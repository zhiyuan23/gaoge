import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const healthcheckPath = 'infra/deploy/postgres/check-postgres.sh'

test('postgres self-healing probes the Ubuntu cluster explicitly', () => {
  const script = readFileSync(healthcheckPath, 'utf8')

  assert.match(script, /SERVICE_NAME=postgresql@16-main/)
  assert.match(script, /PG_SOCKET_DIR=\/var\/run\/postgresql/)
  assert.match(script, /PG_PORT=5432/)
  assert.match(script, /EXPECTED_DATA_DIRECTORY=\/var\/lib\/postgresql\/16\/main/)
  assert.match(script, /current_setting\('data_directory'\)/)
  assert.match(script, /psql -h "\$PG_SOCKET_DIR" -p "\$PG_PORT"/)
})

test('postgres self-healing restarts only after three failed probes', () => {
  const script = readFileSync(healthcheckPath, 'utf8')

  assert.match(script, /MAX_FAILS=3/)
  assert.match(script, /if \[ "\$fail_count" -lt "\$MAX_FAILS" \]/)
  assert.match(script, /systemctl restart "\$SERVICE_NAME"/)
  assert.doesNotMatch(script, /systemctl restart postgresql(?:\s|$)/)
})

test('postgres self-healing state machine restarts the target on the third failure', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'gaoge-postgres-health-'))
  const fakeBin = path.join(directory, 'bin')
  const stateDirectory = path.join(directory, 'state')
  const logFile = path.join(directory, 'healthcheck.log')
  const systemctlLog = path.join(directory, 'systemctl.log')
  mkdirSync(fakeBin)

  const runuser = path.join(fakeBin, 'runuser')
  writeFileSync(
    runuser,
    `#!/usr/bin/env bash
printf '%s' "\${FAKE_POSTGRES_PROBE_OUTPUT:-}"
`,
  )
  chmodSync(runuser, 0o755)

  const systemctl = path.join(fakeBin, 'systemctl')
  writeFileSync(
    systemctl,
    `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_SYSTEMCTL_LOG"
`,
  )
  chmodSync(systemctl, 0o755)

  const free = path.join(fakeBin, 'free')
  writeFileSync(free, '#!/usr/bin/env bash\nexit 0\n')
  chmodSync(free, 0o755)

  const df = path.join(fakeBin, 'df')
  writeFileSync(df, '#!/usr/bin/env bash\nexit 0\n')
  chmodSync(df, 0o755)

  const runHealthcheck = (probeOutput = '') =>
    spawnSync('bash', [healthcheckPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH}`,
        FAKE_POSTGRES_PROBE_OUTPUT: probeOutput,
        FAKE_SYSTEMCTL_LOG: systemctlLog,
        POSTGRES_HEALTHCHECK_STATE_DIR: stateDirectory,
        POSTGRES_HEALTHCHECK_LOG_FILE: logFile,
      },
    })

  assert.equal(runHealthcheck().status, 1)
  assert.equal(runHealthcheck().status, 1)
  assert.equal(existsSync(systemctlLog), false)

  const thirdFailure = runHealthcheck()
  assert.equal(thirdFailure.status, 0, thirdFailure.stderr + readFileSync(logFile, 'utf8'))
  assert.equal(readFileSync(systemctlLog, 'utf8'), 'restart postgresql@16-main\n')
  assert.equal(readFileSync(path.join(stateDirectory, 'fail_count'), 'utf8'), '0\n')

  assert.equal(runHealthcheck('1').status, 0)
  assert.equal(readFileSync(path.join(stateDirectory, 'fail_count'), 'utf8'), '0\n')
})
