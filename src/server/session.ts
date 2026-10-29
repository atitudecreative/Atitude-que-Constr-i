import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionCookieName, userFromToken, type AdminUser, type Role } from './auth'

// Para Server Components do painel: redireciona ao login sem sessão válida.
export async function requirePageUser(roles: Role[] = ['admin', 'editor']): Promise<AdminUser> {
  const store = await cookies()
  const user = await userFromToken(store.get(sessionCookieName())?.value)
  if (!user) redirect('/admin/login')
  if (!roles.includes(user.role)) redirect('/admin')
  return user
}

export async function currentPageUser(): Promise<AdminUser | null> {
  const store = await cookies()
  return userFromToken(store.get(sessionCookieName())?.value)
}
