import { audit } from '@/server/audit'
import { createSession, sessionCookie, verifyCredentials } from '@/server/auth'
import { AppError, assertSameOrigin, clientIp, hashIp, json, readJson, route } from '@/server/http'
import { enforceRateLimit, resetRateLimit } from '@/server/rate-limit'
import { loginSchema } from '@/lib/validation'

export const POST = route('POST /api/admin/login', async (request) => {
  assertSameOrigin(request)
  const ipHash = hashIp(clientIp(request))
  const { email, password } = loginSchema.parse(await readJson(request))
  const key = `login:${email}:${ipHash ?? 'shared'}`
  // Por conta+IP (força bruta) e por IP (tentativas em muitas contas).
  await enforceRateLimit(key, { limit: 5, windowSeconds: 900 })
  if (ipHash) await enforceRateLimit(`login-ip:${ipHash}`, { limit: 30, windowSeconds: 900 })
  const user = await verifyCredentials(email, password)
  if (!user) throw new AppError(401, 'invalid_credentials', 'E-mail ou senha incorretos.')
  await resetRateLimit(key)
  const { token, expiresAt } = await createSession(user.id, ipHash, request.headers.get('user-agent'))
  await audit(user.id, 'login', 'admin_session')
  return json({ ok: true, user: { name: user.name, role: user.role } }, { headers: { 'Set-Cookie': sessionCookie(token, expiresAt) } })
})
