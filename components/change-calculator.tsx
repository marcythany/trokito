'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	calculateOptimalChange,
	getTotalPieces,
	separateNotesAndCoins,
} from '@/lib/change-utils';
import { formatCurrency } from '@/lib/currency-utils';
import type { ChangeResult } from '@/types/currency';
import { Calculator, Coins, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { CurrencyInput } from './currency-input';
import { DenominationDisplay } from './denomination-display';

// Valores rápidos pré-definidos
const QUICK_AMOUNTS = [1, 2, 5, 10, 20, 50] as const;

export function ChangeCalculator() {
	const [changeAmount, setChangeAmount] = useState(0);
	const [result, setResult] = useState<ChangeResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showExactChange, setShowExactChange] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Função otimizada para sugerir arredondamento considerando moedas brasileiras
	const suggestCoinsFromCustomer = useCallback((changeValue: number) => {
		const cents = Math.round(changeValue * 100) % 100;
		const suggestions: string[] = [];

		// Não sugerir se já for múltiplo de 5
		if (cents % 5 === 0) return suggestions;

		// Calcular o próximo múltiplo de 5
		const nextMultiple = Math.ceil(cents / 5) * 5;
		const difference = nextMultiple - cents;

		// Lógica de negociação para centavos
		if (difference <= 4) {
			suggestions.push(
				`Pergunte se podemos ficar devendo ${difference} centavo(s) - o troco será R$ ${
					(Math.floor(changeValue * 100) + nextMultiple) / 100
				}`
			);
			suggestions.push(
				`Ou peça ${difference} centavo(s) ao cliente para completar o troco`
			);
		} else {
			const amountToGive = Math.floor(cents / 5) * 5;
			suggestions.push(
				`Troco exato: ${cents} centavos. Daremos ${amountToGive} centavos (arredondado para múltiplo de 5)`
			);
		}

		// Sugestões contextuais
		if (cents >= 1 && cents <= 4) {
			suggestions.push('Cliente pode aceitar deixar os centavos como cortesia');
		} else if (cents >= 6 && cents <= 9) {
			suggestions.push(
				'Sugira ao cliente pagar com mais 1 ou 2 reais para facilitar o troco'
			);
		} else if (cents > 95) {
			suggestions.push(
				'Sugira pagar com nota inteira - o troco ficará mais simples'
			);
		}

		return suggestions;
	}, []);

	// Handler de cálculo otimizado com useTransition
	const handleCalculate = useCallback(() => {
		setError(null);
		setResult(null);

		if (changeAmount <= 0) {
			setError('Digite o valor do troco');
			return;
		}

		// Validação adicional
		if (changeAmount > 10000) {
			setError('Valor muito alto. Verifique se o valor está correto.');
			return;
		}

		startTransition(() => {
			try {
				const changeResult = calculateOptimalChange(0, changeAmount);

				if (!changeResult || typeof changeResult.totalChange !== 'number') {
					throw new Error('Erro inesperado no cálculo');
				}

				setResult(changeResult);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Erro ao calcular troco');
			}
		});
	}, [changeAmount]);

	// Handler de reset otimizado
	const handleReset = useCallback(() => {
		setChangeAmount(0);
		setResult(null);
		setError(null);
		setShowExactChange(false);
	}, []);

	// Handler para valores rápidos
	const handleQuickAmount = useCallback((amount: number) => {
		setChangeAmount(amount);
		setResult(null);
		setError(null);
	}, []);

	// Memoizar sugestões de moedas
	const coinSuggestions = useMemo(
		() => (changeAmount > 0 ? suggestCoinsFromCustomer(changeAmount) : []),
		[changeAmount, suggestCoinsFromCustomer]
	);

	// Memoizar a separação de notas e moedas
	const { notes, coins } = useMemo(
		() =>
			result
				? separateNotesAndCoins(result.denominations)
				: { notes: [], coins: [] },
		[result]
	);

	return (
		<div className='space-y-6'>
			<Card className='border-2 border-border'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold text-foreground flex items-center gap-2'>
						<Calculator className='h-6 w-6' />
						Calcular Troco
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<CurrencyInput
						label='Valor do Troco (do PDV)'
						value={changeAmount}
						onChange={setChangeAmount}
						placeholder='Digite o valor do troco'
						aria-label='Valor do troco'
					/>

					<div className='space-y-2'>
						<label className='text-sm font-medium text-foreground/80'>
							Valores Rápidos:
						</label>
						<div className='flex flex-wrap gap-2'>
							{QUICK_AMOUNTS.map((amount) => (
								<Button
									key={amount}
									variant='outline'
									size='sm'
									onClick={() => handleQuickAmount(amount)}
									className='touch-target min-w-[60px]'
									aria-label={`Definir troco para R$ ${amount}`}
								>
									R$ {amount}
								</Button>
							))}
						</div>
					</div>

					<div className='flex gap-3'>
						<Button
							onClick={handleCalculate}
							disabled={isPending}
							className='flex-1 h-14 text-lg font-semibold touch-target'
							aria-label='Calcular troco'
						>
							{isPending ? 'Calculando...' : 'Calcular Troco'}
						</Button>
						<Button
							variant='outline'
							onClick={handleReset}
							className='h-14 px-4 touch-target bg-transparent'
							aria-label='Reiniciar calculadora'
						>
							<RotateCcw className='h-5 w-5' />
						</Button>
					</div>
				</CardContent>
			</Card>

			{changeAmount > 0 && coinSuggestions.length > 0 && (
				<Card className='border-2 border-blue-200 bg-blue-50'>
					<CardHeader>
						<CardTitle className='text-lg font-semibold text-blue-800 flex items-center gap-2'>
							<Coins className='h-5 w-5' />
							Negociação com Cliente
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							<p className='text-sm text-blue-700'>
								💡 <strong>Dica:</strong> Alguns clientes aceitam deixar
								centavos como cortesia!
							</p>
							{coinSuggestions.map((suggestion, index) => (
								<Alert key={index} className='bg-white border-blue-300'>
									<AlertDescription className='text-base text-blue-800'>
										{suggestion}
									</AlertDescription>
								</Alert>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{error && (
				<Alert variant='destructive' className='my-4'>
					<AlertDescription className='text-lg' role='alert'>
						{error}
					</AlertDescription>
				</Alert>
			)}

			{result && (
				<div className='space-y-4'>
					<Card className='border-2 border-accent'>
						<CardContent className='p-6'>
							<div className='text-center space-y-4'>
								<h2 className='text-2xl font-bold text-foreground'>
									Troco a Dar
								</h2>
								<div
									className='text-6xl font-bold text-accent'
									aria-live='polite'
								>
									{formatCurrency(result.totalChange)}
								</div>

								<div className='flex flex-wrap justify-center gap-2'>
									<Badge variant='secondary' className='text-sm'>
										{getTotalPieces(result.denominations)} peça(s)
									</Badge>
									{!result.isOptimal && (
										<Badge variant='outline' className='text-sm'>
											Arredondado
										</Badge>
									)}
								</div>

								{result.exactChange !== result.totalChange && (
									<Button
										variant='ghost'
										size='sm'
										onClick={() => setShowExactChange(!showExactChange)}
										className='text-sm'
										aria-expanded={showExactChange}
									>
										{showExactChange ? (
											<EyeOff className='h-4 w-4 mr-1' />
										) : (
											<Eye className='h-4 w-4 mr-1' />
										)}
										{showExactChange ? 'Ocultar' : 'Ver'} troco exato
									</Button>
								)}

								{showExactChange &&
									result.exactChange !== result.totalChange && (
										<div className='text-sm text-foreground/70 border-t pt-3'>
											<p>Troco exato: {formatCurrency(result.exactChange)}</p>
											{result.message && (
												<p className='mt-1'>{result.message}</p>
											)}
										</div>
									)}
							</div>
						</CardContent>
					</Card>

					{result.denominations.length > 0 && (
						<>
							{notes.length > 0 && (
								<DenominationDisplay denominations={notes} title='Notas' />
							)}
							{coins.length > 0 && (
								<DenominationDisplay denominations={coins} title='Moedas' />
							)}
						</>
					)}

					{result.message && (
						<Alert>
							<AlertDescription className='text-base'>
								{result.message}
							</AlertDescription>
						</Alert>
					)}
				</div>
			)}
		</div>
	);
}
