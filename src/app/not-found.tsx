import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="t-eyebrow">ERRO 404</p>
      <h1 className="t-heading">Página não encontrada.</h1>
      <Link href="/" className="t-ui">
        Voltar para o início
      </Link>
    </main>
  )
}
