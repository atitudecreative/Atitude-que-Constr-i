import { anchors, gallery as copy } from '@/content/landing'
import type { GalleryPhoto } from '@/server/campaign'
import { PendingChip } from '@/components/ui/PendingChip'
import styles from './landing.module.css'

export function Gallery({ photos }: { photos: (GalleryPhoto | null)[] }) {
  const complete = photos.every(Boolean)
  return (
    <section id={anchors.gallery} className={`${styles.section} ${styles.cream}`} aria-labelledby="gallery-title">
      <div className={`${styles.inner} ${styles.gallery}`}>
        <p className={`${styles.eyebrowOrange} t-eyebrow`}>{copy.eyebrow}</p>
        <h2 id="gallery-title" className={`${styles.titleGreen} ${styles.galleryTitle} t-heading`}>
          {copy.title}
        </h2>
        {!complete && <PendingChip>{copy.pendingChip}</PendingChip>}
        <ul className={styles.media}>
          {photos.map((photo, index) => (
            <li key={index}>
              {photo ? (
                <div className={`${styles.mediaItem} ${styles.mediaPhoto}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem servida pela própria API com cache */}
                  <img src={photo.src} alt={photo.altText} loading="lazy" decoding="async" />
                </div>
              ) : (
                <div className={`${styles.mediaItem} t-eyebrow`}>
                  <p>
                    {copy.placeholder(index + 1)[0]}
                    <br />
                    {copy.placeholder(index + 1)[1]}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
