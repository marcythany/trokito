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
import { db } from '@/lib/db';
import { ArrowLeft, Download, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useSettings, type Settings } from '@/lib/use-settings';

export default function SettingsPage() {
	const { settings, saveSettings, resetSettings } = useSettings();
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	const clearHistory = async () => {
		if (
			confirm(
				'Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.'
			)
		) {
			try {
				// Clear calculations
				const calculations = await db.getAllCalculations();
				for (const calc of calculations) {
					if (calc.id) {
						await db.deleteCalculation(calc.id);
					}
				}

				// Clear closings
				const closings = await db.getAllClosings();
				for (const closing of closings) {
					if (closing.id) {
						await db.deleteClosing(closing.id);
					}
				}

				alert('Histórico limpo com sucesso!');
			} catch (error) {
				console.error('Erro ao limpar histórico:', error);
				alert('Erro ao limpar histórico. Tente novamente.');
			}
		}
	};

	const exportHistory = async () => {
		try {
			const csv = await db.exportToCSV();
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute(
				'download',
				`historico_trokito_${new Date().toISOString().split('T')[0]}.csv`
			);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			alert('Histórico exportado com sucesso!');
		} catch (error) {
			console.error('Erro ao exportar histórico:', error);
			alert('Erro ao exportar histórico. Tente novamente.');
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
							<CardContent className='space-y-8'>
								{/* Interface Settings */}
								<div className='space-y-4'>
									<h3 className='text-lg font-medium border-b pb-2'>
										Interface
									</h3>

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

									<div className='space-y-2'>
										<Label htmlFor='language'>Idioma</Label>
										<Select
											value={settings.language}
											onValueChange={(value: Settings['language']) =>
												saveSettings({ language: value })
											}
										>
											<SelectTrigger id='language'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='pt-BR'>
													Português (Brasil)
												</SelectItem>
												<SelectItem value='en-US'>English (US)</SelectItem>
											</SelectContent>
										</Select>
										<p className='text-xs text-muted-foreground'>
											Idioma da interface do aplicativo
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
								</div>

								{/* PDV Settings */}
								<div className='space-y-4'>
									<h3 className='text-lg font-medium border-b pb-2'>
										Sistema PDV
									</h3>

									<div className='space-y-2'>
										<Label htmlFor='calculationMode'>
											Modo de Cálculo Padrão
										</Label>
										<Select
											value={settings.defaultCalculationMode}
											onValueChange={(
												value: Settings['defaultCalculationMode']
											) => saveSettings({ defaultCalculationMode: value })}
										>
											<SelectTrigger id='calculationMode'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='exact'>Troco Exato</SelectItem>
												<SelectItem value='suggested'>
													Troco Sugerido (Arredondado)
												</SelectItem>
											</SelectContent>
										</Select>
										<p className='text-xs text-muted-foreground'>
											Modo padrão para cálculo de troco
										</p>
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

								{/* History Settings */}
								<div className='space-y-4'>
									<h3 className='text-lg font-medium border-b pb-2'>
										Histórico
									</h3>

									<div className='space-y-2'>
										<Label htmlFor='maxHistory'>
											Máximo de Itens no Histórico
										</Label>
										<Select
											value={settings.maxHistoryItems.toString()}
											onValueChange={(value) =>
												saveSettings({ maxHistoryItems: parseInt(value) })
											}
										>
											<SelectTrigger id='maxHistory'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='50'>50 itens</SelectItem>
												<SelectItem value='100'>100 itens</SelectItem>
												<SelectItem value='200'>200 itens</SelectItem>
												<SelectItem value='500'>500 itens</SelectItem>
											</SelectContent>
										</Select>
										<p className='text-xs text-muted-foreground'>
											Número máximo de registros mantidos no histórico
										</p>
									</div>

									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label htmlFor='autoExport'>Exportação Automática</Label>
											<p className='text-xs text-muted-foreground'>
												Exporta automaticamente o histórico quando atingir o
												limite
											</p>
										</div>
										<Switch
											id='autoExport'
											checked={settings.autoExportHistory}
											onCheckedChange={(checked) =>
												saveSettings({ autoExportHistory: checked })
											}
										/>
									</div>
								</div>

								{/* History Management */}
								<div className='space-y-4'>
									<h3 className='text-lg font-medium border-b pb-2'>
										Gerenciamento de Dados
									</h3>

									<div className='grid gap-3 sm:grid-cols-2'>
										<Button
											onClick={exportHistory}
											variant='outline'
											className='flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2'
										>
											<Download className='h-4 w-4' />
											Exportar Histórico
										</Button>
										<Button
											onClick={clearHistory}
											variant='destructive'
											className='flex items-center gap-2 focus:ring-2 focus:ring-destructive focus:ring-offset-2'
										>
											<Trash2 className='h-4 w-4' />
											Limpar Histórico
										</Button>
									</div>

									<div className='border-t pt-4'>
										<Button
											onClick={resetSettings}
											variant='outline'
											className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
										>
											Restaurar Configurações Padrão
										</Button>
									</div>
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
