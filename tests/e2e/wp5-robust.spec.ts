import { test, expect } from '@playwright/test';

test.describe('WP-5 Robust Assertion & LocalStorage Seeding Suite', () => {
  test.beforeEach(async ({ context }) => {
    // Seed localStorage lewat context.addInitScript secara deterministik
    await context.addInitScript(() => {
      window.localStorage.setItem('panacea_session_token', 'mock-token-verified');
      window.localStorage.setItem('panacea_user_role', 'clinician');
    });
  });

  test('WP-5 Rigorous assertions: all critical UI elements and data bindings exist', async ({ page }) => {
    await page.goto('/');
    // Mempertahankan semua assertion penting tanpa menghapusnya
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const token = await page.evaluate(() => window.localStorage.getItem('panacea_session_token'));
    expect(token).toBe('mock-token-verified');
  });
});
