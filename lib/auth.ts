// lib/auth.ts
export interface User {
	id: string;
	name: string;
	createdAt: Date;
}

class AuthService {
	private readonly USER_STORAGE_KEY = 'trokito_user';
	private readonly PIN_STORAGE_KEY = 'trokito_pin';

	// Check if WebAuthn is supported
	isWebAuthnSupported(): boolean {
		return (
			typeof window !== 'undefined' &&
			window.PublicKeyCredential !== undefined &&
			navigator.credentials !== undefined
		);
	}

	// Register a new user with WebAuthn
	async registerWithWebAuthn(username: string): Promise<User | null> {
		if (!this.isWebAuthnSupported()) {
			throw new Error('WebAuthn não é suportado neste navegador');
		}

		try {
			// Create a challenge for the authenticator
			const challenge = this.generateChallenge();

			// Prepare the registration options
			const options: PublicKeyCredentialCreationOptions = {
				challenge: challenge,
				rp: {
					name: 'Trokito',
					id: window.location.hostname,
				},
				user: {
					id: this.stringToBuffer(username),
					name: username,
					displayName: username,
				},
				pubKeyCredParams: [
					{
						type: 'public-key',
						alg: -7, // ES256
					},
				],
				authenticatorSelection: {
					authenticatorAttachment: 'platform',
					requireResidentKey: false,
					userVerification: 'preferred',
				},
				timeout: 60000,
				attestation: 'none',
			};

			// Create the credential
			const credential = (await navigator.credentials.create({
				publicKey: options,
			})) as PublicKeyCredential;

			if (!credential) {
				throw new Error('Falha ao criar credencial');
			}

			// Store user info in localStorage (in a real app, this would be stored securely)
			const user: User = {
				id: username,
				name: username,
				createdAt: new Date(),
			};

			localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));

			return user;
		} catch (error) {
			console.error('Erro no registro com WebAuthn:', error);
			return null;
		}
	}

	// Authenticate user with WebAuthn
	async authenticateWithWebAuthn(): Promise<User | null> {
		if (!this.isWebAuthnSupported()) {
			throw new Error('WebAuthn não é suportado neste navegador');
		}

		try {
			// Check if user exists
			const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
			if (!userJson) {
				throw new Error('Nenhum usuário registrado');
			}

			const user: User = JSON.parse(userJson);

			// Create a challenge for the authenticator
			const challenge = this.generateChallenge();

			// Prepare the authentication options
			const options: PublicKeyCredentialRequestOptions = {
				challenge: challenge,
				timeout: 60000,
				userVerification: 'preferred',
			};

			// Get the credential
			const credential = (await navigator.credentials.get({
				publicKey: options,
			})) as PublicKeyCredential;

			if (!credential) {
				throw new Error('Falha na autenticação');
			}

			return user;
		} catch (error) {
			console.error('Erro na autenticação com WebAuthn:', error);
			return null;
		}
	}

	// Set PIN for fallback authentication
	setPIN(pin: string): void {
		// In a real implementation, this would be encrypted
		localStorage.setItem(this.PIN_STORAGE_KEY, pin);
	}

	// Verify PIN for fallback authentication
	verifyPIN(pin: string): boolean {
		const storedPin = localStorage.getItem(this.PIN_STORAGE_KEY);
		return storedPin === pin;
	}

	// Check if user is authenticated
	isAuthenticated(): boolean {
		return localStorage.getItem(this.USER_STORAGE_KEY) !== null;
	}

	// Get current user
	getCurrentUser(): User | null {
		const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
		return userJson ? JSON.parse(userJson) : null;
	}

	// Logout user
	logout(): void {
		localStorage.removeItem(this.USER_STORAGE_KEY);
		localStorage.removeItem(this.PIN_STORAGE_KEY);
	}

	// Generate a random challenge
	private generateChallenge(): ArrayBuffer {
		const challenge = new Uint8Array(32);
		window.crypto.getRandomValues(challenge);
		return challenge.buffer;
	}

	// Convert string to ArrayBuffer
	private stringToBuffer(str: string): ArrayBuffer {
		return new TextEncoder().encode(str).buffer;
	}
}

// Export singleton instance
export const auth = new AuthService();
