import { z } from 'zod'
import { audit } from '@/server/audit'
import { requireUser } from '@/server/auth'
import { AppError, assertSameOrigin, errors, json, route } from '@/server/http'
import { webhookConfigured } from '@/server/integrations'
import { deliverLead, getLeadForDelivery } from '@/server/leads'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>('POST /api/admin/leads/[id]/resend', async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request, ['admin'])
  if (!webhookConfigured()) throw new AppError(409, 'not_configured', 'A integração com o Inbound ainda não foi configurada.')
  const id = z.uuid().safeParse((await params).id)
  const lead = id.success ? await getLeadForDelivery(id.data) : null
  if (!lead) throw errors.notFound()
  await deliverLead(lead)
  await audit(user.id, 'resend_webhook', 'lead', lead.id)
  const updated = await getLeadForDelivery(lead.id)
  return json({ ok: true, webhookStatus: updated?.webhook_status })
})
