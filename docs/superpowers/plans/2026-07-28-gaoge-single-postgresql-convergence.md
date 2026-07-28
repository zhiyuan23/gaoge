# Gaoge Single PostgreSQL Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/var/www/gaoge/api/shared/api.env` the only production database configuration source and prevent Gaoge migrations, runtime startup, backups, or restarts from targeting any database other than Ubuntu PostgreSQL 16 at `[::1]:5432/gaoge_db`.

**Architecture:** Add a dependency-free Node.js database guard that validates the configured target, probes the actual PostgreSQL identity and critical row counts, and creates verified custom-format backups. The API workflow writes and validates one environment file, loads it for Prisma migration and PM2, performs post-start database/API checks, and restores the previous release/environment on failure.

**Tech Stack:** Node.js 22 built-ins, Bash, PostgreSQL CLI (`psql`, `pg_dump`, `pg_restore`), GitHub Actions, PM2, Node test runner.

## Global Constraints

- The only Gaoge production database target is `[::1]:5432/gaoge_db`.
- `DEPLOY_ENV_FILE_API` is the only production configuration source.
- CI Prisma Generate uses a non-production placeholder URL and never reads `secrets.DATABASE_URL`.
- Migration and PM2 runtime load the same server-side `shared/api.env`.
- Production migration is blocked when database identity differs or any of User, Player, Team, MatchRound, or FootballAssetRecord is empty.
- Every production migration is preceded by a verified custom-format backup; retain the latest 14 deployment backups.
- Logs must not print database credentials or the complete connection URL.
- Release/environment rollback is automatic; database migration rollback is always manual.
- This plan does not migrate Compass and does not stop the BT PostgreSQL instance.

---

### Task 1: Add the production database identity and backup guard

**Files:**

- Create: `scripts/deployment/production-database-guard.mjs`
- Create: `scripts/production-database-guard.test.mjs`

**Interfaces:**

- Consumes: `--env-file`, optional `--backup-dir`, optional `--retention`; environment variables `EXPECTED_DATABASE_HOST`, `EXPECTED_DATABASE_PORT`, `EXPECTED_DATABASE_NAME`
- Produces: CLI commands `validate`, `probe`, and `backup`; sanitized success output; non-zero exit code on target, identity, count, backup, or retention failure

- [ ] **Step 1: Write failing tests for environment parsing and target validation**

Create tests that import `readDatabaseUrl` and `parseDatabaseTarget`:

```js
test('accepts the canonical Gaoge production database target', () => {
  const envFile = writeEnv(
    'DATABASE_URL="postgresql://gaoge_user:secret@[::1]:5432/gaoge_db?schema=public"\n',
  )
  const url = readDatabaseUrl(envFile)

  assert.deepEqual(parseDatabaseTarget(url), {
    protocol: 'postgresql:',
    host: '::1',
    port: 5432,
    database: 'gaoge_db',
    schema: 'public',
    username: 'gaoge_user',
    password: 'secret',
  })
})

for (const databaseUrl of [
  'postgresql://gaoge_user:secret@127.0.0.1:5432/gaoge_db',
  'postgresql://gaoge_user:secret@localhost:5432/gaoge_db',
  'postgresql://gaoge_user:secret@[::1]:5433/gaoge_db',
  'postgresql://gaoge_user:secret@[::1]:5432/wrong_db',
]) {
  test(`rejects non-canonical target ${databaseUrl}`, () => {
    const envFile = writeEnv(`DATABASE_URL="${databaseUrl}"\n`)
    assert.throws(() => validateConfiguredTarget(envFile, canonicalExpected))
  })
}

test('rejects missing and duplicate DATABASE_URL lines', () => {
  assert.throws(() => readDatabaseUrl(writeEnv('APP_PORT=3000\n')))
  assert.throws(() =>
    readDatabaseUrl(writeEnv('DATABASE_URL="postgresql://one"\nDATABASE_URL="postgresql://two"\n')),
  )
})
```

- [ ] **Step 2: Run the parser tests and verify they fail**

Run:

```bash
node --test scripts/production-database-guard.test.mjs
```

Expected: FAIL because `production-database-guard.mjs` does not exist.

- [ ] **Step 3: Implement URL parsing and sanitized target validation**

Implement and export:

