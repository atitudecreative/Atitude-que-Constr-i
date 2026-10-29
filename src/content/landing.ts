// Textos da landing page, transcritos do Figma "LP — Atitude que Constrói | Nov 2026" (V1).
// Quando o texto muda entre desktop (≥ 1024px) e tablet/celular, há duas versões: `desktop` e `compact`.

export const anchors = {
  top: 'inicio',
  about: 'sobre-a-campanha',
  progress: 'nosso-progresso',
  contribute: 'como-contribuir',
  gallery: 'o-terreno',
  contact: 'receba-atualizacoes',
} as const

export const statusBar = {
  desktop: 'V1 ESTRUTURAL  •  28/10/2026  •  DADOS, FLUXO, FOTOS E FORMULÁRIO PENDENTES',
  compact: 'V1 ESTRUTURAL  •  dados, fluxo, fotos e formulário pendentes',
}

export const header = {
  logoAlt: 'Constrói — Atitude que Constrói',
  nav: [
    { label: 'Sobre a campanha', href: `#${anchors.about}` },
    { label: 'Nosso progresso', href: `#${anchors.progress}` },
    { label: 'Como contribuir', href: `#${anchors.contribute}` },
  ],
  cta: { desktop: 'Quero contribuir', tablet: 'Quero contribuir', mobile: 'Contribuir', href: `#${anchors.contribute}` },
}

export const hero = {
  eyebrow: 'ATITUDE QUE CONSTRÓI',
  title: 'Juntos pela expansão da promessa!',
  intro: [
    'Deus nos deu um sonho e ele acontecendo.',
    'Tivemos a vitória de 12 parcelas juntos pelo novo templo, mas a obra não parou!',
  ],
  cta: { label: 'Doe agora mesmo', href: `#${anchors.contribute}` },
}

export const purpose = {
  eyebrow: 'PROPÓSITO',
  title: 'Mais que um espaço maior.',
  body: 'A Terra da Promessa não representa apenas a construção de um espaço maior. É a realização do chamado para levar esperança a uma cidade que precisa ser alcançada.',
  cta: ['Seja a mão que abençoa e constrói o futuro da nossa igreja!', 'Doe agora mesmo.'],
}

export const progress = {
  eyebrow: 'PRESTAÇÃO DE CONTAS',
  title: 'Cada parte ajuda a levantar essa promessa.',
  pendingChip: 'DADOS FINANCEIROS PENDENTES',
  pendingNote: {
    desktop: 'Sem valores, percentuais ou estados inventados nesta versão.',
    compact: 'O muro abaixo é conceitual e não apresenta valores, percentuais ou estados financeiros.',
  },
  stats: {
    total: 'TOTAL ARRECADADO',
    payments: 'PAGAMENTOS',
    update: 'ATUALIZAÇÃO',
    pendingValue: 'PENDENTE',
    pendingUpdate: 'SEMANAL — A VALIDAR',
  },
}

export const contribute = {
  eyebrow: 'COMO CONTRIBUIR',
  title: 'Escolha a forma de contribuição.',
  body: {
    desktop: 'PIX, cartão e boleto estão confirmados. O fluxo, os links e o PIX recorrente continuam pendentes de validação.',
    compact: 'PIX, cartão e boleto estão confirmados. Fluxo, links e PIX recorrente aguardam validação.',
  },
  cardEyebrow: 'FORMA DE CONTRIBUIR',
}

export const gallery = {
  eyebrow: 'O TERRENO',
  title: 'Um lugar para a promessa continuar.',
  pendingChip: 'SELEÇÃO DE FOTOS PENDENTE',
  placeholder: (n: number) => [`FOTO ${String(n).padStart(2, '0')}`, 'ASSET PENDENTE'],
}

export const contact = {
  eyebrow: 'CONTINUE PERTO',
  title: 'Receba atualizações da campanha.',
  body: {
    desktop: 'O formulário será usado para ações de marketing. Campos, consentimento e integração serão definidos pelo Inbound.',
    compact: 'Campos, consentimento e integração do formulário serão definidos pelo Inbound.',
  },
  pendingChip: 'CAMPOS E LGPD PENDENTES',
  submit: 'Enviar interesse',
  submitting: 'Enviando…',
  success: {
    title: 'Interesse recebido!',
    body: 'Obrigado por caminhar com a gente. Você vai receber as próximas atualizações da campanha.',
    again: 'Enviar outro cadastro',
  },
  // Campos provisórios até o Inbound definir a versão final (ver docs).
  fields: {
    name: { label: 'NOME', placeholder: 'Seu nome completo' },
    email: { label: 'E-MAIL', placeholder: 'voce@email.com' },
    phone: { label: 'WHATSAPP (OPCIONAL)', placeholder: '(00) 00000-0000' },
  },
}

export const footer = {
  status: 'PRIMEIRA VERSÃO EDITÁVEL',
  pending: 'Links institucionais, dados legais e conteúdo final do footer pendentes.',
}
