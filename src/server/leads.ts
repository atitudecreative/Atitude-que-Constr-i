import 'server-only'
import { query } from './db'
import { notifyNewLead, sendLeadWebhook, webhookConfigured, type LeadPayload } from './integrations'
import { logger } from './logger'
import { CONSENT_TEXT, leadSchema } from '@/lib/validation'

type LeadRow = {
  id: string
  name: string
  email: string
  phone: string | null
  consent_text: string
  consent_at: Date
  utm: Record<string, string>
  created_at: Date
  updated_at: Date
  webhook_status: 'skipped' | 'pending' | 'sent' | 'failed'
  webhook_attempts: number
  submissions: number
}

export type LeadListItem = Omit<LeadRow, 'utm' | 'consent_text'> & { source: string | null }

function toPayload(row: LeadRow): LeadPayload {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    consent: { granted: true, text: row.consent_text, at: new Date(row.consent_at).toISOString() },
    utm: row.utm ?? {},
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function deliverLead(row: LeadRow) {
  if (!webhookConfigured()) return
  const result = await sendLeadWebhook(toPayload(row))
  await query(
    `UPDATE leads SET webhook_status = $2, webhook_attempts = webhook_attempts + 1, webhook_last_error = $3 WHERE id = $1`,
    [row.id, result.ok ? 'sent' : 'failed', result.ok ? null : result.error],
  )
  if (!result.ok) logger.warn('lead_webhook_failed', { leadId: row.id, error: result.error })
}

// Cria ou atualiza o cadastro (um por e-mail). A resposta é a mesma nos dois casos,
// para não revelar se um e-mail já está cadastrado.
export async function upsertLead(input: unknown, meta: { ipHash: string | null; userAgent: string | null; source: string | null }) {
  const data = leadSchema.parse(input)
  if (data.website) return { ignored: true as const }

  const utm = Object.fromEntries(Object.entries(data.utm ?? {}).filter(([, v]) => v)) as Record<string, string>
  const rows = await query<LeadRow & { inserted: boolean }>(
    `INSERT INTO leads (name, email, phone, consent_marketing, consent_text, consent_at, source, utm, ip_hash, user_agent, webhook_status)
     VALUES ($1, $2, $3, true, $4, now(), $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       phone = COALESCE(EXCLUDED.phone, leads.phone),
       consent_text = EXCLUDED.consent_text,
       consent_at = EXCLUDED.consent_at,
       utm = leads.utm || EXCLUDED.utm,
       submissions = leads.submissions + 1,
       webhook_status = EXCLUDED.webhook_status,
       updated_at = now()
     RETURNING id, name, email, phone, consent_text, consent_at, utm, created_at, updated_at,
               webhook_status, webhook_attempts, submissions, (xmax = 0) AS inserted`,
    [
      data.name,
      data.email,
      data.phone ?? null,
      CONSENT_TEXT,
      meta.source?.slice(0, 200) ?? null,
      JSON.stringify(utm),
      meta.ipHash,
      meta.userAgent?.slice(0, 300) ?? null,
      webhookConfigured() ? 'pending' : 'skipped',
    ],
  )
  const row = rows[0]
  logger.info('lead_upserted', { leadId: row.id, inserted: row.inserted })
  await deliverLead(row)
  if (row.inserted) await notifyNewLead(row.id)
  return { ignored: false as const, id: row.id }
}

export async function listLeads(params: { page: number; pageSize: number; search?: string }) {
  const search = params.search?.trim()
  const where = search ? `WHERE name ILIKE $1 OR email ILIKE $1 OR phone LIKE $1` : ''
  const args: unknown[] = search ? [`%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`] : []
  const totalRows = await query<{ count: string }>(`SELECT count(*) FROM leads ${where}`, args)
  const offset = (params.page - 1) * params.pageSize
  const items = await query<LeadListItem>(
    `SELECT id, name, email, phone, source, consent_at, created_at, updated_at, webhook_status, webhook_attempts, submissions
       FROM leads ${where}
      ORDER BY created_at DESC, id
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
    [...args, params.pageSize, offset],
  )
  return { items, total: Number(totalRows[0].count), page: params.page, pageSize: params.pageSize }
}

export async function getLeadForDelivery(id: string) {
  const rows = await query<LeadRow>(
    `SELECT id, name, email, phone, consent_text, consent_at, utm, created_at, updated_at, webhook_status, webhook_attempts, submissions
       FROM leads WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function deleteLead(id: string) {
  const rows = await query<{ id: string }>('DELETE FROM leads WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

export async function allLeadsForExport() {
  return query<LeadRow & { source: string | null }>(
    `SELECT id, name, email, phone, source, consent_text, consent_at, utm, created_at, updated_at, webhook_status, webhook_attempts, submissions
       FROM leads ORDER BY created_at`,
  )
}
