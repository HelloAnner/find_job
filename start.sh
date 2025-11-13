#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

log() {
  printf '[start] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "缺少依赖: $1"
    exit 1
  fi
}

require_cmd docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  log "未检测到 docker compose，请先安装 Docker Compose V2"
  exit 1
fi

cleanup_stack() {
  log "停止并删除已有容器/镜像…"
  if ! "${COMPOSE[@]}" down --remove-orphans --rmi local --volumes >/dev/null 2>&1; then
    log "没有需要清理的容器或镜像"
  fi
}

build_binary_if_needed() {
  if [ -x "$ROOT_DIR/boss" ]; then
    log "检测到已有 boss 可执行文件，跳过编译"
    return
  fi
  require_cmd go
  log "未找到 boss，可执行文件，开始编译当前代码…"
  GO111MODULE=on CGO_ENABLED=0 go build -o boss .
  chmod +x boss
  log "编译完成：$ROOT_DIR/boss"
}

ensure_config() {
  for file in config.yaml .env data/boss/cookie.json; do
    if [ ! -e "$ROOT_DIR/$file" ]; then
      log "缺少必需文件: $file"
      exit 1
    fi
  done
}

wait_for_health() {
  local container=$1
  local timeout=${2:-180}
  local waited=0
  log "等待 $container 通过健康检查…"
  while true; do
    local status
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container" 2>/dev/null || true)
    if [ "$status" = "healthy" ]; then
      log "$container 已就绪"
      break
    fi
    if [ "$status" = "unhealthy" ]; then
      log "$container 处于 unhealthy 状态，请查看日志"
      exit 1
    fi
    sleep 3
    waited=$((waited + 3))
    if [ $waited -ge $timeout ]; then
      log "等待 $container 超时 ($timeout 秒)"
      exit 1
    fi
  done
}

start_playwright() {
  log "构建 Playwright 镜像…"
  "${COMPOSE[@]}" build --pull playwright
  log "启动 Playwright 服务…"
  "${COMPOSE[@]}" up -d playwright
  wait_for_health boss-playwright 240
}

start_boss() {
  log "构建 boss 镜像…"
  "${COMPOSE[@]}" build boss
  log "启动 boss 服务…"
  "${COMPOSE[@]}" up -d --no-deps boss
}

main() {
  cleanup_stack
  build_binary_if_needed
  ensure_config
  start_playwright
  start_boss
  log "全部就绪，可通过以下命令查看日志："
  log "${COMPOSE[*]} logs -f boss"
  log "按 Ctrl+C 可退出跟随日志"
  "${COMPOSE[@]}" logs -f boss
}

main "$@"
