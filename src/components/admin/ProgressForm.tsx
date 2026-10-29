'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/format'
import type { Progress } from '@/server/campaign'
import { FieldError, Notice } from './Notice'
import { jsonInit, useSubmit } from './useSubmit'
import styles from './admin.module.css'

// "1.234,56" → 123456 centavos
function parseBRL(value: string): number | null {
  const clean = value.replace(/[^\d,]/g, '')
  if (!clean) return null
  const [int, dec = ''] = clean.split(',')
  return Number(int || '0') * 100 + Number((dec + '00').slice(0, 2))
}

function centsToInput(cents: number | null) {
  return cents === null ? '' : formatBRL(cents).replace('R$', '').trim()
}

function intOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text === '' ? null : Number(text)
}

export function ProgressForm({ initial }: { initial: Progress }) {
  const [data, setData] = useState(initial)
  const { pending, notice, fieldErrors, submit } = useSubmit()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      published: form.get('published') === 'on',
      totalRaisedCents: parseBRL(String(form.get('total') ?? '')),
      paymentsCount: intOrNull(form.get('payments')),
      updateFrequency: String(form.get('frequency') ?? ''),
      bricksTotal: Number(form.get('bricksTotal')),
      bricksCompleted: intOrNull(form.get('bricksCompleted')),
    }
    const saved = await submit<Progress>('/api/admin/progress', jsonInit('PUT', payload), 'Prestação de contas salva. O site já mostra os novos dados.')
    if (saved) setData(saved)
  }

  return (
    <form className={styles.panel} onSubmit={onSubmit} noValidate key={data.updatedAt}>
      <h2 className={`${styles.panelTitle} t-heading-sm`}>Nosso progresso</h2>
      <p className={styles.hint}>
        Enquanto não estiver publicado, o site mostra “PENDENTE” e o muro com “?”, como no layout aprovado. Informe apenas valores conferidos pela
        tesouraria.
      </p>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor="total">TOTAL ARRECADADO (R$)</label>
          <input className={styles.input} id="total" name="total" inputMode="decimal" placeholder="0,00" defaultValue={centsToInput(data.totalRaisedCents)} />
          <FieldError message={fieldErrors.totalRaisedCents} />
        </div>
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor="payments">PAGAMENTOS (QUANTIDADE)</label>
          <input className={styles.input} id="payments" name="payments" type="number" min={0} step={1} defaultValue={data.paymentsCount ?? ''} />
          <FieldError message={fieldErrors.paymentsCount} />
        </div>
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor="frequency">ATUALIZAÇÃO</label>
          <input className={styles.input} id="frequency" name="frequency" maxLength={40} placeholder="Semanal" defaultValue={data.updateFrequency ?? ''} />
          <FieldError message={fieldErrors.updateFrequency} />
        </div>
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor="bricksTotal">PARTES DO MURO (TOTAL)</label>
          <input className={styles.input} id="bricksTotal" name="bricksTotal" type="number" min={1} max={60} defaultValue={data.bricksTotal} required />
          <FieldError message={fieldErrors.bricksTotal} />
        </div>
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor="bricksCompleted">PARTES CONCLUÍDAS</label>
          <input className={styles.input} id="bricksCompleted" name="bricksCompleted" type="number" min={0} max={60} defaultValue={data.bricksCompleted ?? ''} />
          <FieldError message={fieldErrors.bricksCompleted} />
        </div>
      </div>
      <label className={styles.check}>
        <input type="checkbox" name="published" defaultChecked={data.published} />
        <span className="t-ui">Publicar no site</span>
      </label>
      <FieldError message={fieldErrors.published} />
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</Button>
        <Notice notice={notice} />
      </div>
      <p className={styles.hint}>Última alteração: {new Date(data.updatedAt).toLocaleString('pt-BR')}</p>
    </form>
  )
}
