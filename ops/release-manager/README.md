# Gaoge Release Manager

`gaoge-release-manager` centrally manages immutable release directories for the Gaoge production server. It protects active and rollback releases, applies disk and inode gates before upload, records deployment state, and deletes only bounded, revalidated candidates.

## Install

Run as root from this directory:

```bash
bash install.sh
gaoge-release-manager --version
gaoge-release-manager audit --target all --json
```

The installer preserves an existing `/etc/gaoge/release-roots.conf`. It installs timers but does not enable them unless `--activate` is passed. Do not activate timers before dry-run and bootstrap review.

Deployments running as `deploy` must call `sudo -n gaoge-release-manager`; the installed sudoers rule grants only this path, while the manager itself remains constrained to root-owned configured targets.

## Safe takeover

```bash
gaoge-release-manager plan --target all --json
gaoge-release-manager bootstrap --target all
gaoge-release-manager bootstrap --target all --apply
gaoge-release-manager plan --target all --json
```

Review every unresolved path before `--apply`. Bootstrap writes the current success marker and creates `previous` only from a release that contains the target's required artifacts. It never deletes a release.

## Normal operations

```bash
gaoge-release-manager preflight --target gaoge-api
gaoge-release-manager audit --target all --json
gaoge-release-manager prune --target gaoge-api --max-delete 1 --json
gaoge-release-manager rollback --target gaoge-api
```

`rollback` only changes the `current` link. The owning deployment workflow must restart PM2 and verify HTTPS health. Exit codes are `0` success, `2` argument/config error, `3` path/config-file safety error, `4` disk gate, `5` lock timeout, and `6` audit/runtime inconsistency.

`audit` removes an expired in-progress state file only when the matching release directory does not exist. Existing failed or incomplete release directories keep their state and remain subject to the configured 24-hour TTL.

Disable scheduled maintenance without changing releases:

```bash
systemctl disable --now gaoge-release-audit.timer gaoge-release-report.timer
systemctl stop gaoge-release-audit.service gaoge-release-report.service || true
```

## Storage boundaries

- Never automate `pnpm store prune`.
- Never automate `docker system prune`, `docker volume prune`, or deletion of named volumes.
- After a separate manual audit, `docker image prune --filter dangling=true` may be considered in a maintenance window.
- Do not put database backups, uploads, `.env` files, secrets, or other persistent business state inside release directories.
