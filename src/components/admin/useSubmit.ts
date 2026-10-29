'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Notice = { type: 'ok' | 'error'; message: string } | null

// Envia JSON/FormData para a API do painel e devolve estado de carregamento, erros e aviso.
export function useSubmit() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function submit<T>(url: string, init: RequestInit, okMessage: string): Promise<T | null> {
    setPending(true)
    setNotice(null)
    setFieldErrors({})
    try {
      const response = await fetch(url, init)
      const body = await response.json().catch(() => null)
      if (response.status === 401 && body?.error?.code === 'unauthorized') {
        router.replace('/admin/login')
        return null
      }
      if (!response.ok) {
        setFieldErrors(body?.error?.fields ?? {})
        setNotice({ type: 'error', message: body?.error?.message ?? 'Não foi possível salvar.' })
        return null
      }
      setNotice({ type: 'ok', message: okMessage })
      return body as T
    } catch {
      setNotice({ type: 'error', message: 'Sem conexão com o servidor.' })
      return null
    } finally {
      setPending(false)
    }
  }

  return { pending, notice, fieldErrors, submit, setNotice }
}

export function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}
