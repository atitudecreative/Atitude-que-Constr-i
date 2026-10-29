'use client'

import { useRef, useState, type FormEvent } from 'react'
import { contact } from '@/content/landing'
import { CONSENT_TEXT, leadSchema } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import styles from './LeadForm.module.css'

type FieldName = 'name' | 'email' | 'phone' | 'consent'
type Status = 'idle' | 'submitting' | 'success' | 'error'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

function readUtm() {
  const params = new URLSearchParams(window.location.search)
  return Object.fromEntries(UTM_KEYS.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v))
}

export function LeadForm({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const successRef = useRef<HTMLHeadingElement>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? '') || undefined,
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''),
      utm: readUtm(),
    }

    const parsed = leadSchema.safeParse(payload)
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      setFormError(null)
      const first = (['name', 'email', 'phone', 'consent'] as const).find((k) => next[k])
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    setErrors({})
    setFormError(null)
    setStatus('submitting')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setStatus('success')
        form.reset()
        requestAnimationFrame(() => successRef.current?.focus())
        return
      }
      const body = await response.json().catch(() => null)
      if (response.status === 422 && body?.error?.fields) setErrors(body.error.fields)
      setFormError(body?.error?.message ?? 'Não foi possível enviar agora. Tente novamente.')
      setStatus('error')
    } catch {
      setFormError('Sem conexão. Verifique sua internet e tente novamente.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={`${styles.form} ${className ?? ''}`}>
        <div className={styles.success} role="status">
          <h3 ref={successRef} tabIndex={-1} className={`${styles.successTitle} t-heading-sm`}>
            {contact.success.title}
          </h3>
          <p className="t-ui">{contact.success.body}</p>
          <Button type="button" onClick={() => setStatus('idle')}>
            {contact.success.again}
          </Button>
        </div>
      </div>
    )
  }

  const field = (name: 'name' | 'email' | 'phone', type: string, autoComplete: string, extra?: { inputMode?: 'tel' | 'email' }) => {
    const config = contact.fields[name]
    const error = errors[name]
    return (
      <div className={`${styles.field} ${error ? styles.invalid : ''}`}>
        <label className={styles.box}>
          <span className={`${styles.label} t-eyebrow`}>{config.label}</span>
          <input
            className={styles.input}
            name={name}
            type={type}
            autoComplete={autoComplete}
            placeholder={config.placeholder}
            required={name !== 'phone'}
            maxLength={name === 'email' ? 254 : name === 'phone' ? 25 : 120}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${name}-error` : undefined}
            {...extra}
          />
        </label>
        {error && (
          <p id={`${name}-error`} className={styles.error}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form className={`${styles.form} ${className ?? ''}`} onSubmit={onSubmit} noValidate aria-label="Receba atualizações da campanha">
      {field('name', 'text', 'name')}
      {field('email', 'email', 'email', { inputMode: 'email' })}
      {field('phone', 'tel', 'tel', { inputMode: 'tel' })}

      <div className={styles.honeypot} aria-hidden="true">
        <label>
          Não preencha
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className={`${styles.field} ${errors.consent ? styles.invalid : ''}`}>
        <label className={styles.consent}>
          <input
            className={styles.checkbox}
            type="checkbox"
            name="consent"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
          />
          <span>{CONSENT_TEXT}</span>
        </label>
        {errors.consent && (
          <p id="consent-error" className={styles.error}>
            {errors.consent}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
          {status === 'submitting' ? contact.submitting : contact.submit}
        </Button>
      </div>
    </form>
  )
}