```js
export const readDatabaseUrl = (envFile) => {
  const lines = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('DATABASE_URL='))

  if (lines.length !== 1) {
    throw new GuardError(`expected exactly one DATABASE_URL, found ${lines.length}`)
  }

  const value = lines[0].slice('DATABASE_URL='.length).trim()
  return value.replace(/^(['"])(.*)\1$/, '$2')
}

export const parseDatabaseTarget = (databaseUrl) => {
  const parsed = new URL(databaseUrl)
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new GuardError(`unsupported database protocol: ${parsed.protocol}`)
  }

  const schemas = parsed.searchParams.getAll('schema')
  if (schemas.length !== 1 || schemas[0] !== 'public') {
    throw new GuardError('DATABASE_URL must contain exactly one schema=public')
  }

  return {
    protocol: parsed.protocol,
    host: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: Number(parsed.port || 5432),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    schema: schemas[0],
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  }
}

export const validateConfiguredTarget = (envFile, expected) => {
  const target = parseDatabaseTarget(readDatabaseUrl(envFile))
  const actual = `${target.host}:${target.port}/${target.database}?schema=${target.schema}`
  const required = `${expected.host}:${expected.port}/${expected.database}?schema=${expected.schema}`

  if (actual !== required) {
    throw new GuardError(`database target mismatch: got ${actual}, expected ${required}`)
  }

  return target
}
```

The CLI must catch `GuardError`, print `[database-guard] ERROR: <sanitized message>`, and set exit code 1 without printing `databaseUrl`, `username`, or `password`.

- [ ] **Step 4: Run parser tests and verify they pass**

Run:

```bash
node --test scripts/production-database-guard.test.mjs
```

Expected: parser and validation tests PASS.

- [ ] **Step 5: Write failing probe tests with a fake psql executable**

Add a temporary executable to the test `PATH` that prints one JSON line:

```js
const healthyProbe = {
  serverAddress: '::1',
  serverPort: 5432,
  database: 'gaoge_db',
  schema: 'public',
  users: 7,
  players: 39,
  teams: 3,
  matches: 14,
  assets: 37,
}

test('probe accepts the canonical database with non-empty critical tables', () => {
  const result = runGuard(['probe', '--env-file', canonicalEnv], {
    FAKE_PSQL_OUTPUT: JSON.stringify(healthyProbe),
  })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /users=7 players=39 teams=3 matches=14 assets=37/)
  assert.doesNotMatch(result.stdout + result.stderr, /secret/)
})

for (const field of ['users', 'players', 'teams', 'matches', 'assets']) {
  test(`probe rejects zero ${field}`, () => {
    const output = { ...healthyProbe, [field]: 0 }
    const result = runGuard(['probe', '--env-file', canonicalEnv], {
      FAKE_PSQL_OUTPUT: JSON.stringify(output),
    })
    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(`${field} must be greater than zero`))
  })
}
```

- [ ] **Step 6: Run probe tests and verify they fail**

Run:

```bash
node --test scripts/production-database-guard.test.mjs
```

Expected: FAIL because probe execution is not implemented.

- [ ] **Step 7: Implement actual identity and row-count probing**

Use `spawnSync('psql', ['-X', '-A', '-t', '-q', '-c', PROBE_SQL], { env })`. Pass credentials only through:

```js
const postgresEnvironment = (target) => ({
  ...process.env,
  PGHOST: target.host,
  PGPORT: String(target.port),
  PGDATABASE: target.database,
  PGUSER: target.username,
  PGPASSWORD: target.password,
})
```

Use this exact query:

```sql
select json_build_object(
  'serverAddress', inet_server_addr()::text,
  'serverPort', inet_server_port(),
  'database', current_database(),
  'users', (select count(*) from "User"),
  'players', (select count(*) from "Player"),
  'teams', (select count(*) from "Team"),
  'matches', (select count(*) from "MatchRound"),
  'assets', (select count(*) from "FootballAssetRecord")
)::text;
```

Reject non-zero `psql` exit status, invalid JSON, identity mismatch, or any count less than 1. Print only:

```text
[database-guard] verified ::1:5432/gaoge_db users=7 players=39 teams=3 matches=14 assets=37
```

- [ ] **Step 8: Run probe tests and verify they pass**

Run:

```bash
node --test scripts/production-database-guard.test.mjs
```

