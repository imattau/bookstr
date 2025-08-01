import { test, expect } from '@playwright/test';

const PRIV_KEY = '04eb047d1f95fe50e72c964dbec600f51d1d6ebc5a4666238778aaa3a4615a16';

test('login -> discover -> publish -> read', async ({ page }) => {
  // open app
  await page.goto('/');

  // open login modal
  await page.getByRole('button', { name: /login/i }).click();
  await page.getByPlaceholder('nsec or hex').fill(PRIV_KEY);
  await page.getByRole('button', { name: /^login$/i }).click();

  // expect login modal to close and logout button to appear
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  await page.getByRole('button', { name: /close/i }).click();

  // navigate to discover
  await page.getByRole('link', { name: /discover/i }).click();
  await expect(page).toHaveURL(/\/discover/);

  // navigate to write page to publish
  await page.getByRole('link', { name: /write/i }).click();
  await expect(page).toHaveURL(/\/write/);

  // fill publish wizard minimal fields
  await page.getByPlaceholder('Title').fill('Test Book');
  await page.getByPlaceholder('Summary').fill('Summary');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();

  // after publishing, toast with View book link should appear
  const viewLink = page.getByRole('link', { name: /view book/i });
  await expect(viewLink).toBeVisible();
  const href = await viewLink.getAttribute('href');
  await viewLink.click();

  // read page should load
  await expect(page).toHaveURL(href!);
  await expect(page.locator('h1')).toContainText('Test Book');
});
