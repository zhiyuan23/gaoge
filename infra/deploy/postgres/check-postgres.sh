#!/usr/bin/env bash
set -euo pipefail

STATE_DIR=/var/lib/postgresql/healthcheck
FAIL_FILE="$STATE_DIR/fail_count"
LOG_FILE=/var/log/postgres-healthcheck.log
SERVICE_NAME=postgresql@16-main
DB_NAME=postgres
PG_SOCKET_DIR=/var/run/postgresql
PG_PORT=5432
EXPECTED_DATA_DIRECTORY=/var/lib/postgresql/16/main
MAX_FAILS=3

mkdir -p "$STATE_DIR"

fail_count=$(cat "$FAIL_FILE" 2>/dev/null || echo 0)
probe_sql="select case when current_setting('data_directory') = '$EXPECTED_DATA_DIRECTORY' then 1 else 0 end"

if [ "$(runuser -u postgres -- psql -h "$PG_SOCKET_DIR" -p "$PG_PORT" -d "$DB_NAME" -Atqc "$probe_sql" 2>/dev/null)" = "1" ]; then
  echo 0 > "$FAIL_FILE"
  exit 0
fi

fail_count=$((fail_count + 1))
echo "$fail_count" > "$FAIL_FILE"

if [ "$fail_count" -lt "$MAX_FAILS" ]; then
  exit 1
fi

{
  echo "[$(date '+%F %T')] postgres healthcheck failed ${MAX_FAILS} times, restarting ${SERVICE_NAME}"
  echo "=== free -h ==="
  free -h
  echo "=== df -h ==="
  df -h
  echo "=== df -h /dev/shm ==="
  df -h /dev/shm
  echo "=== PostgreSQL shm entries ==="
  ls -l /dev/shm | grep PostgreSQL || true
  echo "=== PostgreSQL clusters ==="
  pg_lsclusters || true
  echo "=== expected PostgreSQL target ==="
  echo "service=${SERVICE_NAME} socket=${PG_SOCKET_DIR} port=${PG_PORT} data_directory=${EXPECTED_DATA_DIRECTORY}"
  echo "=== recent postgres journal ==="
  journalctl -u "$SERVICE_NAME" --since '10 minutes ago' --no-pager || true
} >> "$LOG_FILE" 2>&1

systemctl restart "$SERVICE_NAME"
echo 0 > "$FAIL_FILE"
