# Production Resource Exhaustion Prevention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the confirmed unattended-upgrade and no-swap resource exhaustion paths while preserving a reversible production configuration and recording the durable runbook knowledge.

**Architecture:** Apply two independent host controls: permit limited emergency swapping through `vm.swappiness=10`, and remove the three confirmed unattended timers from automatic scheduling without uninstalling or masking them. Verify host, database, process-manager, package, I/O, and public-domain health before updating one existing canonical troubleshooting page.

**Tech Stack:** Ubuntu 24.04, systemd, sysctl, PostgreSQL 16, PM2, Nginx, Docker, Markdown knowledge base, Node.js validators

## Global Constraints

- Do not delete packages, data, releases, logs, databases, or backups.
- Do not change PostgreSQL, Nginx, PM2, Docker, application, DNS, firewall, or cloud instance configuration.
- Preserve backups of modified host configuration and keep every timer change reversible with `systemctl enable --now`.
- Do not write secrets, raw production logs, private keys, tokens, cookies, or database connection strings to the repository or knowledge base.
- Update only `20-Projects/高歌数字/apps/gaoge/operations/高歌数字主工程-故障排查.md`; classify `11-Guides/高歌数字/高歌数字导览.md` as `guide-no-op`.

---

### Task 1: Apply reversible host prevention controls

**Files:**

- Modify remotely: `/etc/sysctl.conf`
- Verify alias remotely: `/etc/sysctl.d/99-sysctl.conf`
- Create remotely: `/etc/sysctl.conf.bak-YYYYMMDDHHMMSS` using the execution timestamp

**Interfaces:**

- Consumes: confirmed design in `docs/superpowers/specs/2026-08-21-production-resource-exhaustion-prevention-design.md`
- Produces: live and persistent `vm.swappiness=10`; disabled `apt-daily.timer`, `apt-daily-upgrade.timer`, and `fwupd-refresh.timer`

- [ ] **Step 1: Capture the current configuration and timer state**

Run remotely:

```bash
sysctl vm.swappiness
swapon --show
readlink -f /etc/sysctl.conf /etc/sysctl.d/99-sysctl.conf
systemctl is-enabled apt-daily.timer apt-daily-upgrade.timer fwupd-refresh.timer
systemctl is-active apt-daily.timer apt-daily-upgrade.timer fwupd-refresh.timer
```

Expected: `vm.swappiness = 0`, `/www/swap` is active, and the three timers are enabled before the change.

- [ ] **Step 2: Back up and update the persistent sysctl source**

Run remotely after confirming that `/etc/sysctl.d/99-sysctl.conf` resolves to the same canonical file or contains the same setting:

```bash
ops_backup_suffix=$(date +%Y%m%d%H%M%S)
cp --preserve=all /etc/sysctl.conf "/etc/sysctl.conf.bak-${ops_backup_suffix}"
sed -i 's/^vm\.swappiness[[:space:]]*=.*/vm.swappiness=10/' /etc/sysctl.conf
sysctl -p /etc/sysctl.conf
```

Expected: the command prints `vm.swappiness = 10` and no unrelated sysctl line changes.

- [ ] **Step 3: Disable the unattended timers without masking or uninstalling them**

Run remotely:

```bash
systemctl disable --now apt-daily.timer apt-daily-upgrade.timer fwupd-refresh.timer
```

Expected: each timer is removed from its target wants directory; services and packages remain installed.

- [ ] **Step 4: Verify the applied host controls**

Run remotely:

```bash
sysctl vm.swappiness
grep -R -n -E '^[[:space:]]*vm\.swappiness[[:space:]]*=' /etc/sysctl.conf /etc/sysctl.d
systemctl is-enabled apt-daily.timer apt-daily-upgrade.timer fwupd-refresh.timer
systemctl list-timers --all --no-pager
```

Expected: the effective value is `10`, no conflicting persistent value remains, all three timers are `disabled`, and none has a future trigger.

### Task 2: Verify production stability after the configuration change

**Files:**

- No file changes

**Interfaces:**

- Consumes: host controls from Task 1
- Produces: fresh evidence for package consistency, service health, resource stability, and public availability

- [ ] **Step 1: Verify package and system integrity**

