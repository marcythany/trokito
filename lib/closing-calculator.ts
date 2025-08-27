import type {
	ClosingRecord,
	ClosingSummary,
	DenominationCount,
} from '@/types/closing';
import { BRAZILIAN_DENOMINATIONS, centsToReals } from './currency-utils';

// Filtra as denominações para fechamento (remove notas de 50, 100 e 200 reais)
const FECHAMENTO_DENOMINATIONS = BRAZILIAN_DENOMINATIONS.filter(
	(denomination) => denomination.value <= 2000 || denomination.type === 'coin'
);

export function initializeDenominationCounts(): DenominationCount[] {
	return FECHAMENTO_DENOMINATIONS.map((denomination) => ({
		denomination,
		count: 0,
	}));
}

export function updateDenominationCount(
	counts: DenominationCount[],
	denominationValue: number,
	newCount: number
): DenominationCount[] {
	return counts.map((item) =>
		item.denomination.value === denominationValue
			? { ...item, count: Math.max(0, newCount) }
			: item
	);
}

export function calculateClosingSummary(
	counts: DenominationCount[]
): ClosingSummary {
	// IMPORTANTE: Os valores já estão em centavos nas denominações
	// Não precisamos converter, apenas somar diretamente

	const totalNotesCents = counts
		.filter((item) => item.denomination.type === 'note')
		.reduce((sum, item) => sum + item.denomination.value * item.count, 0);

	const totalCoinsCents = counts
		.filter((item) => item.denomination.type === 'coin')
		.reduce((sum, item) => sum + item.denomination.value * item.count, 0);

	const totalAmountCents = totalNotesCents + totalCoinsCents;
	const totalPieces = counts.reduce((sum, item) => sum + item.count, 0);
	const denominationCounts = counts.filter((item) => item.count > 0);

	return {
		totalNotes: centsToReals(totalNotesCents), // Converter para reais para exibição
		totalCoins: centsToReals(totalCoinsCents), // Converter para reais para exibição
		totalAmount: centsToReals(totalAmountCents), // Converter para reais para exibição
		totalPieces,
		denominationCounts,
	};
}

export function createClosingRecord(
	counts: DenominationCount[],
	operator?: string,
	observations?: string
): ClosingRecord {
	const summary = calculateClosingSummary(counts);

	return {
		id: `closing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		date: new Date(),
		operator,
		observations,
		denominationCounts: counts.filter((item) => item.count > 0),
		totalNotes: summary.totalNotes,
		totalCoins: summary.totalCoins,
		totalAmount: summary.totalAmount,
		createdAt: new Date(),
	};
}

export function validateClosing(summary: ClosingSummary): {
	isValid: boolean;
	warnings: string[];
} {
	const warnings: string[] = [];

	if (summary.totalAmount === 0) {
		warnings.push('Nenhum valor foi contado');
	}

	if (summary.totalNotes === 0 && summary.totalCoins > 0) {
		warnings.push('Apenas moedas foram contadas');
	}

	if (summary.totalCoins === 0 && summary.totalNotes > 0) {
		warnings.push('Apenas notas foram contadas');
	}

	// Verifica se há valores muito altos (possível erro de digitação)
	const hasHighCount = summary.denominationCounts.some((item) => {
		if (item.denomination.value >= 5000) {
			// R$ 50 ou mais (em centavos)
			return item.count > 100; // Mais de 100 notas de R$ 50 ou maior
		}
		return item.count > 500; // Mais de 500 moedas ou notas pequenas
	});

	if (hasHighCount) {
		warnings.push(
			'Quantidade muito alta detectada - verifique se está correto'
		);
	}

	return {
		isValid: warnings.length === 0,
		warnings,
	};
}

export function getQuickCountOptions(denominationValue: number): number[] {
	// Retorna opções de contagem rápida baseadas no valor da denominação (em centavos)
	if (denominationValue >= 5000) {
		// R$ 50 ou mais
		return [5, 10, 20, 50];
	} else if (denominationValue >= 1000) {
		// R$ 10 ou mais
		return [5, 10, 25, 50];
	} else if (denominationValue >= 100) {
		// R$ 1 ou mais
		return [10, 20, 50, 100];
	} else {
		return [10, 25, 50, 100];
	}
}
