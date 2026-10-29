import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://atitude:atitude_dev@localhost:5432/atitude_lp_e2e'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Requer `npm run build` antes.
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      APP_URL: `http://localhost:${PORT}`,
      IP_HASH_SALT: 'e2e-salt-0123456789abcdef0123456789abcdef',
      TRUST_PROXY: 'false',
    },
  },
})
