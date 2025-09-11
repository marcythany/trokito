import { Page } from '@playwright/test';

/**
 * Form filling utilities optimized for financial calculator inputs
 */
export class FormHelpers {
	constructor(private page: Page) {}

	/**
	 * Fill currency input with Brazilian Real formatting
	 */
	async fillCurrencyInput(selector: string, value: string) {
		// Clear existing value
		await this.page.fill(selector, '');

		// Type value with formatting
		await this.page.type(selector, value, { delay: 100 });

		// Wait for formatting to apply
		await this.page.waitForTimeout(200);
	}

	/**
	 * Fill calculator form with validation
	 */
	async fillCalculatorForm(data: {
		pdvChange: string;
		customerContribution?: string;
	}) {
		await this.fillCurrencyInput('#pdvChange', data.pdvChange);

		if (data.customerContribution) {
			await this.fillCurrencyInput(
				'#customerContribution',
				data.customerContribution
			);
		}
	}

	/**
	 * Fill denomination counts for closing page
	 */
	async fillDenominations(denominations: Record<string, number>) {
		for (const [label, count] of Object.entries(denominations)) {
			const input = this.page.locator(
				`input[aria-label*="Contagem de ${label}"]`
			);
			await input.fill(count.toString());
			await this.page.waitForTimeout(100); // Allow calculation to update
		}
	}

	/**
	 * Smart form submission with validation
	 */
	async submitForm(
		options: {
			selector?: string;
			waitForResult?: boolean;
			resultSelector?: string;
		} = {}
	) {
		const {
			selector = 'button[type="submit"]',
			waitForResult = true,
			resultSelector = '[aria-live="polite"]',
		} = options;

		// Click submit button
		await this.page.click(selector);

		if (waitForResult) {
			// Wait for result to appear
			await this.page.waitForSelector(resultSelector, { timeout: 5000 });
		}
	}

	/**
	 * Fill login form
	 */
	async fillLoginForm(pin: string) {
		await this.page.fill('#pin', pin);
	}

	/**
	 * Handle form validation errors
	 */
	async getFormErrors(): Promise<string[]> {
		const errorElements = await this.page
			.locator('[role="alert"], .text-destructive')
			.all();
		const errors: string[] = [];

		for (const element of errorElements) {
			const text = await element.textContent();
			if (text) errors.push(text.trim());
		}

		return errors;
	}

	/**
	 * Wait for form calculation to complete
	 */
	async waitForCalculation() {
		await this.page.waitForSelector('[aria-live="polite"]', { timeout: 5000 });
		// Wait for any animations to complete
		await this.page.waitForTimeout(500);
	}

	/**
	 * Get form field value with formatting
	 */
	async getFieldValue(selector: string): Promise<string> {
		const input = this.page.locator(selector);
		return await input.inputValue();
	}

	/**
	 * Clear form field
	 */
	async clearField(selector: string) {
		await this.page.fill(selector, '');
	}

	/**
	 * Fill multiple fields at once
	 */
	async fillMultipleFields(fields: Record<string, string>) {
		const promises = Object.entries(fields).map(([selector, value]) =>
			this.page.fill(selector, value)
		);
		await Promise.all(promises);
	}

	/**
	 * Handle numeric inputs with increment/decrement
	 */
	async adjustNumericInput(
		selector: string,
		operation: 'increment' | 'decrement',
		times = 1
	) {
		const buttonSelector = operation === 'increment' ? '+ button' : '- button';
		const container = this.page.locator(selector).locator('..');

		for (let i = 0; i < times; i++) {
			await container.locator(buttonSelector).click();
			await this.page.waitForTimeout(50);
		}
	}
}
