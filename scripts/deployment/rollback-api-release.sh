#!/usr/bin/env bash

set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${STATE_DIR:?STATE_DIR is required}"
: "${SHARED_ENV_FILE:?SHARED_ENV_FILE is required}"
: "${NEXT_ENV_FILE:?NEXT_ENV_FILE is required}"
: "${ROLLBACK_TOKEN:?ROLLBACK_TOKEN is required}"

PM2_BIN="${PM2_BIN:-pm2}"
ATOMIC_MOVE_BIN="${ATOMIC_MOVE_BIN:-mv}"
CURRENT_LINK="$DEPLOY_PATH/current"

if [ ! -d "$STATE_DIR" ]; then
  echo "No rollback state was created; nothing to restore"
  exit 0
fi

cleanup_rollback_state() {
  rm -rf "$STATE_DIR"
}
trap cleanup_rollback_state EXIT

switched=false
previous_release=

if [ -f "$STATE_DIR/switched" ]; then
  switched=true
  [ -s "$STATE_DIR/previous-release" ] || {
    echo "Cannot roll back gaoge-api: previous release was not recorded" >&2
    exit 1
  }

  recorded_release=$(cat "$STATE_DIR/previous-release")
  previous_release=$(realpath "$recorded_release" 2>/dev/null || true)
  release_root=$(realpath "$DEPLOY_PATH/releases/api")

  [ -n "$previous_release" ] && [ -d "$previous_release" ] || {
    echo "Cannot roll back gaoge-api: previous release is unavailable" >&2
    exit 1
  }
  case "$previous_release" in
    "$release_root"/*) ;;
    *)
      echo "Previous release is outside the API release root" >&2
      exit 1
      ;;
  esac

  [ -f "$previous_release/ecosystem.config.cjs" ] || {
    echo "Previous release has no ecosystem.config.cjs" >&2
    exit 1
  }
  [ -f "$previous_release/dist/main.js" ] || {
    echo "Previous release has no dist/main.js" >&2
    exit 1
  }
  [ ! -e "$CURRENT_LINK" ] || [ -L "$CURRENT_LINK" ] || {
    echo "Current release path is not a symlink: $CURRENT_LINK" >&2
    exit 1
  }
fi

rm -f "$NEXT_ENV_FILE"
if [ -f "$STATE_DIR/previous-api.env" ]; then
  rollback_env_file="$SHARED_ENV_FILE.rollback-$ROLLBACK_TOKEN"
  cp -p "$STATE_DIR/previous-api.env" "$rollback_env_file"
  chmod 600 "$rollback_env_file"
  mv "$rollback_env_file" "$SHARED_ENV_FILE"
elif [ ! -f "$STATE_DIR/had-api-env" ]; then
  rm -f "$SHARED_ENV_FILE"
fi

if [ "$switched" = true ]; then
  : "${RUNTIME_GUARD_PATH:?RUNTIME_GUARD_PATH is required after a release switch}"
  rollback_link="$DEPLOY_PATH/.current-rollback-$ROLLBACK_TOKEN"
  rm -f "$rollback_link"
  ln -s "$previous_release" "$rollback_link"
  "$ATOMIC_MOVE_BIN" -Tf "$rollback_link" "$CURRENT_LINK"
  [ "$(realpath "$CURRENT_LINK")" = "$previous_release" ] || {
    echo "Rollback current symlink verification failed" >&2
    exit 1
  }

  "$PM2_BIN" delete gaoge-api >/dev/null 2>&1 || true
  cd "$CURRENT_LINK"
  "$PM2_BIN" start ecosystem.config.cjs --only gaoge-api --update-env

  EXPECTED_RELEASE_PATH="$previous_release" bash "$RUNTIME_GUARD_PATH"
  "$PM2_BIN" save
fi

rm -rf "$STATE_DIR"
trap - EXIT
