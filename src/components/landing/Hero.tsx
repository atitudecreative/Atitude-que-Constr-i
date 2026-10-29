import { anchors, hero } from '@/content/landing'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import styles from './landing.module.css'

export function Hero() {
  return (
    <section id={anchors.top} className={`${styles.section} ${styles.hero} ${styles.green}`} aria-labelledby="hero-title">
      <div className={`${styles.inner} ${styles.heroContent}`}>
        <div className={styles.heroText}>
          <p className={`${styles.heroEyebrow} t-eyebrow`}>{hero.eyebrow}</p>
          <h1 id="hero-title" className="t-display">
            {hero.title}
          </h1>
          <p className="t-body">
            {hero.intro[0]}
            <br />
            {hero.intro[1]}
          </p>
          <ButtonLink href={hero.cta.href} variant="accent">
            {hero.cta.label}
          </ButtonLink>
        </div>
        {/* Hero / Visual IDV: composição gráfica da identidade visual */}
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroCircle} />
          <div className={styles.heroSurface} />
          <Logo className={styles.heroLogo} decorative />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.heroTopo} src="/brand/topo-compact.svg" alt="" width={160} height={100} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.heroTopoDesktop} src="/brand/topo-desktop.svg" alt="" width={220} height={150} />
        </div>
      </div>
    </section>
  )
}
