import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type DatabaseConstructor from 'better-sqlite3'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3') as typeof DatabaseConstructor

export function createSettingsRepository(databasePath: string) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const database = new Database(databasePath)
  const initSql = fs.readFileSync(
    path.resolve(process.cwd(), 'database/migrations/001_init.sql'),
    'utf8',
  )
  database.exec(initSql)

  const getStatement = database.prepare<[string], { value: string }>(
    'select value from app_settings where key = ?',
  )
  const setStatement = database.prepare<[string, string]>(
    `
      insert into app_settings (key, value, updated_at)
      values (?, ?, current_timestamp)
      on conflict(key) do update set value = excluded.value, updated_at = current_timestamp
    `,
  )

  return {
    get(key: string) {
      return getStatement.get(key)?.value ?? null
    },
    set(key: string, value: string) {
      setStatement.run(key, value)
    },
  }
}
