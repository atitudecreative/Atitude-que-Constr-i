import { header } from '@/content/landing'

// Logo oficial (vetor exportado do Figma). A cor é a original do arquivo (Brand/Black).
export function Logo({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem otimização necessária
    <img src="/brand/logo-constroi.svg" alt={decorative ? '' : header.logoAlt} className={className} width={250} height={139} />
  )
}
