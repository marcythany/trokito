'use client';

import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import {
	Calculator,
	FileText,
	HelpCircle,
	History,
	Settings,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
	const [isInstalled, setIsInstalled] = useState(false);
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		const checkInstalled = () => {
			if (window.matchMedia('(display-mode: standalone)').matches) {
				setIsInstalled(true);
			}
		};

		checkInstalled();
		window.addEventListener('resize', checkInstalled);

		return () => window.removeEventListener('resize', checkInstalled);
	}, []);

	// Focus the main heading when the page loads for better screen reader experience
	useEffect(() => {
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}
	}, []);

	const menuItems = [
		{
			title: 'Calcular Troco',
			description: 'Calcule o troco de forma rápida e otimizada',
			icon: Calculator,
			href: '/troco',
			color: 'bg-primary',
		},
		{
			title: 'Fechamento',
			description: 'Faça a contagem do vale/caixa',
			icon: FileText,
			href: '/fechamento',
			color: 'bg-primary',
		},
		{
			title: 'Histórico',
			description: 'Veja o histórico de operações',
			icon: History,
			href: '/historico',
			color: 'bg-card',
		},
		{
			title: 'Configurações',
			description: 'Ajuste as configurações do app',
			icon: Settings,
			href: '/configuracoes',
			color: 'bg-card',
		},
		{
			title: 'Ajuda',
			description: 'Tutorial e dicas de uso',
			icon: HelpCircle,
			href: '/ajuda',
			color: 'bg-card',
		},
	];

	return (
		<ProtectedRoute>
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden'>
				{/* Background blur and grain effects - 2025 trend */}
				<div className='absolute inset-0 blur-bg grain-overlay' />

				{/* Animated background elements */}
				<div className='absolute inset-0 overflow-hidden'>
					<div className='absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse' />
					<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000' />
				</div>

				<div className='relative z-10 w-full max-w-6xl'>
					{/* Bento grid layout - 2025 trend */}
					<div className='bento-grid gap-6'>
						{/* Header section */}
						<div className='bento-item col-span-1 md:col-span-2 lg:col-span-3 text-center'>
							<h1
								ref={mainHeadingRef}
								tabIndex={-1}
								className='kinetic-text text-4xl md:text-6xl font-bold mb-4 focus:outline-none'
							>
								Trokito
							</h1>
							<p className='text-muted-foreground text-lg md:text-xl'>
								Calculadora de Troco Inteligente
							</p>
							{!isInstalled && (
								<div className='glassmorphism rounded-xl p-3 mt-4 inline-block'>
									<p className='text-sm text-foreground/80' role='status'>
										💡 Adicione à tela inicial para acesso rápido
									</p>
								</div>
							)}
						</div>

						{/* Menu items with glassmorphism - 2025 trend */}
						{menuItems.map((item, index) => {
							const Icon = item.icon;
							return (
								<div
									key={item.href}
									className={`bento-item glassmorphism neumorphism hover:transform hover:scale-105 transition-all duration-300 ${
										index === 0 ? 'col-span-1 md:col-span-2' : ''
									}`}
								>
									<Button
										variant='ghost'
										className='w-full h-full p-6 flex flex-col items-center gap-4 text-center touch-target focus-ring'
										onClick={() => (window.location.href = item.href)}
										aria-label={`${item.title}: ${item.description}`}
									>
										<div className='neumorphism rounded-xl p-4'>
											<Icon
												className='h-10 w-10 text-primary'
												aria-hidden='true'
											/>
										</div>
										<div className='flex-1'>
											<h3 className='text-xl font-semibold text-foreground mb-2'>
												{item.title}
											</h3>
											<p className='text-muted-foreground text-sm leading-relaxed'>
												{item.description}
											</p>
										</div>
									</Button>
								</div>
							);
						})}

						{/* Footer info card */}
						<div className='bento-item glassmorphism neumorphism col-span-1 md:col-span-2 lg:col-span-3'>
							<div className='text-center space-y-3'>
								<div className='w-12 h-12 mx-auto neumorphism rounded-full flex items-center justify-center'>
									<span className='text-2xl'>⚡</span>
								</div>
								<h3 className='font-semibold text-foreground'>
									Sobre o Trokito
								</h3>
								<div className='space-y-2 text-sm text-muted-foreground'>
									<p>Versão 1.0 - Funciona completamente offline</p>
									<p>
										Feito especialmente para operadores de caixa brasileiros
									</p>
									<p>Interface moderna com suporte a acessibilidade</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
