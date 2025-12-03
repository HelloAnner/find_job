#!/usr/bin/env bash
# scripts/start.sh — 一键构建前端 + 构建镜像 + 启动容器
# 说明：从仓库根目录迁移而来；此版本对路径做了健壮处理，并始终执行 `npm ci` 以避免依赖缺失。

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

log_info() { printf '[start] %s\n' "$*"; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || { log_info "缺少依赖: $1"; exit 1; }; }

need_cmd docker
need_cmd node
need_cmd npm

# 检测 Docker 守护进程
if ! docker info >/dev/null 2>&1; then
  log_info "Docker 守护进程未运行，请先启动 Docker。"
  exit 1
fi

cleanup_stack() {
  log_info "停止并删除已有容器/镜像…"
  if docker ps -a --filter "name=boss-runner" --format "{{.Names}}" | grep -q "^boss-runner$"; then
    docker stop boss-runner 2>/dev/null || true
    docker rm boss-runner 2>/dev/null || true
  fi
}

ensure_config() {
  cd "$REPO_ROOT"
  for file in config.yaml .env; do
    if [[ ! -e "$file" ]]; then
      log_info "缺少必需文件: $file"
      exit 1
    fi
  done
  # 检查 Cookie（二选一）
  if [[ ! -e data/boss/cookie.json && ! -e data/boss/browser_cookie.txt ]]; then
    log_info "缺少登录 Cookie，请提供 data/boss/cookie.json 或 data/boss/browser_cookie.txt"
    exit 1
  fi
}

build_frontend() {
  log_info "构建前端界面（确保最新效果）…"
  cd "$REPO_ROOT/front"

  if [[ ! -f package.json ]]; then
    log_info "未找到 front/package.json"
    exit 1
  fi

  # 始终以锁文件安装，避免 node_modules 残留导致的 TS/依赖缺失
  log_info "安装前端依赖 (npm ci) …"
  npm ci --no-audit --no-fund

  log_info "执行前端打包 (vite build) …"
  npm run build

  cd "$REPO_ROOT"
}

build_and_start_single_container() {
  log_info "构建单镜像 boss 应用（包含最新前端）…"

  # 确保前端已构建
  build_frontend

  cd "$REPO_ROOT"
  log_info "docker build …"
  docker build -t get_jobs-boss .

  log_info "启动容器 boss-runner …"
  docker run -d \
    --name boss-runner \
    --restart unless-stopped \
    -p 38888:38888 \
    -v "$REPO_ROOT/config.yaml:/app/config.yaml" \
    -v "$REPO_ROOT/.env:/app/.env" \
    -v "$REPO_ROOT/data:/app/data" \
    get_jobs-boss
}

monitor_job_success() {
  log_info "开始监控投递日志，等待投递成功…"
  log_info "投递成功日志模式: '投递完成 | 岗位：'"
  while true; do
    if docker logs boss-runner 2>&1 | grep -q "投递完成 | 岗位："; then
      log_info "🎉 检测到投递成功！"
      docker logs boss-runner | grep "投递完成 | 岗位：" || true
      break
    fi
    if ! docker ps --format "{{.Names}}" | grep -q "^boss-runner$"; then
      log_info "容器已停止，检查日志…"
      docker logs boss-runner || true
      exit 1
    fi
    sleep 5
  done
}

main() {
  cleanup_stack
  ensure_config
  build_and_start_single_container
}

main "$@"
