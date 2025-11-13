#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

log_info() {
  printf '[start] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_info "缺少依赖: $1"
    exit 1
  fi
}

require_cmd docker

# 检测Docker守护进程是否运行
if ! docker info >/dev/null 2>&1; then
  log_info "Docker守护进程未运行，请先启动Docker"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  log_info "未检测到 docker compose，请先安装 Docker Compose V2"
  exit 1
fi

cleanup_stack() {
  log_info "停止并删除已有容器/镜像…"
  if docker ps -a --filter "name=boss-runner" --format "{{.Names}}" | grep -q "boss-runner"; then
    docker stop boss-runner 2>/dev/null || true
    docker rm boss-runner 2>/dev/null || true
  fi
}

ensure_config() {
  for file in config.yaml .env; do
    if [ ! -e "$ROOT_DIR/$file" ]; then
      log_info "缺少必需文件: $file"
      exit 1
    fi
  done

  # 检查cookie文件（支持json或txt格式）
  if [ ! -e "$ROOT_DIR/data/boss/cookie.json" ] && [ ! -e "$ROOT_DIR/data/boss/browser_cookie.txt" ]; then
    log_info "缺少cookie文件，请提供 data/boss/cookie.json 或 data/boss/browser_cookie.txt"
    exit 1
  fi
}

build_and_start_single_container() {
  log_info "构建单镜像boss应用…"
  docker build -t get_jobs-boss .

  log_info "启动boss应用…"
  docker run -d \
    --name boss-runner \
    --restart unless-stopped \
    -v "$ROOT_DIR/config.yaml:/app/config.yaml:ro" \
    -v "$ROOT_DIR/.env:/app/.env:ro" \
    -v "$ROOT_DIR/data:/app/data" \
    get_jobs-boss
}

monitor_job_success() {
  log_info "开始监控投递日志，等待投递成功…"
  log_info "投递成功日志模式: '投递完成 | 岗位：'"

  while true; do
    if docker logs boss-runner 2>&1 | grep -q "投递完成 | 岗位："; then
      log_info "🎉 检测到投递成功！"
      docker logs boss-runner | grep "投递完成 | 岗位："
      break
    fi

    # 检查容器是否还在运行
    if ! docker ps --filter "name=boss-runner" --format "{{.Names}}" | grep -q "boss-runner"; then
      log_info "容器已停止，检查日志…"
      docker logs boss-runner
      exit 1
    fi

    sleep 5
  done
}

main() {
  cleanup_stack
  ensure_config
  build_and_start_single_container

  log_info "等待容器启动…"
  sleep 10

  monitor_job_success

  log_info "投递任务完成，停止容器…"
  docker stop boss-runner
  docker rm boss-runner
  log_info "✅ 所有任务完成！"
}

main "$@"