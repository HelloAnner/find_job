#!/usr/bin/env bash
# 启动两容器（browserless + boss）
# 依赖：docker compose / docker-compose
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

log() { printf '[compose] %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "缺少命令: $1" >&2; exit 1; }; }

need docker

cd "$REPO_ROOT"

# 校验配置与凭证
[[ -f config.yaml ]] || { echo "缺少 config.yaml" >&2; exit 1; }
[[ -f .env ]] || { echo "缺少 .env" >&2; exit 1; }
mkdir -p data/boss
if [[ ! -f data/boss/browser_cookie.txt && ! -f data/boss/cookie.json ]]; then
  echo "缺少登录 Cookie: 提供 data/boss/browser_cookie.txt 或 data/boss/cookie.json" >&2
  exit 1
fi

# 构建前端，确保最新静态资源被打包进镜像
log "构建前端…"
(cd front && npm ci --no-audit --no-fund && npm run build)

# 启动 compose（会构建 boss 镜像并拉起两个服务）
if command -v docker-compose >/dev/null 2>&1; then
  log "使用 docker-compose 启动…"
  docker-compose up -d --build
else
  log "使用 docker compose 启动…"
  docker compose up -d --build
fi

log "服务已启动："
log "- http://localhost:38888 前端 & API"
log "- ws://localhost:3000/chromium/playwright Browserless"
log "查看日志: docker compose logs -f boss"

