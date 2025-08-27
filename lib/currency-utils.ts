import type { Denomination } from '@/types/currency';

// Denominações brasileiras - VALORES EM CENTAVOS para evitar problemas de ponto flutuante
export const BRAZILIAN_DENOMINATIONS: Denomination[] = [
	{ value: 20000, type: 'note', label: 'R$ 200', active: false }, // 200 reais = 20000 centavos
	{ value: 10000, type: 'note', label: 'R$ 100', active: false }, // 100 reais = 10000 centavos
	{ value: 5000, type: 'note', label: 'R$ 50', active: false }, // 50 reais = 5000 centavos
	{ value: 2000, type: 'note', label: 'R$ 20', active: true }, // 20 reais = 2000 centavos
	{ value: 1000, type: 'note', label: 'R$ 10', active: true }, // 10 reais = 1000 centavos
	{ value: 500, type: 'note', label: 'R$ 5', active: true }, // 5 reais = 500 centavos
	{ value: 200, type: 'note', label: 'R$ 2', active: true }, // 2 reais = 200 centavos
	{ value: 100, type: 'coin', label: 'R$ 1', active: true }, // 1 real = 100 centavos
	{ value: 50, type: 'coin', label: 'R$ 0,50', active: true }, // 50 centavos
	{ value: 25, type: 'coin', label: 'R$ 0,25', active: true }, // 25 centavos
	{ value: 10, type: 'coin', label: 'R$ 0,10', active: true }, // 10 centavos
	{ value: 5, type: 'coin', label: 'R$ 0,05', active: true }, // 5 centavos
];

// Formatação de moeda brasileira
export function formatCurrency(value: number): string {
	// Se o valor já estiver em centavos, converter para reais
	const valueInReals = value > 100 ? value / 100 : value;

	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(valueInReals);
}

// Conversões consistentes
export function realsToCents(reals: number): number {
	return Math.round(reals * 100);
}

export function centsToReals(cents: number): number {
	return cents / 100;
}

// Validação de valor monetário
export function isValidMonetaryValue(value: number): boolean {
	return !isNaN(value) && isFinite(value) && value >= 0;
}

// Arredondamento para múltiplos de 5 centavos
export function roundToNearestFiveCents(cents: number): number {
	return Math.round(cents / 5) * 5;
}

// Arredondamento para múltiplos de 10 centavos
export function roundToNearestTenCents(cents: number): number {
	return Math.round(cents / 10) * 10;
}

// Verifica se um valor pode ser representado sem centavos menores que 5
export function canRepresentWithoutCents(cents: number): boolean {
	return cents % 5 === 0;
}

// Calcula a diferença de arredondamento
export function calculateRoundingDifference(
	original: number,
	rounded: number
): number {
	return rounded - original;
}

// Filtra denominações ativas
export function getActiveDenominations(
	denominations: Denomination[]
): Denomination[] {
	return denominations
		.filter((d) => d.active)
		.sort((a, b) => b.value - a.value); // Ordem decrescente
}

// Valida se um valor monetário está dentro dos limites
export function isValidCurrencyValue(value: number): boolean {
	return isValidMonetaryValue(value) && value <= 99999999; // Até R$ 999.999,99
}
