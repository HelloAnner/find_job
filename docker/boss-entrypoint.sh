#!/usr/bin/env sh
set -e

cd /app

# 运行在 browserless/chrome 外接模式，不再内置浏览器与驱动
BROWSERLESS_URL="${BROWSERLESS_URL:-}"
BROWSERLESS_MODE="${BROWSERLESS_MODE:-playwright}"
export BROWSERLESS_URL BROWSERLESS_MODE

if [ ! -f "config.yaml" ]; then
  echo "[boss-entrypoint] 缺少 /app/config.yaml，请通过 volume 挂载真实配置" >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "[boss-entrypoint] 缺少 /app/.env，请提供有效环境变量" >&2
  exit 1
fi

# 运行提示：如果未设置 BROWSERLESS_URL，将由程序本地拉起浏览器（开发模式）
if [ -z "$BROWSERLESS_URL" ]; then
  echo "[boss-entrypoint] WARN: 未设置 BROWSERLESS_URL，将尝试本地启动浏览器（仅开发调试用）。" >&2
else
  echo "[boss-entrypoint] 使用外接浏览器: $BROWSERLESS_URL (mode=$BROWSERLESS_MODE)"
fi

mkdir -p /app/data/boss

exec "$@"
