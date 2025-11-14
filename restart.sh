#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

log() {
  printf '[restart] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "缺少依赖: $1"
    exit 1
  fi
}

require_cmd docker
require_cmd go

if ! docker ps --filter "name=boss-runner" --format '{{.ID}}' | grep -q .; then
  log "检测到 boss-runner 未运行，跳过重启"
  exit 0
fi

log "停止当前容器…"
docker stop boss-runner >/dev/null
log "删除旧容器…"
docker rm boss-runner >/dev/null

log "交叉编译最新代码…"
mkdir -p "$ROOT_DIR/build"
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o "$ROOT_DIR/build/boss" ./

log "使用原镜像重启容器…"
CONTAINER_ID=$(docker run -d \
  --name boss-runner \
  --restart unless-stopped \
  -v "$ROOT_DIR/config.yaml:/app/config.yaml" \
  -v "$ROOT_DIR/.env:/app/.env" \
  -v "$ROOT_DIR/data:/app/data" \
  -v "$ROOT_DIR/build/boss:/app/boss:ro" \
  get_jobs-boss)

log "容器已重启: $CONTAINER_ID"
