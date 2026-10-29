import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { LogoutButton } from '@/components/admin/LogoutButton'
import styles from '@/components/admin/admin.module.css'
import { Logo } from '@/components/ui/Logo'
import { requirePageUser } from '@/server/session'

export const metadata: Metadata = { title: 'Painel — Atitude que Constrói', robots: { index: false, follow: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser()
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandBadge}>
            <Logo className={styles.brandLogo} decorative />
          </span>
          <span className="t-ui">Painel da campanha</span>
        </div>
        <div className={styles.user}>
          <span className="t-ui">
            {user.name} · {user.role === 'admin' ? 'Administrador' : 'Editor'}
          </span>
          <a className={styles.ghost} href="/" target="_blank" rel="noopener">
            Ver site
          </a>
          <LogoutButton />
        </div>
      </header>
      <AdminNav role={user.role} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
