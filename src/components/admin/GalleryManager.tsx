'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { GalleryPhoto } from '@/server/campaign'
import { FieldError, Notice } from './Notice'
import { useSubmit } from './useSubmit'
import styles from './admin.module.css'

function Slot({ slot, photo, onChange }: { slot: number; photo: GalleryPhoto | null; onChange: (g: (GalleryPhoto | null)[]) => void }) {
  const { pending, notice, fieldErrors, submit } = useSubmit()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set('slot', String(slot))
    const saved = await submit<(GalleryPhoto | null)[]>('/api/admin/gallery', { method: 'POST', body: data }, 'Foto salva.')
    if (saved) {
      onChange(saved)
      form.reset()
    }
  }

  async function remove() {
    if (!window.confirm(`Remover a foto ${slot}? O site voltará a mostrar o espaço reservado.`)) return
    const saved = await submit<(GalleryPhoto | null)[]>(`/api/admin/gallery/${slot}`, { method: 'DELETE' }, 'Foto removida.')
    if (saved) onChange(saved)
  }

  return (
    <form className={styles.panel} onSubmit={onSubmit} noValidate>
      <h2 className={`${styles.panelTitle} t-ui`}>Foto {String(slot).padStart(2, '0')}</h2>
      <div className={styles.photoPreview}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.src} alt={photo.altText} />
        ) : (
          <span className="t-eyebrow">ASSET PENDENTE</span>
        )}
      </div>
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor={`file-${slot}`}>{photo ? 'SUBSTITUIR FOTO' : 'ENVIAR FOTO'}</label>
        <input className={styles.input} id={`file-${slot}`} name="file" type="file" accept="image/jpeg,image/png,image/webp" />
        <span className={styles.hint}>JPG, PNG ou WebP, até 5 MB. Recorte final: proporção aproximada de 5:3.</span>
      </div>
      <div className={styles.field}>
        <label className={`${styles.label} t-eyebrow`} htmlFor={`alt-${slot}`}>DESCRIÇÃO DA FOTO (ACESSIBILIDADE)</label>
        <input className={styles.input} id={`alt-${slot}`} name="altText" maxLength={160} defaultValue={photo?.altText ?? ''} required />
        <FieldError message={fieldErrors._ ?? fieldErrors.altText} />
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Salvar'}</Button>
        {photo && (
          <button type="button" className={`${styles.ghost} ${styles.danger}`} onClick={remove} disabled={pending}>
            Remover
          </button>
        )}
      </div>
      <Notice notice={notice} />
    </form>
  )
}

export function GalleryManager({ initial }: { initial: (GalleryPhoto | null)[] }) {
  const [gallery, setGallery] = useState(initial)
  return (
    <div className={styles.photoGrid}>
      {gallery.map((photo, i) => (
        <Slot key={i} slot={i + 1} photo={photo} onChange={setGallery} />
      ))}
    </div>
  )
}
