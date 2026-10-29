import { requireUser } from '@/server/auth'
import { deletePhoto } from '@/server/campaign'
import { assertSameOrigin, json, route } from '@/server/http'

type Ctx = { params: Promise<{ slot: string }> }

export const DELETE = route<Ctx>('DELETE /api/admin/gallery/[slot]', async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  return json(await deletePhoto((await params).slot, user.id))
})
