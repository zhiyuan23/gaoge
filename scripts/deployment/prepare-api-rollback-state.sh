#!/usr/bin/env bash

set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${STATE_ROOT:?STATE_ROOT is required}"
: "${STATE_DIR:?STATE_DIR is required}"
: "${SHARED_ENV_FILE:?SHARED_ENV_FILE is required}"

COPY_BIN="${COPY_BIN:-cp}"

state_root=$(realpath "$STATE_ROOT")
state_parent=$(realpath "$(dirname "$STATE_DIR")")
[ "$state_parent" = "$state_root" ] || {
  echo "Rollback state must be a direct child of $state_root" >&2
  exit 1
}

mkdir "$STATE_DIR"
chmod 700 "$STATE_DIR"

if [ -L "$DEPLOY_PATH/current" ]; then
  previous_release_file="$STATE_DIR/previous-release"
  previous_release_temp="$previous_release_file.next"
  readlink -f "$DEPLOY_PATH/current" > "$previous_release_temp"
  mv "$previous_release_temp" "$previous_release_file"
fi

if [ -f "$SHARED_ENV_FILE" ]; then
  touch "$STATE_DIR/had-api-env"
  snapshot_file="$STATE_DIR/previous-api.env"
  snapshot_temp="$snapshot_file.next"

  if ! "$COPY_BIN" -p "$SHARED_ENV_FILE" "$snapshot_temp"; then
    rm -f "$snapshot_temp"
    echo "Failed to copy the active API environment snapshot" >&2
    exit 1
  fi
  chmod 600 "$snapshot_temp"
  cmp -s "$SHARED_ENV_FILE" "$snapshot_temp" || {
    rm -f "$snapshot_temp"
    echo "API environment snapshot verification failed" >&2
    exit 1
  }
  mv "$snapshot_temp" "$snapshot_file"
else
  touch "$STATE_DIR/no-api-env"
fi
