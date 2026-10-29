import bcrypt from 'bcryptjs'
import { Client } from 'pg'
import { E2E_DATABASE_URL } from '../../playwright.config'

export const ADMIN = { email: 'admin@e2e.test', password: 'senha-e2e-segura-123' }

export default async function globalSetup() {
  const client = new Client({ connectionString: E2E_DATABASE_URL })
  await client.connect()
  await client.query('TRUNCATE leads, admin_sessions, gallery_photos, rate_limits, audit_log')
  await client.query('DELETE FROM admin_users')
  await client.query(`UPDATE campaign_progress SET published = false, total_raised_cents = NULL, payments_count = NULL, update_frequency = NULL, bricks_total = 12, bricks_completed = NULL`)
  await client.query(`UPDATE contribution_methods SET published = false, description = NULL, pix_key = NULL, url = NULL`)
  await client.query(`UPDATE site_settings SET show_status_bar = true, lead_form_approved = false`)
  await client.query(`INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, 'Equipe E2E', $2, 'admin')`, [
    ADMIN.email,
    await bcrypt.hash(ADMIN.password, 4),
  ])
  await client.end()
}
