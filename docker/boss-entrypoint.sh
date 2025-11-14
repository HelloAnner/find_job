#!/usr/bin/env sh
set -e

cd /app

PLAYWRIGHT_DRIVER_PATH="${PLAYWRIGHT_DRIVER_PATH:-/usr/local/lib/node_modules/playwright/node_modules/playwright-core}"
PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/root/.cache/ms-playwright}"
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS="${PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS:-true}"
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-1}"
export PLAYWRIGHT_DRIVER_PATH PLAYWRIGHT_BROWSERS_PATH \
  PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD

if [ ! -f "config.yaml" ]; then
  echo "[boss-entrypoint] 缺少 /app/config.yaml，请通过 volume 挂载真实配置" >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "[boss-entrypoint] 缺少 /app/.env，请提供有效环境变量" >&2
  exit 1
fi

# 检查Playwright驱动关键文件
check_driver_file() {
  local rel="$1"
  local abs="$PLAYWRIGHT_DRIVER_PATH/$rel"
  if [ ! -e "$abs" ]; then
    echo "[boss-entrypoint] 缺少 Playwright driver 文件: $abs" >&2
    exit 1
  fi
}

if [ ! -d "$PLAYWRIGHT_DRIVER_PATH" ]; then
  echo "[boss-entrypoint] 未找到 Playwright driver 目录: $PLAYWRIGHT_DRIVER_PATH" >&2
  exit 1
fi

check_driver_file node
check_driver_file package/package.json
check_driver_file package/cli.js
check_driver_file package/index.js
check_driver_file package/lib/server/index.js

if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
  echo "[boss-entrypoint] 未找到 Playwright 浏览器缓存: $PLAYWRIGHT_BROWSERS_PATH" >&2
  exit 1
fi

if ! find "$PLAYWRIGHT_BROWSERS_PATH" -maxdepth 1 -type d -name 'chromium-*' | grep -q .; then
  echo "[boss-entrypoint] 浏览器缓存中缺少 chromium-* 目录" >&2
  exit 1
fi

mkdir -p /app/data/boss

exec "$@"
