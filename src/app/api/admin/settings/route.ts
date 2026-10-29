import { requireUser } from '@/server/auth'
import { getSettings, updateSettings } from '@/server/campaign'
import { assertSameOrigin, json, readJson, route } from '@/server/http'

export const GET = route('GET /api/admin/settings', async (request) => {
  await requireUser(request)
  return json(await getSettings())
})

export const PUT = route('PUT /api/admin/settings', async (request) => {
  assertSameOrigin(request)
  const user = await requireUser(request, ['admin'])
  return json(await updateSettings(await readJson(request), user.id))
})
