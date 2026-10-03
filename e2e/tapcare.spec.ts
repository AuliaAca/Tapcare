import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any console error, which also catches Content-Security-Policy violations. */
function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('home page is accessible and served with security headers', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");

  await expect(page.getByRole('heading', { name: /bingung pakai mesin kiosk/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('practice: completes the train ticket scenario offline-style', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /latihan dulu/i }).click();
  await page.getByRole('button', { name: /beli tiket kereta/i }).click();

  for (const label of ['Beli Tiket', 'Stasiun Taman', 'Lanjut', 'QRIS', 'Saya sudah bayar']) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: /latihan selesai/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test('live: guides through a kiosk journey with the camera and demo provider', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /bantu saya sekarang/i }).click();
  await page.getByRole('button', { name: /bayar parkir/i }).click();
  await page.getByRole('button', { name: /lanjut/i }).click();

  const capture = page.getByRole('button', { name: /lihat layar/i });
  for (let step = 1; step <= 4; step++) {
    await expect(capture).toBeEnabled({ timeout: 10_000 });
    await capture.click();
    await expect(page.getByText(/mode demo/i)).toBeVisible();
    await expect(page.getByTestId('target-highlight')).toBeVisible();
    await page.getByRole('button', { name: /sudah saya tekan/i }).click();
  }

  await expect(capture).toBeEnabled({ timeout: 10_000 });
  await capture.click();
  await expect(page.getByRole('heading', { name: /berhasil/i })).toBeVisible();
  await page.getByRole('button', { name: /selesai/i }).click();
  await expect(page.getByRole('button', { name: /bantu saya sekarang/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test('settings: switching to English and large text persists across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pengaturan' }).click();
  // The radio inputs are visually hidden; people tap the visible pill labels.
  await page.getByText('English', { exact: true }).click();
  await page.getByText('Extra large', { exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /help me now/i })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-text-scale', 'xl');
});
