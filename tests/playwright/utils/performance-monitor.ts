import { Page } from '@playwright/test';

/**
 * Performance monitoring utilities for UI/UX analysis
 */
export class PerformanceMonitor {
	constructor(private page: Page) {}

	/**
	 * Collect comprehensive performance metrics
	 */
	async collectMetrics(): Promise<PerformanceMetrics> {
		return await this.page.evaluate(() => {
			const navigation = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;
			const paint = performance.getEntriesByName(
				'first-paint'
			)[0] as PerformanceEntry;
			const contentfulPaint = performance.getEntriesByName(
				'first-contentful-paint'
			)[0] as PerformanceEntry;
			const largestContentfulPaint = performance.getEntriesByName(
				'largest-contentful-paint'
			)[0] as PerformanceEntry;

			// Calculate Core Web Vitals
			const clsEntries = performance.getEntriesByName('layout-shift');
			const clsValue = clsEntries.reduce(
				(total, entry: any) => total + entry.value,
				0
			);

			const fidEntries = performance.getEntriesByName('first-input');
			const fidValue =
				fidEntries.length > 0
					? (fidEntries[0] as any).processingStart -
					  (fidEntries[0] as any).startTime
					: 0;

			return {
				// Navigation timing
				navigation: {
					domContentLoaded:
						navigation.domContentLoadedEventEnd -
						navigation.domContentLoadedEventStart,
					loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
					dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
					tcpConnect: navigation.connectEnd - navigation.connectStart,
					serverResponse: navigation.responseStart - navigation.requestStart,
					pageDownload: navigation.responseEnd - navigation.responseStart,
					domProcessing:
						navigation.domContentLoadedEventStart - navigation.responseEnd,
				},

				// Paint timing
				paint: {
					firstPaint: paint?.startTime || 0,
					firstContentfulPaint: contentfulPaint?.startTime || 0,
					largestContentfulPaint: largestContentfulPaint?.startTime || 0,
				},

				// Core Web Vitals
				coreWebVitals: {
					cls: clsValue,
					fid: fidValue,
					lcp: largestContentfulPaint?.startTime || 0,
				},

				// Resource timing
				resources: performance.getEntriesByType('resource').map((entry) => ({
					name: entry.name,
					type: (entry as any).initiatorType,
					duration: entry.duration,
					size: (entry as any).transferSize || 0,
				})),

				// Memory usage (if available)
				memory: (performance as any).memory
					? {
							used: (performance as any).memory.usedJSHeapSize,
							total: (performance as any).memory.totalJSHeapSize,
							limit: (performance as any).memory.jsHeapSizeLimit,
					  }
					: null,
			};
		});
	}

	/**
	 * Monitor performance during user interactions
	 */
	async monitorInteraction(
		interaction: () => Promise<void>
	): Promise<InteractionMetrics> {
		const startTime = Date.now();
		const startMemory = await this.getMemoryUsage();

		// Start monitoring
		await this.page.evaluate(() => {
			performance.mark('interaction-start');
		});

		// Execute interaction
		await interaction();

		// End monitoring
		await this.page.evaluate(() => {
			performance.mark('interaction-end');
			performance.measure(
				'interaction-duration',
				'interaction-start',
				'interaction-end'
			);
		});

		const endTime = Date.now();
		const endMemory = await this.getMemoryUsage();

		const duration = endTime - startTime;
		const memoryDelta = endMemory - startMemory;

		return {
			duration,
			memoryDelta,
			memoryLeak: memoryDelta > 1024 * 1024, // > 1MB increase
			performanceMark: await this.page.evaluate(() => {
				const measure = performance.getEntriesByName('interaction-duration')[0];
				return measure ? measure.duration : 0;
			}),
		};
	}

	/**
	 * Get current memory usage
	 */
	private async getMemoryUsage(): Promise<number> {
		return await this.page.evaluate(() => {
			return (performance as any).memory?.usedJSHeapSize || 0;
		});
	}

