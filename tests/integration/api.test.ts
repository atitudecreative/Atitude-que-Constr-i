import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { POST as postLead } from '@/app/api/leads/route'
import { POST as login } from '@/app/api/admin/login/route'
import { POST as logout } from '@/app/api/admin/logout/route'
import { GET as listLeads } from '@/app/api/admin/leads/route'
import { DELETE as deleteLead } from '@/app/api/admin/leads/[id]/route'
import { GET as exportLeads } from '@/app/api/admin/leads/export/route'
import { PUT as putProgress } from '@/app/api/admin/progress/route'
import { PUT as putContribution } from '@/app/api/admin/contribution/route'
import { PUT as putSettings } from '@/app/api/admin/settings/route'
import { POST as postGallery } from '@/app/api/admin/gallery/route'
import { DELETE as deleteGallery } from '@/app/api/admin/gallery/[slot]/route'
import { GET as getMedia } from '@/app/api/media/[slot]/route'
import { GET as health } from '@/app/api/health/route'
import { getLandingData } from '@/server/campaign'
import { ctx, createUser, db, noCtx, req, resetDb } from '../helpers'

const lead = { name: 'Maria Silva', email: 'maria@exemplo.com', phone: '(11) 98765-4321', consent: true }

async function signIn(email = 'admin@igreja.org', password = 'senha-forte-123', role: 'admin' | 'editor' = 'admin') {
  await createUser(email, password, role)
  const res = await login(req('/api/admin/login', { method: 'POST', json: { email, password } }), noCtx)
  expect(res.status).toBe(200)
  const cookie = res.headers.get('set-cookie')!
  expect(cookie).toMatch(/HttpOnly/)
  expect(cookie).toMatch(/SameSite=Strict/)
  return cookie.split(';')[0]
}

beforeEach(resetDb)
afterAll(() => db.end())

describe('GET /api/health', () => {
  it('responde ok com o banco disponível', async () => {
    const res = await health()
    expect(res.status).toBe(200)
  })
})

describe('POST /api/leads', () => {
  it('grava o cadastro com consentimento e IP em hash', async () => {
    const res = await postLead(req('/api/leads', { method: 'POST', json: lead }), noCtx)
    expect(res.status).toBe(201)
    const { rows } = await db.query('SELECT * FROM leads')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'Maria Silva', email: 'maria@exemplo.com', phone: '11987654321', consent_marketing: true, webhook_status: 'skipped' })
    expect(rows[0].consent_text).toMatch(/LGPD/)
    expect(rows[0].ip_hash).toHaveLength(32)
    expect(rows[0].ip_hash).not.toContain('203.0.113.10')
  })

  it('atualiza em vez de duplicar o mesmo e-mail', async () => {
    await postLead(req('/api/leads', { method: 'POST', json: lead }), noCtx)
    const res = await postLead(req('/api/leads', { method: 'POST', json: { ...lead, name: 'Maria S.', email: 'MARIA@exemplo.com' } }), noCtx)
    expect(res.status).toBe(201)
    const { rows } = await db.query('SELECT name, submissions FROM leads')
    expect(rows).toEqual([{ name: 'Maria S.', submissions: 2 }])
  })

  it('retorna 422 com erros por campo', async () => {
    const res = await postLead(req('/api/leads', { method: 'POST', json: { name: '', email: 'x', consent: false } }), noCtx)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(Object.keys(body.error.fields)).toEqual(expect.arrayContaining(['name', 'email', 'consent']))
    expect((await db.query('SELECT count(*)::int AS n FROM leads')).rows[0].n).toBe(0)
  })

  it('ignora robôs que preenchem o campo isca, sem revelar', async () => {
    const res = await postLead(req('/api/leads', { method: 'POST', json: { ...lead, website: 'spam.com' } }), noCtx)
    expect(res.status).toBe(201)
    expect((await db.query('SELECT count(*)::int AS n FROM leads')).rows[0].n).toBe(0)
  })

  it('bloqueia origem externa (CSRF)', async () => {
    const res = await postLead(req('/api/leads', { method: 'POST', json: lead, headers: { origin: 'https://malicioso.com' } }), noCtx)
    expect(res.status).toBe(403)
  })

  it('limita a 5 envios por IP em 10 minutos', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await postLead(req('/api/leads', { method: 'POST', json: { ...lead, email: `p${i}@ex.com` }, ip: '198.51.100.7' }), noCtx)
      expect(r.status).toBe(201)
    }
    const blocked = await postLead(req('/api/leads', { method: 'POST', json: { ...lead, email: 'p6@ex.com' }, ip: '198.51.100.7' }), noCtx)
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBeTruthy()
    const other = await postLead(req('/api/leads', { method: 'POST', json: { ...lead, email: 'outro@ex.com' }, ip: '198.51.100.8' }), noCtx)
    expect(other.status).toBe(201)
  })

  it('rejeita corpo que não é JSON', async () => {
    const res = await postLead(req('/api/leads', { method: 'POST', body: 'name=x', headers: { 'content-type': 'application/x-www-form-urlencoded' } }), noCtx)
    expect(res.status).toBe(400)
  })
})

