'use client';

import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	ArrowLeft,
	Calculator,
	ChevronDown,
	FileText,
	HelpCircle,
	History,
	Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export default function HelpPage() {
	const mainHeadingRef = useRef<HTMLHeadingElement>(null);

	const faqs = [
		{
			question: 'Como calcular o troco?',
			answer:
				'Digite o valor total da compra no campo "Valor Total" e o valor pago pelo cliente no campo "Valor Pago". Clique em "Calcular Troco" para ver o resultado otimizado.',
		},
		{
			question: 'O que significa "Troco Exato" e "Troco Sugerido"?',
			answer:
				'O troco exato é o valor matemático correto. O troco sugerido arredonda para os centavos terminados em 0 ou 5, facilitando o uso de moedas em circulação no Brasil.',
		},
		{
			question: 'Como fazer um fechamento de caixa?',
			answer:
				'Na página de Fechamento, conte suas notas e moedas, preenchendo a quantidade de cada denominação. O total será calculado automaticamente.',
		},
		{
			question: 'Os dados são salvos automaticamente?',
			answer:
				'Sim, todos os cálculos e fechamentos são salvos automaticamente no seu dispositivo. Você pode visualizar o histórico na página correspondente.',
		},
		{
			question: 'Como funciona a autenticação?',
			answer:
				'O app suporta autenticação por biometria (impressão digital/face) ou PIN. Configure na primeira execução para proteger seus dados.',
		},
		{
			question: 'O app funciona offline?',
			answer:
				'Sim! O Trokito é um PWA que funciona completamente offline após a primeira instalação.',
		},
		{
			question: 'Como instalar o app?',
			answer:
				'Abra o site em um navegador compatível, clique no ícone de instalação na barra de endereços ou menu do navegador.',
		},
	];

	const features = [
		{
			icon: Calculator,
			title: 'Calculadora de Troco',
			description:
				'Calcule trocos de forma rápida e otimizada com algoritmo guloso.',
			steps: [
				'Digite o valor total da compra',
				'Informe o valor pago pelo cliente',
				'Visualize o troco sugerido com denominações',
			],
		},
		{
			icon: FileText,
			title: 'Fechamento de Caixa',
			description:
				'Conte notas e moedas facilmente com cálculo automático do total.',
			steps: [
				'Preencha a quantidade de cada denominação',
				'Adicione nome do operador e observações',
				'Salve ou exporte os dados',
			],
		},
		{
			icon: History,
			title: 'Histórico',
			description: 'Acesse todos os seus cálculos e fechamentos anteriores.',
			steps: [
				'Visualize cálculos e fechamentos em abas separadas',
				'Exclua registros desnecessários',
				'Dados organizados por data',
			],
		},
		{
			icon: Settings,
			title: 'Configurações',
			description: 'Personalize o app de acordo com suas preferências.',
			steps: [
				'Ajuste tema (claro/escuro/sistema)',
				'Configure tamanho da fonte',
				'Ative opções de acessibilidade',
			],
		},
	];

	return (
		<ProtectedRoute>
			<div className='min-h-screen bg-background p-4'>
				<div className='max-w-4xl mx-auto space-y-6'>
					<div className='animate-in fade-in slide-in-from-top-2 duration-300'>
						<Link href='/'>
							<Button
								variant='ghost'
								className='mb-4 pl-0 focus:ring-2 focus:ring-primary focus:ring-offset-2'
								aria-label='Voltar para a página inicial'
							>
								<ArrowLeft className='mr-2 h-4 w-4' aria-hidden='true' />
								Voltar
							</Button>
						</Link>

						<Card>
							<CardHeader>
								<CardTitle
									ref={mainHeadingRef}
									tabIndex={-1}
									className='flex items-center gap-2 focus:outline-none'
								>
									<HelpCircle
										className='h-6 w-6 text-primary'
										aria-hidden='true'
									/>
									Central de Ajuda
								</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Tutorial e respostas para dúvidas frequentes
								</p>
							</CardHeader>
							<CardContent className='space-y-8'>
								<section>
									<h2 className='text-xl font-semibold mb-4'>
										Como Usar o Trokito
									</h2>
									<div className='grid gap-6 md:grid-cols-2'>
										{features.map((feature, index) => {
											const Icon = feature.icon;
											return (
												<Card
													key={index}
													className='animate-in fade-in slide-in-from-left-2 duration-300'
													style={{ animationDelay: `${index * 100}ms` }}
												>
													<CardHeader>
														<CardTitle className='flex items-center gap-2 text-lg'>
															<Icon className='h-5 w-5 text-primary' />
															{feature.title}
														</CardTitle>
														<p className='text-sm text-muted-foreground'>
															{feature.description}
														</p>
													</CardHeader>
													<CardContent>
														<ol className='list-decimal list-inside space-y-1 text-sm'>
															{feature.steps.map((step, stepIndex) => (
																<li key={stepIndex}>{step}</li>
															))}
														</ol>
													</CardContent>
												</Card>
											);
										})}
									</div>
								</section>

								<section>
									<h2 className='text-xl font-semibold mb-4'>
										Perguntas Frequentes
									</h2>
									<div className='space-y-2'>
										{faqs.map((faq, index) => (
											<details
												key={index}
												className='group border rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300'
												style={{ animationDelay: `${index * 50}ms` }}
											>
												<summary className='flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors'>
													<span className='font-medium text-left pr-4'>
														{faq.question}
													</span>
													<ChevronDown className='h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0' />
												</summary>
												<div className='px-4 pb-4 text-muted-foreground'>
													{faq.answer}
												</div>
											</details>
										))}
									</div>
								</section>

								<section className='border-t pt-6'>
									<h2 className='text-xl font-semibold mb-4'>
										Sobre o Trokito
									</h2>
									<div className='space-y-4 text-sm text-muted-foreground'>
										<p>
											O Trokito foi desenvolvido especialmente para operadores
											de caixa brasileiros, com foco em usuários com
											discalculia. Utiliza algoritmos otimizados e interface
											acessível para facilitar o trabalho diário.
										</p>
										<p>
											<strong>Características principais:</strong>
										</p>
										<ul className='list-disc list-inside space-y-1 ml-4'>
											<li>Funcionamento completamente offline</li>
											<li>Armazenamento seguro no dispositivo</li>
											<li>Interface adaptada para discalculia</li>
											<li>Suporte a autenticação biométrica</li>
											<li>Compatível com PWA (Progressive Web App)</li>
										</ul>
									</div>
								</section>

								<section className='border-t pt-6'>
									<h2 className='text-xl font-semibold mb-4'>Suporte</h2>
									<div className='space-y-4'>
										<p className='text-sm text-muted-foreground'>
											Para dúvidas ou sugestões, entre em contato:
										</p>
										<div className='flex flex-col sm:flex-row gap-2'>
											<Button variant='outline' className='flex-1'>
												📧 Email de Suporte
											</Button>
											<Button variant='outline' className='flex-1'>
												📖 Documentação Completa
											</Button>
										</div>
									</div>
								</section>

								<div className='text-center text-xs text-muted-foreground border-t pt-4'>
									<p>Versão 1.0 - Ajuda sempre disponível offline</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
