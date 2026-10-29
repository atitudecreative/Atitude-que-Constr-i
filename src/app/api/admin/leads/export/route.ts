import { audit } from '@/server/audit'
import { requireUser } from '@/server/auth'
import { toCsv } from '@/server/csv'
import { route } from '@/server/http'
import { allLeadsForExport } from '@/server/leads'

export const GET = route('GET /api/admin/leads/export', async (request) => {
  const user = await requireUser(request, ['admin'])
  const rows = await allLeadsForExport()
  const csv = toCsv(
    ['id', 'nome', 'email', 'telefone', 'consentimento_em', 'texto_consentimento', 'origem', 'utm', 'cadastrado_em', 'atualizado_em', 'envios', 'status_integracao'],
    rows.map((r) => [r.id, r.name, r.email, r.phone, r.consent_at, r.consent_text, r.source, JSON.stringify(r.utm), r.created_at, r.updated_at, r.submissions, r.webhook_status]),
  )
  await audit(user.id, 'export', 'lead', null, { count: rows.length })
  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cadastros-atitude-que-constroi-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
})
