#!/usr/bin/env bash
# 顶层 start.sh —— 统一入口：默认使用 docker compose 启动 browserless + boss 两容器
# 历史兼容：如需保留“单容器（不启动 browserless）”模式，请执行 scripts/start.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
exec "${SCRIPT_DIR}/scripts/up-compose.sh" "$@"

