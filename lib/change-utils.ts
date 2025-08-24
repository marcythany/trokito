import type { ChangeResult, DenominationItem } from '@/types/currency';

// Denominações brasileiras em ordem decrescente de valor
export const DENOMINATIONS = [
	{ value: 200, type: 'note' as const, label: 'R$ 200' },
	{ value: 100, type: 'note' as const, label: 'R$ 100' },
	{ value: 50, type: 'note' as const, label: 'R$ 50' },
	{ value: 20, type: 'note' as const, label: 'R$ 20' },
	{ value: 10, type: 'note' as const, label: 'R$ 10' },
	{ value: 5, type: 'note' as const, label: 'R$ 5' },
	{ value: 2, type: 'note' as const, label: 'R$ 2' },
	{ value: 1, type: 'coin' as const, label: 'R$ 1' },
	{ value: 0.5, type: 'coin' as const, label: 'R$ 0,50' },
	{ value: 0.25, type: 'coin' as const, label: 'R$ 0,25' },
	{ value: 0.1, type: 'coin' as const, label: 'R$ 0,10' },
	{ value: 0.05, type: 'coin' as const, label: 'R$ 0,05' },
];

export function calculateOptimalChange(
	paidAmount: number,
	changeAmount: number
): ChangeResult {
	const exactChange = changeAmount;
	let remainingChange = Math.round(changeAmount * 100) / 100;
	const denominations: DenominationItem[] = [];
	let message = '';

	// Se o troco tem centavos menores que 5 centavos
	const cents = Math.round(remainingChange * 100) % 100;
	if (cents > 0 && cents < 5) {
		// Arredonda para baixo (remove os centavos)
		remainingChange = Math.floor(remainingChange);
		message = `Troco arredondado para baixo (removidos ${cents} centavo${
			cents > 1 ? 's' : ''
		})`;
	} else if (cents > 5 && cents % 5 !== 0) {
		// Arredonda para o múltiplo de 5 mais próximo
		const roundedCents = Math.round(cents / 5) * 5;
		remainingChange = Math.floor(remainingChange) + roundedCents / 100;
		message = `Troco arredondado para ${roundedCents} centavos`;
	}

	// Calcula as denominações necessárias
	for (const denomination of DENOMINATIONS) {
		if (remainingChange >= denomination.value) {
			const count = Math.floor(remainingChange / denomination.value);
			if (count > 0) {
				denominations.push({
					denomination,
					count,
					total: count * denomination.value,
				});
				remainingChange =
					Math.round((remainingChange - count * denomination.value) * 100) /
					100;
			}
		}
	}

	return {
		paidAmount,
		totalChange: changeAmount,
		exactChange,
		denominations,
		isOptimal: cents === 0 || cents % 5 === 0,
		message,
	};
}

// Função genérica que funciona para ambos os tipos
export function separateNotesAndCoins<
	T extends { denomination: { type: 'note' | 'coin' } }
>(
	items: T[]
): {
	notes: T[];
	coins: T[];
} {
	const notes = items.filter((item) => item.denomination.type === 'note');
	const coins = items.filter((item) => item.denomination.type === 'coin');
	return { notes, coins };
}

export function getTotalPieces(denominations: DenominationItem[]): number {
	return denominations.reduce((total, item) => total + item.count, 0);
}
