'use client';

import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const mainContentRef = useRef<HTMLDivElement>(null);
	const [isClient, setIsClient] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		// Check if we're on the client side
		setIsClient(true);

		// Check if user is authenticated
		const authenticated = auth.isAuthenticated();
		setIsAuthenticated(authenticated);

		if (!authenticated) {
			router.push('/login');
		}
	}, [router]);

	// Focus the main content when the component mounts for better screen reader experience
	useEffect(() => {
		if (isAuthenticated && mainContentRef.current) {
			mainContentRef.current.focus();
		}
	}, [isAuthenticated]);

	// Show loading state on server and during initial client check
	if (!isClient) {
		return (
			<div
				className='min-h-screen bg-background flex items-center justify-center p-4'
				role='status'
				aria-live='polite'
			>
				<p className='text-muted-foreground'>Verificando autenticação...</p>
			</div>
		);
	}

	// Show children only if authenticated
	if (!isAuthenticated) {
		return (
			<div
				className='min-h-screen bg-background flex items-center justify-center p-4'
				role='status'
				aria-live='polite'
			>
				<p className='text-muted-foreground'>Redirecionando para login...</p>
			</div>
		);
	}

	return (
		<div ref={mainContentRef} tabIndex={-1} className='focus:outline-none'>
			{children}
		</div>
	);
}
