import { ContributionForms } from '@/components/admin/ContributionForms'
import styles from '@/components/admin/admin.module.css'
import { getContributionMethods } from '@/server/campaign'

export default async function ContributionPage() {
  const methods = await getContributionMethods()
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="t-heading-sm">Formas de contribuição</h1>
        <p className={styles.muted}>Cards PIX, cartão e boleto da seção “Escolha a forma de contribuição”.</p>
      </div>
      <ContributionForms initial={methods} />
    </>
  )
}
