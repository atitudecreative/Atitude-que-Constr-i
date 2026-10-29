import Link from 'next/link'
import { LeadsTable } from '@/components/admin/LeadsTable'
import styles from '@/components/admin/admin.module.css'
import { webhookConfigured } from '@/server/integrations'
import { listLeads } from '@/server/leads'
import { requirePageUser } from '@/server/session'

const PAGE_SIZE = 25

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requirePageUser(['admin'])
  const params = await searchParams
  const page = Math.max(1, Math.min(10_000, Number(params.page) || 1))
  const q = (params.q ?? '').slice(0, 100)
  const result = await listLeads({ page, pageSize: PAGE_SIZE, search: q })
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
  const href = (p: number) => `/admin/leads?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="t-heading-sm">Cadastros</h1>
        <p className={styles.muted}>
          Pessoas que pediram para receber atualizações. Dados pessoais: acesso somente para administradores. {result.total} cadastro(s).
        </p>
      </div>
      <div className={styles.panel}>
        <form className={styles.actions} role="search" action="/admin/leads">
          <label className="visually-hidden" htmlFor="q">Buscar</label>
          <input className={styles.input} id="q" name="q" defaultValue={q} placeholder="Buscar por nome, e-mail ou telefone" maxLength={100} />
          <button className={styles.ghost} type="submit">Buscar</button>
          <a className={styles.ghost} href="/api/admin/leads/export" download>Exportar CSV</a>
        </form>
        <LeadsTable items={result.items} webhookEnabled={webhookConfigured()} />
        <nav className={styles.pagination} aria-label="Paginação">
          {page > 1 ? <Link className={styles.ghost} href={href(page - 1)}>Anterior</Link> : <span />}
          <span className={styles.hint}>Página {page} de {pages}</span>
          {page < pages ? <Link className={styles.ghost} href={href(page + 1)}>Próxima</Link> : <span />}
        </nav>
      </div>
    </>
  )
}