Expected: parser, validation, identity, count, and redaction tests PASS.

- [ ] **Step 9: Write failing backup and retention tests**

Add fake `pg_dump` and `pg_restore` executables and assert:

```js
test('backup creates a verified custom dump and retains the newest fourteen', () => {
  seedBackups(15)
  const result = runGuard([
    'backup',
    '--env-file',
    canonicalEnv,
    '--backup-dir',
    backupDir,
    '--retention',
    '14',
  ])

  assert.equal(result.status, 0)
  assert.equal(listDeploymentBackups(backupDir).length, 14)
  assert.match(result.stdout, /sha256=[a-f0-9]{64}/)
})

test('backup fails when pg_restore cannot read the dump', () => {
  const result = runGuard(['backup', '--env-file', canonicalEnv, '--backup-dir', backupDir], {
    FAKE_PG_RESTORE_EXIT: '1',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /backup verification failed/)
})
```

- [ ] **Step 10: Implement custom backup, verification, checksum, and retention**

Create filenames as:

```text
gaoge-db-pre-migration-YYYYMMDD-HHMMSS.dump
```

Run:

```js
spawnSync(
  'pg_dump',
  ['--format=custom', '--compress=9', '--no-owner', '--no-privileges', '--file', backupFile],
  { env: postgresEnvironment(target) },
)
spawnSync('pg_restore', ['--list', backupFile], { encoding: 'utf8' })
```

Require a non-empty `pg_restore --list` result, set file mode `0o600`, set backup directory mode `0o700`, print file name/size/SHA-256, sort matching backup names descending, and delete entries after index 13.

- [ ] **Step 11: Run all database guard tests**

Run:

```bash
node --test scripts/production-database-guard.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 12: Commit the database guard**

```bash
git add scripts/deployment/production-database-guard.mjs \
  scripts/production-database-guard.test.mjs
git commit -m "feat(deploy): add production database identity guard"
```

---

### Task 2: Integrate database and non-empty API checks into the runtime guard

**Files:**

- Modify: `scripts/deployment/verify-remote-runtime.sh`
- Modify: `scripts/verify-production-runtime-guard.test.mjs`

**Interfaces:**

- Consumes: `DATABASE_GUARD_PATH`, `EXPECTED_DB_HOST`, `EXPECTED_DB_PORT`, `EXPECTED_DB_NAME`, `CRITICAL_PATHS`, `NON_EMPTY_PATHS`
- Produces: release/PM2/database/API/CORS verification with non-zero exit on empty business responses

- [ ] **Step 1: Extend the existing test with failing assertions**

Require:

```js
assert.match(guard, /DATABASE_GUARD_PATH/)
assert.match(guard, /EXPECTED_DB_PORT/)
assert.match(guard, /EXPECTED_DB_NAME/)
assert.match(guard, /NON_EMPTY_PATHS/)
assert.match(guard, /production-database-guard\.mjs/)
assert.match(guard, /data\.total/)
```

Update the workflow expectation so non-empty endpoints include players, teams, matches, and assets.

- [ ] **Step 2: Run the runtime guard test and verify it fails**

Run:

```bash
node --test scripts/verify-production-runtime-guard.test.mjs
```

Expected: FAIL on missing database guard and non-empty endpoint integration.

- [ ] **Step 3: Call the database guard after resolving the current release**

Add required variables:

```bash
EXPECTED_DB_HOST="${EXPECTED_DB_HOST:?EXPECTED_DB_HOST is required}"
EXPECTED_DB_PORT="${EXPECTED_DB_PORT:?EXPECTED_DB_PORT is required}"
EXPECTED_DB_NAME="${EXPECTED_DB_NAME:?EXPECTED_DB_NAME is required}"
DATABASE_GUARD_PATH="${DATABASE_GUARD_PATH:-${EXPECTED_DEPLOY_PATH%/}/tmp/production-database-guard.mjs}"
NON_EMPTY_PATHS="${NON_EMPTY_PATHS:-}"
```

After resolving `ENV_FILE`, run:

```bash
EXPECTED_DATABASE_HOST="$EXPECTED_DB_HOST" \
EXPECTED_DATABASE_PORT="$EXPECTED_DB_PORT" \
EXPECTED_DATABASE_NAME="$EXPECTED_DB_NAME" \
node "$DATABASE_GUARD_PATH" probe --env-file "$ENV_FILE"
```

Remove the partial string-pattern database validation from the shell script; the Node guard becomes the single parser and identity authority.

- [ ] **Step 4: Add JSON-aware non-empty endpoint checks**

For paths in `NON_EMPTY_PATHS`, parse the response with Node:

```bash
RESPONSE_FILE="$response_file" node <<'NODE'
const fs = require('node:fs')
const response = JSON.parse(fs.readFileSync(process.env.RESPONSE_FILE, 'utf8'))

