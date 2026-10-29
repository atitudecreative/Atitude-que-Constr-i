import { expect, test } from '@playwright/test'
import { Client } from 'pg'
import { E2E_DATABASE_URL } from '../../playwright.config'

test.use({ viewport: { width: 375, height: 800 } })

test('formulário valida, envia e persiste o cadastro', async ({ page }) => {
  await page.goto('/?utm_source=instagram&utm_campaign=nov26')
  const form = page.getByRole('form', { name: 'Receba atualizações da campanha' })
  await form.getByRole('button', { name: 'Enviar interesse' }).click()
  await expect(form.getByText('Informe seu nome.')).toBeVisible()
  await expect(form.getByText('É preciso autorizar para receber as atualizações.')).toBeVisible()
  await expect(form.getByLabel('NOME')).toBeFocused()

  await form.getByLabel('NOME').fill('Paulo Teste')
  await form.getByLabel('E-MAIL').fill('paulo@exemplo.com')
  await form.getByLabel('WHATSAPP (OPCIONAL)').fill('(21) 99999-0000')
  await form.getByRole('checkbox').check()
  await form.getByRole('button', { name: 'Enviar interesse' }).click()
  await expect(page.getByRole('heading', { name: 'Interesse recebido!' })).toBeVisible()

  const client = new Client({ connectionString: E2E_DATABASE_URL })
  await client.connect()
  const { rows } = await client.query('SELECT name, phone, utm FROM leads WHERE email = $1', ['paulo@exemplo.com'])
  await client.end()
  expect(rows).toEqual([{ name: 'Paulo Teste', phone: '21999990000', utm: { utm_source: 'instagram', utm_campaign: 'nov26' } }])

  // Persiste após recarregar: o cadastro existe no banco; a página volta ao formulário vazio.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Enviar interesse' })).toBeVisible()
})
