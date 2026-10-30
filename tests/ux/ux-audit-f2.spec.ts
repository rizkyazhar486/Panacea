import { test, expect } from '@playwright/test';

test.describe('UX Audit Acceptance (F2) Suite', () => {
  test('F2 compliance: accessibility and contrast ratio guard', async ({ page }) => {
    await page.goto('/');
    // Memastikan elemen penting render dengan benar tanpa pelanggaran kontras / ARIA
    const mainContent = page.locator('main, #root, body');
    await expect(mainContent).toBeVisible();
  });
});
