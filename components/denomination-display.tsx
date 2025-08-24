'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency-utils';
import type { DenominationItem } from '@/types/currency';

interface DenominationDisplayProps {
	denominations: DenominationItem[];
	title: string;
	className?: string;
}

export function DenominationDisplay({
	denominations,
	title,
	className,
}: DenominationDisplayProps) {
	if (denominations.length === 0) {
		return null;
	}

	const totalValue = denominations.reduce((sum, item) => sum + item.total, 0);

	return (
		<Card className={`border-2 border-border ${className}`}>
			<CardContent className='p-4 space-y-4'>
				<div className='flex items-center justify-between'>
					<h3 className='text-lg font-semibold text-foreground'>{title}</h3>
					<Badge variant='secondary' className='text-lg font-bold px-3 py-1'>
						{formatCurrency(totalValue)}
					</Badge>
				</div>

				<div className='grid grid-cols-1 gap-3'>
					{denominations.map((item, index) => (
						<div
							key={index}
							className='flex items-center justify-between p-3 bg-card rounded-lg border border-border'
						>
							<div className='flex items-center gap-3'>
								<div
									className={`w-12 h-8 rounded flex items-center justify-center text-sm font-bold ${
										item.denomination.type === 'note'
											? 'bg-primary text-primary-foreground'
											: 'bg-secondary text-secondary-foreground'
									}`}
								>
									{item.denomination.type === 'note' ? 'NOTA' : 'MOEDA'}
								</div>
								<span className='text-lg font-semibold text-foreground'>
									{item.denomination.label}
								</span>
							</div>

							<div className='flex items-center gap-2'>
								<span className='text-2xl font-bold text-accent'>
									{item.count}x
								</span>
								<span className='text-lg text-foreground/80'>
									= {formatCurrency(item.total)}
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
