import { ProgressForm } from '@/components/admin/ProgressForm'
import styles from '@/components/admin/admin.module.css'
import { getProgress } from '@/server/campaign'

export default async function ProgressPage() {
  const progress = await getProgress()
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="t-heading-sm">Prestação de contas</h1>
        <p className={styles.muted}>Dados exibidos na seção “Cada parte ajuda a levantar essa promessa”.</p>
      </div>
      <ProgressForm initial={progress} />
    </>
  )
}
