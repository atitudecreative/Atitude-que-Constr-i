import { anchors, contribute as copy } from '@/content/landing'
import type { ContributionMethod } from '@/server/campaign'
import { ResponsiveText } from '@/components/ui/ResponsiveText'
import styles from './landing.module.css'

function CardBody({ method }: { method: ContributionMethod }) {
  const text = method.published ? method.description : method.pendingDescription
  return (
    <>
      <p className={`${styles.eyebrowOrange} t-eyebrow`}>{copy.cardEyebrow}</p>
      <h3 className={`${styles.cardTitle} t-heading-sm`}>{method.title}</h3>
      <p className={`${styles.cardText} t-ui`}>{text}</p>
      {method.published && method.code === 'pix' && method.pixKey && (
        <p className={`${styles.cardText} t-ui`}>
          <strong>Chave PIX:</strong> {method.pixKey}
        </p>
      )}
    </>
  )
}

export function Contribute({ methods }: { methods: ContributionMethod[] }) {
  return (
    <section id={anchors.contribute} className={`${styles.section} ${styles.orange}`} aria-labelledby="contribute-title">
      <div className={`${styles.inner} ${styles.contribute}`}>
        <div className={styles.contributeHeader}>
          <p className="t-eyebrow">{copy.eyebrow}</p>
          <h2 id="contribute-title" className="t-heading">
            {copy.title}
          </h2>
          <p className="t-body">
            <ResponsiveText desktop={copy.body.desktop} compact={copy.body.compact} />
          </p>
        </div>
        <ul className={styles.cards}>
          {methods.map((method) => (
            <li key={method.code}>
              {method.published && method.url ? (
                <a className={styles.card} href={method.url} target="_blank" rel="noopener noreferrer">
                  <CardBody method={method} />
                  <span className="visually-hidden">(abre em nova aba)</span>
                </a>
              ) : (
                <div className={styles.card}>
                  <CardBody method={method} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
