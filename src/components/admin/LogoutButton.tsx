'use client'

import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

export function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    router.replace('/admin/login')
    router.refresh()
  }
  return (
    <button type="button" className={styles.ghost} onClick={logout}>
      Sair
    </button>
  )
}