describe('autenticação do painel', () => {
  it('recusa senha errada com mensagem genérica e limita tentativas', async () => {
    await createUser('admin@igreja.org', 'senha-forte-123')
    for (let i = 0; i < 5; i++) {
      const r = await login(req('/api/admin/login', { method: 'POST', json: { email: 'admin@igreja.org', password: 'errada' } }), noCtx)
      expect(r.status).toBe(401)
      expect((await r.json()).error.message).toBe('E-mail ou senha incorretos.')
    }
    const blocked = await login(req('/api/admin/login', { method: 'POST', json: { email: 'admin@igreja.org', password: 'senha-forte-123' } }), noCtx)
    expect(blocked.status).toBe(429)
  })

  it('rotas do painel exigem sessão', async () => {
    const res = await listLeads(req('/api/admin/leads'), noCtx)
    expect(res.status).toBe(401)
    const put = await putProgress(req('/api/admin/progress', { method: 'PUT', json: {} }), noCtx)
    expect(put.status).toBe(401)
  })

  it('logout invalida a sessão no servidor', async () => {
    const cookie = await signIn()
    expect((await listLeads(req('/api/admin/leads', { cookie }), noCtx)).status).toBe(200)
    await logout(req('/api/admin/logout', { method: 'POST', cookie }), noCtx)
    expect((await listLeads(req('/api/admin/leads', { cookie }), noCtx)).status).toBe(401)
  })

  it('sessão expirada não vale', async () => {
    const cookie = await signIn()
    await db.query(`UPDATE admin_sessions SET expires_at = now() - interval '1 minute'`)
    expect((await listLeads(req('/api/admin/leads', { cookie }), noCtx)).status).toBe(401)
  })

  it('editor não acessa dados pessoais nem configurações', async () => {
    const cookie = await signIn('editor@igreja.org', 'senha-forte-123', 'editor')
    expect((await listLeads(req('/api/admin/leads', { cookie }), noCtx)).status).toBe(403)
    expect((await exportLeads(req('/api/admin/leads/export', { cookie }), noCtx)).status).toBe(403)
    const settings = await putSettings(req('/api/admin/settings', { method: 'PUT', cookie, json: { showStatusBar: false, leadFormApproved: false } }), noCtx)
    expect(settings.status).toBe(403)
    const progress = await putProgress(
      req('/api/admin/progress', { method: 'PUT', cookie, json: { published: false, totalRaisedCents: null, paymentsCount: null, updateFrequency: null, bricksTotal: 12, bricksCompleted: null } }),
      noCtx,
    )
    expect(progress.status).toBe(200)
  })
})

describe('gestão de cadastros', () => {
  it('lista com busca e paginação, exporta CSV e exclui', async () => {
    for (const email of ['ana@ex.com', 'bia@ex.com', 'carla@ex.com']) {
      await postLead(req('/api/leads', { method: 'POST', json: { ...lead, name: email.split('@')[0], email }, ip: email }), noCtx)
    }
    const cookie = await signIn()
    const page = await (await listLeads(req('/api/admin/leads?pageSize=2&page=1', { cookie }), noCtx)).json()
    expect(page.total).toBe(3)
    expect(page.items).toHaveLength(2)
    const search = await (await listLeads(req('/api/admin/leads?q=bia', { cookie }), noCtx)).json()
    expect(search.items.map((i: { email: string }) => i.email)).toEqual(['bia@ex.com'])

    const csvRes = await exportLeads(req('/api/admin/leads/export', { cookie }), noCtx)
    expect(csvRes.headers.get('content-type')).toContain('text/csv')
    const csv = await csvRes.text()
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(4)

    const id = search.items[0].id
    expect((await deleteLead(req(`/api/admin/leads/${id}`, { method: 'DELETE', cookie }), ctx({ id }))).status).toBe(200)
    expect((await deleteLead(req(`/api/admin/leads/${id}`, { method: 'DELETE', cookie }), ctx({ id }))).status).toBe(404)
    const audit = await db.query(`SELECT action FROM audit_log WHERE entity = 'lead' ORDER BY id`)
    expect(audit.rows.map((r) => r.action)).toEqual(['export', 'delete'])
  })
})

