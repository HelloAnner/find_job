# syntax=docker/dockerfile:1.7
ARG GO_VERSION=1.22
FROM golang:${GO_VERSION}-bookworm AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/boss ./

FROM debian:bookworm-slim AS runner
ENV PLAYWRIGHT_BROWSERS_PATH=/playwright/browsers \
    PLAYWRIGHT_DRIVER_PATH=/playwright/driver

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates bash tzdata && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/boss /app/boss
COPY assets ./assets
COPY config.yaml ./config.yaml
COPY scripts ./scripts

RUN mkdir -p /app/data/boss
COPY docker/boss-entrypoint.sh /usr/local/bin/boss-entrypoint.sh
RUN chmod +x /usr/local/bin/boss-entrypoint.sh

VOLUME ["/app/data"]
ENTRYPOINT ["boss-entrypoint.sh"]
CMD ["/app/boss"]
