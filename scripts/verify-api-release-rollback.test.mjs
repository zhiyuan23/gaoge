import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()
const rollbackScript = path.join(workspaceRoot, 'scripts/deployment/rollback-api-release.sh')
const snapshotScript = path.join(workspaceRoot, 'scripts/deployment/prepare-api-rollback-state.sh')

const createFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'gaoge-api-rollback-'))
  const deployPath = path.join(root, 'api')
  const stateDir = path.join(deployPath, 'tmp/deploy-state/run-attempt')
  const sharedDirectory = path.join(deployPath, 'shared')
  const releaseRoot = path.join(deployPath, 'releases/api')
  const newRelease = path.join(releaseRoot, 'new-release')
  const previousRelease = path.join(releaseRoot, 'previous-release')
  const sharedEnvFile = path.join(sharedDirectory, 'api.env')
  const nextEnvFile = path.join(sharedDirectory, 'api.env.next')

  mkdirSync(stateDir, { recursive: true })
  mkdirSync(sharedDirectory, { recursive: true })
  mkdirSync(newRelease, { recursive: true })
  writeFileSync(sharedEnvFile, 'DATABASE_URL="new"\n')
  writeFileSync(nextEnvFile, 'DATABASE_URL="next"\n')
  writeFileSync(path.join(stateDir, 'previous-api.env'), 'DATABASE_URL="old"\n')
  writeFileSync(path.join(stateDir, 'had-api-env'), '')
  writeFileSync(path.join(stateDir, 'env-installed'), '')
  writeFileSync(path.join(stateDir, 'switched'), '')
  symlinkSync(newRelease, path.join(deployPath, 'current'))

  return {
    deployPath,
    newRelease,
    nextEnvFile,
    previousRelease,
    sharedEnvFile,
    stateDir,
  }
}

const runRollback = (fixture, extraEnv = {}) =>
  spawnSync('bash', [rollbackScript], {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEPLOY_PATH: fixture.deployPath,
      STATE_DIR: fixture.stateDir,
      SHARED_ENV_FILE: fixture.sharedEnvFile,
      NEXT_ENV_FILE: fixture.nextEnvFile,
      ROLLBACK_TOKEN: 'test-run',
      DATABASE_URL: 'inherited-wrong',
      ...extraEnv,
    },
  })

const prepareValidPreviousRelease = (fixture) => {
  mkdirSync(path.join(fixture.previousRelease, 'dist'), { recursive: true })
  writeFileSync(path.join(fixture.previousRelease, 'dist/main.js'), '')
  writeFileSync(path.join(fixture.previousRelease, 'ecosystem.config.cjs'), 'module.exports = {}')
  writeFileSync(path.join(fixture.stateDir, 'previous-release'), fixture.previousRelease)
}

const createFakeAtomicMove = (directory) => {
  const fakeAtomicMove = path.join(directory, 'atomic-move')
  writeFileSync(
    fakeAtomicMove,
    '#!/usr/bin/env bash\nset -euo pipefail\n[ "$1" = "-Tf" ]\nrm -f "$3"\n/bin/mv "$2" "$3"\n',
  )
  chmodSync(fakeAtomicMove, 0o755)

  return fakeAtomicMove
}

test('rollback refuses a missing previous release before changing environment or current', () => {
  const fixture = createFixture()
  writeFileSync(path.join(fixture.stateDir, 'previous-release'), fixture.previousRelease)

  const result = runRollback(fixture)

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /previous release is unavailable/)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="new"\n')
  assert.equal(readlinkSync(path.join(fixture.deployPath, 'current')), fixture.newRelease)
  assert.equal(existsSync(fixture.stateDir), false)
})

