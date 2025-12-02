#!/usr/bin/env bash

# build-and-push.sh — 构建并推送当前项目镜像到私有 Hub（仅保留 latest）
# 默认对齐 cortex 项目的私有仓库：118.196.16.11:48080/anner/<repo>:latest
# - 仅产出/刷新 latest 标签；推送后会清理私有仓库中除 latest 外的其它标签
# - 默认平台 linux/amd64,linux/arm64（Dockerfile 已按 TARGETARCH 适配）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 默认配置（可被环境变量或参数覆盖）
GITEA_HOST="${GITEA_HOST:-118.196.16.11}"
GITEA_PORT="${GITEA_PORT:-48080}"
REGISTRY="${REGISTRY:-${GITEA_HOST}:${GITEA_PORT}}"
NAMESPACE="${NAMESPACE:-anner}"
REPO_DEFAULT="$(basename "$ROOT_DIR")"
REPO="${REPO:-$REPO_DEFAULT}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER_NAME="${BUILDER_NAME:-${REPO_DEFAULT}-builder}"
NO_CACHE=false
PRUNE=false
INSECURE=true
PROGRESS="${PROGRESS:-}"

usage() {
  cat <<USAGE
用法: scripts/build-and-push.sh [选项]

选项:
  --registry HOST[:PORT]   目标私有仓库（默认: \${GITEA_HOST}:\${GITEA_PORT}）
  --namespace NS           命名空间（默认: anner）
  --repo NAME              仓库名（默认: 当前目录名）
  --platform LIST          平台（默认: linux/amd64,linux/arm64）
  --builder NAME           buildx builder 名（默认: \${REPO_DEFAULT}-builder）
  --no-cache               不使用缓存构建
  --prune                  推送后清理 buildx 缓存
  --insecure               以 HTTP 方式给 buildx 配置该 Registry（默认）
  --secure                 使用 HTTPS（禁用 insecure）
  --progress MODE          buildx 输出: auto|plain|tty
  -h, --help               显示帮助

环境:
  GITEA_USERNAME / GITEA_PASSWORD   私有仓库的 API 账号密码，用于删除旧标签
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry) REGISTRY="$2"; shift 2 ;;
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --platform) PLATFORMS="$2"; shift 2 ;;
    --builder) BUILDER_NAME="$2"; shift 2 ;;
    --no-cache) NO_CACHE=true; shift ;;
    --prune) PRUNE=true; shift ;;
    --insecure) INSECURE=true; shift ;;
    --secure) INSECURE=false; shift ;;
    --progress) PROGRESS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 2 ;;
  esac
done

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "缺少命令: $1" >&2; exit 1; }; }
need_cmd docker

IMAGE_BASE="${REGISTRY}/${NAMESPACE}/${REPO}"

if [[ -z "$PROGRESS" ]]; then
  if [ -t 1 ]; then PROGRESS="tty"; else PROGRESS="plain"; fi
fi

echo "Registry:   $REGISTRY"
echo "Repository: $IMAGE_BASE"
echo "Platforms:  $PLATFORMS"
echo "Tag:        latest (仅保留此标签)"

:

ensure_builder() {
  # 尝试安装 binfmt/qemu（若可用则启用，失败不致命）
  if docker info --format '{{json .}}' 2>/dev/null | grep -q 'runc'; then
    docker run --privileged --rm tonistiigi/binfmt:latest --install all >/dev/null 2>&1 || true
  fi
  if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
    echo "创建 buildx builder: $BUILDER_NAME"
    local cfg=""
    if [[ "$INSECURE" == true ]]; then
      cfg="$(mktemp)"
      cat >"$cfg" <<CFG
debug = true
[registry."$REGISTRY"]
  http = true
  insecure = true
CFG
      docker buildx create \
        --name "$BUILDER_NAME" \
        --driver docker-container \
        --driver-opt network=host \
        --config "$cfg" >/dev/null
      rm -f "$cfg"
    else
      docker buildx create --name "$BUILDER_NAME" --driver docker-container >/dev/null
    fi
  fi
  docker buildx use "$BUILDER_NAME" >/dev/null
  docker buildx inspect --bootstrap >/dev/null
}

build_and_push() {
  local no_cache_flag=( )
  [[ "$NO_CACHE" == true ]] && no_cache_flag+=(--no-cache)
  echo "开始构建并推送: ${IMAGE_BASE}:latest"
  docker buildx build \
    --platform "$PLATFORMS" \
    -t "${IMAGE_BASE}:latest" \
    --push \
    --progress "$PROGRESS" \
    "${no_cache_flag[@]}" \
    "$ROOT_DIR"
}

