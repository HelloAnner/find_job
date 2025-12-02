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
# 2) Go 构建阶段：编译主程序并预装 Playwright 驱动
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

# 预先安装 Playwright driver 和浏览器缓存，避免运行时重复下载
ENV PLAYWRIGHT_DRIVER_PATH=/out/playwright/driver \
    PLAYWRIGHT_BROWSERS_PATH=/out/playwright/browsers
RUN mkdir -p "$PLAYWRIGHT_DRIVER_PATH" "$PLAYWRIGHT_BROWSERS_PATH" \
    && go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium

###############################################
# 3) 运行时阶段：最小化镜像，集成浏览器依赖
###############################################
FROM m.daocloud.io/docker.io/debian:bookworm-slim

# 设置上海时区
RUN apt-get update && apt-get install -y --no-install-recommends tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 设置环境变量
ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright/browsers \
    PLAYWRIGHT_DRIVER_PATH=/opt/playwright/driver \
    TZ=Asia/Shanghai

# 安装 Playwright 运行所需的系统依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libdrm2 \
        libgbm1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxrandr2 \
        libxshmfence1 \
        wget \
        xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/boss /app/boss
COPY --from=builder /out/playwright /opt/playwright
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