if (response?.code !== 0) {
  console.error('[runtime-guard] ERROR: response code is not zero')
  process.exit(1)
}

if (!Number.isInteger(response?.data?.total) || response.data.total < 1) {
  console.error('[runtime-guard] ERROR: response data.total must be greater than zero')
  process.exit(1)
}
NODE
```

Continue to validate envelope success for ordinary `CRITICAL_PATHS`.

- [ ] **Step 5: Run runtime guard tests**

Run:

```bash
node --test scripts/verify-production-runtime-guard.test.mjs
bash -n scripts/deployment/verify-remote-runtime.sh
```

Expected: PASS and shell syntax exit 0.

- [ ] **Step 6: Commit runtime guard integration**

```bash
git add scripts/deployment/verify-remote-runtime.sh \
  scripts/verify-production-runtime-guard.test.mjs
git commit -m "fix(deploy): reject wrong or empty production database"
```

---

### Task 3: Make the API workflow use one environment source with backup and rollback

**Files:**

- Modify: `.github/workflows/deploy-api.yml`
- Create: `scripts/deployment/prepare-api-rollback-state.sh`
- Create: `scripts/deployment/rollback-api-release.sh`
- Create: `scripts/verify-api-release-rollback.test.mjs`
- Modify: `scripts/verify-production-runtime-guard.test.mjs`

**Interfaces:**

- Consumes: `DEPLOY_ENV_FILE_API`, `EXPECTED_DATABASE_HOST`, existing deploy host/user/path and SSH key Secrets
- Produces: atomic environment install, pre-migration probe/backup, shared-env migration, guarded switch, automatic release/environment rollback

- [ ] **Step 1: Write failing workflow assertions**

Add:

```js
assert.doesNotMatch(workflow, /secrets\.DATABASE_URL/)
assert.match(workflow, /postgresql:\/\/build:build@127\.0\.0\.1:1\/build/)
assert.match(workflow, /production-database-guard\.mjs/)
assert.match(workflow, /api\.env\.next-/)
assert.match(workflow, /mv .*api\.env/)
assert.match(workflow, /node .*production-database-guard\.mjs probe/)
assert.match(workflow, /node .*production-database-guard\.mjs backup/)
assert.match(
  remoteWorkflow,
  /env -i HOME="\$HOME" PATH="\$PATH"\s+node --env-file=\.env \.\/node_modules\/prisma\/build\/index\.js migrate deploy/,
)
assert.doesNotMatch(workflow, /\. \.\/\.env/)
assert.match(workflow, /id:\s+switch-release/)
assert.match(workflow, /if:\s+failure\(\)/)
assert.match(workflow, /previous-release/)
assert.match(workflow, /previous-api\.env/)
```

Assert the first `pm2 save` occurrence is after the runtime guard step.

- [ ] **Step 2: Run workflow tests and verify they fail**

Run:

```bash
node --test scripts/verify-production-runtime-guard.test.mjs
```

Expected: FAIL on the existing dual Secret and missing backup/rollback workflow.

- [ ] **Step 3: Remove production DATABASE_URL from CI generation**

Use:

```yaml
env:
  DATABASE_URL: postgresql://build:build@127.0.0.1:1/build
