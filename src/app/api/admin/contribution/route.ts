import { requireUser } from '@/server/auth'
import { getContributionMethods, updateContributionMethod } from '@/server/campaign'
import { assertSameOrigin, json, readJson, route } from '@/server/http'

export const GET = route('GET /api/admin/contribution', async (request) => {
  await requireUser(request)
  return json(await getContributionMethods())
})

export const PUT = route('PUT /api/admin/contribution', async (request) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  return json(await updateContributionMethod(await readJson(request), user.id))
})
