// Each test title carries its Jira story and requirement IDs so results can be posted back.
const { test, expect } = require('@playwright/test');

const shot = (page, name) => page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('drug')).toHaveValue('DRUG-A');
});

test('[AIDEL-58][REQ-001] shows the patient weight when an order starts', async ({ page }) => {
  await expect(page.getByTestId('weight')).toContainText('15 kg');
  await shot(page, 'AIDEL-58_weight-shown');
});

test('[AIDEL-58][REQ-001] blocks ordering when weight is missing', async ({ page }) => {
  await page.getByTestId('patient').selectOption('DEMO-003');
  await page.getByTestId('dose').fill('50');
  await expect(page.getByTestId('weight')).toContainText('weight is missing');
  await expect(page.getByTestId('submit')).toBeDisabled();
  await shot(page, 'AIDEL-58_weight-missing');
});

test('[AIDEL-59][REQ-002] calculates the maximum daily dose from weight', async ({ page }) => {
  await page.getByTestId('dose').fill('50');
  await expect(page.getByTestId('calc')).toContainText('Maximum for this patient: 150 mg/day');
  await shot(page, 'AIDEL-59_max-calculated');
});

test('[AIDEL-60][REQ-003] shows an alert when the daily dose exceeds the maximum', async ({ page }) => {
  await page.getByTestId('dose').fill('100');
  await page.getByTestId('freq').fill('2');
  await expect(page.getByTestId('alert')).toBeVisible();
  await expect(page.getByTestId('alert')).toContainText('Maximum-dose alert');
  await shot(page, 'AIDEL-60_alert-shown');
});

test('[AIDEL-60][REQ-003] no alert when within the limit', async ({ page }) => {
  await page.getByTestId('dose').fill('50');
  await expect(page.getByTestId('alert')).toBeHidden();
});

test('[AIDEL-61][REQ-004] requires a justification before signing an over-limit order', async ({ page }) => {
  await page.getByTestId('dose').fill('200');
  await expect(page.getByTestId('submit')).toBeDisabled();
  await page.getByTestId('reason').fill('Loading dose per consultant');
  await expect(page.getByTestId('submit')).toBeEnabled();
  await shot(page, 'AIDEL-61_justification');
});

test('[AIDEL-62][REQ-005] logs the alert and the justification', async ({ page }) => {
  await page.getByTestId('dose').fill('200');
  await page.getByTestId('reason').fill('Loading dose per consultant');
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('audit')).toContainText('Loading dose per consultant');
  await expect(page.getByTestId('result')).toContainText('override');
  await shot(page, 'AIDEL-62_alert-logged');
});
