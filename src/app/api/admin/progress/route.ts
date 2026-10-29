import { requireUser } from '@/server/auth'
import { getProgress, updateProgress } from '@/server/campaign'
import { assertSameOrigin, json, readJson, route } from '@/server/http'

export const GET = route('GET /api/admin/progress', async (request) => {
  await requireUser(request)
  return json(await getProgress())
})

export const PUT = route('PUT /api/admin/progress', async (request) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  return json(await updateProgress(await readJson(request), user.id))
})
