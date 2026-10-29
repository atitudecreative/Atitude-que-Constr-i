import { SettingsForm } from '@/components/admin/SettingsForm'
import styles from '@/components/admin/admin.module.css'
import { getSettings } from '@/server/campaign'
import { requirePageUser } from '@/server/session'

export default async function SettingsPage() {
  await requirePageUser(['admin'])
  const settings = await getSettings()
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="t-heading-sm">Configurações</h1>
        <p className={styles.muted}>Avisos de “pendente” exibidos no site.</p>
      </div>
      <SettingsForm initial={settings} />
    </>
  )
}
