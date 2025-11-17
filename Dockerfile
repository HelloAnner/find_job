# 单镜像架构 - 集成Go应用和Playwright环境
FROM golang:1.25.3 AS builder

ARG GOPROXY=https://goproxy.cn,direct
ENV GOPROXY=${GOPROXY}

WORKDIR /src
RUN echo 'deb https://mirrors.aliyun.com/debian/ trixie main contrib non-free non-free-firmware' > /etc/apt/sources.list \
    && echo 'deb https://mirrors.aliyun.com/debian/ trixie-updates main contrib non-free non-free-firmware' >> /etc/apt/sources.list \
    && echo 'deb https://mirrors.aliyun.com/debian-security trixie-security main contrib non-free non-free-firmware' >> /etc/apt/sources.list \
    && apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/boss ./

# 预先安装 Playwright driver 和浏览器缓存，避免运行时重复下载
ENV PLAYWRIGHT_DRIVER_PATH=/out/playwright/driver \
    PLAYWRIGHT_BROWSERS_PATH=/out/playwright/browsers
RUN mkdir -p "$PLAYWRIGHT_DRIVER_PATH" "$PLAYWRIGHT_BROWSERS_PATH" \
    && go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium

# 运行时阶段 - 集成Playwright环境
FROM debian:bookworm-slim

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
RUN echo 'deb https://mirrors.aliyun.com/debian/ bookworm main contrib non-free non-free-firmware' > /etc/apt/sources.list \
    && echo 'deb https://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free non-free-firmware' >> /etc/apt/sources.list \
    && echo 'deb https://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free non-free-firmware' >> /etc/apt/sources.list \
    && apt-get update \
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
COPY config.yaml ./config.yaml
COPY .env ./.env

RUN mkdir -p /app/data/boss
COPY docker/boss-entrypoint.sh /usr/local/bin/boss-entrypoint.sh
RUN chmod +x /usr/local/bin/boss-entrypoint.sh

# 数据目录仍可通过宿主机挂载覆盖
VOLUME ["/app/data"]
ENTRYPOINT ["boss-entrypoint.sh"]
CMD ["/app/boss"]
