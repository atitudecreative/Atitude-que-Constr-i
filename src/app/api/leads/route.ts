import { clientIp, hashIp, json, readJson, route, assertSameOrigin } from '@/server/http'
import { enforceRateLimit } from '@/server/rate-limit'
import { upsertLead } from '@/server/leads'

export const POST = route('POST /api/leads', async (request) => {
  assertSameOrigin(request)
  const ipHash = hashIp(clientIp(request))
  // Sem IP confiável, todos compartilham um balde maior.
  await enforceRateLimit(ipHash ? `lead:${ipHash}` : 'lead:shared', ipHash ? { limit: 5, windowSeconds: 600 } : { limit: 60, windowSeconds: 600 })
  const body = await readJson(request)
  await upsertLead(body, {
    ipHash,
    userAgent: request.headers.get('user-agent'),
    source: request.headers.get('referer'),
  })
  return json({ ok: true }, { status: 201 })
})
