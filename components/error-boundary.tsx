'use client';

import React from 'react';

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		this.setState({
			error,
			errorInfo,
		});

		// Report error to monitoring service in production
		if (process.env.NODE_ENV === 'production') {
			// Add error reporting service here
		}
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return (
					<FallbackComponent
						error={this.state.error}
						resetError={this.resetError}
					/>
				);
			}

			return (
				<div
					className='min-h-screen bg-background flex items-center justify-center p-4'
					role='alert'
				>
					<div className='max-w-md w-full text-center space-y-4'>
						<div className='w-16 h-16 mx-auto neumorphism rounded-full flex items-center justify-center'>
							<span className='text-2xl'>⚠️</span>
						</div>
						<h1 className='text-2xl font-bold text-foreground'>
							Oops! Algo deu errado
						</h1>
						<p className='text-muted-foreground'>
							Encontramos um erro inesperado. Tente recarregar a página.
						</p>
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className='mt-4 text-left'>
								<summary className='cursor-pointer text-sm font-medium'>
									Detalhes do erro (desenvolvimento)
								</summary>
								<pre className='mt-2 text-xs bg-muted p-3 rounded overflow-auto'>
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}
						<button
							onClick={this.resetError}
							className='neumorphism focus-ring mobile-tap touch-target px-6 py-3 rounded-lg'
							aria-label='Tentar novamente'
						>
							Tentar Novamente
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Hook for functional components
export function useErrorHandler() {
	return (error: Error, errorInfo?: { componentStack?: string }) => {
		console.error('Error caught by useErrorHandler:', error, errorInfo);
		// Could integrate with error reporting service
	};
}

export default ErrorBoundary;
