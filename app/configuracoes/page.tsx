'use client';

import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface Settings {
	theme: 'light' | 'dark' | 'system';
	fontSize: 'small' | 'medium' | 'large';
	reducedMotion: boolean;
	highContrast: boolean;
	autoSave: boolean;
}

const SETTINGS_KEY = 'trokito-settings';

export default function SettingsPage() {
	const [settings, setSettings] = useState<Settings>({
		theme: 'system',
		fontSize: 'medium',
		reducedMotion: false,
		highContrast: false,
		autoSave: true,
	});
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}
		loadSettings();
	}, []);

	const loadSettings = () => {
		try {
			const saved = localStorage.getItem(SETTINGS_KEY);
			if (saved) {
				const parsedSettings = JSON.parse(saved);
				setSettings({ ...settings, ...parsedSettings });
				applySettings(parsedSettings);
			}
		} catch (error) {
			console.error('Erro ao carregar configurações:', error);
		}
	};

	const saveSettings = (newSettings: Partial<Settings>) => {
		try {
			const updatedSettings = { ...settings, ...newSettings };
			setSettings(updatedSettings);
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
			applySettings(updatedSettings);
		} catch (error) {
			console.error('Erro ao salvar configurações:', error);
		}
	};

	const applySettings = (settings: Settings) => {
		// Apply theme
		const root = document.documentElement;
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches;

		if (
			settings.theme === 'dark' ||
			(settings.theme === 'system' && prefersDark)
		) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		// Apply font size
		root.classList.remove('text-small', 'text-medium', 'text-large');
		root.classList.add(`text-${settings.fontSize}`);

		// Apply reduced motion
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		if (settings.reducedMotion || prefersReducedMotion) {
			root.style.setProperty('--motion-duration', '0s');
			root.classList.add('motion-reduce');
		} else {
			root.style.removeProperty('--motion-duration');
			root.classList.remove('motion-reduce');
		}

		// Apply high contrast
		if (settings.highContrast) {
			root.classList.add('high-contrast');
		} else {
			root.classList.remove('high-contrast');
		}
	};

	const resetSettings = () => {
		if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
			const defaultSettings: Settings = {
				theme: 'system',
				fontSize: 'medium',
				reducedMotion: false,
				highContrast: false,
				autoSave: true,
			};
			setSettings(defaultSettings);
			localStorage.removeItem(SETTINGS_KEY);
			applySettings(defaultSettings);
		}
	};

	return (
		<ProtectedRoute>
			<div className='min-h-screen bg-background p-4'>
				<div className='max-w-md mx-auto space-y-6'>
					<div className='animate-in fade-in slide-in-from-top-2 duration-300'>
						<Link href='/'>
							<Button
								variant='ghost'
								className='mb-4 pl-0 focus:ring-2 focus:ring-primary focus:ring-offset-2'
								aria-label='Voltar para a página inicial'
							>
								<ArrowLeft className='mr-2 h-4 w-4' aria-hidden='true' />
								Voltar
							</Button>
						</Link>

						<Card>
							<CardHeader>
								<CardTitle
									ref={mainHeadingRef}
									tabIndex={-1}
									className='flex items-center gap-2 focus:outline-none'
								>
									<Settings
										className='h-6 w-6 text-primary'
										aria-hidden='true'
									/>
									Configurações
								</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Personalize sua experiência no Trokito
								</p>
							</CardHeader>
							<CardContent className='space-y-6'>
								<div className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='theme'>Tema</Label>
										<Select
											value={settings.theme}
											onValueChange={(value: Settings['theme']) =>
												saveSettings({ theme: value })
											}
										>
											<SelectTrigger id='theme'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='light'>Claro</SelectItem>
												<SelectItem value='dark'>Escuro</SelectItem>
												<SelectItem value='system'>Sistema</SelectItem>
											</SelectContent>
										</Select>
										<p className='text-xs text-muted-foreground'>
											Escolha o tema da interface
										</p>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='fontSize'>Tamanho da Fonte</Label>
										<Select
											value={settings.fontSize}
											onValueChange={(value: Settings['fontSize']) =>
												saveSettings({ fontSize: value })
											}
										>
											<SelectTrigger id='fontSize'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='small'>Pequeno</SelectItem>
												<SelectItem value='medium'>Médio</SelectItem>
												<SelectItem value='large'>Grande</SelectItem>
											</SelectContent>
										</Select>
										<p className='text-xs text-muted-foreground'>
											Ajuste o tamanho do texto para melhor legibilidade
										</p>
									</div>

									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label htmlFor='reducedMotion'>
												Movimentos Reduzidos
											</Label>
											<p className='text-xs text-muted-foreground'>
												Reduz animações para melhor acessibilidade
											</p>
										</div>
										<Switch
											id='reducedMotion'
											checked={settings.reducedMotion}
											onCheckedChange={(checked) =>
												saveSettings({ reducedMotion: checked })
											}
										/>
									</div>

									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label htmlFor='highContrast'>Alto Contraste</Label>
											<p className='text-xs text-muted-foreground'>
												Aumenta o contraste para melhor visibilidade
											</p>
										</div>
										<Switch
											id='highContrast'
											checked={settings.highContrast}
											onCheckedChange={(checked) =>
												saveSettings({ highContrast: checked })
											}
										/>
									</div>

									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label htmlFor='autoSave'>Salvamento Automático</Label>
											<p className='text-xs text-muted-foreground'>
												Salva automaticamente cálculos e fechamentos
											</p>
										</div>
										<Switch
											id='autoSave'
											checked={settings.autoSave}
											onCheckedChange={(checked) =>
												saveSettings({ autoSave: checked })
											}
										/>
									</div>
								</div>

								<div className='border-t pt-4'>
									<Button
										onClick={resetSettings}
										variant='outline'
										className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
									>
										Restaurar Padrões
									</Button>
								</div>

								<div className='text-center text-xs text-muted-foreground'>
									<p>Versão 1.0 - Configurações salvas localmente</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
