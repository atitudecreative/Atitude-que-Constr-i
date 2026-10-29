import { z } from 'zod'
import { audit } from '@/server/audit'
import { requireUser } from '@/server/auth'
import { assertSameOrigin, errors, json, route } from '@/server/http'
import { deleteLead } from '@/server/leads'

type Ctx = { params: Promise<{ id: string }> }

export const DELETE = route<Ctx>('DELETE /api/admin/leads/[id]', async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request, ['admin'])
  const id = z.uuid().safeParse((await params).id)
  if (!id.success || !(await deleteLead(id.data))) throw errors.notFound()
  await audit(user.id, 'delete', 'lead', id.data)
  return json({ ok: true })
})
