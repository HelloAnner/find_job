#!/usr/bin/env bash

# start-server.sh — 在服务器上自动 pull（若存在）并启动容器
# 前置：当前目录包含 config.yaml、.env、data/boss/browser_cookie.txt（或 data/boss/cookie.json）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

GITEA_HOST="${GITEA_HOST:-118.196.16.11}"
GITEA_PORT="${GITEA_PORT:-48080}"
REGISTRY="${REGISTRY:-${GITEA_HOST}:${GITEA_PORT}}"
NAMESPACE="${NAMESPACE:-anner}"
REPO_DEFAULT="$(basename "$ROOT_DIR")"
REPO="${REPO:-$REPO_DEFAULT}"
TAG="${TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-boss-runner}"
HOST_PORT="${HOST_PORT:-38888}"
SHM_SIZE="${SHM_SIZE:-1g}"

usage() {
  cat <<USAGE
用法: scripts/start-server.sh [选项]

选项:
  --registry HOST[:PORT]   私有仓库地址（默认: \${GITEA_HOST}:\${GITEA_PORT}）
  --namespace NS           命名空间（默认: anner）
  --repo NAME              仓库名（默认: 当前目录名）
  --tag TAG                标签（默认: latest）
  --name NAME              容器名（默认: boss-runner）
  --port PORT              映射到容器 38888 的宿主端口（默认: 38888）
  --shm-size SIZE          /dev/shm 大小（Chromium 建议 >= 1g）
  --platform PLAT          指定平台：linux/amd64 或 linux/arm64（默认：自动探测）
  --no-pull                启动前不尝试 docker pull
  -h, --help               显示帮助
USAGE
}

DO_PULL=true
PLATFORM_AUTO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry) REGISTRY="$2"; shift 2 ;;
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    --name) CONTAINER_NAME="$2"; shift 2 ;;
    --port) HOST_PORT="$2"; shift 2 ;;
    --shm-size) SHM_SIZE="$2"; shift 2 ;;
    --platform) PLATFORM_AUTO="$2"; shift 2 ;;
    --no-pull) DO_PULL=false; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 2 ;;
  esac
done

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "缺少命令: $1" >&2; exit 1; }; }
need_cmd docker

IMAGE="${REGISTRY}/${NAMESPACE}/${REPO}:${TAG}"

cd "$ROOT_DIR"

# 校验必需文件
[[ -f config.yaml ]] || { echo "缺少 ./config.yaml" >&2; exit 1; }
[[ -f .env ]] || { echo "缺少 ./.env" >&2; exit 1; }
mkdir -p data/boss
if [[ ! -f data/boss/browser_cookie.txt && ! -f data/boss/cookie.json ]]; then
  echo "缺少登录 Cookie: 提供 data/boss/browser_cookie.txt 或 data/boss/cookie.json" >&2
  exit 1
fi

echo "Image:     $IMAGE"
echo "Container: $CONTAINER_NAME"
echo "Port:      $HOST_PORT -> 38888"

# 自动探测平台（可被 --platform 覆盖）
detect_platform() {
  if [[ -n "$PLATFORM_AUTO" ]]; then
    echo "$PLATFORM_AUTO"; return 0
  fi
  local m
  m=$(uname -m)
  case "$m" in
    x86_64|amd64) echo linux/amd64 ;;
    arm64|aarch64) echo linux/arm64 ;;
    *) echo linux/amd64 ;; # 默认回退
  esac
}

PLATFORM=$(detect_platform)
echo "Platform:  $PLATFORM"

if [[ "$DO_PULL" == true ]]; then
  echo "尝试 docker pull …"
  if docker pull --platform "$PLATFORM" "$IMAGE" >/dev/null 2>&1 \
     || docker pull "$IMAGE" >/dev/null 2>&1; then
    echo "已拉取: $IMAGE"
  else
    echo "WARN: docker pull 失败（镜像可能尚未推送）。" >&2
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
      echo "Error: 本地也没有该镜像，请先构建并推送。" >&2
      exit 1
    fi
  fi
fi

# 停止/删除旧容器
if docker ps --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "停止运行中的容器: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" >/dev/null || true
fi
if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "删除旧容器: $CONTAINER_NAME"
  docker rm "$CONTAINER_NAME" >/dev/null || true
fi

echo "启动容器 …"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --shm-size "$SHM_SIZE" \
  --platform "$PLATFORM" \
  -p "${HOST_PORT}:38888" \
  --env-file ./.env \
  -v "$(pwd)/config.yaml:/app/config.yaml:ro" \
  -v "$(pwd)/.env:/app/.env:ro" \
  -v "$(pwd)/data:/app/data" \
  "$IMAGE"

echo "容器已启动。最近 50 行日志："
docker logs --tail 50 -f "$CONTAINER_NAME"
