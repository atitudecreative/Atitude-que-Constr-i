import { expect, test } from '@playwright/test'

// Alturas das seções nos frames do Figma (Status, Header, Hero, Purpose, Progress, Contribute, Gallery, Contact, Footer).
// Contato é maior no site por causa da caixa de consentimento LGPD (desvio documentado).
const FIGMA: Record<number, number[]> = {
  1440: [40, 101.35, 636, 386, 688, 550, 724, 572, 226.93],
  1280: [40, 101.35, 636, 414, 688, 574, 724, 572, 226.93],
  768: [36, 83.31, 848, 506, 980, 898, 1252, 802, 278.93],
  375: [52, 80, 848, 630, 1220, 938, 1012, 790, 291.77],
}
const CONTACT = 7

for (const width of Object.keys(FIGMA).map(Number)) {
  test.describe(`landing ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('reproduz a estrutura do Figma sem erros nem rolagem horizontal', async ({ page }) => {
      const problems: string[] = []
      page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
      page.on('pageerror', (e) => problems.push(e.message))

      const response = await page.goto('/')
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'nonce-")
      await page.evaluate(() => document.fonts.ready)

      const heights = await page.evaluate(() =>
        [document.querySelector('[role=note]'), document.querySelector('header'), ...document.querySelectorAll('main > section'), document.querySelector('footer')].map(
          (e) => e!.getBoundingClientRect().height,
        ),
      )
      FIGMA[width].forEach((expected, i) => {
        if (i === CONTACT) expect(heights[i]).toBeGreaterThanOrEqual(expected)
        else expect(Math.abs(heights[i] - expected), `seção ${i}`).toBeLessThanOrEqual(1)
      })

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBe(0)

      const brokenImages = await page.evaluate(() => [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((i) => i.src))
      expect(brokenImages).toEqual([])

      await expect(page.getByRole('heading', { level: 1, name: 'Juntos pela expansão da promessa!' })).toBeVisible()
      await expect(page.locator('main li[class*=brick]')).toHaveCount(12)
      await page.screenshot({ path: `test-results/screens/landing-${width}.png`, fullPage: true })
      expect(problems).toEqual([])
    })
  })
}

test('links do menu e CTAs levam às seções', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Nosso progresso' }).click()
  await expect(page).toHaveURL(/#nosso-progresso$/)
  await expect(page.locator('#nosso-progresso')).toBeInViewport()
  await page.getByRole('link', { name: 'Doe agora mesmo' }).click()
  await expect(page.locator('#como-contribuir')).toBeInViewport()
  await page.getByRole('link', { name: 'Quero contribuir' }).click()
  await expect(page).toHaveURL(/#como-contribuir$/)
})

test('navegação por teclado alcança menu, CTAs e formulário com foco visível', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const focused: string[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    focused.push(await page.evaluate(() => (document.activeElement as HTMLElement).innerText || (document.activeElement as HTMLInputElement).name || ''))
  }
  expect(focused).toEqual(expect.arrayContaining(['Sobre a campanha', 'Quero contribuir', 'Doe agora mesmo', 'name', 'email']))
  await page.getByRole('link', { name: 'Doe agora mesmo' }).focus()
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!).boxShadow)
  expect(ring).not.toBe('none')
})
