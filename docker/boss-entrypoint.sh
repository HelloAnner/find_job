#!/usr/bin/env sh
set -e

cd /app

PLAYWRIGHT_DRIVER_PATH="${PLAYWRIGHT_DRIVER_PATH:-/usr/local/lib/node_modules/playwright}"
PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/root/.cache/ms-playwright}"
export PLAYWRIGHT_DRIVER_PATH PLAYWRIGHT_BROWSERS_PATH

if [ ! -f "config.yaml" ]; then
  echo "[boss-entrypoint] 缺少 /app/config.yaml，请通过 volume 挂载真实配置" >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "[boss-entrypoint] 缺少 /app/.env，请提供有效环境变量" >&2
  exit 1
fi

# 检查Playwright驱动
if [ ! -d "$PLAYWRIGHT_DRIVER_PATH" ]; then
  echo "[boss-entrypoint] 未找到 Playwright driver 目录: $PLAYWRIGHT_DRIVER_PATH" >&2
  exit 1
fi

# 检查Playwright浏览器
if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
  echo "[boss-entrypoint] 未找到 Playwright 浏览器缓存: $PLAYWRIGHT_BROWSERS_PATH" >&2
  exit 1
fi

mkdir -p /app/data/boss

exec "$@"
