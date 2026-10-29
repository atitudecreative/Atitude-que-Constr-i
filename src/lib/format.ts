const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR')

export function formatBRL(cents: number) {
  // Intl usa espaço não separável; normalizamos para espaço comum.
  return brl.format(cents / 100).replace(/ /g, ' ')
}

export function formatInteger(value: number) {
  return integer.format(value)
}