# 校验 latest 是否包含 amd64 与 arm64 两个平台
verify_multiarch_latest() {
  local accept='application/vnd.docker.distribution.manifest.list.v2+json'
  local url="http://${REGISTRY}/v2/${NAMESPACE}/${REPO}/manifests/latest"
  local code body
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Accept: $accept" "$url" || echo 000)
  if [[ "$code" != "200" && -n "${GITEA_USERNAME:-}" ]]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' -u "${GITEA_USERNAME}:${GITEA_PASSWORD:-}" -H "Accept: $accept" "$url" || echo 000)
    [[ "$code" == "200" ]] && body=$(curl -fsS -u "${GITEA_USERNAME}:${GITEA_PASSWORD:-}" -H "Accept: $accept" "$url")
  else
    body=$(curl -fsS -H "Accept: $accept" "$url" || true)
  fi
  if [[ -z "${body:-}" ]]; then
    echo "WARN: 无法获取 manifest list (HTTP $code)，跳过校验。" >&2
    return 0
  fi
  local n
  n=$(printf '%s' "$body" | tr '\n' ' ' | grep -Eo '"architecture"\s*:\s*"(amd64|arm64)"' | sort -u | wc -l | awk '{print $1}')
  if [[ "$n" -lt 2 ]]; then
    echo "ERROR: latest 未同时包含 amd64 与 arm64。" >&2
    return 1
  fi
  echo "Verified: latest 同时包含 linux/amd64 与 linux/arm64"
}

# 仅保留 latest 标签（通过 Gitea Packages API 删除其它版本）
retain_latest_only() {
  if [[ -z "${GITEA_USERNAME:-}" || -z "${GITEA_PASSWORD:-}" ]]; then
    echo "WARN: 未设置 GITEA_USERNAME/GITEA_PASSWORD，跳过清理旧标签。" >&2
    return 0
  fi
  local base_v1="http://${GITEA_HOST}:${GITEA_PORT}/api/v1"
  local base_v0="http://${GITEA_HOST}:${GITEA_PORT}/api"
  local list_url_v1="${base_v1}/packages/${NAMESPACE}/container/${REPO}/versions"
  local list_url_v0="${base_v0}/packages/${NAMESPACE}/container/${REPO}/versions"

  echo "执行保留策略: 仅保留 '${REPO}:latest' …"

  local code body versions
  code=$(curl -s -o /dev/null -w '%{http_code}' -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" "$list_url_v1" || echo 000)
  if [[ "$code" == "200" ]]; then
    body=$(curl -fsS -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" "$list_url_v1")
  else
    code=$(curl -s -o /dev/null -w '%{http_code}' -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" "$list_url_v0" || echo 000)
    if [[ "$code" != "200" ]]; then
      echo "WARN: 列表查询失败(HTTP $code)，跳过清理。" >&2
      return 0
    fi
    body=$(curl -fsS -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" "$list_url_v0")
  fi
  versions=$(printf '%s' "$body" | tr -d '\r' | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/' | sort -u)
  [[ -z "$versions" ]] && { echo "没有可清理的版本。"; return 0; }

  echo "发现版本:"; printf '  - %s\n' $versions
  local v del_url del_url_legacy code_del
  for v in $versions; do
    [[ "$v" == "latest" ]] && { echo "保留: latest"; continue; }
    del_url="${base_v1}/packages/${NAMESPACE}/container/${REPO}/${v}"
    del_url_legacy="${base_v0}/packages/${NAMESPACE}/container/${REPO}/${v}"
    code_del=$(curl -s -o /dev/null -w '%{http_code}' -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" -X DELETE "$del_url" || echo 000)
    if [[ "$code_del" == "404" ]]; then
      code_del=$(curl -s -o /dev/null -w '%{http_code}' -u "${GITEA_USERNAME}:${GITEA_PASSWORD}" -X DELETE "$del_url_legacy" || echo 000)
    fi
    echo "删除标签 $v -> HTTP $code_del"
  done
}

ensure_builder
build_and_push
verify_multiarch_latest
retain_latest_only

if [[ "$PRUNE" == true ]]; then
  echo "清理 buildx 缓存: $BUILDER_NAME"
  docker buildx prune -f --builder "$BUILDER_NAME" || true
fi

echo
echo "完成: 推送 ${IMAGE_BASE}:latest"
echo "服务器上可执行: ./scripts/start-server.sh --registry ${REGISTRY} --namespace ${NAMESPACE} --repo ${REPO}"
echo
