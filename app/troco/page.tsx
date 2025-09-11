'use client';

import ProtectedRoute from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/db';
import { ArrowLeft, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Brazilian currency denominations (in cents to avoid floating point issues)
// Excluding R$0.01 as it's not in practical circulation
const DENOMINATIONS = [
	{ value: 10000, label: 'R$ 100,00', type: 'bill' },
	{ value: 5000, label: 'R$ 50,00', type: 'bill' },
	{ value: 2000, label: 'R$ 20,00', type: 'bill' },
	{ value: 1000, label: 'R$ 10,00', type: 'bill' },
	{ value: 500, label: 'R$ 5,00', type: 'bill' },
	{ value: 200, label: 'R$ 2,00', type: 'bill' },
	{ value: 100, label: 'R$ 1,00', type: 'coin' },
	{ value: 50, label: 'R$ 0,50', type: 'coin' },
	{ value: 25, label: 'R$ 0,25', type: 'coin' },
	{ value: 10, label: 'R$ 0,10', type: 'coin' },
	{ value: 5, label: 'R$ 0,05', type: 'coin' },
	// R$ 0,01 excluded as it's not in practical circulation
];

export default function ChangeCalculator() {
	const [total, setTotal] = useState<string>('');
	const [payment, setPayment] = useState<string>('');
	const [customerContribution, setCustomerContribution] = useState<string>('');
	const [showExactChange, setShowExactChange] = useState<boolean>(false);
	const [changeResult, setChangeResult] = useState<{
		exact: {
			cents: number;
			breakdown: { denomination: (typeof DENOMINATIONS)[0]; count: number }[];
		};
		suggested: {
			cents: number;
			breakdown: { denomination: (typeof DENOMINATIONS)[0]; count: number }[];
		};
		difference: number;
	} | null>(null);
	const [error, setError] = useState<string>('');
	const [hasCalculated, setHasCalculated] = useState<boolean>(false);
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	// Focus the main heading when the page loads for better screen reader experience
	useEffect(() => {
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}
	}, []);

	// Convert string values to cents (integers) to avoid floating point issues
	const toCents = (value: string): number => {
		if (!value) return 0;
		// Remove R$ symbol, spaces and replace comma with dot for parsing
		const cleanValue = value.replace(/[R$\s]/g, '').replace(',', '.');
		const parsed = parseFloat(cleanValue);
		return isNaN(parsed) ? 0 : Math.round(parsed * 100);
	};

	// Format cents back to currency string
	const formatCurrency = (cents: number): string => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(cents / 100);
	};

	// Round to nearest 5 cents
	const roundToNearest5Cents = (cents: number): number => {
		return Math.round(cents / 5) * 5;
	};

	// Calculate change breakdown using greedy algorithm
	const calculateBreakdown = (
		cents: number,
		denominations: typeof DENOMINATIONS
	): { denomination: (typeof DENOMINATIONS)[0]; count: number }[] => {
		const breakdown = [];
		let remaining = cents;

		for (const denomination of denominations) {
			const count = Math.floor(remaining / denomination.value);
			if (count > 0) {
				breakdown.push({ denomination, count });
				remaining -= count * denomination.value;
			}
		}

		return breakdown;
	};

	// Calculate change with both exact and suggested options
	const calculateChange = async () => {
		setError('');
		setHasCalculated(false);

		const totalCents = toCents(total);
		const paymentCents = toCents(payment);
		const contributionCents = toCents(customerContribution);

		// Validate inputs
		if (totalCents <= 0) {
			setError('Valor total inválido');
			return;
		}

		// Check if we have payment amount (traditional calculation)
		const hasPayment = paymentCents > 0;
		let exactChangeCents: number;
		let suggestedChangeCents: number;

		if (hasPayment) {
			// Traditional calculation with payment amount
			if (contributionCents > paymentCents) {
				setError('Valor ajudado não pode ser maior que o valor pago');
				return;
			}

			// Calculate exact change (payment - total - customer contribution)
			exactChangeCents = paymentCents - totalCents - contributionCents;

			if (exactChangeCents < 0) {
				setError('Valor pago insuficiente (considerando ajuda do cliente)');
				return;
			}

			// Calculate suggested change (rounded to nearest 5 cents)
			suggestedChangeCents = roundToNearest5Cents(exactChangeCents);
		} else {
			// Basic calculation without payment amount
			if (contributionCents > 0) {
				// If customer contributed, calculate change needed
				if (contributionCents < totalCents) {
					setError('Valor ajudado insuficiente para cobrir o total');
					return;
				}
				exactChangeCents = contributionCents - totalCents;
				suggestedChangeCents = roundToNearest5Cents(exactChangeCents);
			} else {
				// No contribution provided - cannot calculate change
				// This is a valid scenario where the operator needs to handle change manually
				exactChangeCents = 0;
				suggestedChangeCents = 0;
			}
		}

		// Check if difference is within tolerance (4 cents)
		const difference = Math.abs(exactChangeCents - suggestedChangeCents);
		const withinTolerance = difference <= 4;

		// Calculate breakdowns
		const exactBreakdown = calculateBreakdown(exactChangeCents, [
			...DENOMINATIONS,
			{ value: 1, label: 'R$ 0,01', type: 'coin' },
		]);
		const suggestedBreakdown = calculateBreakdown(
			suggestedChangeCents,
			DENOMINATIONS
		);

		setChangeResult({
			exact: {
				cents: exactChangeCents,
				breakdown: exactBreakdown,
			},
			suggested: {
				cents: suggestedChangeCents,
				breakdown: suggestedBreakdown,
			},
			difference: withinTolerance ? difference : 0,
		});

		// Save calculation to history
		try {
			await db.addCalculation({
				date: new Date(),
				total: totalCents,
				payment: hasPayment ? paymentCents : 0,
				customerContribution: contributionCents,
				change: suggestedChangeCents,
				breakdown: suggestedBreakdown,
			});
		} catch (error) {
			console.error('Erro ao salvar cálculo:', error);
		}

		setHasCalculated(true);
	};

	// Reset form
	const resetForm = () => {
		setTotal('');
		setPayment('');
		setCustomerContribution('');
		setChangeResult(null);
		setError('');
		setHasCalculated(false);
		setShowExactChange(false);
	};

	// Handle input formatting
	const formatInput = (value: string): string => {
		// Remove non-numeric characters except comma
		let cleanValue = value.replace(/[^\d,]/g, '');

		// Handle comma placement
		if (cleanValue.includes(',')) {
			const parts = cleanValue.split(',');
			if (parts[1] && parts[1].length > 2) {
				// Limit to 2 decimal places
				cleanValue = `${parts[0]},${parts[1].substring(0, 2)}`;
			}
		}

		// Add R$ prefix
		return cleanValue ? `R$ ${cleanValue}` : '';
	};

	// Handle total input change
	const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatInput(e.target.value);
		setTotal(formatted);
	};

	// Handle payment input change
	const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatInput(e.target.value);
		setPayment(formatted);
	};

	// Handle customer contribution input change
	const handleCustomerContributionChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const formatted = formatInput(e.target.value);
		setCustomerContribution(formatted);
	};

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		calculateChange();
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
									<Calculator
										className='h-6 w-6 text-primary'
										aria-hidden='true'
									/>
									Calculadora de Troco
								</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Calcule o troco de forma rápida e otimizada
								</p>
								<div className='mt-2 text-xs text-muted-foreground'>
									{toCents(payment) > 0 ? (
										<span className='inline-flex items-center gap-1'>
											<span className='w-2 h-2 bg-green-500 rounded-full'></span>
											Modo tradicional (com valor pago)
										</span>
									) : (
										<span className='inline-flex items-center gap-1'>
											<span className='w-2 h-2 bg-blue-500 rounded-full'></span>
											Modo básico (sem valor pago)
										</span>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<label htmlFor='total' className='text-sm font-medium'>
											Valor Total (R$)
										</label>
										<Input
											id='total'
											type='text'
											inputMode='decimal'
											value={total}
											onChange={handleTotalChange}
											placeholder='R$ 0,00'
											className='text-lg'
											aria-describedby='total-help'
										/>
										<p
											id='total-help'
											className='text-xs text-muted-foreground'
										>
											Digite o valor total da compra
										</p>
									</div>

									<div className='space-y-2'>
										<label htmlFor='payment' className='text-sm font-medium'>
											Valor Pago (R$) - Opcional
										</label>
										<Input
											id='payment'
											type='text'
											inputMode='decimal'
											value={payment}
											onChange={handlePaymentChange}
											placeholder='R$ 0,00'
											className='text-lg'
											aria-describedby='payment-help'
										/>
										<p
											id='payment-help'
											className='text-xs text-muted-foreground'
										>
											Use apenas se quiser incluir uma contribuição do cliente
											no cálculo
										</p>
									</div>

									<div className='space-y-2'>
										<label
											htmlFor='customerContribution'
											className='text-sm font-medium'
										>
											Valor Ajudado pelo Cliente (Opcional)
										</label>
										<Input
											id='customerContribution'
											type='text'
											inputMode='decimal'
											value={customerContribution}
											onChange={handleCustomerContributionChange}
											placeholder='R$ 0,00'
											className='text-lg'
											aria-describedby='contribution-help'
										/>
										<p
											id='contribution-help'
											className='text-xs text-muted-foreground'
										>
											{toCents(payment) > 0
												? 'Valor que o cliente ajudou com moedas/notas menores (opcional)'
												: 'Quanto o cliente ajudou para calcular o troco necessário (opcional)'}
										</p>
									</div>

									{error && (
										<div
											className='text-sm text-destructive animate-in fade-in duration-300'
											role='alert'
											aria-live='assertive'
										>
											{error}
										</div>
									)}

									<div className='flex gap-2 pt-2'>
										<Button
											type='submit'
											className='flex-1 focus:ring-2 focus:ring-primary focus:ring-offset-2'
										>
											Calcular Troco
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={resetForm}
											className='focus:ring-2 focus:ring-primary focus:ring-offset-2'
										>
											Limpar
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>

					{hasCalculated && changeResult && (
						<div className='animate-in fade-in slide-in-from-bottom-2 duration-300'>
							<Card>
								<CardHeader>
									<CardTitle>Resultado</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div
										className={`grid gap-4 ${
											toCents(payment) > 0 ? 'grid-cols-2' : 'grid-cols-1'
										}`}
									>
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>Total</p>
											<p className='text-lg font-semibold'>
												{formatCurrency(toCents(total))}
											</p>
										</div>
										{toCents(payment) > 0 && (
											<div className='space-y-1'>
												<p className='text-sm text-muted-foreground'>Pago</p>
												<p className='text-lg font-semibold'>
													{formatCurrency(toCents(payment))}
												</p>
											</div>
										)}
									</div>
									{toCents(customerContribution) > 0 && (
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>
												Cliente Ajudou
											</p>
											<p className='text-lg font-semibold text-green-600'>
												{formatCurrency(toCents(customerContribution))}
											</p>
										</div>
									)}

									<div className='border-t pt-4'>
										<div className='flex justify-between items-center mb-4'>
											<p className='font-medium'>Troco</p>
											<div className='flex items-center space-x-2'>
												<span className='text-sm'>Exato</span>
												<Switch
													checked={showExactChange}
													onCheckedChange={setShowExactChange}
													aria-label='Alternar entre troco exato e sugerido'
												/>
												<span className='text-sm'>Sugerido</span>
											</div>
										</div>

										{showExactChange ? (
											<>
												<p
													className='text-2xl font-bold text-primary text-center mb-4'
													aria-live='polite'
												>
													{formatCurrency(changeResult.exact.cents)}
												</p>
												{changeResult.difference > 0 && (
													<p className='text-sm text-muted-foreground text-center mb-4'>
														Diferença de{' '}
														{formatCurrency(changeResult.difference * 100)}
													</p>
												)}
											</>
										) : (
											<>
												<p
													className='text-2xl font-bold text-primary text-center mb-4'
													aria-live='polite'
												>
													{formatCurrency(changeResult.suggested.cents)}
												</p>
												{changeResult.difference > 0 && (
													<p className='text-sm text-muted-foreground text-center mb-4'>
														Arredondado de{' '}
														{formatCurrency(changeResult.exact.cents)}{' '}
														(tolerância de{' '}
														{formatCurrency(changeResult.difference * 100)})
													</p>
												)}
											</>
										)}

										{(showExactChange
											? changeResult.exact.cents
											: changeResult.suggested.cents) > 0 ? (
											<div className='mt-4 space-y-2'>
												<p className='text-sm font-medium'>
													{showExactChange ? 'Troco exato:' : 'Troco sugerido:'}
												</p>
												<div className='space-y-2 max-h-60 overflow-y-auto'>
													{(showExactChange
														? changeResult.exact.breakdown
														: changeResult.suggested.breakdown
													).map((item, index) => (
														<div
															key={index}
															className='flex items-center justify-between p-3 bg-card border rounded-lg animate-in fade-in slide-in-from-left-2 duration-300'
															style={{ animationDelay: `${index * 50}ms` }}
														>
															<span className='font-medium'>
																{item.denomination.label}
															</span>
															<Badge variant='secondary' className='text-lg'>
																{item.count}
															</Badge>
														</div>
													))}
												</div>
											</div>
										) : (
											<div className='mt-4 text-center py-4'>
												<p className='text-muted-foreground'>
													{(showExactChange
														? changeResult.exact.cents
														: changeResult.suggested.cents) === 0
														? toCents(payment) > 0
															? 'Valor exato! Não há troco.'
															: 'Cálculo registrado. Troco deve ser fornecido manualmente.'
														: 'Não foi possível calcular o troco.'}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</div>
		</ProtectedRoute>
	);
}
