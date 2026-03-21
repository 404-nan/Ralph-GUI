import { expect, test } from '@playwright/test';

const cases = [
  ['plan-review', 'Spec imported / plan review'],
  ['active-workspace', 'Active task workspace'],
  ['blocked-waiting', 'Waiting decision / blocked'],
] as const;

for (const [fixture, label] of cases) {
  test(`fixture ${fixture} renders primary workspace`, async ({ page }) => {
    await page.goto(`/?fixture=${fixture}`);
    await expect(page.getByText(label)).toBeVisible();
    await expect(page.getByText(/goal \/ done definition \/ source spec/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /1 task = 1 chat/i })).toBeVisible();
  });
}

test('sidebar can collapse while main actions remain usable', async ({ page }) => {
  await page.goto('/?fixture=active-workspace');
  await page.getByLabel('Toggle sidebar').click();
  await expect(page.locator('.app-shell')).toHaveClass(/is-sidebar-collapsed/);
  await expect(page.getByRole('button', { name: 'task 追加' })).toBeVisible();
  await page.getByRole('button', { name: 'Decision' }).click();
  await expect(page.getByText(/decision target:/i)).toBeVisible();
});

test('360px mobile layout keeps primary action visible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/?fixture=blocked-waiting');
  await expect(page.getByRole('button', { name: '推奨回答を使う' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /1 task = 1 chat/i })).toBeVisible();
});
