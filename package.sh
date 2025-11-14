#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
OUT_DIR="$ROOT_DIR/dist"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
PACKAGE_NAME="find_jobs-$TIMESTAMP.zip"
PACKAGE_PATH="$OUT_DIR/$PACKAGE_NAME"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR"

rsync -a --quiet \
  --exclude '.git' \
  --exclude '.gitmodules' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '*.zip' \
  "$ROOT_DIR"/ "$TEMP_DIR"/

(cd "$TEMP_DIR" && zip -qr "$PACKAGE_PATH" .)

printf 'Package created: %s\n' "$PACKAGE_PATH"
