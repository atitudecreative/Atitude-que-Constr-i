import { anchors, header, statusBar } from '@/content/landing'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ResponsiveText } from '@/components/ui/ResponsiveText'
import styles from './landing.module.css'

export function StatusBar() {
  return (
    <div className={`${styles.status} t-eyebrow`} role="note">
      <ResponsiveText desktop={statusBar.desktop} compact={statusBar.compact} />
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`${styles.inner} ${styles.headerBar}`}>
        <a href={`#${anchors.top}`} className={styles.headerLogoLink} aria-label={`${header.logoAlt} — início`}>
          <Logo className={styles.headerLogo} decorative />
        </a>
        <nav className={styles.nav} aria-label="Principal">
          <ul className={styles.navList}>
            {header.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={`${styles.navLink} t-ui`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href={header.cta.href}>
            <span className={styles.ctaDesktop}>{header.cta.desktop}</span>
            <span className={styles.ctaTablet}>{header.cta.tablet}</span>
            <span className={styles.ctaMobile}>{header.cta.mobile}</span>
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}
