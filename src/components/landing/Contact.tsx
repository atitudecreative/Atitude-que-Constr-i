import { anchors, contact as copy } from '@/content/landing'
import { PendingChip } from '@/components/ui/PendingChip'
import { ResponsiveText } from '@/components/ui/ResponsiveText'
import { LeadForm } from './LeadForm'
import styles from './landing.module.css'

export function Contact({ formApproved }: { formApproved: boolean }) {
  return (
    <section id={anchors.contact} className={`${styles.section} ${styles.lavender}`} aria-labelledby="contact-title">
      <div className={`${styles.inner} ${styles.contactContent}`}>
        <div className={styles.contactCopy}>
          <p className="t-eyebrow">{copy.eyebrow}</p>
          <h2 id="contact-title" className="t-heading">
            {copy.title}
          </h2>
          {!formApproved && (
            <>
              <p className="t-body">
                <ResponsiveText desktop={copy.body.desktop} compact={copy.body.compact} />
              </p>
              <PendingChip>{copy.pendingChip}</PendingChip>
            </>
          )}
        </div>
        <LeadForm className={styles.contactForm} />
      </div>
    </section>
  )
}
