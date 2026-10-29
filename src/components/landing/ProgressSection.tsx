import { anchors, progress as copy } from '@/content/landing'
import { formatBRL, formatInteger } from '@/lib/format'
import type { Progress } from '@/server/campaign'
import { PendingChip } from '@/components/ui/PendingChip'
import { ResponsiveText } from '@/components/ui/ResponsiveText'
import styles from './landing.module.css'

export function ProgressSection({ data }: { data: Progress }) {
  const published = data.published
  const completed = published ? (data.bricksCompleted ?? 0) : 0
  const bricks = Array.from({ length: data.bricksTotal }, (_, i) => i + 1)

  const total = published && data.totalRaisedCents !== null ? formatBRL(data.totalRaisedCents) : copy.stats.pendingValue
  const payments = published && data.paymentsCount !== null ? formatInteger(data.paymentsCount) : copy.stats.pendingValue
  const update = published && data.updateFrequency ? data.updateFrequency.toUpperCase() : copy.stats.pendingUpdate

  return (
    <section id={anchors.progress} className={`${styles.section} ${styles.black}`} aria-labelledby="progress-title">
      <div className={`${styles.inner} ${styles.progress}`}>
        <div className={styles.progressHeader}>
          <div className={styles.progressTitle}>
            <p className={`${styles.eyebrowYellow} t-eyebrow`}>{copy.eyebrow}</p>
            <h2 id="progress-title" className="t-heading">
              {copy.title}
            </h2>
          </div>
          {!published && (
            <div className={styles.progressPending}>
              <PendingChip>{copy.pendingChip}</PendingChip>
              <p className={`${styles.progressNote} t-ui`}>
                <ResponsiveText desktop={copy.pendingNote.desktop} compact={copy.pendingNote.compact} />
              </p>
            </div>
          )}
        </div>

        <ul
          className={styles.wall}
          aria-label={published ? `${completed} de ${data.bricksTotal} partes concluídas` : 'Muro conceitual da campanha'}
        >
          {bricks.map((n) => {
            const done = published && n <= completed
            return (
              <li key={n} className={`${styles.brick} ${done ? styles.brickDone : ''} t-ui`}>
                <span aria-hidden="true">{published ? n : '?'}</span>
                <span className="visually-hidden">
                  {published ? `Parte ${n}: ${done ? 'concluída' : 'a concluir'}` : `Parte ${n}: pendente`}
                </span>
              </li>
            )
          })}
        </ul>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt className="t-eyebrow">{copy.stats.total}</dt>
            <dd className="t-heading-sm">{total}</dd>
          </div>
          <div className={styles.stat}>
            <dt className="t-eyebrow">{copy.stats.payments}</dt>
            <dd className="t-heading-sm">{payments}</dd>
          </div>
          <div className={styles.stat}>
            <dt className="t-eyebrow">{copy.stats.update}</dt>
            <dd className="t-stat-sm">{update}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
