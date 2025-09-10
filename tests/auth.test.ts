import { beforeEach, describe, expect, it } from 'vitest';

// Mock the auth functions
const mockLocalStorage: Record<string, string> = {};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: (key: string) => mockLocalStorage[key] || null,
		setItem: (key: string, value: string) => {
			mockLocalStorage[key] = value;
		},
		removeItem: (key: string) => {
			delete mockLocalStorage[key];
		},
		clear: () => {
			Object.keys(mockLocalStorage).forEach((key) => {
				delete mockLocalStorage[key];
			});
		},
	},
	writable: true,
});

// Simple mock of the auth module functions
class MockAuth {
	private pin: string | null = null;

	setPIN(pin: string) {
		this.pin = pin;
		localStorage.setItem('trokito_pin', pin);
	}

	verifyPIN(pin: string): boolean {
		if (!this.pin) {
			const storedPIN = localStorage.getItem('trokito_pin');
			if (storedPIN) {
				this.pin = storedPIN;
			}
		}
		return this.pin === pin;
	}

	isAuthenticated(): boolean {
		return !!localStorage.getItem('trokito_user');
	}

	isWebAuthnSupported(): boolean {
		return typeof window.PublicKeyCredential !== 'undefined';
	}
}

describe('Authentication', () => {
	let auth: MockAuth;

	beforeEach(() => {
		auth = new MockAuth();
		localStorage.clear();
	});

	it('should set and verify PIN correctly', () => {
		const testPIN = '1234';

		// Set PIN
		auth.setPIN(testPIN);

		// Verify PIN
		expect(auth.verifyPIN(testPIN)).toBe(true);
		expect(auth.verifyPIN('4321')).toBe(false);
	});

	it('should handle empty PIN', () => {
		expect(auth.verifyPIN('')).toBe(false);
	});

	it('should handle PIN with different lengths', () => {
		const shortPIN = '123';
		const longPIN = '123456';

		auth.setPIN(shortPIN);
		expect(auth.verifyPIN(shortPIN)).toBe(true);

		auth.setPIN(longPIN);
		expect(auth.verifyPIN(longPIN)).toBe(true);
	});

	it('should check authentication status', () => {
		// Not authenticated initially
		expect(auth.isAuthenticated()).toBe(false);

		// Set user in localStorage to simulate authentication
		localStorage.setItem(
			'trokito_user',
			JSON.stringify({
				id: 'test-user',
				name: 'Test User',
				createdAt: new Date().toISOString(),
			})
		);

		// Now authenticated
		expect(auth.isAuthenticated()).toBe(true);
	});

	it('should check WebAuthn support', () => {
		// By default, in jsdom, PublicKeyCredential is not defined
		expect(auth.isWebAuthnSupported()).toBe(false);

		// Mock WebAuthn support
		(window as any).PublicKeyCredential = {};
		expect(auth.isWebAuthnSupported()).toBe(true);

		// Clean up
		delete (window as any).PublicKeyCredential;
	});
});
