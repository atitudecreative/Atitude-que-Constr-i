import { z } from 'zod'

// Schemas compartilhados entre formulário (cliente) e API (servidor).
// O servidor sempre revalida; a validação no cliente é só para feedback imediato.

const noControlChars = (value: string) => !/[\u0000-\u001F\u007F]/.test(value)

export const CONSENT_TEXT =
  'Autorizo o uso dos meus dados para receber comunicações da campanha Atitude que Constrói, conforme a LGPD. Posso cancelar a qualquer momento.'

const utmValue = z.string().trim().max(100).optional()

export const leadSchema = z.object({
  name: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(2, 'Informe seu nome.')
    .max(120, 'Use até 120 caracteres.')
    .refine(noControlChars, 'Nome inválido.'),
  email: z
    .string({ error: 'Informe seu e-mail.' })
    .trim()
    .toLowerCase()
    .max(254, 'E-mail muito longo.')
    .pipe(z.email('Informe um e-mail válido.')),
  phone: z
    .string()
    .trim()
    .max(25)
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : undefined))
    .refine((v) => v === undefined || (v.length >= 10 && v.length <= 13), 'Informe DDD + número.'),
  consent: z.literal(true, { error: 'É preciso autorizar para receber as atualizações.' }),
  // Campo isca: pessoas não veem; robôs preenchem.
  website: z.string().max(200).optional(),
  utm: z
    .object({
      utm_source: utmValue,
      utm_medium: utmValue,
      utm_campaign: utmValue,
      utm_content: utmValue,
      utm_term: utmValue,
    })
    .partial()
    .optional(),
})

export type LeadInput = z.input<typeof leadSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe a senha.').max(200),
})

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))

export const progressSchema = z
  .object({
    published: z.boolean(),
    totalRaisedCents: z.number().int().min(0).max(1_000_000_000_00).nullable(),
    paymentsCount: z.number().int().min(0).max(10_000_000).nullable(),
    updateFrequency: optionalText(40),
    bricksTotal: z.number().int().min(1).max(60),
    bricksCompleted: z.number().int().min(0).max(60).nullable(),
  })
  .refine((v) => v.bricksCompleted === null || v.bricksCompleted <= v.bricksTotal, {
    path: ['bricksCompleted'],
    message: 'Não pode ser maior que o total de partes.',
  })
  .refine((v) => !v.published || (v.totalRaisedCents !== null && v.paymentsCount !== null), {
    path: ['published'],
    message: 'Para publicar, informe o total arrecadado e o número de pagamentos.',
  })

export type ProgressInput = z.infer<typeof progressSchema>

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), 'Use um link https:// válido.')

export const contributionSchema = z
  .object({
    code: z.enum(['pix', 'cartao', 'boleto']),
    published: z.boolean(),
    description: optionalText(160),
    pixKey: optionalText(140),
    url: httpsUrl,
  })
  .refine((v) => !v.published || v.description !== null, {
    path: ['description'],
    message: 'Informe as instruções antes de publicar.',
  })
  .refine((v) => !v.published || (v.code === 'pix' ? v.pixKey !== null || v.url !== null : v.url !== null), {
    path: ['url'],
    message: 'Informe o link (ou a chave, no caso do PIX) antes de publicar.',
  })

export type ContributionInput = z.infer<typeof contributionSchema>

export const settingsSchema = z.object({
  showStatusBar: z.boolean(),
  leadFormApproved: z.boolean(),
})

export const altTextSchema = z.string().trim().min(3, 'Descreva a foto (texto alternativo).').max(160)
