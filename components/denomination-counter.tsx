'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getQuickCountOptions } from '@/lib/closing-calculator';
import { formatCurrency } from '@/lib/currency-utils';
import type { DenominationCount } from '@/types/closing';
import { Minus, Plus } from 'lucide-react';
import { useCallback, useMemo, useState, useTransition } from 'react';

interface DenominationCounterProps {
	item: DenominationCount;
	onCountChange: (newCount: number) => void;
	className?: string;
}

export function DenominationCounter({
	item,
	onCountChange,
	className,
}: DenominationCounterProps) {
	const [inputValue, setInputValue] = useState(item.count.toString());
	const [, startTransition] = useTransition();

	const handleInputChange = useCallback(
		(value: string) => {
			setInputValue(value);
			const numericValue = Number.parseInt(value) || 0;
			onCountChange(numericValue);
		},
		[onCountChange]
	);

	const handleIncrement = useCallback(
		(amount = 1) => {
			const newCount = Math.max(0, item.count + amount);
			onCountChange(newCount);
			setInputValue(newCount.toString());
		},
		[item.count, onCountChange]
	);

	const handleDecrement = useCallback(
		(amount = 1) => {
			const newCount = Math.max(0, item.count - amount);
			onCountChange(newCount);
			setInputValue(newCount.toString());
		},
		[item.count, onCountChange]
	);

	const handleReset = useCallback(() => {
		onCountChange(0);
		setInputValue('0');
	}, [onCountChange]);

	const quickOptions = useMemo(
		() => getQuickCountOptions(item.denomination.value),
		[item.denomination.value]
	);
	const totalValue = useMemo(
		() => item.denomination.value * item.count,
		[item.denomination.value, item.count]
	);

	return (
		<Card
			className={`border-2 hover:border-accent/50 transition-colors ${className}`}
		>
			<CardContent className='p-3'>
				<div className='flex items-center justify-between mb-3'>
					<div className='flex items-center gap-2'>
						<div
							className={`w-12 h-8 rounded-md flex items-center justify-center text-xs font-bold border-2 ${
								item.denomination.type === 'note'
									? 'bg-accent text-accent-foreground border-accent'
									: 'bg-secondary text-secondary-foreground border-secondary'
							}`}
							aria-label={item.denomination.type === 'note' ? 'Nota' : 'Moeda'}
						>
							{item.denomination.type === 'note' ? 'R$' : '¢'}
						</div>
						<div className='flex-1'>
							<div
								className='text-base font-bold text-foreground leading-tight'
								aria-label={`Denominação: ${item.denomination.label}`}
							>
								{item.denomination.label}
							</div>
							{totalValue > 0 && (
								<div
									className='text-xs text-accent font-semibold'
									aria-label={`Valor total: ${formatCurrency(totalValue)}`}
								>
									{formatCurrency(totalValue)}
								</div>
							)}
						</div>
					</div>
					{item.count > 0 && (
						<Badge
							variant='default'
							className='text-base font-bold px-2 py-1 bg-accent text-accent-foreground'
							aria-label={`Quantidade: ${item.count}`}
						>
							{item.count}
						</Badge>
					)}
				</div>

				<div className='flex items-center gap-2 mb-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => startTransition(() => handleDecrement())}
						disabled={item.count === 0}
						className='touch-target h-10 w-10 p-0 border-2'
						aria-label={`Diminuir ${item.denomination.label}`}
					>
						<Minus className='h-4 w-4' />
					</Button>

					<Input
						type='text'
						inputMode='numeric'
						value={inputValue}
						onChange={(e) =>
							startTransition(() => handleInputChange(e.target.value))
						}
						className='text-center text-base font-bold h-10 flex-1 border-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]'
						min='0'
						aria-label={`Quantidade de ${item.denomination.label}`}
					/>

					<Button
						variant='outline'
						size='sm'
						onClick={() => startTransition(() => handleIncrement())}
						className='touch-target h-10 w-10 p-0 border-2'
						aria-label={`Aumentar ${item.denomination.label}`}
					>
						<Plus className='h-4 w-4' />
					</Button>
				</div>

				<div className='flex flex-wrap gap-1 justify-center'>
					{quickOptions.map((option) => (
						<Button
							key={option}
							variant='ghost'
							size='sm'
							onClick={() => startTransition(() => handleIncrement(option))}
							className='text-xs h-7 px-2 hover:bg-accent/20'
							aria-label={`Adicionar ${option} ${item.denomination.label}`}
						>
							+{option}
						</Button>
					))}
					{item.count > 0 && (
						<Button
							variant='ghost'
							size='sm'
							onClick={() => startTransition(handleReset)}
							className='text-xs h-7 px-2 text-destructive hover:bg-destructive/10'
							aria-label={`Zerar ${item.denomination.label}`}
						>
							Zerar
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
