import { Page } from '@playwright/test';

/**
 * Dynamic waiting strategies for stable test execution
 */
export class WaitUtils {
	constructor(private page: Page) {}

	/**
	 * Wait for network to be idle with custom timeout
	 */
	async waitForNetworkIdle(timeout = 5000) {
		await this.page.waitForLoadState('networkidle', { timeout });
	}

	/**
	 * Wait for DOM to be ready
	 */
	async waitForDOMReady() {
		await this.page.waitForLoadState('domcontentloaded');
	}

	/**
	 * Smart wait for element with multiple strategies
	 */
	async smartWaitForElement(
		selector: string,
		options: {
			timeout?: number;
			visible?: boolean;
			stable?: boolean;
			pollInterval?: number;
		} = {}
	) {
		const {
			timeout = 10000,
			visible = true,
			stable = true,
			pollInterval = 100,
		} = options;

		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			try {
				const element = this.page.locator(selector);

				if (visible) {
					await element.waitFor({ state: 'visible', timeout: pollInterval });
				} else {
					await element.waitFor({ state: 'attached', timeout: pollInterval });
				}

				if (stable) {
					// Wait for element to be stable (no changes for 500ms)
					await this.waitForStability(selector, 500);
				}

				return element;
			} catch (error) {
				// Continue polling
			}

			await this.page.waitForTimeout(pollInterval);
		}

		throw new Error(`Element ${selector} not found within ${timeout}ms`);
	}

	/**
	 * Wait for element stability (no changes)
	 */
	private async waitForStability(selector: string, stabilityPeriod = 500) {
		const element = this.page.locator(selector);
		const lastRect = await element.boundingBox();

		await this.page.waitForTimeout(stabilityPeriod);

		const currentRect = await element.boundingBox();

		if (JSON.stringify(lastRect) !== JSON.stringify(currentRect)) {
			await this.waitForStability(selector, stabilityPeriod);
		}
	}

	/**
	 * Wait for text content to change
	 */
	async waitForTextChange(
		selector: string,
		initialText?: string,
		timeout = 5000
	) {
		const startTime = Date.now();

		if (!initialText) {
			initialText = (await this.page.locator(selector).textContent()) || '';
		}

		while (Date.now() - startTime < timeout) {
			const currentText =
				(await this.page.locator(selector).textContent()) || '';
			if (currentText !== initialText) {
				return currentText;
			}
			await this.page.waitForTimeout(100);
		}

		throw new Error(`Text in ${selector} did not change within ${timeout}ms`);
	}

	/**
	 * Wait for calculation result
	 */
	async waitForCalculationResult(resultSelector = '[aria-live="polite"]') {
		await this.smartWaitForElement(resultSelector, {
			visible: true,
			stable: true,
			timeout: 10000,
		});

		// Wait for any animations to complete
		await this.page.waitForTimeout(500);
	}

	/**
	 * Wait for form validation
	 */
	async waitForFormValidation(errorSelector = '[role="alert"]') {
		try {
			await this.page.waitForSelector(errorSelector, { timeout: 2000 });
			return true; // Errors found
		} catch {
			return false; // No errors
		}
	}

	/**
	 * Wait for page transition
	 */
	async waitForPageTransition(expectedUrl: string, timeout = 10000) {
		await this.page.waitForURL(expectedUrl, { timeout });
		await this.waitForNetworkIdle(5000);
	}

	/**
	 * Wait for animations to complete
	 */
	async waitForAnimations(selector?: string, timeout = 2000) {
		if (selector) {
			await this.page.waitForSelector(selector, { timeout });
		}

		// Wait for CSS transitions/animations
		await this.page.waitForTimeout(500);

		// Check if there are any ongoing animations
		const hasAnimations = await this.page.evaluate(() => {
			const elements = document.querySelectorAll('*');
			for (const element of elements) {
				const computedStyle = window.getComputedStyle(element);
				if (
					computedStyle.animationName !== 'none' ||
					computedStyle.transitionProperty !== 'none'
				) {
					return true;
				}
			}
			return false;
		});

		if (hasAnimations) {
			await this.page.waitForTimeout(1000);
		}
	}

	/**
	 * Wait for specific condition with polling
	 */
	async waitForCondition(
		condition: () => Promise<boolean>,
		options: {
			timeout?: number;
			pollInterval?: number;
			message?: string;
		} = {}
	) {
		const {
			timeout = 5000,
			pollInterval = 100,
			message = 'Condition not met',
		} = options;

		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			if (await condition()) {
				return;
			}
			await this.page.waitForTimeout(pollInterval);
		}

		throw new Error(`${message} within ${timeout}ms`);
	}

	/**
	 * Wait for element to be clickable
	 */
	async waitForClickable(selector: string, timeout = 5000) {
		await this.smartWaitForElement(selector, {
			visible: true,
			stable: true,
			timeout,
		});

		// Additional check for clickability
		await this.waitForCondition(
			async () => {
				const element = this.page.locator(selector);
				const isEnabled = await element.isEnabled();
				const isVisible = await element.isVisible();
				return isEnabled && isVisible;
			},
			{
				timeout,
				message: `Element ${selector} not clickable`,
			}
		);
	}

	/**
	 * Wait for loading states to disappear
	 */
	async waitForLoadingToDisappear(
		loadingSelector = '[aria-busy="true"], .loading, .spinner'
	) {
		try {
			await this.page.waitForSelector(loadingSelector, {
				state: 'detached',
				timeout: 5000,
			});
		} catch {
			// Loading element might not exist, which is fine
		}
	}
}
