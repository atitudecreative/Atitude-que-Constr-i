import { GalleryManager } from '@/components/admin/GalleryManager'
import styles from '@/components/admin/admin.module.css'
import { getGallery } from '@/server/campaign'

export default async function GalleryPage() {
  const gallery = await getGallery()
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="t-heading-sm">Fotos do terreno</h1>
        <p className={styles.muted}>As três fotos da seção “Um lugar para a promessa continuar”. Use apenas fotos aprovadas.</p>
      </div>
      <GalleryManager initial={gallery} />
    </>
  )
}
