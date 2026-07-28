#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[runtime-guard] %s\n' "$*"
}

fail() {
  printf '[runtime-guard] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

EXPECTED_PM2_NAME="${EXPECTED_PM2_NAME:?EXPECTED_PM2_NAME is required}"
EXPECTED_DEPLOY_PATH="${EXPECTED_DEPLOY_PATH:?EXPECTED_DEPLOY_PATH is required}"
API_BASE_URL="${API_BASE_URL:?API_BASE_URL is required}"
FORBIDDEN_PM2_NAMES="${FORBIDDEN_PM2_NAMES:-}"
EXPECTED_RELEASE_PATH="${EXPECTED_RELEASE_PATH:-}"
EXPECTED_RELEASE_SHA="${EXPECTED_RELEASE_SHA:-}"
EXPECTED_DB_HOST="${EXPECTED_DB_HOST:?EXPECTED_DB_HOST is required}"
EXPECTED_DB_PORT="${EXPECTED_DB_PORT:?EXPECTED_DB_PORT is required}"
EXPECTED_DB_NAME="${EXPECTED_DB_NAME:?EXPECTED_DB_NAME is required}"
DATABASE_GUARD_PATH="${DATABASE_GUARD_PATH:-${EXPECTED_DEPLOY_PATH%/}/tmp/production-database-guard.mjs}"
CRITICAL_PATHS="${CRITICAL_PATHS:-/health /health/db}"
NON_EMPTY_PATHS="${NON_EMPTY_PATHS:-}"
CORS_ORIGIN="${CORS_ORIGIN:-}"
CORS_PATH="${CORS_PATH:-/auth/admin/login}"

require_command curl
require_command node
require_command pm2
require_command readlink

DEPLOY_PATH="${EXPECTED_DEPLOY_PATH%/}"
CURRENT_PATH="${DEPLOY_PATH}/current"

CURRENT_TARGET="$(readlink -f "$CURRENT_PATH" 2>/dev/null || true)"
[[ -n "$CURRENT_TARGET" ]] || fail "$CURRENT_PATH is not a valid symlink"

if [[ -n "$EXPECTED_RELEASE_PATH" || -n "$EXPECTED_RELEASE_SHA" ]]; then
  if [[ -n "$EXPECTED_RELEASE_PATH" ]]; then
    EXPECTED_RELEASE="${EXPECTED_RELEASE_PATH}"
  else
    EXPECTED_RELEASE="${DEPLOY_PATH}/releases/api/${EXPECTED_RELEASE_SHA}"
  fi

  EXPECTED_TARGET="$(readlink -f "$EXPECTED_RELEASE" 2>/dev/null || true)"
  [[ -n "$EXPECTED_TARGET" ]] || fail "expected release does not exist: ${EXPECTED_RELEASE}"
  [[ "$CURRENT_TARGET" == "$EXPECTED_TARGET" ]] || fail "current points to $CURRENT_TARGET, expected $EXPECTED_TARGET"
fi

ENV_FILE="${CURRENT_TARGET}/.env"
[[ -f "$ENV_FILE" ]] || fail "missing runtime env file: $ENV_FILE"
[[ -f "$DATABASE_GUARD_PATH" ]] || fail "missing database guard: $DATABASE_GUARD_PATH"

EXPECTED_DATABASE_HOST="$EXPECTED_DB_HOST" \
  EXPECTED_DATABASE_PORT="$EXPECTED_DB_PORT" \
  EXPECTED_DATABASE_NAME="$EXPECTED_DB_NAME" \
  node "$DATABASE_GUARD_PATH" probe --env-file "$ENV_FILE"

PM2_JSON="$(pm2 jlist)"
PM2_JSON_FILE="$(mktemp)"
trap 'rm -f "$PM2_JSON_FILE"' EXIT
printf '%s' "$PM2_JSON" >"$PM2_JSON_FILE"

EXPECTED_PM2_NAME="$EXPECTED_PM2_NAME" \
  FORBIDDEN_PM2_NAMES="$FORBIDDEN_PM2_NAMES" \
  EXPECTED_CWD="$CURRENT_TARGET" \
  PM2_JSON_FILE="$PM2_JSON_FILE" \
  node <<'NODE'
const fs = require('node:fs')

const apps = JSON.parse(fs.readFileSync(process.env.PM2_JSON_FILE, 'utf8'))
const expectedName = process.env.EXPECTED_PM2_NAME
const forbiddenNames = (process.env.FORBIDDEN_PM2_NAMES || '').split(/\s+/).filter(Boolean)
const expectedCwd = fs.realpathSync(process.env.EXPECTED_CWD)

const expectedApps = apps.filter((app) => app.name === expectedName)
if (expectedApps.length === 0) {
  console.error(`[runtime-guard] ERROR: PM2 process is missing: ${expectedName}`)
  process.exit(1)
}

const offline = expectedApps.filter((app) => app.pm2_env?.status !== 'online')
if (offline.length > 0) {
  console.error(`[runtime-guard] ERROR: PM2 process is not online: ${expectedName}`)
  process.exit(1)
}

for (const app of expectedApps) {
  const cwd = app.pm2_env?.pm_cwd
  if (!cwd) {
    console.error(`[runtime-guard] ERROR: PM2 process has no cwd: ${expectedName}`)
    process.exit(1)
  }

  if (fs.realpathSync(cwd) !== expectedCwd) {
    console.error(`[runtime-guard] ERROR: PM2 cwd is ${cwd}, expected ${expectedCwd}`)
    process.exit(1)
  }
}

for (const forbiddenName of forbiddenNames) {
  if (apps.some((app) => app.name === forbiddenName)) {
    console.error(`[runtime-guard] ERROR: forbidden PM2 process is present: ${forbiddenName}`)
    process.exit(1)
  }
}
NODE
rm -f "$PM2_JSON_FILE"
trap - EXIT

for path in $CRITICAL_PATHS; do
  url="${API_BASE_URL%/}${path}"
  response_file="$(mktemp)"
  curl -fsS --retry 5 --retry-delay 3 "$url" >"$response_file"

  if grep -Eq '"code"[[:space:]]*:' "$response_file" && ! grep -Eq '"code"[[:space:]]*:[[:space:]]*0($|[[:space:],}])' "$response_file"; then
    rm -f "$response_file"
    fail "critical probe returned a failing response envelope: $url"
  fi

  rm -f "$response_file"
  log "critical probe passed: $url"
done

for path in $NON_EMPTY_PATHS; do
  url="${API_BASE_URL%/}${path}"
  response_file="$(mktemp)"
  curl -fsS --retry 5 --retry-delay 3 "$url" >"$response_file"

  if ! RESPONSE_FILE="$response_file" node <<'NODE'
const fs = require('node:fs')

const response = JSON.parse(fs.readFileSync(process.env.RESPONSE_FILE, 'utf8'))

if (response?.code !== 0) {
  console.error('[runtime-guard] ERROR: response code is not zero')
  process.exit(1)
}

if (!Number.isInteger(response?.data?.total) || response.data.total < 1) {
  console.error(
    '[runtime-guard] ERROR: response data.total must be greater than zero',
  )
  process.exit(1)
}
NODE
  then
    rm -f "$response_file"
    fail "non-empty probe returned an invalid response: $url"
  fi

  rm -f "$response_file"
  log "non-empty probe passed: $url"
done

if [[ -n "$CORS_ORIGIN" ]]; then
  cors_url="${API_BASE_URL%/}${CORS_PATH}"
  headers_file="$(mktemp)"
  curl -fsS -I -X OPTIONS \
    -H "Origin: ${CORS_ORIGIN}" \
    -H 'Access-Control-Request-Method: POST' \
    "$cors_url" >"$headers_file"

  if ! grep -iq "^access-control-allow-origin: ${CORS_ORIGIN}" "$headers_file"; then
    rm -f "$headers_file"
    fail "CORS preflight does not allow ${CORS_ORIGIN}: $cors_url"
  fi

  rm -f "$headers_file"
  log "CORS preflight passed: $cors_url"
fi

log "runtime guard passed for ${EXPECTED_PM2_NAME} at ${CURRENT_TARGET}"
