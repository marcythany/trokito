'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<div className='max-w-md w-full space-y-6'>
				<div className='text-center'>
					<h1
						ref={mainHeadingRef}
						tabIndex={-1}
						className='text-3xl font-bold text-foreground focus:outline-none'
					>
						Trokito
					</h1>
					<p className='text-muted-foreground mt-2'>
						Calculadora de Troco Inteligente
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className='text-center' id='form-title'>
							{isRegistering ? 'Registro' : 'Login'}
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{error && (
							<div
								className='text-sm text-destructive text-center p-2 bg-destructive/10 rounded'
								role='alert'
								aria-live='assertive'
							>
								{error}
							</div>
						)}

						{isRegistering ? (
							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='username'>Nome do Operador</Label>
									<Input
										id='username'
										type='text'
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder='Seu nome'
										className='text-lg'
										aria-describedby='username-help'
									/>
									<p
										id='username-help'
										className='text-xs text-muted-foreground'
									>
										Digite seu nome para registro
									</p>
								</div>

								{isWebAuthnSupported ? (
									<>
										<Button
											onClick={handleWebAuthnRegister}
											className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
									</>
								) : (
									<div
										className='text-sm text-muted-foreground text-center p-2 bg-muted rounded'
										role='status'
									>
										WebAuthn não suportado neste navegador. Use o PIN como
										fallback.
									</div>
								)}

								<div className='relative my-4'>
									<div className='absolute inset-0 flex items-center'>
										<div className='w-full border-t border-border' />
									</div>
									<div className='relative flex justify-center text-xs uppercase'>
										<span className='bg-background px-2 text-muted-foreground'>
											ou
										</span>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='pin'>Configurar PIN (4-6 dígitos)</Label>
									<Input
										id='pin'
										type='password'
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										placeholder='****'
										className='text-lg'
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
									className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
							<div className='space-y-4'>
								{isWebAuthnSupported && (
									<>
										<Button
											onClick={handleWebAuthnLogin}
											className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
									</>
								)}

								<div className='relative my-4'>
									<div className='absolute inset-0 flex items-center'>
										<div className='w-full border-t border-border' />
									</div>
									<div className='relative flex justify-center text-xs uppercase'>
										<span className='bg-background px-2 text-muted-foreground'>
											ou
										</span>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='pin'>Entrar com PIN</Label>
									<Input
										id='pin'
										type='password'
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										placeholder='****'
										className='text-lg'
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
									className='w-full focus:ring-2 focus:ring-primary focus:ring-offset-2'
								>
									Entrar com PIN
								</Button>
							</div>
						)}

						<div className='text-center pt-4'>
							<Button
								variant='link'
								onClick={() => {
									setIsRegistering(!isRegistering);
									setError('');
								}}
								className='text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2'
							>
								{isRegistering
									? 'Já tem uma conta? Faça login'
									: 'Não tem uma conta? Registre-se'}
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className='text-center text-xs text-muted-foreground'>
					<p>
						Para segurança, use biometria ou PIN do sistema quando disponível.
					</p>
					<p className='mt-1'>
						O PIN local é criptografado e armazenado apenas neste dispositivo.
					</p>
				</div>
			</div>
		</div>
	);
}
