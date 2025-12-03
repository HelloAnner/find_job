#!/usr/bin/env bash
# 兼容旧路径的启动脚本：转发到 scripts/start.sh
# 保留该文件是为了避免已有说明/自动化失效；推荐改用 ./scripts/start.sh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
TARGET="${SCRIPT_DIR}/scripts/start.sh"

if [[ -x "$TARGET" ]]; then
  echo "[start] NOTICE: 此入口已迁移到 scripts/start.sh（即将废弃当前路径）。"
  exec "$TARGET" "$@"
else
  echo "[start] ERROR: 未找到 scripts/start.sh，请确认仓库是否完整。" >&2
  exit 1
fi
