import { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for Trokito application
 * Provides high-level methods for interacting with the app
 */
export class TrokitoPage {
	readonly page: Page;

	// Main navigation elements
	readonly loginButton: Locator;
	readonly homeHeading: Locator;
	readonly menuItems: Locator;

	// Login page elements
	readonly usernameInput: Locator;
	readonly pinInput: Locator;
	readonly loginSubmitButton: Locator;
	readonly registerButton: Locator;

	// Calculator page elements
	readonly pdvChangeInput: Locator;
	readonly customerContributionInput: Locator;
	readonly calculateButton: Locator;
	readonly resultDisplay: Locator;

	// Closing page elements
	readonly denominationInputs: Locator;
	readonly totalDisplay: Locator;
	readonly saveButton: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main navigation
		this.loginButton = page.locator('button:has-text("Login")');
		this.homeHeading = page.locator('h1:has-text("Trokito")');
		this.menuItems = page.locator('[aria-label="Menu principal"] a');

		// Login page
		this.usernameInput = page.locator('#username');
		this.pinInput = page.locator('#pin');
		this.loginSubmitButton = page.locator('button[type="submit"]');
		this.registerButton = page.locator('button:has-text("Registre-se")');

		// Calculator page
		this.pdvChangeInput = page.locator('#pdvChange');
		this.customerContributionInput = page.locator('#customerContribution');
		this.calculateButton = page.locator('button:has-text("Calcular Troco")');
		this.resultDisplay = page.locator('[aria-live="polite"]');

		// Closing page
		this.denominationInputs = page.locator('input[type="number"]');
		this.totalDisplay = page.locator('[aria-label*="Total geral"]');
		this.saveButton = page.locator('button:has-text("Salvar")');
	}

	/**
	 * Navigate to the application
	 */
	async goto(path = '/') {
		await this.page.goto(path);
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Login with PIN
	 */
	async loginWithPIN(pin: string = '7564') {
		// Wait for redirect to login page
		await this.page.waitForURL('**/login');

		// Fill PIN and submit
		await this.pinInput.fill(pin);
		await this.loginSubmitButton.click();

		// Wait for redirect to home
		await this.page.waitForURL('**/');
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Navigate to a specific page
	 */
	async navigateTo(
		pageName: 'troco' | 'fechamento' | 'historico' | 'configuracoes' | 'ajuda'
	) {
		const href = `/${pageName}`;
		await this.page.locator(`a[href="${href}"]`).click();
		await this.page.waitForURL(`**/${pageName}`);
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Fill calculator form
	 */
	async fillCalculatorForm(
		pdvChange: string,
		customerContribution: string = ''
	) {
		await this.pdvChangeInput.fill(pdvChange);
		if (customerContribution) {
			await this.customerContributionInput.fill(customerContribution);
		}
	}

	/**
	 * Calculate change
	 */
	async calculateChange() {
		await this.calculateButton.click();
		await this.page.waitForSelector('[aria-live="polite"]', { timeout: 5000 });
	}

	/**
	 * Get calculation result
	 */
	async getCalculationResult() {
		return await this.resultDisplay.textContent();
	}

	/**
	 * Fill denomination count
	 */
	async fillDenomination(denomination: string, count: number) {
		const input = this.page.locator(
			`input[aria-label*="Contagem de ${denomination}"]`
		);
		await input.fill(count.toString());
	}

	/**
	 * Get total from closing page
	 */
	async getClosingTotal() {
		return await this.totalDisplay.textContent();
	}

	/**
	 * Wait for element to be visible with custom timeout
	 */
	async waitForElement(selector: string, timeout = 10000) {
		await this.page.waitForSelector(selector, { timeout, state: 'visible' });
	}

	/**
	 * Wait for text to appear
	 */
	async waitForText(text: string, timeout = 10000) {
		await this.page.waitForSelector(`text=${text}`, { timeout });
	}

	/**
	 * Take screenshot with timestamp
	 */
	async takeScreenshot(name: string) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		await this.page.screenshot({
			path: `tests/playwright/screenshots/${name}-${timestamp}.png`,
			fullPage: true,
		});
	}

	/**
	 * Get page performance metrics
	 */
	async getPerformanceMetrics() {
		return await this.page.evaluate(() => {
			const navigation = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;
			return {
				domContentLoaded:
					navigation.domContentLoadedEventEnd -
					navigation.domContentLoadedEventStart,
				loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
				firstPaint:
					performance.getEntriesByName('first-paint')[0]?.startTime || 0,
				firstContentfulPaint:
					performance.getEntriesByName('first-contentful-paint')[0]
						?.startTime || 0,
			};
		});
	}
}
