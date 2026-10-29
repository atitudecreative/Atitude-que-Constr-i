import styles from './admin.module.css'

export function Notice({ notice }: { notice: { type: 'ok' | 'error'; message: string } | null }) {
  if (!notice) return null
  return (
    <p className={`${styles.notice} ${notice.type === 'ok' ? styles.noticeOk : styles.noticeError}`} role={notice.type === 'ok' ? 'status' : 'alert'}>
      {notice.message}
    </p>
  )
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return (
    <p className={styles.fieldError} id={id}>
      {message}
    </p>
  )
}
