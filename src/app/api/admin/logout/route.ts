import { clearedSessionCookie, destroySession, readSessionToken } from '@/server/auth'
import { assertSameOrigin, json, route } from '@/server/http'

export const POST = route('POST /api/admin/logout', async (request) => {
  assertSameOrigin(request)
  await destroySession(readSessionToken(request.headers.get('cookie')))
  return json({ ok: true }, { headers: { 'Set-Cookie': clearedSessionCookie() } })
})