```

for both Prisma Generate steps. Add `.github/workflows/deploy-api.yml` and `scripts/deployment/production-database-guard.mjs` to the workflow path filter.

- [ ] **Step 4: Upload both deployment guards before environment validation**

Upload:

```yaml
rsync -avz \
scripts/deployment/verify-remote-runtime.sh \
scripts/deployment/production-database-guard.mjs \
${{ secrets.API_DEPLOY_USER }}@${{ secrets.API_DEPLOY_HOST }}:${{ secrets.API_DEPLOY_PATH }}/tmp/
```

Require `psql`, `pg_dump`, `pg_restore`, `node`, and `pm2` during server environment checks.

- [ ] **Step 5: Save rollback state and atomically install the environment**

Create `${API_DEPLOY_PATH}/tmp/deploy-state/${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`. Save:

```text
previous-release
previous-api.env
```

Write the Secret to `${API_DEPLOY_PATH}/shared/api.env.next-${GITHUB_SHA}`, mode `600`, validate it with:

```bash
EXPECTED_DATABASE_HOST='${{ secrets.EXPECTED_DATABASE_HOST }}' \
EXPECTED_DATABASE_PORT='5432' \
EXPECTED_DATABASE_NAME='gaoge_db' \
node ${API_DEPLOY_PATH}/tmp/production-database-guard.mjs validate \
  --env-file ${API_DEPLOY_PATH}/shared/api.env.next-${GITHUB_SHA}
```

Only then rename the temporary file to `shared/api.env`.

- [ ] **Step 6: Probe and back up before migration**

Run against the release `.env`:

```bash
EXPECTED_DATABASE_HOST='${{ secrets.EXPECTED_DATABASE_HOST }}' \
EXPECTED_DATABASE_PORT='5432' \
EXPECTED_DATABASE_NAME='gaoge_db' \
node ${API_DEPLOY_PATH}/tmp/production-database-guard.mjs probe \
  --env-file .env

EXPECTED_DATABASE_HOST='${{ secrets.EXPECTED_DATABASE_HOST }}' \
EXPECTED_DATABASE_PORT='5432' \
EXPECTED_DATABASE_NAME='gaoge_db' \
node ${API_DEPLOY_PATH}/tmp/production-database-guard.mjs backup \
  --env-file .env \
  --backup-dir ${API_DEPLOY_PATH}/backups \
  --retention 14
```

Clear inherited variables and load the migration environment with Node's dotenv parser, without executing the file as shell code:

```bash
env -i HOME="$HOME" PATH="$PATH" \
  node --env-file=.env ./node_modules/prisma/build/index.js migrate deploy \
  --schema prisma/schema.prisma
```

- [ ] **Step 7: Delay PM2 persistence until post-start verification**

Give the switch step `id: switch-release`, switch `current`, restart `gaoge-api`, and do not call `pm2 save`.

Run the runtime guard with:

```bash
DATABASE_GUARD_PATH='${API_DEPLOY_PATH}/tmp/production-database-guard.mjs' \
EXPECTED_DB_HOST='${{ secrets.EXPECTED_DATABASE_HOST }}' \
EXPECTED_DB_PORT='5432' \
EXPECTED_DB_NAME='gaoge_db' \
CRITICAL_PATHS='/health /health/db' \
NON_EMPTY_PATHS='/football/players?page=1&pageSize=1 /football/teams?page=1&pageSize=1 /football/match-rounds?page=1&pageSize=1 /football/asset-records?page=1&pageSize=1'
```

Call `pm2 save` only after this guard succeeds.

- [ ] **Step 8: Add a failure rollback step**

With `if: failure()`, SSH to the server and:

1. Read the saved previous release and explicit previous-environment state.
2. If `switch-release` ran, resolve and validate the previous release root plus its startup files before mutating the environment or `current`.
3. Pre-stage and verify `previous-api.env` in the shared environment directory.
4. Atomically restore `current`, verify its resolved target, then atomically activate the pre-staged environment. Compensate `current` to the active release if activation fails.
5. Restart `gaoge-api` from restored `current` through a sanitized PM2 environment.
6. Run the complete database, API payload, and CORS runtime guard.
7. Save the restored PM2 state and remove rollback state; also remove rollback state on an unsuccessful rollback exit.

Do not invoke Prisma or restore the database backup in this step.

- [ ] **Step 9: Run workflow tests and YAML formatting checks**

Run:

```bash
node --test scripts/verify-production-runtime-guard.test.mjs
pnpm exec prettier --check .github/workflows/deploy-api.yml \
  scripts/verify-production-runtime-guard.test.mjs
```

Expected: all tests PASS and Prettier reports both files formatted.

- [ ] **Step 10: Commit the single-source deployment workflow**

```bash
git add .github/workflows/deploy-api.yml \
  scripts/verify-production-runtime-guard.test.mjs
git commit -m "fix(deploy): use one production database configuration"
```

---

### Task 4: Lock PostgreSQL self-healing and documentation to Ubuntu PostgreSQL 16

**Files:**

- Modify: `infra/deploy/postgres/check-postgres.sh`
- Create: `scripts/verify-postgres-healthcheck.test.mjs`
- Modify: `docs/conventions/env-and-config.md`
- Modify: `docs/conventions/testing-and-verification.md`
- Modify: `docs/ops/production-runtime-guard.md`
- Modify: `docs/ops/postgres-monitoring-and-self-healing.md`

**Interfaces:**

- Consumes: Ubuntu PostgreSQL socket `/var/run/postgresql`, port `5432`, expected data directory `/var/lib/postgresql/16/main`
- Produces: self-healing that cannot probe/restart based on the BT PostgreSQL instance; documented single-source deployment and recovery procedure

- [ ] **Step 1: Write failing healthcheck assertions**

Create:

```js
test('postgres self-healing probes the Ubuntu cluster explicitly', () => {
  const script = readFileSync('infra/deploy/postgres/check-postgres.sh', 'utf8')

  assert.match(script, /SERVICE_NAME=postgresql@16-main/)
  assert.match(script, /PG_SOCKET_DIR=\/var\/run\/postgresql/)
  assert.match(script, /PG_PORT=5432/)
  assert.match(script, /EXPECTED_DATA_DIRECTORY=\/var\/lib\/postgresql\/16\/main/)
  assert.match(script, /current_setting\\('data_directory'\\)/)
  assert.match(script, /psql -h "\$PG_SOCKET_DIR" -p "\$PG_PORT"/)
})
```

- [ ] **Step 2: Run the healthcheck test and verify it fails**

Run:

```bash
node --test scripts/verify-postgres-healthcheck.test.mjs
```

Expected: FAIL because the healthcheck uses the default socket and does not verify data directory.

- [ ] **Step 3: Implement explicit Ubuntu cluster probing**

Add:

```bash
PG_SOCKET_DIR=/var/run/postgresql
PG_PORT=5432
EXPECTED_DATA_DIRECTORY=/var/lib/postgresql/16/main
```

Probe with:

```bash
probe_sql="select case when current_setting('data_directory') = '$EXPECTED_DATA_DIRECTORY' then 1 else 0 end"

if [ "$(runuser -u postgres -- psql \
  -h "$PG_SOCKET_DIR" \
  -p "$PG_PORT" \
  -d "$DB_NAME" \
  -Atqc "$probe_sql" 2>/dev/null)" = "1" ]; then
  echo 0 > "$FAIL_FILE"
  exit 0
fi
```

Include socket, port, expected directory, and `pg_lsclusters` in failure diagnostics without printing credentials.

- [ ] **Step 4: Run healthcheck tests and shell syntax checks**

Run:

```bash
node --test scripts/verify-postgres-healthcheck.test.mjs
bash -n infra/deploy/postgres/check-postgres.sh
```

Expected: PASS and shell syntax exit 0.

- [ ] **Step 5: Update conventions and operations documentation**

Document all of the following explicitly:

- `DEPLOY_ENV_FILE_API` is the only production database configuration source.
- `DATABASE_URL` is read from `shared/api.env` by migration and runtime.
- Canonical target is `[::1]:5432/gaoge_db` on `postgresql@16-main`.
- BT PostgreSQL remains temporarily for Compass and is not a valid Gaoge target.
- Every production migration performs identity/count probes and a verified backup.
- Backups retain the newest 14 deployment dumps.
- Release/environment rollback is automatic; database rollback is manual.
- Required local tests and production verification commands.

- [ ] **Step 6: Run documentation and targeted formatting checks**

Run:

```bash
pnpm exec prettier --check \
  scripts/verify-postgres-healthcheck.test.mjs \
  docs/conventions/env-and-config.md \
  docs/conventions/testing-and-verification.md \
  docs/ops/production-runtime-guard.md \
  docs/ops/postgres-monitoring-and-self-healing.md
```

Expected: all files are formatted.

- [ ] **Step 7: Commit healthcheck and documentation**

```bash
git add infra/deploy/postgres/check-postgres.sh \
  scripts/verify-postgres-healthcheck.test.mjs \
  docs/conventions/env-and-config.md \
  docs/conventions/testing-and-verification.md \
  docs/ops/production-runtime-guard.md \
  docs/ops/postgres-monitoring-and-self-healing.md
git commit -m "docs(ops): lock Gaoge to Ubuntu PostgreSQL"
```

---

### Task 5: Verify locally, deploy to production, and verify the live system

**Files:**

- Verify only; no planned source edits

**Interfaces:**

- Consumes: completed Tasks 1–4, current production backup and corrected Secrets
- Produces: passing local validation, merged/pushed implementation, successful production API workflow, live database/data/account evidence

- [ ] **Step 1: Run the complete deployment test suite**

Run:

```bash
node --test \
  scripts/production-database-guard.test.mjs \
  scripts/verify-production-runtime-guard.test.mjs \
  scripts/verify-postgres-healthcheck.test.mjs
bash -n scripts/deployment/verify-remote-runtime.sh
bash -n infra/deploy/postgres/check-postgres.sh
```

Expected: all Node tests PASS; both shell syntax checks exit 0.

- [ ] **Step 2: Run repository validation proportional to the change**

Run:

```bash
pnpm exec prettier --check \
  .github/workflows/deploy-api.yml \
  scripts/deployment/production-database-guard.mjs \
  scripts/production-database-guard.test.mjs \
  scripts/verify-production-runtime-guard.test.mjs \
  scripts/verify-postgres-healthcheck.test.mjs \
  docs/conventions/env-and-config.md \
  docs/conventions/testing-and-verification.md \
  docs/ops/production-runtime-guard.md \
  docs/ops/postgres-monitoring-and-self-healing.md
pnpm lint
```

Expected: Prettier and lint PASS with zero errors.

- [ ] **Step 3: Record pre-deploy production evidence**

Over SSH, use `/var/www/gaoge/api/shared/api.env` without printing it. Record:

- `inet_server_addr() = ::1`
- `inet_server_port() = 5432`
- `current_database() = gaoge_db`
- users, players, teams, matches, assets
- `Lautaro` status and role
- newest valid backup path and SHA-256
- `pm2-deploy.service` enabled/active

- [ ] **Step 4: Integrate the implementation branch**

Use `superpowers:finishing-a-development-branch`. Merge the verified implementation into `main` without rewriting unrelated user commits, then push `main`.

Expected: the API production workflow is triggered by changed deployment paths.

- [ ] **Step 5: Monitor the production API workflow**

Run:

```bash
gh run list --repo zhiyuan23/gaoge --workflow deploy-api.yml --limit 5
gh run watch <run-id> --repo zhiyuan23/gaoge --exit-status
```

Expected: verify and deploy jobs complete successfully. Logs show sanitized canonical target, verified pre-migration backup, migration loaded from release `.env`, runtime guard success, and PM2 save after verification.

- [ ] **Step 6: Verify live database and APIs**

Verify over SSH and HTTPS:

```text
database: ::1:5432/gaoge_db
players: at least 39
teams: at least 3
matches: at least 14
assets: at least 37
Lautaro: active, super_admin
```

Verify:

- `/health`
- `/health/db`
- `/football/players?page=1&pageSize=1`
- `/football/teams?page=1&pageSize=1`
- `/football/match-rounds?page=1&pageSize=1`
- `/football/asset-records?page=1&pageSize=1`
- Admin login CORS preflight

Expected: health endpoints return success; all list endpoints return `code=0` and positive totals; CORS permits `https://admin.gaoge.cc`.

- [ ] **Step 7: Verify persistence and rollback artifacts**

Confirm:

- `shared/api.env` remains mode `600` and points to `[::1]:5432/gaoge_db`.
- New verified pre-migration backup exists, has mode `600`, and `pg_restore --list` succeeds.
- Deployment backup count is no more than 14.
- `current` points to the deployed Git SHA.
- `gaoge-api` is online and PM2 dump contains only `gaoge-api` for deploy user.
- `pm2-deploy.service` is enabled and active.
- `DATABASE_URL` is absent from workflow usage.

- [ ] **Step 8: Report production completion**

Report the deployed commit, workflow run, database identity, pre/post data counts, backup path/checksum, runtime guard result, and any unverified item. Do not claim the consolidation complete unless every required check has fresh evidence.
