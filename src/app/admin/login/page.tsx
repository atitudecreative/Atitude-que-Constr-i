import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import styles from '@/components/admin/admin.module.css'
import { currentPageUser } from '@/server/session'

export const metadata: Metadata = { title: 'Entrar — Painel Atitude que Constrói', robots: { index: false, follow: false } }

export default async function LoginPage() {
  if (await currentPageUser()) redirect('/admin')
  return (
    <main className={styles.login}>
      <LoginForm />
    </main>
  )
}
