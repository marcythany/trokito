import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions for better type safety
interface ScreenshotMetadata {
	path: string;
	filename: string;
	url: string;
	timestamp: string;
	viewport: { width: number; height: number } | null;
}

interface ResponsiveScreenshot extends ScreenshotMetadata {
	viewport: { width: number; height: number; name: string };
}

interface PerformanceMetrics {
	domContentLoaded: number;
	loadComplete: number;
	firstPaint: number;
	firstContentfulPaint: number;
	largestContentfulPaint: number;
	cumulativeLayoutShift: number;
	memoryUsage: number;
}

/**
 * Snapshot utilities for UI/UX analysis and visual regression testing
 */
export class SnapshotUtils {
	private screenshotsDir: string;

	constructor(private page: Page, baseDir = 'tests/playwright/screenshots') {
		this.screenshotsDir = baseDir;
		this.ensureDirectoryExists();
	}

	private ensureDirectoryExists() {
		if (!fs.existsSync(this.screenshotsDir)) {
			fs.mkdirSync(this.screenshotsDir, { recursive: true });
		}
	}

	/**
	 * Take screenshot with metadata
	 */
	async takeScreenshot(
		name: string,
		options: {
			fullPage?: boolean;
			element?: string;
			quality?: number;
			timestamp?: boolean;
		} = {}
	) {
		const {
			fullPage = true,
			element,
			quality = 80,
			timestamp = true,
		} = options;

		const timestampStr = timestamp ? `-${Date.now()}` : '';
		const filename = `${name}${timestampStr}.png`;
		const filepath = path.join(this.screenshotsDir, filename);

		if (element) {
			const elementHandle = await this.page.locator(element).elementHandle();
			if (elementHandle) {
				await elementHandle.screenshot({
					path: filepath,
					type: 'png',
				});
			} else {
				await this.page.screenshot({
					path: filepath,
					fullPage,
					quality,
					type: 'png',
				});
			}
		} else {
			await this.page.screenshot({
				path: filepath,
				fullPage,
				quality,
				type: 'png',
			});
		}

		return {
			path: filepath,
			filename,
			url: this.page.url(),
			timestamp: new Date().toISOString(),
			viewport: await this.page.viewportSize(),
		};
	}

	/**
	 * Capture multiple screenshots for UI flow analysis
	 */
	async captureUIFlow(
		name: string,
		steps: Array<{
			action: () => Promise<void>;
			description: string;
			waitFor?: string;
		}>
	) {
		const flowScreenshots: ScreenshotMetadata[] = [];

		// Initial state
		flowScreenshots.push(await this.takeScreenshot(`${name}-initial`));

		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];

			// Execute action
			await step.action();

			// Wait for condition if specified
			if (step.waitFor) {
				await this.page.waitForSelector(step.waitFor, { timeout: 5000 });
			}

			// Wait for animations/transitions
			await this.page.waitForTimeout(500);

			// Take screenshot
			flowScreenshots.push(
				await this.takeScreenshot(`${name}-step-${i + 1}`, {
					fullPage: true,
				})
			);
		}

		return flowScreenshots;
	}

	/**
	 * Compare screenshots for visual regression
	 */
	async compareScreenshots(
		baselinePath: string,
		currentPath: string
	): Promise<{
		match: boolean;
		difference?: number;
		diffPath?: string;
	}> {
		// This would require pixelmatch or similar library
		// For now, return basic comparison
		try {
			const baselineStats = fs.statSync(baselinePath);
			const currentStats = fs.statSync(currentPath);

			return {
				match: baselineStats.size === currentStats.size,
				difference: Math.abs(baselineStats.size - currentStats.size),
			};
		} catch (error) {
			return { match: false };
		}
	}

	/**
	 * Take accessibility snapshot
	 */
	async takeAccessibilitySnapshot(name: string) {
		const accessibilityTree = await this.page.accessibility.snapshot();

		const filepath = path.join(
			this.screenshotsDir,
			`${name}-accessibility.json`
		);
		fs.writeFileSync(filepath, JSON.stringify(accessibilityTree, null, 2));

		return {
			path: filepath,
			data: accessibilityTree,
		};
	}

	/**
	 * Capture performance metrics with screenshot
	 */
	async capturePerformanceWithScreenshot(name: string) {
		const [screenshot, metrics] = await Promise.all([
			this.takeScreenshot(`${name}-performance`),
			this.page.evaluate(() => ({
				domContentLoaded:
					performance.getEntriesByType('navigation')[0]
						?.domContentLoadedEventEnd || 0,
				loadComplete:
					performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0,
				firstPaint:
					performance.getEntriesByName('first-paint')[0]?.startTime || 0,
				firstContentfulPaint:
					performance.getEntriesByName('first-contentful-paint')[0]
						?.startTime || 0,
				largestContentfulPaint:
					performance.getEntriesByName('largest-contentful-paint')[0]
						?.startTime || 0,
				cumulativeLayoutShift:
					(
						performance.getEntriesByName(
							'layout-shift'
						)[0] as PerformanceEntry & { value?: number }
					)?.value || 0,
				memoryUsage:
					(performance as Performance & { memory?: { usedJSHeapSize: number } })
						.memory?.usedJSHeapSize || 0,
			})),
		]);

		const metricsPath = path.join(this.screenshotsDir, `${name}-metrics.json`);
		fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

		return {
			screenshot,
			metrics: {
				path: metricsPath,
				data: metrics,
			},
		};
	}

	/**
	 * Take responsive screenshots
	 */
	async takeResponsiveScreenshots(
		name: string,
		viewports: Array<{ width: number; height: number; name: string }>
	) {
		const screenshots: ResponsiveScreenshot[] = [];

		for (const viewport of viewports) {
			await this.page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});
			await this.page.waitForTimeout(500); // Wait for responsive changes

			const screenshot = await this.takeScreenshot(`${name}-${viewport.name}`, {
				fullPage: true,
				timestamp: false,
			});

			screenshots.push({
				...screenshot,
				viewport,
			});
		}

		return screenshots;
	}

	/**
	 * Generate screenshot report
	 */
	generateReport(screenshots: ScreenshotMetadata[], outputPath: string) {
		const report = {
			generatedAt: new Date().toISOString(),
			totalScreenshots: screenshots.length,
			screenshots: screenshots.map((s) => ({
				filename: s.filename,
				url: s.url,
				timestamp: s.timestamp,
				viewport: s.viewport,
			})),
		};

		fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
		return report;
	}
}
