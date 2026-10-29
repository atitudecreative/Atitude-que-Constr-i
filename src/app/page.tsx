import { connection } from 'next/server'
import { Contact } from '@/components/landing/Contact'
import { Contribute } from '@/components/landing/Contribute'
import { Gallery } from '@/components/landing/Gallery'
import { Hero } from '@/components/landing/Hero'
import { ProgressSection } from '@/components/landing/ProgressSection'
import { Purpose } from '@/components/landing/Purpose'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SiteHeader, StatusBar } from '@/components/landing/SiteHeader'
import { getLandingData, type LandingData } from '@/server/campaign'
import { logger } from '@/server/logger'

// Estado usado se o banco estiver indisponível: o mesmo estado "pendente" do Figma V1.
const FALLBACK: LandingData = {
  settings: { showStatusBar: true, leadFormApproved: false },
  progress: {
    published: false,
    totalRaisedCents: null,
    paymentsCount: null,
    updateFrequency: null,
    bricksTotal: 12,
    bricksCompleted: null,
    updatedAt: new Date(0).toISOString(),
  },
  methods: [
    { code: 'pix', title: 'PIX', pendingDescription: 'Chave, instruções e recorrência a validar.', published: false, description: null, pixKey: null, url: null },
    { code: 'cartao', title: 'CARTÃO', pendingDescription: 'Link, parcelamento e gateway pendentes.', published: false, description: null, pixKey: null, url: null },
    { code: 'boleto', title: 'BOLETO', pendingDescription: 'Emissão, vencimento e instruções pendentes.', published: false, description: null, pixKey: null, url: null },
  ],
  gallery: [null, null, null],
}

async function loadData(): Promise<LandingData> {
  try {
    return await getLandingData()
  } catch (error) {
    logger.error('landing_data_failed', { error })
    return FALLBACK
  }
}

export default async function Home() {
  // Renderização por requisição: dados sempre atuais e nonce da CSP aplicado.
  await connection()
  const data = await loadData()

  return (
    <>
      {data.settings.showStatusBar && <StatusBar />}
      <SiteHeader />
      <main>
        <Hero />
        <Purpose />
        <ProgressSection data={data.progress} />
        <Contribute methods={data.methods} />
        <Gallery photos={data.gallery} />
        <Contact formApproved={data.settings.leadFormApproved} />
      </main>
      <SiteFooter />
    </>
  )
}
