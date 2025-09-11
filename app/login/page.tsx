'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, type User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState<string>('');
	const [pin, setPin] = useState<string>('');
	const [isRegistering, setIsRegistering] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [isWebAuthnSupported, setIsWebAuthnSupported] =
		useState<boolean>(false);
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		// Focus the main heading when the page loads for better screen reader experience
		if (mainHeadingRef.current) {
			mainHeadingRef.current.focus();
		}

		// Check if WebAuthn is supported
		setIsWebAuthnSupported(auth.isWebAuthnSupported());

		// Set test PIN to 7546 if not already set
		if (!auth.verifyPIN('7546')) {
			auth.setPIN('7546');
		}

		// Redirect if already authenticated
		if (auth.isAuthenticated()) {
			router.push('/');
		}
	}, [router]);

	const handleWebAuthnRegister = async () => {
		if (!username.trim()) {
			setError('Por favor, informe seu nome');
			return;
		}

		try {
			const user = await auth.registerWithWebAuthn(username.trim());
			if (user) {
				router.push('/');
			} else {
				setError('Falha no registro. Por favor, tente novamente.');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro desconhecido');
		}
	};

	const handleWebAuthnLogin = async () => {
		try {
			const user = await auth.authenticateWithWebAuthn();
			if (user) {
				router.push('/');
			} else {
				setError('Falha na autenticação. Por favor, tente novamente.');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro desconhecido');
		}
	};

	const handlePINLogin = () => {
		if (!pin.trim()) {
			setError('Por favor, informe o PIN');
			return;
		}

		if (auth.verifyPIN(pin.trim())) {
			// Create a temporary user for PIN login
			const user: User = {
				id: 'pin-user',
				name: 'Usuário PIN',
				createdAt: new Date(),
			};
			localStorage.setItem('trokito_user', JSON.stringify(user));
			router.push('/');
		} else {
			setError('PIN inválido');
		}
	};

	const handleSetPIN = () => {
		if (!pin.trim()) {
			setError('Por favor, informe o PIN');
			return;
		}

		if (pin.trim().length < 4) {
			setError('O PIN deve ter pelo menos 4 dígitos');
			return;
		}

		auth.setPIN(pin.trim());
		setError('PIN configurado com sucesso!');
		setPin('');
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden'>
			{/* Background blur and grain effects - 2025 trend */}
			<div className='absolute inset-0 blur-bg grain-overlay' />

			{/* Animated background elements */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse' />
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000' />
			</div>

			<div className='relative z-10 w-full max-w-6xl'>
				{/* Bento grid layout - 2025 trend */}
				<div className='bento-grid gap-6'>
					{/* Header section */}
					<div className='bento-item col-span-1 md:col-span-2 lg:col-span-3 text-center'>
						<h1
							ref={mainHeadingRef}
							tabIndex={-1}
							className='kinetic-text text-4xl md:text-6xl font-bold mb-4 focus:outline-none'
						>
							Trokito
						</h1>
						<p className='text-muted-foreground text-lg md:text-xl'>
							Calculadora de Troco Inteligente
						</p>
					</div>

					{/* Main login card with glassmorphism - 2025 trend */}
					<div className='bento-item glassmorphism neumorphism'>
						<div className='text-center mb-6'>
							<h2
								className='text-2xl font-semibold text-foreground'
								id='form-title'
							>
								{isRegistering ? 'Registro' : 'Login'}
							</h2>
						</div>

						{error && (
							<div
								className='text-sm text-destructive text-center p-3 bg-destructive/10 rounded-xl border border-destructive/20 mb-4'
								role='alert'
								aria-live='assertive'
							>
								{error}
							</div>
						)}

						{isRegistering ? (
							<div className='space-y-6'>
								{/* Username input with enhanced styling */}
								<div className='space-y-3'>
									<Label
										htmlFor='username'
										className='text-foreground font-medium'
									>
										Nome do Operador
									</Label>
									<Input
										id='username'
										type='text'
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder='Seu nome'
										className='text-lg h-12 neumorphism-inset focus-ring'
										aria-describedby='username-help'
									/>
									<p
										id='username-help'
										className='text-xs text-muted-foreground'
									>
										Digite seu nome para registro
									</p>
								</div>

								{/* WebAuthn registration */}
								{isWebAuthnSupported ? (
									<div className='space-y-2'>
										<Button
											onClick={handleWebAuthnRegister}
											className='w-full h-12 neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
											aria-describedby='webauthn-register-help'
										>
											Registrar com Biometria/PIN do Sistema
										</Button>
										<p
											id='webauthn-register-help'
											className='text-xs text-muted-foreground text-center'
										>
											Use sua biometria ou PIN do sistema para registro seguro
										</p>
									</div>
								) : (
									<div
										className='text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-xl border'
										role='status'
									>
										WebAuthn não suportado neste navegador. Use o PIN como
										fallback.
									</div>
								)}

								{/* Divider with glassmorphism */}
								<div className='relative my-6'>
									<div className='absolute inset-0 flex items-center'>
										<div className='w-full border-t border-border/50' />
									</div>
									<div className='relative flex justify-center text-xs uppercase'>
										<span className='glassmorphism px-4 py-1 rounded-full text-muted-foreground font-medium'>
											ou
										</span>
									</div>
								</div>

								{/* PIN setup */}
								<div className='space-y-3'>
									<Label htmlFor='pin' className='text-foreground font-medium'>
										Configurar PIN (4-6 dígitos)
									</Label>
									<Input
										id='pin'
										type='password'
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										placeholder='****'
										className='text-lg h-12 neumorphism-inset focus-ring'
										maxLength={6}
										aria-describedby='pin-help'
									/>
									<p id='pin-help' className='text-xs text-muted-foreground'>
										Digite um PIN de 4 a 6 dígitos para registro
									</p>
								</div>

								<Button
									onClick={handleSetPIN}
									variant='outline'
									className='w-full h-12 neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
									aria-describedby='set-pin-help'
								>
									Configurar PIN
								</Button>
								<p
									id='set-pin-help'
									className='text-xs text-muted-foreground text-center'
								>
									Configure um PIN como método de autenticação alternativo
								</p>
							</div>
						) : (
							<div className='space-y-6'>
								{/* WebAuthn login */}
								{isWebAuthnSupported && (
									<div className='space-y-2'>
										<Button
											onClick={handleWebAuthnLogin}
											className='w-full h-12 neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
											aria-describedby='webauthn-login-help'
										>
											Entrar com Biometria/PIN do Sistema
										</Button>
										<p
											id='webauthn-login-help'
											className='text-xs text-muted-foreground text-center'
										>
											Use sua biometria ou PIN do sistema para login seguro
										</p>
									</div>
								)}

								{/* Divider */}
								<div className='relative my-6'>
									<div className='absolute inset-0 flex items-center'>
										<div className='w-full border-t border-border/50' />
									</div>
									<div className='relative flex justify-center text-xs uppercase'>
										<span className='glassmorphism px-4 py-1 rounded-full text-muted-foreground font-medium'>
											ou
										</span>
									</div>
								</div>

								{/* PIN login */}
								<div className='space-y-3'>
									<Label htmlFor='pin' className='text-foreground font-medium'>
										Entrar com PIN
									</Label>
									<Input
										id='pin'
										type='password'
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										placeholder='****'
										className='text-lg h-12 neumorphism-inset focus-ring'
										maxLength={6}
										aria-describedby='login-pin-help'
									/>
									<p
										id='login-pin-help'
										className='text-xs text-muted-foreground'
									>
										Digite seu PIN para login
									</p>
								</div>

								<Button
									onClick={handlePINLogin}
									variant='outline'
									className='w-full h-12 neumorphism focus-ring hover:transform hover:scale-105 transition-all duration-200'
								>
									Entrar com PIN
								</Button>
							</div>
						)}

						{/* Toggle register/login */}
						<div className='text-center pt-6'>
							<Button
								variant='link'
								onClick={() => {
									setIsRegistering(!isRegistering);
									setError('');
								}}
								className='text-sm focus-ring hover:text-primary transition-colors duration-200'
							>
								{isRegistering
									? 'Já tem uma conta? Faça login'
									: 'Não tem uma conta? Registre-se'}
							</Button>
						</div>
					</div>

					{/* Security info card */}
					<div className='bento-item glassmorphism neumorphism'>
						<div className='text-center space-y-3'>
							<div className='w-12 h-12 mx-auto neumorphism rounded-full flex items-center justify-center'>
								<span className='text-2xl'>🔒</span>
							</div>
							<h3 className='font-semibold text-foreground'>Segurança</h3>
							<p className='text-sm text-muted-foreground'>
								Para segurança, use biometria ou PIN do sistema quando
								disponível. O PIN local é criptografado e armazenado apenas
								neste dispositivo.
							</p>
						</div>
					</div>

					{/* Features card */}
					<div className='bento-item glassmorphism neumorphism'>
						<div className='text-center space-y-3'>
							<div className='w-12 h-12 mx-auto neumorphism rounded-full flex items-center justify-center'>
								<span className='text-2xl'>⚡</span>
							</div>
							<h3 className='font-semibold text-foreground'>Recursos</h3>
							<p className='text-sm text-muted-foreground'>
								Calculadora inteligente de troco com interface moderna e
								acessível. Suporte completo a WebAuthn e autenticação
								biométrica.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
