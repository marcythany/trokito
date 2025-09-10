import { describe, expect, it } from 'vitest';

// Mock the change calculation functions from the troco page
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

// Calculate change breakdown using greedy algorithm
const calculateBreakdown = (
	cents: number,
	denominations: typeof DENOMINATIONS
): { denomination: (typeof DENOMINATIONS)[0]; count: number }[] => {
	const breakdown = [];
	let remaining = cents;

	for (const denomination of denominations) {
		const count = Math.floor(remaining / denomination.value);
		if (count > 0) {
			breakdown.push({ denomination, count });
			remaining -= count * denomination.value;
		}
	}

	return breakdown;
};

// Round to nearest 5 cents
const roundToNearest5Cents = (cents: number): number => {
	return Math.round(cents / 5) * 5;
};

describe('Change Calculation', () => {
	it('should calculate exact change correctly', () => {
		const totalCents = 1500; // R$ 15,00
		const paymentCents = 2000; // R$ 20,00
		const exactChangeCents = paymentCents - totalCents; // R$ 5,00

		const breakdown = calculateBreakdown(exactChangeCents, DENOMINATIONS);

		expect(breakdown).toHaveLength(1);
		expect(breakdown[0].denomination.value).toBe(500);
		expect(breakdown[0].count).toBe(1);
	});

	it('should calculate complex change correctly', () => {
		const totalCents = 1235; // R$ 12,35
		const paymentCents = 2000; // R$ 20,00
		const exactChangeCents = paymentCents - totalCents; // R$ 7,65

		const breakdown = calculateBreakdown(exactChangeCents, [
			...DENOMINATIONS,
			{ value: 1, label: 'R$ 0,01', type: 'coin' },
		]);

		// Should be R$ 5,00 + R$ 2,00 + R$ 0,50 + R$ 0,10 + R$ 0,05
		expect(breakdown).toHaveLength(5);

		const values = breakdown.map((item) => item.denomination.value);
		const counts = breakdown.map((item) => item.count);

		expect(values).toContain(500);
		expect(values).toContain(200);
		expect(values).toContain(50);
		expect(values).toContain(10);
		expect(values).toContain(5);

		expect(counts.every((count) => count === 1)).toBe(true);
	});

	it('should round to nearest 5 cents correctly', () => {
		// Test cases for rounding
		expect(roundToNearest5Cents(1234)).toBe(1235); // R$ 12,34 -> R$ 12,35
		expect(roundToNearest5Cents(1236)).toBe(1235); // R$ 12,36 -> R$ 12,35
		expect(roundToNearest5Cents(1237)).toBe(1235); // R$ 12,37 -> R$ 12,35 (247.4 rounds to 247)
		expect(roundToNearest5Cents(1238)).toBe(1240); // R$ 12,38 -> R$ 12,40 (247.6 rounds to 248)
		expect(roundToNearest5Cents(1232)).toBe(1230); // R$ 12,32 -> R$ 12,30
		expect(roundToNearest5Cents(1233)).toBe(1235); // R$ 12,33 -> R$ 12,35
	});

	it('should handle edge cases', () => {
		// No change needed
		const noChangeBreakdown = calculateBreakdown(0, DENOMINATIONS);
		expect(noChangeBreakdown).toHaveLength(0);

		// Exact denomination match
		const exactMatchBreakdown = calculateBreakdown(1000, DENOMINATIONS);
		expect(exactMatchBreakdown).toHaveLength(1);
		expect(exactMatchBreakdown[0].denomination.value).toBe(1000);
		expect(exactMatchBreakdown[0].count).toBe(1);
	});
});
