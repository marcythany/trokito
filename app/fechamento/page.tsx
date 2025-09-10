'use client';

import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { db, type Closing } from '@/lib/db';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Brazilian currency denominations for closing
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
];

export default function ClosingCalculator() {
	const [counts, setCounts] = useState<Record<string, number>>(
		DENOMINATIONS.reduce((acc, denom) => {
			acc[denom.value.toString()] = 0;
			return acc;
		}, {} as Record<string, number>)
	);
	const [operatorName, setOperatorName] = useState<string>('');
	const [notes, setNotes] = useState<string>('');
	const [total, setTotal] = useState<number>(0);
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	// Focus the main heading when the page loads for better screen reader experience
	useEffect(() => {
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}
	}, []);

	// Format cents back to currency string
	const formatCurrency = (cents: number): string => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(cents / 100);
	};

	// Handle count change for a denomination
	const handleCountChange = (value: number, denomination: number) => {
		const newCounts = { ...counts, [denomination.toString()]: value };
		setCounts(newCounts);

		// Calculate total
		const newTotal = DENOMINATIONS.reduce((sum, denom) => {
			return sum + (newCounts[denom.value.toString()] || 0) * denom.value;
		}, 0);

		setTotal(newTotal);
	};

	// Increment count for a denomination
	const incrementCount = (denomination: number) => {
		const currentCount = counts[denomination.toString()] || 0;
		handleCountChange(currentCount + 1, denomination);
	};

	// Decrement count for a denomination
	const decrementCount = (denomination: number) => {
		const currentCount = counts[denomination.toString()] || 0;
		if (currentCount > 0) {
			handleCountChange(currentCount - 1, denomination);
		}
	};

	// Reset form
	const resetForm = () => {
		setCounts(
			DENOMINATIONS.reduce((acc, denom) => {
				acc[denom.value.toString()] = 0;
				return acc;
			}, {} as Record<string, number>)
		);
		setOperatorName('');
		setNotes('');
		setTotal(0);
	};

	// Save closing to IndexedDB
	const saveClosing = async () => {
		try {
			const closingData: Omit<Closing, 'id'> = {
				date: new Date(),
				operatorName,
				notes,
				denominations: DENOMINATIONS.map((denom) => ({
					value: denom.value,
					count: counts[denom.value.toString()] || 0,
				})),
				total,
			};

			await db.addClosing(closingData);
			alert('Fechamento salvo com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar fechamento:', error);
			alert('Erro ao salvar fechamento. Por favor, tente novamente.');
		}
	};

	// Export to CSV
	const exportToCSV = async () => {
		try {
			const csv = await db.exportToCSV();
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute(
				'download',
				`fechamento_${new Date().toISOString().split('T')[0]}.csv`
			);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Erro ao exportar CSV:', error);
			alert('Erro ao exportar CSV. Por favor, tente novamente.');
		}
	};

	// Copy to clipboard
	const copyToClipboard = async () => {
		try {
			const closingData = {
				date: new Date().toLocaleDateString('pt-BR'),
				operator: operatorName || 'Não informado',
				total: formatCurrency(total),
				notes: notes || 'Nenhuma',
				denominations: DENOMINATIONS.map((denom) => ({
					label: denom.label,
					count: counts[denom.value.toString()] || 0,
					total: formatCurrency(
						(counts[denom.value.toString()] || 0) * denom.value
					),
				})),
			};

			let text = `Fechamento de Caixa
Data: ${closingData.date}
Operador: ${closingData.operator}
Total: ${closingData.total}
Observações: ${closingData.notes}

Detalhamento:
`;

			closingData.denominations.forEach((denom) => {
				if (denom.count > 0) {
					text += `${denom.label}: ${denom.count} unidades = ${denom.total}
`;
				}
			});

			await navigator.clipboard.writeText(text);
			alert('Dados copiados para a área de transferência!');
		} catch (error) {
			console.error('Erro ao copiar para área de transferência:', error);
			alert(
				'Erro ao copiar para área de transferência. Por favor, tente novamente.'
			);
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
									<FileText
										className='h-6 w-6 text-primary'
										aria-hidden='true'
									/>
									Fechamento do Caixa
								</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Contagem de notas e moedas
								</p>
							</CardHeader>
							<CardContent className='space-y-6'>
								<div className='space-y-2'>
									<label htmlFor='operator' className='text-sm font-medium'>
										Nome do Operador (Opcional)
									</label>
									<Input
										id='operator'
										type='text'
										value={operatorName}
										onChange={(e) => setOperatorName(e.target.value)}
										placeholder='Seu nome'
										className='text-lg'
										aria-describedby='operator-help'
									/>
									<p
										id='operator-help'
										className='text-xs text-muted-foreground'
									>
										Digite seu nome para identificar o fechamento
									</p>
								</div>

								<div className='space-y-4'>
									<h3 className='font-medium' id='denominations-heading'>
										Contagem de Denominações
									</h3>
									<div
										className='space-y-3'
										aria-labelledby='denominations-heading'
									>
										{DENOMINATIONS.map((denom) => (
											<div
												key={denom.value}
												className='flex items-center justify-between p-3 bg-card border rounded-lg'
												role='group'
												aria-label={`Contagem de ${denom.label}`}
											>
												<span className='font-medium'>{denom.label}</span>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														size='sm'
														onClick={() => decrementCount(denom.value)}
														className='h-8 w-8 p-0 focus:ring-2 focus:ring-primary focus:ring-offset-2'
														aria-label={`Diminuir contagem de ${denom.label}`}
													>
														-
													</Button>
													<Input
														type='number'
														min='0'
														value={counts[denom.value.toString()] || 0}
														onChange={(e) =>
															handleCountChange(
																parseInt(e.target.value) || 0,
																denom.value
															)
														}
														className='w-16 text-center'
														aria-label={`Contagem de ${denom.label}`}
													/>
													<Button
														variant='outline'
														size='sm'
														onClick={() => incrementCount(denom.value)}
														className='h-8 w-8 p-0 focus:ring-2 focus:ring-primary focus:ring-offset-2'
														aria-label={`Aumentar contagem de ${denom.label}`}
													>
														+
													</Button>
													<span className='w-20 text-right font-medium'>
														{formatCurrency(
															(counts[denom.value.toString()] || 0) *
																denom.value
														)}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className='border-t pt-4'>
									<div className='flex justify-between items-center mb-4'>
										<span className='font-medium'>Total Geral</span>
										<span
											className='text-2xl font-bold text-primary'
											aria-live='polite'
											aria-label={`Total geral: ${formatCurrency(total)}`}
										>
											{formatCurrency(total)}
										</span>
									</div>

									<div className='space-y-2'>
										<label htmlFor='notes' className='text-sm font-medium'>
											Observações (Opcional)
										</label>
										<Input
											id='notes'
											type='text'
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder='Observações sobre o fechamento'
											aria-describedby='notes-help'
										/>
										<p
											id='notes-help'
											className='text-xs text-muted-foreground'
										>
											Adicione observações relevantes sobre este fechamento
										</p>
									</div>
								</div>

								<div className='flex flex-wrap gap-2 pt-4'>
									<Button
										onClick={saveClosing}
										className='flex-1 min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2'
									>
										Salvar
									</Button>
									<Button
										onClick={exportToCSV}
										variant='outline'
										className='flex-1 min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2'
									>
										Exportar CSV
									</Button>
									<Button
										onClick={copyToClipboard}
										variant='outline'
										className='flex-1 min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2'
									>
										Copiar
									</Button>
									<Button
										onClick={resetForm}
										variant='outline'
										className='flex-1 min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2'
									>
										Limpar
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
