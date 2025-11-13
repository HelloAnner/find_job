#!/usr/bin/env bash
set -euo pipefail

copy_if_missing() {
  local src=$1
  local dst=$2
  if [ ! -d "$src" ]; then
    echo "[playwright] 缺少源目录 $src" >&2
    exit 1
  fi
  mkdir -p "$dst"
  if [ -n "$(ls -A "$dst" 2>/dev/null)" ]; then
    return 0
  fi
  echo "[playwright] 初始化依赖 -> $dst"
  cp -R "$src"/. "$dst"/
}

copy_if_missing "${PW_BROWSERS_SOURCE}" "${PW_BROWSERS_TARGET}"
copy_if_missing "${PW_DRIVER_SOURCE}" "${PW_DRIVER_TARGET}"

exec "$@"
