import 'server-only'
import { query } from './db'
import { errors } from './http'

type Rule = { limit: number; windowSeconds: number }

// Janela fixa armazenada no PostgreSQL: funciona mesmo com várias instâncias do app.
export async function consumeRateLimit(key: string, rule: Rule): Promise<{ allowed: boolean; retryAfter: number }> {
  const rows = await query<{ count: number; window_start: Date }>(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
     RETURNING count, window_start`,
    [key, rule.windowSeconds],
  )
  const { count, window_start } = rows[0]
  const elapsed = (Date.now() - new Date(window_start).getTime()) / 1000
  return { allowed: count <= rule.limit, retryAfter: Math.max(1, Math.ceil(rule.windowSeconds - elapsed)) }
}

export async function enforceRateLimit(key: string, rule: Rule) {
  // Limpeza ocasional de janelas antigas, sem precisar de tarefa agendada.
  if (Math.random() < 0.01) await purgeExpiredRateLimits()
  const result = await consumeRateLimit(key, rule)
  if (!result.allowed) throw errors.rateLimited(result.retryAfter)
}

export async function resetRateLimit(key: string) {
  await query('DELETE FROM rate_limits WHERE key = $1', [key])
}

export async function purgeExpiredRateLimits() {
  await query(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`)
}
