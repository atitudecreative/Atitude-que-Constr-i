'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/server/auth'
import styles from './admin.module.css'

const TABS: { href: string; label: string; roles: Role[] }[] = [
  { href: '/admin/progresso', label: 'Prestação de contas', roles: ['admin', 'editor'] },
  { href: '/admin/contribuicao', label: 'Formas de contribuição', roles: ['admin', 'editor'] },
  { href: '/admin/galeria', label: 'Fotos do terreno', roles: ['admin', 'editor'] },
  { href: '/admin/leads', label: 'Cadastros', roles: ['admin'] },
  { href: '/admin/configuracoes', label: 'Configurações', roles: ['admin'] },
]

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname()
  return (
    <nav className={styles.tabs} aria-label="Seções do painel">
      {TABS.filter((t) => t.roles.includes(role)).map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.tab} ${active ? styles.tabActive : ''} t-ui`} aria-current={active ? 'page' : undefined}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
