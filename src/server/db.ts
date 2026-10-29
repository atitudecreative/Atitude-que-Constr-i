import 'server-only'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { env } from './env'

const globalForPool = globalThis as unknown as { __atitudePool?: Pool }

export function pool(): Pool {
  if (!globalForPool.__atitudePool) {
    globalForPool.__atitudePool = new Pool({
      connectionString: env().DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return globalForPool.__atitudePool
}

// Sempre usar parâmetros ($1, $2...) — nunca interpolar valores no SQL.
export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(text, params)
  return result.rows
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
