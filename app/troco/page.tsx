'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calculator } from 'lucide-react';
import { motion } from 'motion';
import Link from 'next/link';
import { useState } from 'react';

// Brazilian currency denominations (in cents to avoid floating point issues)
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
	{ value: 1, label: 'R$ 0,01', type: 'coin' },
];

export default function ChangeCalculator() {
	const [total, setTotal] = useState<string>('');
	const [payment, setPayment] = useState<string>('');
	const [change, setChange] = useState<number>(0);
	const [changeBreakdown, setChangeBreakdown] = useState<
		{ denomination: (typeof DENOMINATIONS)[0]; count: number }[]
	>([]);
	const [error, setError] = useState<string>('');
	const [hasCalculated, setHasCalculated] = useState<boolean>(false);

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

	// Calculate change and breakdown
	const calculateChange = () => {
		setError('');
		setHasCalculated(false);

		const totalCents = toCents(total);
		const paymentCents = toCents(payment);

		// Validate inputs
		if (totalCents <= 0) {
			setError('Valor total inválido');
			return;
		}

		if (paymentCents <= 0) {
			setError('Valor pago inválido');
			return;
		}

		// Calculate change
		const changeCents = paymentCents - totalCents;

		if (changeCents < 0) {
			setError('Valor pago insuficiente');
			return;
		}

		setChange(changeCents);

		// Calculate breakdown
		if (changeCents > 0) {
			const breakdown = [];
			let remaining = changeCents;

			for (const denomination of DENOMINATIONS) {
				const count = Math.floor(remaining / denomination.value);
				if (count > 0) {
					breakdown.push({ denomination, count });
					remaining -= count * denomination.value;
				}
			}

			setChangeBreakdown(breakdown);
		} else {
			setChangeBreakdown([]);
		}

		setHasCalculated(true);
	};

	// Reset form
	const resetForm = () => {
		setTotal('');
		setPayment('');
		setChange(0);
		setChangeBreakdown([]);
		setError('');
		setHasCalculated(false);
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

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		calculateChange();
	};

	return (
		<div className='min-h-screen bg-background p-4'>
			<div className='max-w-md mx-auto space-y-6'>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Link href='/'>
						<Button variant='ghost' className='mb-4 pl-0'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Voltar
						</Button>
					</Link>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Calculator className='h-6 w-6 text-primary' />
								Calculadora de Troco
							</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Calcule o troco de forma rápida e precisa
							</p>
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
									/>
								</div>

								<div className='space-y-2'>
									<label htmlFor='payment' className='text-sm font-medium'>
										Valor Pago (R$)
									</label>
									<Input
										id='payment'
										type='text'
										inputMode='decimal'
										value={payment}
										onChange={handlePaymentChange}
										placeholder='R$ 0,00'
										className='text-lg'
									/>
								</div>

								{error && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className='text-sm text-destructive'
									>
										{error}
									</motion.div>
								)}

								<div className='flex gap-2 pt-2'>
									<Button type='submit' className='flex-1'>
										Calcular Troco
									</Button>
									<Button type='button' variant='outline' onClick={resetForm}>
										Limpar
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</motion.div>

				{hasCalculated && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card>
							<CardHeader>
								<CardTitle>Resultado</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-1'>
										<p className='text-sm text-muted-foreground'>Total</p>
										<p className='text-lg font-semibold'>
											{formatCurrency(toCents(total))}
										</p>
									</div>
									<div className='space-y-1'>
										<p className='text-sm text-muted-foreground'>Pago</p>
										<p className='text-lg font-semibold'>
											{formatCurrency(toCents(payment))}
										</p>
									</div>
								</div>

								<div className='border-t pt-4'>
									<div className='flex justify-between items-center'>
										<p className='font-medium'>Troco</p>
										<p className='text-2xl font-bold text-primary'>
											{formatCurrency(change)}
										</p>
									</div>

									{change > 0 ? (
										<div className='mt-4 space-y-2'>
											<p className='text-sm font-medium'>Entregar em:</p>
											<div className='space-y-2 max-h-60 overflow-y-auto'>
												{changeBreakdown.map((item, index) => (
													<motion.div
														key={index}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{ delay: index * 0.05 }}
														className='flex items-center justify-between p-3 bg-card border rounded-lg'
													>
														<span className='font-medium'>
															{item.denomination.label}
														</span>
														<Badge variant='secondary' className='text-lg'>
															{item.count}
														</Badge>
													</motion.div>
												))}
											</div>
										</div>
									) : (
										<div className='mt-4 text-center py-4'>
											<p className='text-muted-foreground'>
												{change === 0
													? 'Valor exato! Não há troco.'
													: 'Não foi possível calcular o troco.'}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</div>
		</div>
	);
}
