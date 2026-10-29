import { anchors, purpose } from '@/content/landing'
import styles from './landing.module.css'

export function Purpose() {
  return (
    <section id={anchors.about} className={`${styles.section} ${styles.cream}`} aria-labelledby="purpose-title">
      <div className={`${styles.inner} ${styles.purposeContent}`}>
        <div className={styles.purposeHeading}>
          <p className={`${styles.eyebrowOrange} t-eyebrow`}>{purpose.eyebrow}</p>
          <h2 id="purpose-title" className={`${styles.titleGreen} t-heading`}>
            {purpose.title}
          </h2>
        </div>
        <div className={styles.purposeCopy}>
          <p className="t-body">{purpose.body}</p>
          <p className="t-heading-sm">
            {purpose.cta[0]}
            <br />
            {purpose.cta[1]}
          </p>
        </div>
      </div>
    </section>
  )
}
