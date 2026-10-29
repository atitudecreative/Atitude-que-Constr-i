import 'server-only'
import { z } from 'zod'

const optionalUrl = z.preprocess((v) => (v === '' ? undefined : v), z.url().optional())
const optionalString = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  APP_URL: z.url(),
  IP_HASH_SALT: z.string().min(32, 'IP_HASH_SALT deve ter ao menos 32 caracteres'),
  TRUST_PROXY: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_URL: optionalString,
  MAIL_FROM: optionalString,
  LEAD_NOTIFY_TO: optionalString,
  LEADS_WEBHOOK_URL: optionalUrl,
  LEADS_WEBHOOK_SECRET: optionalString,
})

export type Env = z.infer<typeof schema>

let cached: Env | undefined

// Validada na primeira chamada (não no build), para falhar cedo e com mensagem clara.
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env)
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Configuração inválida: ${issues}`)
    }
    if (parsed.data.LEADS_WEBHOOK_URL && !parsed.data.LEADS_WEBHOOK_SECRET) {
      throw new Error('Configuração inválida: LEADS_WEBHOOK_SECRET é obrigatório quando LEADS_WEBHOOK_URL está definido')
    }
    cached = parsed.data
  }
  return cached
}
