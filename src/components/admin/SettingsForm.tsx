'use client'

import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { Settings } from '@/server/campaign'
import { Notice } from './Notice'
import { jsonInit, useSubmit } from './useSubmit'
import styles from './admin.module.css'

export function SettingsForm({ initial }: { initial: Settings }) {
  const { pending, notice, submit } = useSubmit()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await submit(
      '/api/admin/settings',
      jsonInit('PUT', { showStatusBar: form.get('showStatusBar') === 'on', leadFormApproved: form.get('leadFormApproved') === 'on' }),
      'Configurações salvas.',
    )
  }

  return (
    <form className={styles.panel} onSubmit={onSubmit}>
      <h2 className={`${styles.panelTitle} t-heading-sm`}>Avisos de versão</h2>
      <label className={styles.check}>
        <input type="checkbox" name="showStatusBar" defaultChecked={initial.showStatusBar} />
        <span className="t-ui">Mostrar a faixa laranja “V1 ESTRUTURAL” no topo do site</span>
      </label>
      <label className={styles.check}>
        <input type="checkbox" name="leadFormApproved" defaultChecked={initial.leadFormApproved} />
        <span className="t-ui">Campos e texto LGPD do formulário aprovados pelo Inbound (oculta o aviso “CAMPOS E LGPD PENDENTES”)</span>
      </label>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</Button>
        <Notice notice={notice} />
      </div>
    </form>
  )
}
