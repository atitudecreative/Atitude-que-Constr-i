// Aplica as migrations SQL de db/migrations em ordem, uma única vez cada.
// Uso: DATABASE_URL=... npm run db:migrate
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não definida')
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    // Evita duas execuções simultâneas (ex.: deploy com várias instâncias).
    await client.query('SELECT pg_advisory_lock(727001)')
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    )
    const applied = new Set((await client.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map((r) => r.version))
    const dir = join(__dirname, '..', 'db', 'migrations')
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
    for (const file of files) {
      if (applied.has(file)) continue
      const sql = readFileSync(join(dir, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`aplicada: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`falha em ${file}: ${(error as Error).message}`)
      }
    }
    console.log('migrations em dia')
  } finally {
    await client.query('SELECT pg_advisory_unlock(727001)').catch(() => {})
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
