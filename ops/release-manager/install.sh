#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
DEST_ROOT=''
ACTIVATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)
      [[ $# -ge 2 ]] || { echo 'install: --root requires a path' >&2; exit 2; }
      DEST_ROOT="${2%/}"
      shift 2
      ;;
    --activate)
      ACTIVATE=true
      shift
      ;;
    *)
      echo "install: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -n "$DEST_ROOT" && "$ACTIVATE" == true ]]; then
  echo 'install: --activate is not allowed with --root' >&2
  exit 2
fi
if [[ -z "$DEST_ROOT" && "$EUID" -ne 0 ]]; then
  echo 'install: root privileges are required' >&2
  exit 1
fi

dest() {
  printf '%s%s' "$DEST_ROOT" "$1"
}

install -d -m 0755 "$(dest /usr/local/lib/gaoge-release-manager/bin)" "$(dest /usr/local/lib/gaoge-release-manager/lib)"
install -m 0644 "$SOURCE_ROOT"/lib/*.mjs "$(dest /usr/local/lib/gaoge-release-manager/lib/)"
install -m 0755 "$SOURCE_ROOT/bin/gaoge-release-manager.mjs" "$(dest /usr/local/lib/gaoge-release-manager/bin/)"
install -d -m 0755 "$(dest /usr/local/sbin)"
install -m 0755 "$SOURCE_ROOT/bin/gaoge-release-manager" "$(dest /usr/local/sbin/gaoge-release-manager)"

install -d -m 0750 "$(dest /etc/gaoge)" "$(dest /var/lib/gaoge-release-manager)"
CONFIG_PATH="$(dest /etc/gaoge/release-roots.conf)"
if [[ ! -e "$CONFIG_PATH" ]]; then
  install -m 0640 "$SOURCE_ROOT/config/release-roots.conf.example" "$CONFIG_PATH"
fi

install -d -m 0755 "$(dest /etc/systemd/system)" "$(dest /etc/systemd/journald.conf.d)" "$(dest /etc/logrotate.d)" "$(dest /etc/cron.d)" "$(dest /etc/sudoers.d)"
install -m 0644 "$SOURCE_ROOT"/systemd/*.service "$SOURCE_ROOT"/systemd/*.timer "$(dest /etc/systemd/system/)"
install -m 0644 "$SOURCE_ROOT/systemd/gaoge-journald-storage.conf" "$(dest /etc/systemd/journald.conf.d/gaoge-storage.conf)"
install -m 0644 "$SOURCE_ROOT/logrotate/gaoge-pm2" "$(dest /etc/logrotate.d/gaoge-pm2)"
install -m 0644 "$SOURCE_ROOT/cron/gaoge-production-guard" "$(dest /etc/cron.d/gaoge-production-guard)"
install -m 0440 "$SOURCE_ROOT/sudoers/gaoge-release-manager" "$(dest /etc/sudoers.d/gaoge-release-manager)"

if [[ -z "$DEST_ROOT" ]]; then
  command -v visudo >/dev/null 2>&1 || { echo 'install: visudo is required' >&2; exit 1; }
  visudo -cf /etc/sudoers.d/gaoge-release-manager >/dev/null
  systemctl daemon-reload
  if [[ "$ACTIVATE" == true ]]; then
    systemctl restart systemd-journald
    systemctl enable --now gaoge-release-audit.timer gaoge-release-report.timer
  fi
fi

echo "install: gaoge-release-manager files installed${DEST_ROOT:+ under $DEST_ROOT}"