	/**
	 * Monitor network requests during interaction
	 */
	async monitorNetworkRequests(
		interaction: () => Promise<void>
	): Promise<NetworkMetrics> {
		const requests: any[] = [];

		// Start monitoring
		const requestHandler = (request: any) => {
			requests.push({
				url: request.url(),
				method: request.method(),
				resourceType: request.resourceType(),
				timestamp: Date.now(),
			});
		};

		this.page.on('request', requestHandler);

		// Execute interaction
		await interaction();

		// Stop monitoring
		this.page.off('request', requestHandler);

		return {
			totalRequests: requests.length,
			requestsByType: requests.reduce((acc, req) => {
				acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
				return acc;
			}, {} as Record<string, number>),
			requests,
		};
	}

	/**
	 * Analyze rendering performance
	 */
	async analyzeRendering(): Promise<RenderingMetrics> {
		return await this.page.evaluate(() => {
			const longTasks = performance.getEntriesByType('longtask');
			const layoutShifts = performance.getEntriesByName('layout-shift');

			return {
				longTasks: longTasks.map((task) => ({
					duration: task.duration,
					startTime: task.startTime,
				})),
				layoutShifts: layoutShifts.map((shift: any) => ({
					value: shift.value,
					startTime: shift.startTime,
				})),
				totalBlockingTime: longTasks.reduce((total, task) => {
					return total + Math.max(0, task.duration - 50);
				}, 0),
				cumulativeLayoutShift: layoutShifts.reduce(
					(total: number, shift: any) => total + shift.value,
					0
				),
			};
		});
	}

	/**
	 * Generate performance report
	 */
	generateReport(
		metrics: PerformanceMetrics,
		interactionMetrics?: InteractionMetrics
	): PerformanceReport {
		const report: PerformanceReport = {
			timestamp: new Date().toISOString(),
			url: this.page.url(),
			metrics,
			interactionMetrics,
			recommendations: [],
		};

		// Analyze metrics and generate recommendations
		if (metrics.navigation.loadComplete > 3000) {
			report.recommendations.push({
				type: 'performance',
				priority: 'high',
				message:
					'Page load time is too slow (>3s). Consider optimizing assets and reducing bundle size.',
				metric: 'loadComplete',
				value: metrics.navigation.loadComplete,
				threshold: 3000,
			});
		}

		if (metrics.coreWebVitals.cls > 0.1) {
			report.recommendations.push({
				type: 'ux',
				priority: 'high',
				message:
					'High cumulative layout shift detected. Fix element positioning to prevent content jumping.',
				metric: 'cls',
				value: metrics.coreWebVitals.cls,
				threshold: 0.1,
			});
		}

		if (metrics.coreWebVitals.lcp > 2500) {
			report.recommendations.push({
				type: 'performance',
				priority: 'medium',
				message:
					'Largest contentful paint is slow. Optimize image loading and critical rendering path.',
				metric: 'lcp',
				value: metrics.coreWebVitals.lcp,
				threshold: 2500,
			});
		}

		return report;
	}
}

// Type definitions
export interface PerformanceMetrics {
	navigation: {
		domContentLoaded: number;
		loadComplete: number;
		dnsLookup: number;
		tcpConnect: number;
		serverResponse: number;
		pageDownload: number;
		domProcessing: number;
	};
	paint: {
		firstPaint: number;
		firstContentfulPaint: number;
		largestContentfulPaint: number;
	};
	coreWebVitals: {
		cls: number;
		fid: number;
		lcp: number;
	};
	resources: Array<{
		name: string;
		type: string;
		duration: number;
		size: number;
	}>;
	memory: {
		used: number;
		total: number;
		limit: number;
	} | null;
}

export interface InteractionMetrics {
	duration: number;
	memoryDelta: number;
	memoryLeak: boolean;
	performanceMark: number;
}

export interface NetworkMetrics {
	totalRequests: number;
	requestsByType: Record<string, number>;
	requests: Array<{
		url: string;
		method: string;
		resourceType: string;
		timestamp: number;
	}>;
}

export interface RenderingMetrics {
	longTasks: Array<{
		duration: number;
		startTime: number;
	}>;
	layoutShifts: Array<{
		value: number;
		startTime: number;
	}>;
	totalBlockingTime: number;
	cumulativeLayoutShift: number;
}

export interface PerformanceReport {
	timestamp: string;
	url: string;
	metrics: PerformanceMetrics;
	interactionMetrics?: InteractionMetrics;
	recommendations: Array<{
		type: 'performance' | 'ux' | 'accessibility';
		priority: 'low' | 'medium' | 'high';
		message: string;
		metric: string;
		value: number;
		threshold: number;
	}>;
}
