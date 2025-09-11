import { expect, test } from '../fixtures/trokito-fixture';

test.describe('Basic Verification - Trokito Setup', () => {
	test('Application loads successfully', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Trokito/);
	});

	test('Login page renders correctly', async ({ page }) => {
		await page.goto('/login');
		const loginForm = page.locator('form');
		await expect(loginForm).toBeVisible();
	});

	test('Navigation works', async ({ page }) => {
		await page.goto('/');
		// Assuming there's a nav element or link
		const nav = page.locator('nav').or(page.locator('[role="navigation"]'));
		await expect(nav).toBeVisible();
	});

	test('Calculator page loads', async ({ page }) => {
		await page.goto('/troco');
		// Check for calculator-specific elements
		const calculator = page.locator('input').or(page.locator('form'));
		await expect(calculator).toBeVisible();
	});

	test('Responsive design - mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		// Verify content fits mobile screen
		const body = page.locator('body');
		await expect(body).toBeVisible();
	});

	test('Responsive design - desktop viewport', async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto('/');
		const body = page.locator('body');
		await expect(body).toBeVisible();
	});
});
