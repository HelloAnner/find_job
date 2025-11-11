#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v go >/dev/null 2>&1; then
  echo "[package] Go 环境未安装，请先安装 Go" >&2
  exit 1
fi

# Use root directory configuration templates
CONFIG_TEMPLATE="$ROOT_DIR/config.yaml"
ENV_TEMPLATE="$ROOT_DIR/.env"

export PLAYWRIGHT_BROWSERS_PATH="$ROOT_DIR/.playwright"

ensure_playwright() {
  if [ -d "$PLAYWRIGHT_BROWSERS_PATH" ] && find "$PLAYWRIGHT_BROWSERS_PATH" -mindepth 1 -print -quit >/dev/null 2>&1; then
    return
  fi
  echo "[package] 正在准备 Playwright 浏览器..."
  GO111MODULE=on go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium
}

ensure_playwright

DIST_DIR="$ROOT_DIR/dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

copy_resources() {
  local target_dir=$1
  if [ -f "$CONFIG_TEMPLATE" ]; then
    cp -f "$CONFIG_TEMPLATE" "$target_dir/config.yaml"
  elif [ -f config.yaml ]; then
    cp -f config.yaml "$target_dir/"
  fi

  if [ -f "$ENV_TEMPLATE" ]; then
    cp -f "$ENV_TEMPLATE" "$target_dir/.env"
  elif [ -f .env ]; then
    cp -f .env "$target_dir/"
  fi

  if [ -d assets ]; then
    mkdir -p "$target_dir/assets"
    cp -R assets/. "$target_dir/assets/"
  fi

  if [ -d data ]; then
    mkdir -p "$target_dir/data"
    cp -R data/. "$target_dir/data/"
  else
    mkdir -p "$target_dir/data/boss"
  fi

  if [ -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
    cp -R "$PLAYWRIGHT_BROWSERS_PATH" "$target_dir/.playwright"
  fi

  if [ -d scripts ]; then
    mkdir -p "$target_dir/scripts"
    cp scripts/start.sh "$target_dir/scripts/start.sh"
    chmod +x "$target_dir/scripts/start.sh"
  fi
}

build_target() {
  local os=$1
  local arch=$2
  local name=$3
  local ext=$4

  local out_dir="$DIST_DIR/$name"
  mkdir -p "$out_dir"

  echo "[package] 构建 $name ..."
  GOOS="$os" GOARCH="$arch" CGO_ENABLED=0 go build -o "$out_dir/boss$ext" .
  copy_resources "$out_dir"

  (cd "$DIST_DIR" && zip -qr "${name}.zip" "$name")
}

build_target windows amd64 boss-windows-amd64 .exe
build_target darwin arm64 boss-macos-arm64 ""
build_target linux amd64 boss-linux-amd64 ""

echo "[package] 打包完成，文件位于 $DIST_DIR"
