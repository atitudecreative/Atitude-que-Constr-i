import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

export const ORIGIN = 'http://localhost:3000'
export const db = new Pool({ connectionString: process.env.DATABASE_URL })

export async function resetDb() {
  await db.query('TRUNCATE leads, admin_sessions, gallery_photos, rate_limits, audit_log RESTART IDENTITY')
  await db.query('DELETE FROM admin_users')
  await db.query('INSERT INTO campaign_progress (id) VALUES (1) ON CONFLICT DO NOTHING')
  await db.query('INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING')
  await db.query(`UPDATE campaign_progress SET published = false, total_raised_cents = NULL, payments_count = NULL, update_frequency = NULL,
                  bricks_total = 12, bricks_completed = NULL WHERE id = 1`)
  await db.query(`UPDATE contribution_methods SET published = false, description = NULL, pix_key = NULL, url = NULL`)
  await db.query(`UPDATE site_settings SET show_status_bar = true, lead_form_approved = false WHERE id = 1`)
}

export async function createUser(email: string, password: string, role: 'admin' | 'editor' = 'admin') {
  const hash = await bcrypt.hash(password, 4)
  await db.query('INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)', [email, 'Pessoa Teste', hash, role])
}

export function req(path: string, init: RequestInit & { ip?: string; cookie?: string; json?: unknown } = {}) {
  const headers = new Headers(init.headers)
  if (!headers.has('origin') && init.method && init.method !== 'GET') headers.set('origin', ORIGIN)
  headers.set('x-forwarded-for', init.ip ?? '203.0.113.10')
  if (init.cookie) headers.set('cookie', init.cookie)
  let body = init.body
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.json)
  }
  return new Request(ORIGIN + path, { ...init, headers, body })
}

export const noCtx = {} as never
export const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) })
