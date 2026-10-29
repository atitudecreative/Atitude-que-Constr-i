'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FieldError, Notice } from './Notice'
import { jsonInit, useSubmit } from './useSubmit'
import styles from './admin.module.css'

export function LoginForm() {
  const router = useRouter()
  const { pending, notice, fieldErrors, submit } = useSubmit()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await submit('/api/admin/login', jsonInit('POST', { email: data.get('email'), password: data.get('password') }), 'Entrando…')
    if (result) {
      router.replace('/admin')
      router.refresh()
    }
  }

  return (
    <form className={styles.loginCard} onSubmit={onSubmit} noValidate>
      <h1 className="t-heading-sm">Painel da campanha</h1>
      <p className={styles.muted}>Acesso restrito à equipe responsável.</p>
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor="email">
          E-MAIL
        </label>
        <input className={styles.input} id="email" name="email" type="email" autoComplete="username" required />
        <FieldError message={fieldErrors.email} />
      </div>
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor="password">
          SENHA
        </label>
        <input className={styles.input} id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError message={fieldErrors.password} />
      </div>
      <Notice notice={notice?.type === 'error' ? notice : null} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
