import { test as base } from '@playwright/test';
import { TrokitoPage } from '../utils/trokito-page';

// Extend the base test with our custom fixtures
export const test = base.extend<{
	trokitoPage: TrokitoPage;
}>({
	trokitoPage: async ({ page }, use) => {
		const trokitoPage = new TrokitoPage(page);
		await trokitoPage.goto();
		await use(trokitoPage);
	},
});

export { expect } from '@playwright/test';
