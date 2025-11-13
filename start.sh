#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 平台检测
detect_platform() {
  local os arch
  case "$(uname -s)" in
    Linux*)     os=linux ;;
    Darwin*)    os=darwin ;;
    CYGWIN*|MINGW*|MSYS*) os=windows ;;
    *)          os=unknown ;;
  esac

  case "$(uname -m)" in
    x86_64)     arch=amd64 ;;
    aarch64|arm64) arch=arm64 ;;
    *)          arch=unknown ;;
  esac

  echo "${os}-${arch}"
}

# 验证平台是否支持 Docker 构建
validate_platform() {
  case "$PLATFORM" in
    linux-amd64|linux-arm64|darwin-amd64|darwin-arm64)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

PLATFORM=$(detect_platform)

log_info() {
  printf '[start] %s\n' "$*"
}

# 验证平台支持
if ! validate_platform; then
  log_info "当前平台 $PLATFORM 不支持 Docker 运行，请使用本地运行模式"
  log_info "支持的平台: linux-amd64, linux-arm64, darwin-amd64, darwin-arm64"
  exit 1
fi

log_info "检测到平台: $PLATFORM"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_info "缺少依赖: $1"
    exit 1
  fi
}

require_cmd docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  log_info "未检测到 docker compose，请先安装 Docker Compose V2"
  exit 1
fi

cleanup_stack() {
  log_info "停止并删除已有容器/镜像…"
  if ! "${COMPOSE[@]}" down --remove-orphans --rmi local --volumes >/dev/null 2>&1; then
    log_info "没有需要清理的容器或镜像"
  fi
}

build_binary_if_needed() {
  # 不再需要本地编译，Docker 构建会处理跨平台编译
  # 保留此函数以维持接口兼容性
  log_info "跳过本地编译，使用 Docker 构建跨平台二进制文件"
}

ensure_config() {
  for file in config.yaml .env data/boss/cookie.json; do
    if [ ! -e "$ROOT_DIR/$file" ]; then
      log_info "缺少必需文件: $file"
      exit 1
    fi
  done
}

wait_for_health() {
  local container=$1
  local timeout=${2:-180}
  local waited=0
  log_info "等待 $container 通过健康检查…"
  while true; do
    local status
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container" 2>/dev/null || true)
    if [ "$status" = "healthy" ]; then
      log_info "$container 已就绪"
      break
    fi
    if [ "$status" = "unhealthy" ]; then
      log_info "$container 处于 unhealthy 状态，请查看日志"
      exit 1
    fi
    sleep 3
    waited=$((waited + 3))
    if [ $waited -ge $timeout ]; then
      log_info "等待 $container 超时 ($timeout 秒)"
      exit 1
    fi
  done
}

start_playwright() {
  local target_os target_arch
  target_os="${PLATFORM%-*}"
  target_arch="${PLATFORM#*-}"

  log_info "构建 Playwright 镜像 (平台: $target_os-$target_arch)…"
  "${COMPOSE[@]}" build --pull --build-arg TARGETOS="$target_os" --build-arg TARGETARCH="$target_arch" playwright
  log_info "启动 Playwright 服务…"
  "${COMPOSE[@]}" up -d playwright
  wait_for_health boss-playwright 240
}

start_boss() {
  local target_os target_arch
  target_os="${PLATFORM%-*}"
  target_arch="${PLATFORM#*-}"

  log_info "构建 boss 镜像 (平台: $target_os-$target_arch)…"
  "${COMPOSE[@]}" build --build-arg TARGETOS="$target_os" --build-arg TARGETARCH="$target_arch" boss
  log_info "启动 boss 服务…"
  "${COMPOSE[@]}" up -d --no-deps boss
}

main() {
  cleanup_stack
  build_binary_if_needed
  ensure_config
  start_playwright
  start_boss
  log_info "全部就绪，可通过以下命令查看日志："
  log_info "${COMPOSE[*]} log_infos -f boss"
  log_info "按 Ctrl+C 可退出跟随日志"
  "${COMPOSE[@]}" log_infos -f boss
}

main "$@"