describe('conteúdo da campanha', () => {
  it('publica a prestação de contas e reflete nos dados da página', async () => {
    const cookie = await signIn()
    const before = await getLandingData()
    expect(before.progress.published).toBe(false)

    const bad = await putProgress(
      req('/api/admin/progress', { method: 'PUT', cookie, json: { published: true, totalRaisedCents: null, paymentsCount: null, updateFrequency: null, bricksTotal: 12, bricksCompleted: null } }),
      noCtx,
    )
    expect(bad.status).toBe(422)

    const ok = await putProgress(
      req('/api/admin/progress', { method: 'PUT', cookie, json: { published: true, totalRaisedCents: 12345678, paymentsCount: 210, updateFrequency: 'Semanal', bricksTotal: 12, bricksCompleted: 4 } }),
      noCtx,
    )
    expect(ok.status).toBe(200)
    const after = await getLandingData()
    expect(after.progress).toMatchObject({ published: true, totalRaisedCents: 12345678, paymentsCount: 210, bricksCompleted: 4 })
  })

  it('formas de contribuição: valida link e publica', async () => {
    const cookie = await signIn()
    const bad = await putContribution(req('/api/admin/contribution', { method: 'PUT', cookie, json: { code: 'cartao', published: true, description: 'Até 12x', url: 'javascript:alert(1)' } }), noCtx)
    expect(bad.status).toBe(422)
    const ok = await putContribution(req('/api/admin/contribution', { method: 'PUT', cookie, json: { code: 'cartao', published: true, description: 'Até 12x', url: 'https://pagamento.exemplo.com/abc' } }), noCtx)
    expect(ok.status).toBe(200)
    const methods = (await getLandingData()).methods
    expect(methods.find((m) => m.code === 'cartao')).toMatchObject({ published: true, url: 'https://pagamento.exemplo.com/abc' })
  })

  it('galeria: aceita imagem real, recusa arquivo disfarçado e serve com cache', async () => {
    const cookie = await signIn()
    // PNG 1x1 válido
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const form = new FormData()
    form.set('slot', '2')
    form.set('altText', 'Vista aérea do terreno')
    form.set('file', new File([png], 'foto.png', { type: 'image/png' }))
    const res = await postGallery(req('/api/admin/gallery', { method: 'POST', cookie, body: form }), noCtx)
    expect(res.status).toBe(200)
    const gallery = await res.json()
    expect(gallery[1]).toMatchObject({ slot: 2, altText: 'Vista aérea do terreno' })

    const media = await getMedia(req('/api/media/2'), ctx({ slot: '2' }))
    expect(media.headers.get('content-type')).toBe('image/png')
    expect(Buffer.from(await media.arrayBuffer()).equals(png)).toBe(true)
    const cached = await getMedia(req('/api/media/2', { headers: { 'if-none-match': media.headers.get('etag')! } }), ctx({ slot: '2' }))
    expect(cached.status).toBe(304)

    const fake = new FormData()
    fake.set('slot', '1')
    fake.set('altText', 'Foto')
    fake.set('file', new File(['<svg onload="alert(1)"/>'], 'foto.png', { type: 'image/png' }))
    expect((await postGallery(req('/api/admin/gallery', { method: 'POST', cookie, body: fake }), noCtx)).status).toBe(400)

    const del = await deleteGallery(req('/api/admin/gallery/2', { method: 'DELETE', cookie }), ctx({ slot: '2' }))
    expect(del.status).toBe(200)
    expect((await getMedia(req('/api/media/2'), ctx({ slot: '2' }))).status).toBe(404)
    expect((await getMedia(req('/api/media/9'), ctx({ slot: '9' }))).status).toBe(400)
  })

  it('configurações (admin)', async () => {
    const cookie = await signIn()
    const res = await putSettings(req('/api/admin/settings', { method: 'PUT', cookie, json: { showStatusBar: false, leadFormApproved: true } }), noCtx)
    expect(res.status).toBe(200)
    expect((await getLandingData()).settings).toEqual({ showStatusBar: false, leadFormApproved: true })
  })
})
