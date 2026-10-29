import 'server-only'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { env } from './env'
import { logger } from './logger'

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly retryAfter?: number,
  ) {
    super(message)
  }
}

export const errors = {
  badRequest: (message = 'Requisição inválida.') => new AppError(400, 'bad_request', message),
  unauthorized: () => new AppError(401, 'unauthorized', 'Sessão inválida ou expirada.'),
  forbidden: (message = 'Acesso negado.') => new AppError(403, 'forbidden', message),
  notFound: () => new AppError(404, 'not_found', 'Recurso não encontrado.'),
  tooLarge: (message = 'Arquivo muito grande.') => new AppError(413, 'payload_too_large', message),
  rateLimited: (retryAfter: number) =>
    new AppError(
      429,
      'rate_limited',
      `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfter / 60)} min.`,
      undefined,
      retryAfter,
    ),
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

export function toErrorResponse(error: unknown, route: string): Response {
  if (error instanceof AppError) {
    const headers: HeadersInit = error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}
    return json({ error: { code: error.code, message: error.message, fields: error.fields } }, { status: error.status, headers })
  }
  if (error instanceof z.ZodError) {
    return json(
      { error: { code: 'validation_error', message: 'Confira os campos destacados.', fields: fieldErrors(error) } },
      { status: 422 },
    )
  }
  logger.error('unhandled_error', { route, error })
  return json({ error: { code: 'internal_error', message: 'Não foi possível concluir agora. Tente novamente.' } }, { status: 500 })
}

type Handler<C> = (request: Request, context: C) => Promise<Response>

// Envolve um Route Handler com tratamento centralizado de erros.
export function route<C = unknown>(name: string, handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return toErrorResponse(error, name)
    }
  }
}

// Proteção CSRF para requisições que alteram dados: a origem precisa ser o próprio site.
export function assertSameOrigin(request: Request) {
  const expected = new URL(env().APP_URL).origin
  const origin = request.headers.get('origin')
  if (origin) {
    if (origin !== expected) throw errors.forbidden('Origem não permitida.')
    return
  }
  const referer = request.headers.get('referer')
  if (!referer || new URL(referer).origin !== expected) throw errors.forbidden('Origem não permitida.')
}

export function clientIp(request: Request): string | null {
  if (!env().TRUST_PROXY) return null
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

// O IP nunca é armazenado em texto puro.
export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  return createHash('sha256').update(`${env().IP_HASH_SALT}:${ip}`).digest('hex').slice(0, 32)
}

export async function readJson(request: Request, maxBytes = 16 * 1024): Promise<unknown> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) throw errors.badRequest('Envie os dados em JSON.')
  const text = await request.text()
  if (text.length > maxBytes) throw errors.tooLarge('Dados muito grandes.')
  try {
    return JSON.parse(text)
  } catch {
    throw errors.badRequest('JSON inválido.')
  }
}
