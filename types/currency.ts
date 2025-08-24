export interface Denomination {
	value: number; // Valor em reais (não centavos)
	type: 'note' | 'coin';
	label: string; // Ex: "R$ 100", "R$ 0,50"
	active?: boolean; // Se está ativa nas configurações
}

export interface DenominationItem {
	denomination: Denomination;
	count: number;
	total: number; // Total em reais
}

export interface ChangeResult {
	paidAmount: number; // Valor pago
	totalChange: number; // Valor total do troco
	exactChange: number; // Valor exato do troco
	denominations: DenominationItem[];
	isOptimal: boolean; // Se conseguiu calcular sem arredondamento
	message?: string; // Mensagem explicativa se houver arredondamento
}

export interface RoundingPolicy {
	type: 'nearest-0.05' | 'nearest-0.10' | 'allow-owing-up-to-0.04';
	toleranceCents: number; // Máximo de centavos que pode "dever"
}

export interface CalculationConfig {
	roundingPolicy: RoundingPolicy;
	activeDenominations: Denomination[];
	prioritizeLessCoins: boolean;
}
