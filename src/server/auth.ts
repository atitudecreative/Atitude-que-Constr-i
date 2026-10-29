import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { query } from './db'
import { env } from './env'
import { errors } from './http'

export type Role = 'admin' | 'editor'
export type AdminUser = { id: string; email: string; name: string; role: Role }

const SESSION_HOURS = 12
const BCRYPT_COST = 12
// Hash usado quando o e-mail não existe, para o tempo de resposta não revelar contas.
const DUMMY_HASH = '$2b$12$gGS0GY1WASLenarV3fSAbubMHxwxFA0.F2gca37pvib2Zt0P2ZG6a'

export function sessionCookieName() {
  return env().APP_URL.startsWith('https://') ? '__Host-aqc_session' : 'aqc_session'
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const rows = await query<AdminUser & { password_hash: string; active: boolean }>(
    'SELECT id, email, name, role, active, password_hash FROM admin_users WHERE email = $1',
    [email.trim().toLowerCase()],
  )
  const user = rows[0]
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
  if (!user || !ok || !user.active) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function createSession(userId: string, ipHash: string | null, userAgent: string | null) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000)
  await query(
    'INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_hash, user_agent) VALUES ($1, $2, $3, $4, $5)',
    [userId, hashToken(token), expiresAt, ipHash, userAgent?.slice(0, 300) ?? null],
  )
  await query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [userId])
  await query('DELETE FROM admin_sessions WHERE expires_at < now()')
  return { token, expiresAt }
}

export function sessionCookie(token: string, expiresAt: Date) {
  const secure = env().APP_URL.startsWith('https://') ? '; Secure' : ''
  return `${sessionCookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}${secure}`
}

export function clearedSessionCookie() {
  const secure = env().APP_URL.startsWith('https://') ? '; Secure' : ''
  return `${sessionCookieName()}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const name = sessionCookieName()
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=') || null
  }
  return null
}

export async function userFromToken(token: string | null | undefined): Promise<AdminUser | null> {
  if (!token) return null
  const rows = await query<AdminUser>(
    `SELECT u.id, u.email, u.name, u.role
       FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [hashToken(token)],
  )
  return rows[0] ?? null
}

export async function destroySession(token: string | null) {
  if (token) await query('DELETE FROM admin_sessions WHERE token_hash = $1', [hashToken(token)])
}

// Autorização no servidor para as rotas /api/admin/*.
export async function requireUser(request: Request, roles: Role[] = ['admin', 'editor']): Promise<AdminUser> {
  const user = await userFromToken(readSessionToken(request.headers.get('cookie')))
  if (!user) throw errors.unauthorized()
  if (!roles.includes(user.role)) throw errors.forbidden()
  return user
}
