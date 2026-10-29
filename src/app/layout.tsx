import type { Metadata, Viewport } from 'next'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Atitude que Constrói — Juntos pela expansão da promessa',
  description:
    'Campanha Atitude que Constrói: acompanhe a prestação de contas, escolha a forma de contribuição e receba as atualizações da obra.',
  icons: { icon: '/brand/logo-constroi.svg' },
}

export const viewport: Viewport = {
  themeColor: '#265f56',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
