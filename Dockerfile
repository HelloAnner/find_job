# 单镜像架构 - 集成Go应用和Playwright环境
FROM golang:1.25.3-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/boss ./

# 运行时阶段 - 集成Playwright环境
FROM node:18-alpine

# 设置环境变量
ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 \
    PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright \
    PLAYWRIGHT_DRIVER_PATH=/usr/local/lib/node_modules/playwright

# 安装系统依赖和Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && npm install -g playwright@1.52.0 \
    && npx playwright install chromium

WORKDIR /app
COPY --from=builder /out/boss /app/boss
COPY assets ./assets
COPY config.yaml ./config.yaml

RUN mkdir -p /app/data/boss
COPY docker/boss-entrypoint.sh /usr/local/bin/boss-entrypoint.sh
RUN chmod +x /usr/local/bin/boss-entrypoint.sh

VOLUME ["/app/data"]
ENTRYPOINT ["boss-entrypoint.sh"]
CMD ["/app/boss"]