test('rollback restores a valid release and environment before saving PM2 state', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)

  const binDirectory = path.join(path.dirname(fixture.deployPath), 'bin')
  const pm2Log = path.join(path.dirname(fixture.deployPath), 'pm2.log')
  const guardLog = path.join(path.dirname(fixture.deployPath), 'guard.log')
  const fakePm2 = path.join(binDirectory, 'pm2')
  const fakeGuard = path.join(binDirectory, 'runtime-guard.sh')
  mkdirSync(binDirectory)
  const fakeAtomicMove = createFakeAtomicMove(binDirectory)
  writeFileSync(
    fakePm2,
    `#!/usr/bin/env bash\nprintf "%s DATABASE_URL=%s\\n" "$*" "\${DATABASE_URL-unset}" >> ${JSON.stringify(pm2Log)}\n`,
  )
  writeFileSync(
    fakeGuard,
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      '[ "$(realpath "$EXPECTED_DEPLOY_PATH/current")" = "$EXPECTED_RELEASE_PATH" ]',
      'printf "%s\\n" "$EXPECTED_RELEASE_PATH" > "$GUARD_LOG"',
      '',
    ].join('\n'),
  )
  chmodSync(fakePm2, 0o755)
  chmodSync(fakeGuard, 0o755)

  const result = runRollback(fixture, {
    ATOMIC_MOVE_BIN: fakeAtomicMove,
    EXPECTED_DEPLOY_PATH: fixture.deployPath,
    GUARD_LOG: guardLog,
    PM2_BIN: fakePm2,
    RUNTIME_GUARD_PATH: fakeGuard,
  })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="old"\n')
  assert.equal(
    realpathSync(path.join(fixture.deployPath, 'current')),
    realpathSync(fixture.previousRelease),
  )
  assert.equal(readFileSync(guardLog, 'utf8').trim(), realpathSync(fixture.previousRelease))
  assert.deepEqual(readFileSync(pm2Log, 'utf8').trim().split('\n'), [
    'delete gaoge-api DATABASE_URL=unset',
    'start ecosystem.config.cjs --only gaoge-api --update-env DATABASE_URL=unset',
    'save DATABASE_URL=unset',
  ])
  assert.equal(existsSync(fixture.nextEnvFile), false)
  assert.equal(existsSync(fixture.stateDir), false)
})

test('failed environment snapshot never changes the active environment during rollback', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'gaoge-api-snapshot-'))
  const deployPath = path.join(root, 'api')
  const stateRoot = path.join(deployPath, 'tmp/deploy-state')
  const stateDir = path.join(stateRoot, 'run-attempt')
  const sharedDirectory = path.join(deployPath, 'shared')
  const sharedEnvFile = path.join(sharedDirectory, 'api.env')
  const nextEnvFile = path.join(sharedDirectory, 'api.env.next')
  const fakeCopy = path.join(root, 'copy-partially-and-fail')
  mkdirSync(stateRoot, { recursive: true })
  mkdirSync(sharedDirectory, { recursive: true })
  writeFileSync(sharedEnvFile, 'DATABASE_URL="active"\n')
  writeFileSync(
    fakeCopy,
    '#!/usr/bin/env bash\nprintf "DATABASE_URL=\\"partial\\"\\n" > "$3"\nexit 1\n',
  )
  chmodSync(fakeCopy, 0o755)

  const snapshot = spawnSync('bash', [snapshotScript], {
    encoding: 'utf8',
    env: {
      ...process.env,
      COPY_BIN: fakeCopy,
      DEPLOY_PATH: deployPath,
      SHARED_ENV_FILE: sharedEnvFile,
      STATE_DIR: stateDir,
      STATE_ROOT: stateRoot,
    },
  })

  assert.notEqual(snapshot.status, 0)
  assert.equal(existsSync(path.join(stateDir, 'had-api-env')), true)
  assert.equal(existsSync(path.join(stateDir, 'previous-api.env')), false)

  const rollback = runRollback({
    deployPath,
    nextEnvFile,
    sharedEnvFile,
    stateDir,
  })

  assert.equal(rollback.status, 0, rollback.stderr)
  assert.equal(readFileSync(sharedEnvFile, 'utf8'), 'DATABASE_URL="active"\n')
  assert.equal(existsSync(stateDir), false)
})

test('failed release switch keeps the new environment paired with the new release', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)

  const failingMove = path.join(path.dirname(fixture.deployPath), 'move-and-fail')
  writeFileSync(failingMove, '#!/usr/bin/env bash\nexit 1\n')
  chmodSync(failingMove, 0o755)

  const result = runRollback(fixture, {
    ATOMIC_MOVE_BIN: failingMove,
    RUNTIME_GUARD_PATH: '/must-not-run',
  })

  assert.notEqual(result.status, 0)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="new"\n')
  assert.equal(readlinkSync(path.join(fixture.deployPath, 'current')), fixture.newRelease)
  assert.equal(existsSync(fixture.stateDir), false)
})

