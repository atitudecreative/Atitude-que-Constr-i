import { z } from 'zod'
import { requireUser } from '@/server/auth'
import { json, route } from '@/server/http'
import { listLeads } from '@/server/leads'

const paramsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(100).optional(),
})

// Dados pessoais: somente perfil admin.
export const GET = route('GET /api/admin/leads', async (request) => {
  await requireUser(request, ['admin'])
  const params = paramsSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
  return json(await listLeads({ page: params.page, pageSize: params.pageSize, search: params.q }))
})
