'use client'

import { useRouter } from 'next/navigation'
import type { LeadListItem } from '@/server/leads'
import { Notice } from './Notice'
import { useSubmit } from './useSubmit'
import styles from './admin.module.css'

const STATUS: Record<LeadListItem['webhook_status'], string> = {
  skipped: 'Integração não configurada',
  pending: 'Aguardando envio',
  sent: 'Enviado ao Inbound',
  failed: 'Falha no envio',
}

export function LeadsTable({ items, webhookEnabled }: { items: LeadListItem[]; webhookEnabled: boolean }) {
  const router = useRouter()
  const { pending, notice, submit } = useSubmit()

  async function remove(lead: LeadListItem) {
    if (!window.confirm(`Excluir definitivamente o cadastro de ${lead.name}? Use para pedidos de exclusão (LGPD).`)) return
    if (await submit(`/api/admin/leads/${lead.id}`, { method: 'DELETE' }, 'Cadastro excluído.')) router.refresh()
  }

  async function resend(lead: LeadListItem) {
    if (await submit(`/api/admin/leads/${lead.id}/resend`, { method: 'POST' }, 'Envio ao Inbound solicitado.')) router.refresh()
  }

  if (!items.length) return <p className={styles.muted}>Nenhum cadastro encontrado.</p>

  return (
    <>
      <Notice notice={notice} />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">E-mail</th>
              <th scope="col">WhatsApp</th>
              <th scope="col">Cadastro</th>
              <th scope="col">Integração</th>
              <th scope="col"><span className="visually-hidden">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}{lead.submissions > 1 ? ` (${lead.submissions} envios)` : ''}</td>
                <td>{lead.email}</td>
                <td>{lead.phone ?? '—'}</td>
                <td>{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
                <td><span className={styles.status}>{STATUS[lead.webhook_status]}</span></td>
                <td>
                  <div className={styles.actions}>
                    {webhookEnabled && lead.webhook_status !== 'sent' && (
                      <button type="button" className={styles.ghost} onClick={() => resend(lead)} disabled={pending}>Reenviar</button>
                    )}
                    <button type="button" className={`${styles.ghost} ${styles.danger}`} onClick={() => remove(lead)} disabled={pending}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
