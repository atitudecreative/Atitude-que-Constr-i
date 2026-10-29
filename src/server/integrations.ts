import 'server-only'
import { createHmac } from 'node:crypto'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from './env'
import { logger } from './logger'

export type LeadPayload = {
  id: string
  name: string
  email: string
  phone: string | null
  consent: { granted: true; text: string; at: string }
  utm: Record<string, string>
  createdAt: string
}

export function webhookConfigured() {
  return Boolean(env().LEADS_WEBHOOK_URL)
}

export function signPayload(body: string, secret: string) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
}

// Envia o cadastro para a ferramenta do Inbound. Assinado com HMAC para o receptor validar a origem.
export async function sendLeadWebhook(payload: LeadPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const { LEADS_WEBHOOK_URL, LEADS_WEBHOOK_SECRET } = env()
  if (!LEADS_WEBHOOK_URL || !LEADS_WEBHOOK_SECRET) return { ok: false, error: 'not_configured' }
  const body = JSON.stringify({ event: 'lead.upserted', data: payload })
  try {
    const response = await fetch(LEADS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signPayload(body, LEADS_WEBHOOK_SECRET),
        'X-Event-Id': payload.id,
      },
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.name : 'unknown' }
  }
}

let transporter: Transporter | undefined

export async function notifyNewLead(leadId: string) {
  const { SMTP_URL, LEAD_NOTIFY_TO, MAIL_FROM, APP_URL } = env()
  if (!SMTP_URL || !LEAD_NOTIFY_TO) return
  transporter ??= nodemailer.createTransport(SMTP_URL)
  try {
    // Sem dados pessoais no e-mail: apenas o aviso e o link para o painel.
    await transporter.sendMail({
      from: MAIL_FROM ?? 'Atitude que Constrói <nao-responda@localhost>',
      to: LEAD_NOTIFY_TO,
      subject: 'Novo cadastro na campanha Atitude que Constrói',
      text: `Um novo cadastro foi recebido.\n\nConsulte o painel: ${APP_URL}/admin/leads\n`,
    })
  } catch (error) {
    logger.warn('lead_notification_failed', { leadId, error })
  }
}
