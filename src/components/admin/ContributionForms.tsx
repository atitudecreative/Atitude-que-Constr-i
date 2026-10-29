'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { ContributionMethod } from '@/server/campaign'
import { FieldError, Notice } from './Notice'
import { jsonInit, useSubmit } from './useSubmit'
import styles from './admin.module.css'

function MethodForm({ method, onSaved }: { method: ContributionMethod; onSaved: (all: ContributionMethod[]) => void }) {
  const { pending, notice, fieldErrors, submit } = useSubmit()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      code: method.code,
      published: form.get('published') === 'on',
      description: String(form.get('description') ?? ''),
      pixKey: method.code === 'pix' ? String(form.get('pixKey') ?? '') : null,
      url: String(form.get('url') ?? ''),
    }
    const saved = await submit<ContributionMethod[]>('/api/admin/contribution', jsonInit('PUT', payload), `${method.title} salvo.`)
    if (saved) onSaved(saved)
  }

  const id = (name: string) => `${method.code}-${name}`
  return (
    <form className={styles.panel} onSubmit={onSubmit} noValidate>
      <h2 className={`${styles.panelTitle} t-heading-sm`}>{method.title}</h2>
      <p className={styles.hint}>Enquanto não publicado, o card mostra: “{method.pendingDescription}”</p>
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor={id('description')}>INSTRUÇÕES NO CARD</label>
        <input className={styles.input} id={id('description')} name="description" maxLength={160} defaultValue={method.description ?? ''} />
        <FieldError message={fieldErrors.description} />
      </div>
      {method.code === 'pix' && (
        <div className={styles.field}>
          <label className={`${styles.label} t-eyebrow`} htmlFor={id('pixKey')}>CHAVE PIX</label>
          <input className={styles.input} id={id('pixKey')} name="pixKey" maxLength={140} defaultValue={method.pixKey ?? ''} />
          <FieldError message={fieldErrors.pixKey} />
        </div>
      )}
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor={id('url')}>LINK DE PAGAMENTO (HTTPS){method.code === 'pix' ? ' — OPCIONAL' : ''}</label>
        <input className={styles.input} id={id('url')} name="url" type="url" maxLength={500} placeholder="https://" defaultValue={method.url ?? ''} />
        <span className={styles.hint}>Com link, o card inteiro vira um botão que abre a página de pagamento do gateway.</span>
        <FieldError message={fieldErrors.url} />
      </div>
      <label className={styles.check}>
        <input type="checkbox" name="published" defaultChecked={method.published} />
        <span className="t-ui">Publicar no site</span>
      </label>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</Button>
        <Notice notice={notice} />
      </div>
    </form>
  )
}

export function ContributionForms({ initial }: { initial: ContributionMethod[] }) {
  const [methods, setMethods] = useState(initial)
  return (
    <>
      {methods.map((m) => (
        <MethodForm key={m.code} method={m} onSaved={setMethods} />
      ))}
    </>
  )
}
