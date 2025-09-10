import { describe, expect, it } from 'vitest';

// Mock the closing calculation functions from the fechamento page
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

describe('Closing Calculation', () => {
	it('should calculate total correctly', () => {
		// Create mock counts for denominations
		const counts: Record<string, number> = {
			'10000': 2, // 2 x R$ 100,00 = R$ 200,00
			'5000': 1, // 1 x R$ 50,00 = R$ 50,00
			'2000': 3, // 3 x R$ 20,00 = R$ 60,00
			'1000': 2, // 2 x R$ 10,00 = R$ 20,00
			'500': 1, // 1 x R$ 5,00 = R$ 5,00
			'200': 4, // 4 x R$ 2,00 = R$ 8,00
			'100': 5, // 5 x R$ 1,00 = R$ 5,00
			'50': 10, // 10 x R$ 0,50 = R$ 5,00
			'25': 4, // 4 x R$ 0,25 = R$ 1,00
			'10': 5, // 5 x R$ 0,10 = R$ 0,50
			'5': 2, // 2 x R$ 0,05 = R$ 0,10
		};

		// Calculate total manually
		const expectedTotal =
			2 * 10000 +
			1 * 5000 +
			3 * 2000 +
			2 * 1000 +
			1 * 500 +
			4 * 200 +
			5 * 100 +
			10 * 50 +
			4 * 25 +
			5 * 10 +
			2 * 5;

		// Calculate total using the same logic as in the fechamento page
		const calculatedTotal = DENOMINATIONS.reduce((sum, denom) => {
			return sum + (counts[denom.value.toString()] || 0) * denom.value;
		}, 0);

		expect(calculatedTotal).toBe(expectedTotal);
		expect(calculatedTotal).toBe(35460); // R$ 354,60
	});

	it('should handle zero counts correctly', () => {
		const counts: Record<string, number> = {};

		const calculatedTotal = DENOMINATIONS.reduce((sum, denom) => {
			return sum + (counts[denom.value.toString()] || 0) * denom.value;
		}, 0);

		expect(calculatedTotal).toBe(0);
	});

	it('should handle partial counts correctly', () => {
		const counts: Record<string, number> = {
			'10000': 1, // 1 x R$ 100,00 = R$ 100,00
			'500': 2, // 2 x R$ 5,00 = R$ 10,00
			'25': 4, // 4 x R$ 0,25 = R$ 1,00
		};

		const calculatedTotal = DENOMINATIONS.reduce((sum, denom) => {
			return sum + (counts[denom.value.toString()] || 0) * denom.value;
		}, 0);

		expect(calculatedTotal).toBe(11100); // R$ 111,00
	});
});
