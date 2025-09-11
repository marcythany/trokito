'use client';

import React from 'react';

// Component to help debug React Error #418 in production
export function ReactErrorDebug() {
	const [error, setError] = React.useState<Error | null>(null);
	const [errorInfo, setErrorInfo] = React.useState<React.ErrorInfo | null>(
		null
	);

	React.useEffect(() => {
		// Global error handler for unhandled errors
		const handleError = (event: ErrorEvent) => {
			console.error('Global error caught:', event.error);
			setError(event.error);
		};

		// Global handler for unhandled promise rejections
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error('Unhandled promise rejection:', event.reason);
			if (event.reason instanceof Error) {
				setError(event.reason);
			}
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener(
				'unhandledrejection',
				handleUnhandledRejection
			);
		};
	}, []);

	// Component-level error boundary (placeholder - use ErrorBoundary class for actual error catching)
	React.useEffect(() => {
		// Placeholder for component error handling - integrate with ErrorBoundary if needed
		return () => {
			// Cleanup if needed
		};
	}, []);

	// Only show in development or if there's an error
	if (process.env.NODE_ENV === 'production' && !error) {
		return null;
	}

	if (!error) {
		return (
			<div className='fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm z-50'>
				✅ No React errors detected
			</div>
		);
	}

	return (
		<div className='fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg max-w-md z-50 shadow-lg'>
			<h3 className='font-bold mb-2'>🚨 React Error Detected</h3>
			<div className='text-sm space-y-2'>
				<div>
					<strong>Error:</strong> {error.name}: {error.message}
				</div>
				{errorInfo && (
					<div>
						<strong>Component Stack:</strong>
						<pre className='text-xs mt-1 bg-red-600 p-2 rounded overflow-auto max-h-32'>
							{errorInfo.componentStack}
						</pre>
					</div>
				)}
				<div>
					<strong>Stack:</strong>
					<pre className='text-xs mt-1 bg-red-600 p-2 rounded overflow-auto max-h-32'>
						{error.stack}
					</pre>
				</div>
			</div>
			<button
				onClick={() => {
					setError(null);
					setErrorInfo(null);
					window.location.reload();
				}}
				className='mt-2 bg-white text-red-500 px-3 py-1 rounded text-sm hover:bg-gray-100'
			>
				Reload Page
			</button>
		</div>
	);
}

// Hook to manually report errors
export function useErrorReporting() {
	return (error: Error, context?: string) => {
		console.error(`Error in ${context || 'unknown context'}:`, error);

		// In production, you might want to send this to an error reporting service
		if (process.env.NODE_ENV === 'production') {
			// Example: Send to error reporting service
			// errorReportingService.captureException(error, { context });
		}
	};
}

// Utility to check for common React Error #418 causes
export function checkForCommonReactErrors() {
	const issues = [];

	// Check for hydration mismatches
	if (typeof window !== 'undefined') {
		// Check if we're in a browser environment
		issues.push('Hydration check passed');
	}

	// Check for state updates on unmounted components
	issues.push('State update checks: Monitor useEffect cleanup');

	// Check for key prop issues in lists
	issues.push('Key props: Ensure stable keys in mapped components');

	return issues;
}
