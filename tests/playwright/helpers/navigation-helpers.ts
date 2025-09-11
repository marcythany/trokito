import { Page } from '@playwright/test';

/**
 * Navigation helpers for efficient page transitions
 */
export class NavigationHelpers {
	constructor(private page: Page) {}

	/**
	 * Navigate with retry logic for flaky connections
	 */
	async navigateWithRetry(url: string, maxRetries = 3) {
		for (let i = 0; i < maxRetries; i++) {
			try {
				await this.page.goto(url, { waitUntil: 'networkidle' });
				return;
			} catch (error) {
				if (i === maxRetries - 1) throw error;
				await this.page.waitForTimeout(1000 * (i + 1)); // Exponential backoff
			}
		}
	}

	/**
	 * Wait for page to be fully loaded with custom conditions
	 */
	async waitForPageLoad(
		options: {
			timeout?: number;
			waitForNetwork?: boolean;
			waitForContent?: string;
		} = {}
	) {
		const { timeout = 30000, waitForNetwork = true, waitForContent } = options;

		if (waitForNetwork) {
			await this.page.waitForLoadState('networkidle', { timeout });
		}

		if (waitForContent) {
			await this.page.waitForSelector(`text=${waitForContent}`, { timeout });
		}

		// Wait for any animations to complete
		await this.page.waitForTimeout(500);
	}

	/**
	 * Smart click with fallback strategies
	 */
	async smartClick(
		selector: string,
		options: {
			timeout?: number;
			force?: boolean;
			waitForVisible?: boolean;
		} = {}
	) {
		const { timeout = 10000, force = false, waitForVisible = true } = options;

		if (waitForVisible) {
			await this.page.waitForSelector(selector, { timeout, state: 'visible' });
		}

		try {
			await this.page.click(selector, { timeout: timeout / 2 });
		} catch (error) {
			if (force) {
				await this.page.locator(selector).click({ force: true });
			} else {
				// Try scrolling into view first
				await this.page.locator(selector).scrollIntoViewIfNeeded();
				await this.page.click(selector, { timeout: timeout / 2 });
			}
		}
	}

	/**
	 * Navigate through app menu with validation
	 */
	async navigateMenu(path: string) {
		const menuSelector = `a[href="${path}"]`;

		// Wait for menu to be visible
		await this.page.waitForSelector('[aria-label="Menu principal"]', {
			timeout: 5000,
		});

		// Click menu item
		await this.smartClick(menuSelector);

		// Wait for navigation to complete
		await this.page.waitForURL(`**${path}`, { timeout: 10000 });

		// Wait for page content to load
		await this.waitForPageLoad({ waitForContent: 'Trokito' });
	}

	/**
	 * Handle authentication flow
	 */
	async handleAuth(pin: string = '7564') {
		// Check if we're on login page
		if (this.page.url().includes('/login')) {
			await this.page.fill('#pin', pin);
			await this.page.click('button[type="submit"]');
			await this.page.waitForURL('**/', { timeout: 10000 });
		}
	}

	/**
	 * Get current page identifier
	 */
	async getCurrentPage(): Promise<string> {
		const url = this.page.url();
		if (url.includes('/troco')) return 'calculator';
		if (url.includes('/fechamento')) return 'closing';
		if (url.includes('/historico')) return 'history';
		if (url.includes('/configuracoes')) return 'settings';
		if (url.includes('/ajuda')) return 'help';
		if (url.includes('/login')) return 'login';
		return 'home';
	}
}
