'use client';

import ProtectedRoute from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, type Calculation, type Closing } from '@/lib/db';
import { ArrowLeft, Calculator, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export default function HistoryPage() {
	const [closings, setClosings] = useState<Closing[]>([]);
	const [calculations, setCalculations] = useState<Calculation[]>([]);
	const [loading, setLoading] = useState(true);
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}
		loadHistory();
	}, []);

	const loadHistory = async () => {
		try {
			const [closingsData, calculationsData] = await Promise.all([
				db.getAllClosings(),
				db.getAllCalculations(),
			]);
			setClosings(
				closingsData.sort((a, b) => b.date.getTime() - a.date.getTime())
			);
			setCalculations(
				calculationsData.sort((a, b) => b.date.getTime() - a.date.getTime())
			);
		} catch (error) {
			console.error('Erro ao carregar histórico:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (cents: number): string => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(cents / 100);
	};

	const formatDate = (date: Date): string => {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	const deleteClosing = async (id: number) => {
		if (confirm('Tem certeza que deseja excluir este fechamento?')) {
			try {
				await db.deleteClosing(id);
				setClosings(closings.filter((c) => c.id !== id));
			} catch (error) {
				console.error('Erro ao excluir fechamento:', error);
				alert('Erro ao excluir fechamento.');
			}
		}
	};

	const deleteCalculation = async (id: number) => {
		if (confirm('Tem certeza que deseja excluir este cálculo?')) {
			try {
				await db.deleteCalculation(id);
				setCalculations(calculations.filter((c) => c.id !== id));
			} catch (error) {
				console.error('Erro ao excluir cálculo:', error);
				alert('Erro ao excluir cálculo.');
			}
		}
	};

	if (loading) {
		return (
			<ProtectedRoute>
				<div className='min-h-screen bg-background p-4'>
					<div className='max-w-4xl mx-auto space-y-6'>
						<div className='text-center py-12'>
							<p className='text-muted-foreground'>Carregando histórico...</p>
						</div>
					</div>
				</div>
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute>
			<div className='min-h-screen bg-background p-4'>
				<div className='max-w-4xl mx-auto space-y-6'>
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
									<Calculator
										className='h-6 w-6 text-primary'
										aria-hidden='true'
									/>
									Histórico de Operações
								</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Visualize seus cálculos e fechamentos anteriores
								</p>
							</CardHeader>
							<CardContent>
								<Tabs defaultValue='calculations' className='w-full'>
									<TabsList className='grid w-full grid-cols-2'>
										<TabsTrigger
											value='calculations'
											className='flex items-center gap-2'
										>
											<Calculator className='h-4 w-4' />
											Cálculos ({calculations.length})
										</TabsTrigger>
										<TabsTrigger
											value='closings'
											className='flex items-center gap-2'
										>
											<FileText className='h-4 w-4' />
											Fechamentos ({closings.length})
										</TabsTrigger>
									</TabsList>

									<TabsContent value='calculations' className='space-y-4 mt-6'>
										{calculations.length === 0 ? (
											<div className='text-center py-8'>
												<Calculator className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
												<p className='text-muted-foreground'>
													Nenhum cálculo encontrado
												</p>
												<p className='text-sm text-muted-foreground mt-2'>
													Seus cálculos aparecerão aqui após o primeiro uso
												</p>
											</div>
										) : (
											<div className='space-y-4 max-h-96 overflow-y-auto'>
												{calculations.map((calc, index) => (
													<Card
														key={calc.id}
														className='animate-in fade-in slide-in-from-left-2 duration-300'
														style={{ animationDelay: `${index * 50}ms` }}
													>
														<CardContent className='p-4'>
															<div className='flex justify-between items-start mb-3'>
																<div className='space-y-1'>
																	<p className='text-sm text-muted-foreground'>
																		{formatDate(calc.date)}
																	</p>
																	<div className='flex gap-4 text-sm'>
																		<span>
																			Total: {formatCurrency(calc.total)}
																		</span>
																		<span>
																			Pago: {formatCurrency(calc.payment)}
																		</span>
																	</div>
																</div>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() =>
																		calc.id && deleteCalculation(calc.id)
																	}
																	className='text-destructive hover:text-destructive'
																	aria-label='Excluir cálculo'
																>
																	<Trash2 className='h-4 w-4' />
																</Button>
															</div>
															<div className='flex justify-between items-center'>
																<div className='space-y-1'>
																	<p className='font-medium'>
																		Troco: {formatCurrency(calc.change)}
																	</p>
																	<div className='flex flex-wrap gap-1'>
																		{calc.breakdown
																			.slice(0, 3)
																			.map((item, idx) => (
																				<Badge
																					key={idx}
																					variant='secondary'
																					className='text-xs'
																				>
																					{item.denomination.label}:{' '}
																					{item.count}
																				</Badge>
																			))}
																		{calc.breakdown.length > 3 && (
																			<Badge
																				variant='outline'
																				className='text-xs'
																			>
																				+{calc.breakdown.length - 3} mais
																			</Badge>
																		)}
																	</div>
																</div>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</TabsContent>

									<TabsContent value='closings' className='space-y-4 mt-6'>
										{closings.length === 0 ? (
											<div className='text-center py-8'>
												<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
												<p className='text-muted-foreground'>
													Nenhum fechamento encontrado
												</p>
												<p className='text-sm text-muted-foreground mt-2'>
													Seus fechamentos aparecerão aqui após o primeiro uso
												</p>
											</div>
										) : (
											<div className='space-y-4 max-h-96 overflow-y-auto'>
												{closings.map((closing, index) => (
													<Card
														key={closing.id}
														className='animate-in fade-in slide-in-from-left-2 duration-300'
														style={{ animationDelay: `${index * 50}ms` }}
													>
														<CardContent className='p-4'>
															<div className='flex justify-between items-start mb-3'>
																<div className='space-y-1'>
																	<p className='text-sm text-muted-foreground'>
																		{formatDate(closing.date)}
																	</p>
																	<p className='font-medium'>
																		Operador:{' '}
																		{closing.operatorName || 'Não informado'}
																	</p>
																	<p className='text-sm text-muted-foreground'>
																		Total: {formatCurrency(closing.total)}
																	</p>
																</div>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() =>
																		closing.id && deleteClosing(closing.id)
																	}
																	className='text-destructive hover:text-destructive'
																	aria-label='Excluir fechamento'
																>
																	<Trash2 className='h-4 w-4' />
																</Button>
															</div>
															{closing.notes && (
																<p className='text-sm text-muted-foreground'>
																	Observações: {closing.notes}
																</p>
															)}
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</TabsContent>
								</Tabs>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
