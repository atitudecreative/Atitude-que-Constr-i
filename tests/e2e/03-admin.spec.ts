import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from './global-setup'

test.use({ viewport: { width: 1280, height: 900 } })

async function signIn(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('E-MAIL').fill(ADMIN.email)
  await page.getByLabel('SENHA').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/admin\/progresso$/)
}

test('painel exige login e recusa senha errada', async ({ page }) => {
  await page.goto('/admin/leads')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.getByLabel('E-MAIL').fill(ADMIN.email)
  await page.getByLabel('SENHA').fill('errada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
})

test('publicar dados no painel atualiza a landing page', async ({ page, context }) => {
  await signIn(page)

  // Prestação de contas
  await page.getByLabel('TOTAL ARRECADADO (R$)').fill('125.430,50')
  await page.getByLabel('PAGAMENTOS (QUANTIDADE)').fill('318')
  await page.getByLabel('ATUALIZAÇÃO').fill('Semanal')
  await page.getByLabel('PARTES CONCLUÍDAS').fill('5')
  await page.getByLabel('Publicar no site').check()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Prestação de contas salva.')).toBeVisible()

  // Forma de contribuição: cartão com link
  await page.getByRole('link', { name: 'Formas de contribuição' }).click()
  const card = page.locator('form').filter({ hasText: 'CARTÃO' })
  await card.getByLabel('INSTRUÇÕES NO CARD').fill('Crédito em até 12x pelo link seguro.')
  await card.getByLabel(/LINK DE PAGAMENTO/).fill('https://pagamento.exemplo.com/atitude')
  await card.getByLabel('Publicar no site').check()
  await card.getByRole('button', { name: 'Salvar' }).click()
  await expect(card.getByText('CARTÃO salvo.')).toBeVisible()

  // Fotos: envia as três
  await page.getByRole('link', { name: 'Fotos do terreno' }).click()
  mkdirSync(test.info().outputDir, { recursive: true })
  const png = path.join(test.info().outputDir, 'foto.png')
  writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'))
  for (const slot of [1, 2, 3]) {
    const form = page.locator('form').filter({ hasText: `Foto 0${slot}` })
    await form.getByLabel(/ENVIAR FOTO/).setInputFiles(png)
    await form.getByLabel('DESCRIÇÃO DA FOTO (ACESSIBILIDADE)').fill(`Terreno, vista ${slot}`)
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.getByText('Foto salva.')).toBeVisible()
  }

  // Landing reflete os dados reais
  const site = await context.newPage()
  await site.goto('/')
  const progress = site.locator('#nosso-progresso')
  await expect(progress.getByText('R$ 125.430,50')).toBeVisible()
  await expect(progress.getByText('318', { exact: true })).toBeVisible()
  await expect(progress.getByText('SEMANAL', { exact: true })).toBeVisible()
  await expect(progress.getByText('DADOS FINANCEIROS PENDENTES')).toHaveCount(0)
  await expect(progress.locator('li[class*=brickDone]')).toHaveCount(5)
  const cardLink = site.locator('#como-contribuir').getByRole('link', { name: /CARTÃO/ })
  await expect(cardLink).toHaveAttribute('href', 'https://pagamento.exemplo.com/atitude')
  await expect(site.getByRole('img', { name: 'Terreno, vista 2' })).toBeVisible()
  await expect(site.getByText('SELEÇÃO DE FOTOS PENDENTE')).toHaveCount(0)
  await site.screenshot({ path: 'test-results/screens/landing-1280-publicado.png', fullPage: true })

  // Cadastros (lead criado no teste anterior) e exportação
  await page.getByRole('link', { name: 'Cadastros' }).click()
  await expect(page.getByRole('cell', { name: 'paulo@exemplo.com' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Exportar CSV' }).click()
  expect((await download).suggestedFilename()).toMatch(/^cadastros-atitude-que-constroi-\d{4}-\d{2}-\d{2}\.csv$/)

  // Configurações: esconder faixa V1
  await page.getByRole('link', { name: 'Configurações' }).click()
  await page.getByLabel(/faixa laranja/).uncheck()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Configurações salvas.')).toBeVisible()
  await site.reload()
  await expect(site.locator('[role=note]')).toHaveCount(0)

  // Sair
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.goto('/admin/progresso')
  await expect(page).toHaveURL(/\/admin\/login$/)
})
