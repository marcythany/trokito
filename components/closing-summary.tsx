'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { centsToReals, formatCurrency } from '@/lib/currency-utils';
import type { ClosingSummary as ClosingSummaryType } from '@/types/closing';
import { Banknote, Calculator, Coins } from 'lucide-react';

interface ClosingSummaryProps {
	summary: ClosingSummaryType;
	className?: string;
}

export function ClosingSummary({ summary, className }: ClosingSummaryProps) {
	return (
		<Card className={`border-2 border-accent ${className}`}>
			<CardHeader>
				<CardTitle className='text-xl font-bold text-foreground flex items-center gap-2'>
					<Calculator className='h-5 w-5' />
					Resumo do Fechamento
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Total Geral */}
				<div className='text-center p-4 bg-card rounded-lg border border-border'>
					<div className='text-sm text-foreground/70 mb-1'>Total Geral</div>
					<div className='text-4xl font-bold text-accent'>
						{formatCurrency(summary.totalAmount)}
					</div>
					<div className='text-sm text-foreground/70 mt-1'>
						{summary.totalPieces} peça(s)
					</div>
				</div>

				{/* Subtotais */}
				<div className='grid grid-cols-2 gap-4'>
					<div className='text-center p-3 bg-card rounded-lg border border-border'>
						<div className='flex items-center justify-center gap-1 mb-2'>
							<Banknote className='h-4 w-4 text-primary' />
							<span className='text-sm font-medium text-foreground'>Notas</span>
						</div>
						<div className='text-2xl font-bold text-foreground'>
							{formatCurrency(summary.totalNotes)}
						</div>
					</div>

					<div className='text-center p-3 bg-card rounded-lg border border-border'>
						<div className='flex items-center justify-center gap-1 mb-2'>
							<Coins className='h-4 w-4 text-secondary-foreground' />
							<span className='text-sm font-medium text-foreground'>
								Moedas
							</span>
						</div>
						<div className='text-2xl font-bold text-foreground'>
							{formatCurrency(summary.totalCoins)}
						</div>
					</div>
				</div>

				{/* Detalhamento por denominação */}
				{summary.denominationCounts.length > 0 && (
					<>
						<Separator />
						<div className='space-y-2'>
							<h4 className='text-sm font-medium text-foreground/80'>
								Detalhamento:
							</h4>
							<div className='space-y-1'>
								{summary.denominationCounts.map((item, index) => {
									// Calcular o valor total desta denominação (em centavos, depois converter)
									const totalValueCents = item.denomination.value * item.count;
									const totalValueReals = centsToReals(totalValueCents);

									return (
										<div
											key={index}
											className='flex items-center justify-between text-sm'
										>
											<span className='text-foreground/70'>
												{item.count}x {item.denomination.label}
											</span>
											<span className='font-medium text-foreground'>
												{formatCurrency(totalValueReals)}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</>
				)}

				{/* Status */}
				<div className='flex justify-center'>
					{summary.totalAmount > 0 ? (
						<Badge
							variant='default'
							className='bg-primary text-primary-foreground'
						>
							Fechamento Calculado
						</Badge>
					) : (
						<Badge variant='outline'>Aguardando Contagem</Badge>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