test('failed environment pre-staging keeps the new environment paired with the new release', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)
  const failingCopy = path.join(path.dirname(fixture.deployPath), 'copy-and-fail')
  writeFileSync(failingCopy, '#!/usr/bin/env bash\nprintf "partial\\n" > "$3"\nexit 1\n')
  chmodSync(failingCopy, 0o755)

  const result = runRollback(fixture, {
    ROLLBACK_COPY_BIN: failingCopy,
    RUNTIME_GUARD_PATH: '/must-not-run',
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Failed to pre-stage the previous API environment/)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="new"\n')
  assert.equal(readlinkSync(path.join(fixture.deployPath, 'current')), fixture.newRelease)
  assert.equal(existsSync(fixture.stateDir), false)
})

test('failed environment activation compensates current back to the new release', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)
  const binDirectory = path.join(path.dirname(fixture.deployPath), 'bin')
  const failingEnvironmentMove = path.join(binDirectory, 'environment-move-and-fail')
  mkdirSync(binDirectory)
  const fakeAtomicMove = createFakeAtomicMove(binDirectory)
  writeFileSync(failingEnvironmentMove, '#!/usr/bin/env bash\nexit 1\n')
  chmodSync(failingEnvironmentMove, 0o755)

  const result = runRollback(fixture, {
    ATOMIC_MOVE_BIN: fakeAtomicMove,
    ENV_MOVE_BIN: failingEnvironmentMove,
    RUNTIME_GUARD_PATH: '/must-not-run',
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Failed to activate the previous API environment/)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="new"\n')
  assert.equal(
    realpathSync(path.join(fixture.deployPath, 'current')),
    realpathSync(fixture.newRelease),
  )
  assert.equal(existsSync(fixture.stateDir), false)
})

test('failed PM2 start never saves the restored process state', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)
  const binDirectory = path.join(path.dirname(fixture.deployPath), 'bin')
  const pm2Log = path.join(path.dirname(fixture.deployPath), 'pm2.log')
  const fakePm2 = path.join(binDirectory, 'pm2')
  const fakeGuard = path.join(binDirectory, 'runtime-guard.sh')
  mkdirSync(binDirectory)
  const fakeAtomicMove = createFakeAtomicMove(binDirectory)
  writeFileSync(
    fakePm2,
    `#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> ${JSON.stringify(pm2Log)}\n[ "$1" != "start" ]\n`,
  )
  writeFileSync(fakeGuard, '#!/usr/bin/env bash\nexit 0\n')
  chmodSync(fakePm2, 0o755)
  chmodSync(fakeGuard, 0o755)

  const result = runRollback(fixture, {
    ATOMIC_MOVE_BIN: fakeAtomicMove,
    PM2_BIN: fakePm2,
    RUNTIME_GUARD_PATH: fakeGuard,
  })

  assert.notEqual(result.status, 0)
  assert.equal(readFileSync(fixture.sharedEnvFile, 'utf8'), 'DATABASE_URL="old"\n')
  assert.equal(
    realpathSync(path.join(fixture.deployPath, 'current')),
    realpathSync(fixture.previousRelease),
  )
  assert.deepEqual(readFileSync(pm2Log, 'utf8').trim().split('\n'), [
    'delete gaoge-api',
    'start ecosystem.config.cjs --only gaoge-api --update-env',
  ])
  assert.equal(existsSync(fixture.stateDir), false)
})

test('failed runtime guard never saves the restored process state', () => {
  const fixture = createFixture()
  prepareValidPreviousRelease(fixture)
  const binDirectory = path.join(path.dirname(fixture.deployPath), 'bin')
  const pm2Log = path.join(path.dirname(fixture.deployPath), 'pm2.log')
  const fakePm2 = path.join(binDirectory, 'pm2')
  const fakeGuard = path.join(binDirectory, 'runtime-guard.sh')
  mkdirSync(binDirectory)
  const fakeAtomicMove = createFakeAtomicMove(binDirectory)
  writeFileSync(fakePm2, `#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> ${JSON.stringify(pm2Log)}\n`)
  writeFileSync(fakeGuard, '#!/usr/bin/env bash\nexit 1\n')
  chmodSync(fakePm2, 0o755)
  chmodSync(fakeGuard, 0o755)

  const result = runRollback(fixture, {
    ATOMIC_MOVE_BIN: fakeAtomicMove,
    PM2_BIN: fakePm2,
    RUNTIME_GUARD_PATH: fakeGuard,
  })

  assert.notEqual(result.status, 0)
  assert.deepEqual(readFileSync(pm2Log, 'utf8').trim().split('\n'), [
    'delete gaoge-api',
    'start ecosystem.config.cjs --only gaoge-api --update-env',
  ])
  assert.equal(existsSync(fixture.stateDir), false)
})
