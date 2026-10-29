import styles from './ui.module.css'

// Sinaliza conteúdo, dados, assets ou decisões ainda pendentes (AQ / Pending / Chip).
export function PendingChip({ children }: { children: string }) {
  return <p className={`${styles.chip} t-eyebrow`}>{children}</p>
}
