import 'server-only'
import { query } from './db'

export async function audit(userId: string | null, action: string, entity: string, entityId?: string | null, details: Record<string, unknown> = {}) {
  await query('INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5)', [
    userId,
    action,
    entity,
    entityId ?? null,
    JSON.stringify(details),
  ])
}
