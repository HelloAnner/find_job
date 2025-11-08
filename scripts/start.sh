#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v go >/dev/null 2>&1; then
  echo "[start] 需要已安装的 Go 环境，请先安装 Go 后再运行。" >&2
  exit 1
fi

BUILD_DIR="$ROOT_DIR/build"
GLOBAL_PLAYWRIGHT="$ROOT_DIR/.playwright"
PLAYWRIGHT_CACHE="$BUILD_DIR/.playwright"
export PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_CACHE"

mkdir -p "$BUILD_DIR"
pushd "$BUILD_DIR" >/dev/null
trap 'popd >/dev/null' EXIT

ensure_playwright() {
  if [ -d "$GLOBAL_PLAYWRIGHT" ] && find "$GLOBAL_PLAYWRIGHT" -mindepth 1 -print -quit >/dev/null 2>&1; then
    return
  fi
  echo "[start] 正在安装/更新 Playwright 浏览器..."
  PLAYWRIGHT_BROWSERS_PATH="$GLOBAL_PLAYWRIGHT" GO111MODULE=on go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium
}

copy_dir() {
  local src=$1
  local dst=$2
  if [ ! -d "$src" ]; then
    return
  fi
  mkdir -p "$dst"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$src/" "$dst/"
  else
    rm -rf "$dst"
    mkdir -p "$dst"
    cp -R "$src/." "$dst/"
  fi
}

sync_resources() {
  if [ -f "$BUILD_DIR/config.yaml" ]; then
    :
  elif [ -f "$ROOT_DIR/config.yaml" ]; then
    cp -f "$ROOT_DIR/config.yaml" "$BUILD_DIR/"
  else
    echo "[start] 警告：缺少 config.yaml，请先在根目录或 build/ 下准备配置后再运行" >&2
    exit 1
  fi

  if [ -f "$BUILD_DIR/.env" ]; then
    :
  elif [ -f "$ROOT_DIR/.env" ]; then
    cp -f "$ROOT_DIR/.env" "$BUILD_DIR/"
  else
    echo "[start] 警告：缺少 .env，请先在根目录或 build/ 下准备配置后再运行" >&2
    exit 1
  fi

  copy_dir "$ROOT_DIR/assets" "$BUILD_DIR/assets"

  if [ ! -d "$BUILD_DIR/data" ]; then
    if [ -d "$ROOT_DIR/data" ]; then
      copy_dir "$ROOT_DIR/data" "$BUILD_DIR/data"
    else
      mkdir -p "$BUILD_DIR/data/boss"
    fi
  fi

  if [ -d "$GLOBAL_PLAYWRIGHT" ]; then
    copy_dir "$GLOBAL_PLAYWRIGHT" "$PLAYWRIGHT_CACHE"
  fi
}

build_binary() {
  echo "[start] 正在编译当前平台可执行文件 ..." >&2
  GO111MODULE=on CGO_ENABLED=0 go build -o "$BUILD_DIR/boss" "$ROOT_DIR"
  chmod +x "$BUILD_DIR/boss"
  echo "$BUILD_DIR/boss"
}

ensure_playwright
sync_resources
BIN_PATH=$(build_binary)

echo "[start] 启动可执行文件..."
"$BIN_PATH"
