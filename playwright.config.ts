import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const PORT = 8788;
const webDist = fileURLToPath(new URL('./apps/web/dist', import.meta.url));

/**
 * End-to-end tests run against the production build: the Node server serves the
 * built web app (with its real security headers) and the offline demo provider.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'id-ID',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        permissions: ['camera'],
        launchOptions: {
          // A fake camera lets the live flow run headless. PW_CHROMIUM_PATH is optional.
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
          executablePath: process.env.PW_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build && node apps/server/dist/index.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      TAPCARE_PROVIDER: 'mock',
      STATIC_DIR: webDist,
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      ALLOWED_ORIGINS: `http://localhost:${PORT}`,
    },
  },
});