Run remotely:

```bash
dpkg --audit
apt-get check
systemctl --failed --no-pager
journalctl -k -b 0 --no-pager | grep -iE 'out of memory|oom-kill|killed process'
```

Expected: no package audit output, `apt-get check` succeeds, zero failed units, and no current-boot OOM entry.

- [ ] **Step 2: Verify database and application processes**

Run remotely:

```bash
systemctl is-active postgresql@16-main nginx docker pm2-root pm2-deploy
pg_isready -h ::1 -p 5432
pm2 ls --no-color
su - deploy -c 'pm2 ls --no-color'
```

Expected: all system services are active, PostgreSQL accepts connections, and all six PM2 applications are `online` with no restart loop.

- [ ] **Step 3: Verify resource stability**

Run remotely:

```bash
free -h
swapon --show
vmstat 1 5
uptime
```

Expected: no sustained blocked processes, no sustained high I/O wait, load remains normal, and Swap is available.

- [ ] **Step 4: Verify public endpoints**

Run from outside the production host:

```bash
for url in https://api.gaoge.cc/health https://api.gaoge.cc/health/db https://crm-api.gaoge.cc/health https://compass-api.gaoge.cc/health https://club-api.gaoge.cc/health https://gaoge.cc https://www.gaoge.cc https://admin.gaoge.cc https://sports.gaoge.cc https://crm.gaoge.cc https://compass.gaoge.cc https://club.gaoge.cc https://finance.gaoge.cc https://admin-finance.gaoge.cc https://monitor.gaoge.cc; do
  curl --noproxy '*' -sS --max-time 12 -o /dev/null -w "$url %{http_code} %{time_total} %{redirect_url}\n" "$url"
done
```

Expected: application endpoints return HTTP 200, `www.gaoge.cc` redirects to the root site, and `monitor.gaoge.cc` returns the expected HTTP 401 protection response. `h5.gaoge.cc` remains a separately reported DNS gap.

### Task 3: Update and validate canonical troubleshooting knowledge

**Files:**

- Modify: `20-Projects/高歌数字/apps/gaoge/operations/高歌数字主工程-故障排查.md`
- No change: `11-Guides/高歌数字/高歌数字导览.md`

**Interfaces:**

- Consumes: verified incident evidence and Task 1/2 final state
- Produces: a durable project troubleshooting section with confirmed facts, uncertainty boundaries, recovery order, and the manual-update responsibility

- [ ] **Step 1: Apply a minimal patch to the existing troubleshooting page**

Add a section named `整机高负载、OOM 与全域名不可用` after `PM2 与日志`. Include:

- the distinction between CPU computation and I/O wait;
- the 2026-08-21 unattended-upgrade timeline and sysstat values;
- the 2026-08-19 OOM victims and the explicit boundary that no single Node leak was proven;
- commands for previous-boot OOM, `sar`, `vmstat`, package integrity, both PM2 domains, PostgreSQL, and public health checks;
- the confirmed post-incident baseline: `vm.swappiness=10`, three disabled timers, and mandatory manual maintenance windows for security updates.

Do not copy raw logs or credentials.

- [ ] **Step 2: Inspect the exact diff**

Run in the knowledge-base root:

```bash
git diff -- 20-Projects/高歌数字/apps/gaoge/operations/高歌数字主工程-故障排查.md
git diff --check
```

Expected: only the approved troubleshooting page changes and existing unrelated sections remain byte-for-byte untouched.

- [ ] **Step 3: Run canonical knowledge validation**

Run in the knowledge-base root:

```bash
node scripts/validate-knowledge-base.mjs --kb-root .
node scripts/retrieval-readiness.mjs --kb-root .
node scripts/audit-knowledge-base.mjs --kb-root .
```

Expected: validation and retrieval readiness pass. Audit may report pre-existing warnings but must return success; report any new warning related to the changed page.

- [ ] **Step 4: Report the Guides classification and recovery scope**

Record `guide-no-op` for `11-Guides/高歌数字/高歌数字导览.md` because the existing guide already routes operational questions to Projects/shared troubleshooting. Report the single changed location, evidence, validators, remaining uncertainty, and the server/knowledge rollback commands.
