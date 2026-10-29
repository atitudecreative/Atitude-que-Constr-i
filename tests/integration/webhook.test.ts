import { createHmac } from 'node:crypto'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db, noCtx, req, resetDb } from '../helpers'

const SECRET = 'segredo-de-teste-webhook'
const received: { body: string; signature: string | undefined }[] = []
let server: Server
let failNext = false

beforeAll(async () => {
  server = createServer((request: IncomingMessage, response) => {
    let body = ''
    request.on('data', (c) => (body += c))
    request.on('end', () => {
      received.push({ body, signature: request.headers['x-signature'] as string | undefined })
      response.statusCode = failNext ? 500 : 200
      failNext = false
      response.end('ok')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  process.env.LEADS_WEBHOOK_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`
  process.env.LEADS_WEBHOOK_SECRET = SECRET
})

beforeEach(async () => {
  received.length = 0
  await resetDb()
})

afterAll(async () => {
  await db.end()
  await new Promise((resolve) => server.close(resolve))
})

describe('integração com o Inbound (webhook)', () => {
  it('envia o cadastro assinado com HMAC e marca como enviado', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const res = await POST(req('/api/leads', { method: 'POST', json: { name: 'João', email: 'joao@ex.com', consent: true, utm: { utm_source: 'instagram' } } }), noCtx)
    expect(res.status).toBe(201)
    expect(received).toHaveLength(1)
    const expected = 'sha256=' + createHmac('sha256', SECRET).update(received[0].body).digest('hex')
    expect(received[0].signature).toBe(expected)
    const payload = JSON.parse(received[0].body)
    expect(payload).toMatchObject({ event: 'lead.upserted', data: { name: 'João', email: 'joao@ex.com', utm: { utm_source: 'instagram' }, consent: { granted: true } } })
    const { rows } = await db.query('SELECT webhook_status, webhook_attempts FROM leads')
    expect(rows[0]).toEqual({ webhook_status: 'sent', webhook_attempts: 1 })
  })

  it('registra falha sem perder o cadastro e permite reenviar', async () => {
    const { POST } = await import('@/app/api/leads/route')
    failNext = true
    const res = await POST(req('/api/leads', { method: 'POST', json: { name: 'Ana', email: 'ana@ex.com', consent: true } }), noCtx)
    expect(res.status).toBe(201)
    const { rows } = await db.query('SELECT id, webhook_status, webhook_last_error FROM leads')
    expect(rows[0]).toMatchObject({ webhook_status: 'failed', webhook_last_error: 'HTTP 500' })

    const { createUser } = await import('../helpers')
    await createUser('admin@igreja.org', 'senha-forte-123')
    const { POST: login } = await import('@/app/api/admin/login/route')
    const cookie = (await login(req('/api/admin/login', { method: 'POST', json: { email: 'admin@igreja.org', password: 'senha-forte-123' } }), noCtx))
      .headers.get('set-cookie')!.split(';')[0]
    const { POST: resend } = await import('@/app/api/admin/leads/[id]/resend/route')
    const again = await resend(req(`/api/admin/leads/${rows[0].id}/resend`, { method: 'POST', cookie }), { params: Promise.resolve({ id: rows[0].id }) })
    expect(await again.json()).toMatchObject({ webhookStatus: 'sent' })
  })
})
