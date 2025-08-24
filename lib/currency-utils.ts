import type { Denomination } from '@/types/currency';

// Denominações brasileiras
export const BRAZILIAN_DENOMINATIONS: Denomination[] = [
	{ value: 200, type: 'note', label: 'R$ 200', active: true },
	{ value: 100, type: 'note', label: 'R$ 100', active: true },
	{ value: 50, type: 'note', label: 'R$ 50', active: true },
	{ value: 20, type: 'note', label: 'R$ 20', active: true },
	{ value: 10, type: 'note', label: 'R$ 10', active: true },
	{ value: 5, type: 'note', label: 'R$ 5', active: true },
	{ value: 2, type: 'note', label: 'R$ 2', active: true },
	{ value: 1, type: 'coin', label: 'R$ 1', active: true },
	{ value: 0.5, type: 'coin', label: 'R$ 0,50', active: true },
	{ value: 0.25, type: 'coin', label: 'R$ 0,25', active: true },
	{ value: 0.1, type: 'coin', label: 'R$ 0,10', active: true },
	{ value: 0.05, type: 'coin', label: 'R$ 0,05', active: true },
];

// Formatação de moeda brasileira
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

// Conversões para evitar problemas de ponto flutuante
export function realsToCents(reals: number): number {
	return Math.round(reals * 100);
}

export function centsToReals(cents: number): number {
	return cents / 100;
}

// Validação de valor monetário
export function isValidCurrencyValue(value: number): boolean {
	return !isNaN(value) && isFinite(value) && value >= 0;
}

// Arredondamento para múltiplos de 5 centavos
export function roundToNearest5Cents(value: number): number {
	const cents = realsToCents(value);
	const rounded = Math.round(cents / 5) * 5;
	return centsToReals(rounded);
}

// Arredondamento para múltiplos de 10 centavos
export function roundToNearest10Cents(value: number): number {
	const cents = realsToCents(value);
	const rounded = Math.round(cents / 10) * 10;
	return centsToReals(rounded);
}
