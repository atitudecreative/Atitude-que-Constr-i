import { describe, expect, it } from 'vitest'
import { contributionSchema, leadSchema, progressSchema } from '@/lib/validation'

describe('leadSchema', () => {
  const valid = { name: '  Maria Silva ', email: ' Maria@Exemplo.COM ', phone: '(11) 98765-4321', consent: true }

  it('normaliza nome, e-mail e telefone', () => {
    const data = leadSchema.parse(valid)
    expect(data).toMatchObject({ name: 'Maria Silva', email: 'maria@exemplo.com', phone: '11987654321' })
  })

  it('exige consentimento explícito', () => {
    expect(leadSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
    expect(leadSchema.safeParse({ ...valid, consent: 'true' }).success).toBe(false)
  })

  it('rejeita e-mail inválido, nome curto e telefone incompleto', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'maria@' }).success).toBe(false)
    expect(leadSchema.safeParse({ ...valid, name: 'M' }).success).toBe(false)
    expect(leadSchema.safeParse({ ...valid, phone: '1234' }).success).toBe(false)
  })

  it('telefone é opcional', () => {
    expect(leadSchema.parse({ ...valid, phone: undefined }).phone).toBeUndefined()
  })

  it('rejeita caracteres de controle no nome', () => {
    expect(leadSchema.safeParse({ ...valid, name: 'Ana\u0000' }).success).toBe(false)
  })
})

describe('progressSchema', () => {
  const base = { published: false, totalRaisedCents: null, paymentsCount: null, updateFrequency: null, bricksTotal: 12, bricksCompleted: null }

  it('não publica sem total e pagamentos', () => {
    expect(progressSchema.safeParse({ ...base, published: true }).success).toBe(false)
    expect(progressSchema.safeParse({ ...base, published: true, totalRaisedCents: 100, paymentsCount: 1 }).success).toBe(true)
  })

  it('partes concluídas não passam do total', () => {
    expect(progressSchema.safeParse({ ...base, bricksCompleted: 13 }).success).toBe(false)
  })

  it('rejeita valores negativos', () => {
    expect(progressSchema.safeParse({ ...base, totalRaisedCents: -1 }).success).toBe(false)
  })
})

describe('contributionSchema', () => {
  it('aceita apenas links https', () => {
    const r = contributionSchema.safeParse({ code: 'cartao', published: true, description: 'x', url: 'javascript:alert(1)' })
    expect(r.success).toBe(false)
    expect(contributionSchema.safeParse({ code: 'cartao', published: true, description: 'x', url: 'http://a.com' }).success).toBe(false)
    expect(contributionSchema.safeParse({ code: 'cartao', published: true, description: 'x', url: 'https://pag.com/x' }).success).toBe(true)
  })

  it('PIX publicado precisa de chave ou link', () => {
    expect(contributionSchema.safeParse({ code: 'pix', published: true, description: 'x' }).success).toBe(false)
    expect(contributionSchema.safeParse({ code: 'pix', published: true, description: 'x', pixKey: 'chave@igreja.org' }).success).toBe(true)
  })
})
