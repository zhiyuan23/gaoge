import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('postgres self-healing probes the Ubuntu cluster explicitly', () => {
  const script = readFileSync('infra/deploy/postgres/check-postgres.sh', 'utf8')

  assert.match(script, /SERVICE_NAME=postgresql@16-main/)
  assert.match(script, /PG_SOCKET_DIR=\/var\/run\/postgresql/)
  assert.match(script, /PG_PORT=5432/)
  assert.match(script, /EXPECTED_DATA_DIRECTORY=\/var\/lib\/postgresql\/16\/main/)
  assert.match(script, /current_setting\('data_directory'\)/)
  assert.match(script, /psql -h "\$PG_SOCKET_DIR" -p "\$PG_PORT"/)
})

test('postgres self-healing restarts only after three failed probes', () => {
  const script = readFileSync('infra/deploy/postgres/check-postgres.sh', 'utf8')

  assert.match(script, /MAX_FAILS=3/)
  assert.match(script, /if \[ "\$fail_count" -lt "\$MAX_FAILS" \]/)
  assert.match(script, /systemctl restart "\$SERVICE_NAME"/)
  assert.doesNotMatch(script, /systemctl restart postgresql(?:\s|$)/)
})
