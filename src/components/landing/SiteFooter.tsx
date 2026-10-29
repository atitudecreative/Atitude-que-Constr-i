import { footer } from '@/content/landing'
import { Logo } from '@/components/ui/Logo'
import styles from './landing.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} ${styles.footerContent}`}>
        <div className={styles.badge}>
          <Logo className={styles.badgeLogo} />
        </div>
        <div className={styles.footerMeta}>
          <p className={`${styles.footerStatus} t-eyebrow`}>{footer.status}</p>
          <p className={`${styles.footerPending} t-ui`}>{footer.pending}</p>
        </div>
      </div>
    </footer>
  )
}
