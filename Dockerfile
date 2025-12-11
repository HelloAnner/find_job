###############################################
# 1) 前端构建阶段：使用 Node 构建 Vite 静态资源
###############################################
FROM m.daocloud.io/docker.io/node:20-alpine AS frontend
WORKDIR /frontend
# 仅复制依赖清单，最大化缓存命中
COPY front/package*.json ./
RUN npm ci
# 复制其余前端源码并打包
COPY front/ ./
RUN npm run build

###############################################
# 2) Go 构建阶段：编译主程序并准备 Playwright driver（不携带浏览器）
###############################################
FROM m.daocloud.io/docker.io/golang:1.25.3 AS builder

# 使构建过程感知目标平台
ARG TARGETOS
ARG TARGETARCH

ARG GOPROXY=https://goproxy.cn,direct
ENV GOPROXY=${GOPROXY}

WORKDIR /src
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN go mod download
# 将前端产物覆盖到 front/dist，以便 go:embed 或静态提供
COPY --from=frontend /frontend/dist ./front/dist
# 复制项目源码
COPY . .
# 针对目标平台编译（由 buildx 传入 TARGETOS/TARGETARCH）
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} go build -o /out/boss ./

# 准备 Playwright driver（仅 driver，无浏览器），用于通过 ws 连接 browserless
ENV PLAYWRIGHT_DRIVER_PATH=/out/playwright/driver \
    PLAYWRIGHT_BROWSERS_PATH=/out/playwright/browsers \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN mkdir -p "$PLAYWRIGHT_DRIVER_PATH" "$PLAYWRIGHT_BROWSERS_PATH" \
    && go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 --version \
    && rm -rf "$PLAYWRIGHT_BROWSERS_PATH" || true

###############################################
# 3) 运行时阶段：最小化镜像，集成浏览器依赖
###############################################
FROM m.daocloud.io/docker.io/debian:bookworm-slim

# 设置上海时区（仅基础包）
RUN apt-get update && apt-get install -y --no-install-recommends tzdata ca-certificates && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Shanghai \
    PLAYWRIGHT_DRIVER_PATH=/opt/playwright/driver \
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 不再安装本地浏览器依赖；通过 Browserless 远程浏览器运行

WORKDIR /app
COPY --from=builder /out/boss /app/boss
COPY --from=builder /out/playwright/driver /opt/playwright/driver
COPY assets ./assets
COPY --from=builder /src/front/dist ./front/dist
COPY config.yaml ./config.yaml
COPY .env ./.env

RUN mkdir -p /app/data/boss
COPY docker/boss-entrypoint.sh /usr/local/bin/boss-entrypoint.sh
RUN chmod +x /usr/local/bin/boss-entrypoint.sh

# 数据目录仍可通过宿主机挂载覆盖
VOLUME ["/app/data"]
ENTRYPOINT ["boss-entrypoint.sh"]
CMD ["/app/boss"]
EXPOSE 38888
