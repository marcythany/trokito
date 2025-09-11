import { expect, test } from '../fixtures/trokito-fixture';
import { FormHelpers } from '../helpers/form-helpers';
import { NavigationHelpers } from '../helpers/navigation-helpers';
import { SnapshotUtils } from '../utils/snapshot-utils';

test.describe('UI/UX Analysis - Trokito Financial Calculator', () => {
	let snapshotUtils: SnapshotUtils;
	let navHelpers: NavigationHelpers;
	let formHelpers: FormHelpers;

	test.beforeEach(async ({ page }) => {
		snapshotUtils = new SnapshotUtils(page);
		navHelpers = new NavigationHelpers(page);
		formHelpers = new FormHelpers(page);
	});

	test('Complete user journey analysis', async ({}) => {
		// 1. Initial page load
		await snapshotUtils.takeScreenshot('01-home-page-initial');

		// 2. Login flow
		await snapshotUtils.captureUIFlow('login-flow', [
			{
				action: async () => {
					await formHelpers.fillLoginForm('7564');
					await formHelpers.submitForm();
				},
				description: 'Fill login form with PIN',
				waitFor: '[aria-label="Menu principal"]',
			},
		]);

		// 3. Main navigation analysis
		await snapshotUtils.takeScreenshot('02-main-menu');

		// 4. Calculator page analysis
		await navHelpers.navigateMenu('/troco');
		await snapshotUtils.takeScreenshot('03-calculator-empty');

		// 5. Calculator interaction flow
		await snapshotUtils.captureUIFlow('calculator-interaction', [
			{
				action: async () => {
					await formHelpers.fillCalculatorForm({
						pdvChange: 'R$ 150,00',
						customerContribution: 'R$ 50,00',
					});
				},
				description: 'Fill calculator with sample data',
				waitFor: '#pdvChange',
			},
			{
				action: async () => await formHelpers.submitForm(),
				description: 'Submit calculation',
				waitFor: '[aria-live="polite"]',
			},
		]);

		await snapshotUtils.takeScreenshot('04-calculator-result');

		// 6. Closing page analysis
		await navHelpers.navigateMenu('/fechamento');
		await snapshotUtils.takeScreenshot('05-closing-empty');

		// 7. Closing interaction flow
		await snapshotUtils.captureUIFlow('closing-interaction', [
			{
				action: async () => {
					await formHelpers.fillDenominations({
						'R$ 100,00': 5,
						'R$ 50,00': 2,
						'R$ 10,00': 3,
					});
				},
				description: 'Fill denomination counts',
				waitFor: '[aria-label*="Total geral"]',
			},
		]);

		await snapshotUtils.takeScreenshot('06-closing-filled');

		// 8. Responsive design analysis
		await snapshotUtils.takeResponsiveScreenshots('responsive-analysis', [
			{ width: 375, height: 667, name: 'mobile' },
			{ width: 768, height: 1024, name: 'tablet' },
			{ width: 1920, height: 1080, name: 'desktop' },
		]);

		// 9. Performance analysis
		await snapshotUtils.capturePerformanceWithScreenshot(
			'performance-analysis'
		);

		// 10. Accessibility analysis
		await snapshotUtils.takeAccessibilitySnapshot('accessibility-analysis');
	});

	test('Touch target and mobile usability analysis', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Analyze touch targets
		const touchTargets = await page.$$eval(
			'button, [role="button"], input, select, a',
			(elements) => {
				return elements.map((el) => {
					const rect = el.getBoundingClientRect();
					return {
						tagName: el.tagName,
						text: el.textContent?.trim() || '',
						width: rect.width,
						height: rect.height,
						area: rect.width * rect.height,
						meetsMinimum: rect.width >= 44 && rect.height >= 44,
					};
				});
			}
		);

		// Log touch target analysis
		console.log('Touch Target Analysis:', touchTargets);

		// Take screenshot of mobile layout
		await snapshotUtils.takeScreenshot('mobile-touch-targets');
	});

	test('Color contrast and visual hierarchy analysis', async ({ page }) => {
		// Analyze color usage
		const colorAnalysis = await page.evaluate(() => {
			const elements = document.querySelectorAll('*');
			const colors = new Map<string, number>();

			elements.forEach((el) => {
				const style = window.getComputedStyle(el);
				const bgColor = style.backgroundColor;
				const textColor = style.color;

				if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
					colors.set(bgColor, (colors.get(bgColor) || 0) + 1);
				}
				if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
					colors.set(textColor, (colors.get(textColor) || 0) + 1);
				}
			});

			return Array.from(colors.entries()).map(([color, count]) => ({
				color,
				count,
				usage: count > 10 ? 'frequent' : count > 5 ? 'moderate' : 'rare',
			}));
		});

		console.log('Color Usage Analysis:', colorAnalysis);
		await snapshotUtils.takeScreenshot('color-analysis');
	});

	test('Form validation and error handling analysis', async ({}) => {
		// Navigate to calculator
		await navHelpers.navigateMenu('/troco');

		// Test invalid inputs
		const invalidInputs = [
			{ pdvChange: '', customerContribution: 'R$ 100,00' },
			{ pdvChange: 'R$ 50,00', customerContribution: 'R$ 100,00' },
			{ pdvChange: 'invalid', customerContribution: '' },
		];

		for (const input of invalidInputs) {
			await formHelpers.fillCalculatorForm(input);
			await formHelpers.submitForm();

			// Check for error messages
			const errors = await formHelpers.getFormErrors();
			expect(errors.length).toBeGreaterThan(0);

			await snapshotUtils.takeScreenshot(
				`form-validation-error-${invalidInputs.indexOf(input)}`
			);
		}
	});

	test('Animation and transition analysis', async ({ page }) => {
		// Navigate to calculator
		await navHelpers.navigateMenu('/troco');

		// Fill and submit form to trigger animations
		await formHelpers.fillCalculatorForm({
			pdvChange: 'R$ 200,00',
			customerContribution: 'R$ 50,00',
		});

		// Record animation performance
		const animationMetrics = await page.evaluate(() => {
			return new Promise((resolve) => {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					resolve(
						entries.map((entry) => ({
							name: entry.name,
							startTime: entry.startTime,
							duration: entry.duration,
						}))
					);
				});

				observer.observe({ entryTypes: ['measure'] });

				// Trigger calculation
				setTimeout(() => {
					observer.disconnect();
					resolve([]);
				}, 2000);
			});
		});

		console.log('Animation Performance:', animationMetrics);
		await snapshotUtils.takeScreenshot('animation-analysis');
	});

	test('Search integration for UI/UX research', async ({}) => {
		// This test would integrate with search tools to research best practices
		// For now, we'll simulate the research process

		const researchQueries = [
			'UI/UX best practices for financial calculators 2024',
			'Mobile-first design patterns for money management apps',
			'Accessibility guidelines for Brazilian financial applications',
			'Color schemes for financial apps with dyscalculia considerations',
		];

		console.log('Research queries for UI/UX analysis:', researchQueries);

		// In a real implementation, this would:
		// 1. Use Brave Search API or similar
		// 2. Analyze competitor apps
		// 3. Gather user feedback data
		// 4. Compare with current implementation
	});
});
