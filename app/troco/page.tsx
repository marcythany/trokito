'use client';

import ProtectedRoute from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
	const [pdvChange, setPdvChange] = useState<string>('');
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

		const pdvChangeCents = toCents(pdvChange);
		const contributionCents = toCents(customerContribution);

		// Validate inputs
		if (pdvChangeCents <= 0) {
			setError('Valor do troco do PDV inválido');
			return;
		}

		// Validate customer contribution doesn't exceed PDV change
		if (contributionCents > pdvChangeCents) {
			setError('Valor ajudado não pode ser maior que o troco do PDV');
			return;
		}

		// Calculate actual change to give (PDV change - customer contribution)
		const exactChangeCents = pdvChangeCents - contributionCents;

		// Calculate suggested change (rounded to nearest 5 cents)
		const suggestedChangeCents = roundToNearest5Cents(exactChangeCents);

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
				total: 0, // Not used in PDV mode
				payment: pdvChangeCents, // Store PDV change as payment for compatibility
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
		setPdvChange('');
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

	// Handle PDV change input change
	const handlePdvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatInput(e.target.value);
		setPdvChange(formatted);
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
						<div className='bento-item col-span-1 md:col-span-2 lg:col-span-3'>
							<div className='flex items-center justify-between mb-4'>
								<Link href='/'>
									<Button
										variant='ghost'
										className='neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
										aria-label='Voltar para a página inicial'
									>
										<ArrowLeft className='mr-2 h-4 w-4' aria-hidden='true' />
										Voltar
									</Button>
								</Link>
							</div>

							<div className='text-center space-y-3'>
								<div className='w-16 h-16 mx-auto neumorphism rounded-full flex items-center justify-center'>
									<Calculator
										className='h-8 w-8 text-primary'
										aria-hidden='true'
									/>
								</div>
								<h1
									ref={mainHeadingRef}
									tabIndex={-1}
									className='kinetic-text text-3xl font-bold focus:outline-none'
								>
									Calculadora de Troco
								</h1>
								<p className='text-muted-foreground'>
									Calcule o troco considerando a contribuição do cliente
								</p>
								<div className='glassmorphism rounded-full px-4 py-2 inline-block'>
									<span className='inline-flex items-center gap-2 text-sm text-foreground/80'>
										<span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
										Integração PDV
									</span>
								</div>
							</div>
						</div>

						{/* Calculator form with glassmorphism - 2025 trend */}
						<div className='bento-item glassmorphism neumorphism'>
							<div className='space-y-6'>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<label
											htmlFor='pdvChange'
											className='text-sm font-medium text-foreground'
										>
											Valor do Troco do PDV (R$)
										</label>
										<Input
											id='pdvChange'
											type='text'
											inputMode='decimal'
											value={pdvChange}
											onChange={handlePdvChange}
											placeholder='R$ 0,00'
											className='text-lg neumorphism-inset focus-ring'
											aria-describedby='pdv-help'
										/>
										<p id='pdv-help' className='text-xs text-muted-foreground'>
											Valor do troco calculado pelo sistema PDV
										</p>
									</div>

									<div className='space-y-2'>
										<label
											htmlFor='customerContribution'
											className='text-sm font-medium text-foreground'
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
											className='text-lg neumorphism-inset focus-ring'
											aria-describedby='contribution-help'
										/>
										<p
											id='contribution-help'
											className='text-xs text-muted-foreground'
										>
											Valor que o cliente ajudou com moedas/notas menores
											(opcional)
										</p>
									</div>

									{error && (
										<div
											className='text-sm text-destructive animate-in fade-in duration-300 glassmorphism p-3 rounded-xl border border-destructive/20'
											role='alert'
											aria-live='assertive'
										>
											{error}
										</div>
									)}

									<div className='flex gap-3 pt-2'>
										<Button
											type='submit'
											className='flex-1 neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
										>
											Calcular Troco
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={resetForm}
											className='neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
										>
											Limpar
										</Button>
									</div>
								</form>
							</div>
						</div>

						{hasCalculated && changeResult && (
							<div className='bento-item glassmorphism neumorphism'>
								<div className='space-y-6'>
									<div className='text-center'>
										<h2 className='text-2xl font-semibold text-foreground'>
											Resultado
										</h2>
									</div>

									<div className='space-y-4'>
										<div className='space-y-2'>
											<p className='text-sm text-muted-foreground'>
												Troco do PDV
											</p>
											<p className='text-xl font-semibold text-primary'>
												{formatCurrency(toCents(pdvChange))}
											</p>
										</div>
										{toCents(customerContribution) > 0 && (
											<div className='space-y-2'>
												<p className='text-sm text-muted-foreground'>
													Cliente Ajudou
												</p>
												<p className='text-xl font-semibold text-green-600'>
													{formatCurrency(toCents(customerContribution))}
												</p>
											</div>
										)}

										<div className='glassmorphism p-4 rounded-xl'>
											<div className='flex justify-between items-center mb-4'>
												<p className='font-medium text-foreground'>Troco</p>
												<div className='flex items-center space-x-2'>
													<span className='text-sm text-muted-foreground'>
														Exato
													</span>
													<Switch
														checked={showExactChange}
														onCheckedChange={setShowExactChange}
														aria-label='Alternar entre troco exato e sugerido'
													/>
													<span className='text-sm text-muted-foreground'>
														Sugerido
													</span>
												</div>
											</div>

											{showExactChange ? (
												<>
													<p
														className='kinetic-text text-3xl font-bold text-center mb-4'
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
														className='kinetic-text text-3xl font-bold text-center mb-4'
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
												<div className='mt-4 space-y-3'>
													<p className='text-sm font-medium text-foreground'>
														{showExactChange
															? 'Troco exato:'
															: 'Troco sugerido:'}
													</p>
													<div className='space-y-2 max-h-60 overflow-y-auto'>
														{(showExactChange
															? changeResult.exact.breakdown
															: changeResult.suggested.breakdown
														).map((item, index) => (
															<div
																key={index}
																className='flex items-center justify-between p-3 glassmorphism rounded-lg animate-in fade-in slide-in-from-left-2 duration-300'
																style={{ animationDelay: `${index * 50}ms` }}
															>
																<span className='font-medium text-foreground'>
																	{item.denomination.label}
																</span>
																<Badge
																	variant='secondary'
																	className='text-lg neumorphism'
																>
																	{item.count}
																</Badge>
															</div>
														))}
													</div>
												</div>
											) : (
												<div className='mt-4 text-center py-4 glassmorphism rounded-xl'>
													<p className='text-muted-foreground'>
														{(showExactChange
															? changeResult.exact.cents
															: changeResult.suggested.cents) === 0
															? 'Valor exato! Não há troco.'
															: 'Não foi possível calcular o troco.'}
													</p>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
