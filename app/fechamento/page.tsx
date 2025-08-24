'use client';

import { ClosingSummary } from '@/components/closing-summary';
import { DenominationCounter } from '@/components/denomination-counter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { separateNotesAndCoins } from '@/lib/change-utils';
import {
	calculateClosingSummary,
	createClosingRecord,
	initializeDenominationCounts,
	updateDenominationCount,
	validateClosing,
} from '@/lib/closing-calculator';
import type { DenominationCount } from '@/types/closing';
import { ArrowLeft, FileText, RotateCcw, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';

export default function FechamentoPage() {
	const router = useRouter();
	const [counts, setCounts] = useState<DenominationCount[]>(
		initializeDenominationCounts()
	);
	const [operator, setOperator] = useState('');
	const [observations, setObservations] = useState('');
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Memoizar cálculos pesados
	const summary = useMemo(() => calculateClosingSummary(counts), [counts]);
	const validation = useMemo(() => validateClosing(summary), [summary]);
	const { notes, coins } = useMemo(
		() => separateNotesAndCoins(counts),
		[counts]
	);

	// Handlers otimizados com useCallback
	const handleCountChange = useCallback(
		(denominationValue: number, newCount: number) => {
			setCounts((prev) =>
				updateDenominationCount(prev, denominationValue, newCount)
			);
		},
		[]
	);

	const handleReset = useCallback(() => {
		setCounts(initializeDenominationCounts());
		setOperator('');
		setObservations('');
		setSaveMessage(null);
	}, []);

	const handleSave = useCallback(async () => {
		if (summary.totalAmount === 0) {
			setSaveMessage('Adicione pelo menos uma contagem antes de salvar');
			return;
		}

		startTransition(async () => {
			setSaveMessage(null);

			try {
				// Simular delay de processamento
				await new Promise((resolve) => setTimeout(resolve, 300));

				const record = createClosingRecord(
					counts,
					operator || undefined,
					observations || undefined
				);
				console.log('Fechamento salvo:', record);

				setSaveMessage('Fechamento salvo com sucesso!');

				// Reset após sucesso
				setTimeout(() => {
					handleReset();
				}, 2000);
			} catch {
				setSaveMessage('Erro ao salvar fechamento');
			}
		});
	}, [counts, operator, observations, summary.totalAmount, handleReset]);

	const handleGoBack = useCallback(() => {
		router.back();
	}, [router]);

	// Memoizar componentes de lista para evitar re-render desnecessários
	const notesComponents = useMemo(
		() =>
			notes.map((item) => (
				<DenominationCounter
					key={item.denomination.value}
					item={item}
					onCountChange={(newCount) =>
						handleCountChange(item.denomination.value, newCount)
					}
				/>
			)),
		[notes, handleCountChange]
	);

	const coinsComponents = useMemo(
		() =>
			coins.map((item) => (
				<DenominationCounter
					key={item.denomination.value}
					item={item}
					onCountChange={(newCount) =>
						handleCountChange(item.denomination.value, newCount)
					}
					className='h-full'
				/>
			)),
		[coins, handleCountChange]
	);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<div className='sticky top-0 bg-background border-b border-border z-10'>
				<div className='max-w-md mx-auto p-4'>
					<div className='flex items-center gap-3'>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleGoBack}
							className='touch-target'
							aria-label='Voltar'
						>
							<ArrowLeft className='h-5 w-5' />
						</Button>
						<div>
							<h1 className='text-xl font-bold text-foreground font-serif'>
								Fechamento
							</h1>
							<p className='text-sm text-foreground/70'>
								Contagem do vale/caixa
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Conteúdo */}
			<div className='max-w-md mx-auto p-2 pb-8 space-y-2'>
				{/* Resumo */}
				<ClosingSummary summary={summary} />

				<div className='space-y-4'>
					{/* Notas - layout horizontal */}
					{notes.length > 0 && (
						<Card className='border border-border/50'>
							<CardHeader className='pb-2 pt-3'>
								<CardTitle className='text-sm font-semibold text-foreground flex items-center gap-2'>
									<div
										className='w-2 h-2 bg-accent rounded-full'
										aria-hidden='true'
									></div>
									Notas (Vale mínimo: R$ 50)
								</CardTitle>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='grid grid-cols-2 gap-2'>{notesComponents}</div>
							</CardContent>
						</Card>
					)}

					{/* Moedas - layout horizontal */}
					{coins.length > 0 && (
						<Card className='border border-border/50 bg-card/50'>
							<CardHeader className='pb-2 pt-3'>
								<CardTitle className='text-sm font-semibold text-foreground flex items-center gap-2'>
									<div
										className='w-2 h-2 bg-accent rounded-full'
										aria-hidden='true'
									></div>
									Moedas
								</CardTitle>
							</CardHeader>
							<CardContent className='pt-0 pb-3'>
								<div className='grid grid-cols-2 gap-1.5 auto-rows-fr'>
									{coinsComponents}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				<Card className='border border-border'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base font-semibold text-foreground flex items-center gap-2'>
							<FileText className='h-4 w-4' />
							Informações
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='grid grid-cols-1 gap-3'>
							<div className='space-y-1'>
								<Label
									htmlFor='operator'
									className='text-xs font-medium text-foreground'
								>
									Operador (opcional)
								</Label>
								<Input
									id='operator'
									value={operator}
									onChange={(e) => setOperator(e.target.value)}
									placeholder='Nome do operador'
									className='h-10 text-sm'
									aria-describedby='operator-description'
								/>
								<p
									id='operator-description'
									className='text-xs text-muted-foreground'
								>
									Identifique quem está realizando o fechamento
								</p>
							</div>

							<div className='space-y-1'>
								<Label
									htmlFor='observations'
									className='text-xs font-medium text-foreground'
								>
									Observações (opcional)
								</Label>
								<Textarea
									id='observations'
									value={observations}
									onChange={(e) => setObservations(e.target.value)}
									placeholder='Observações...'
									className='min-h-16 text-sm'
									aria-describedby='observations-description'
								/>
								<p
									id='observations-description'
									className='text-xs text-muted-foreground'
								>
									Adicione informações relevantes sobre o fechamento
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Avisos de validação */}
				{validation.warnings.length > 0 && (
					<Alert>
						<AlertDescription className='text-sm'>
							<ul className='list-disc list-inside space-y-1'>
								{validation.warnings.map((warning, index) => (
									<li key={index}>{warning}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				{/* Mensagem de salvamento */}
				{saveMessage && (
					<Alert
						variant={
							saveMessage.includes('sucesso') ? 'default' : 'destructive'
						}
					>
						<AlertDescription className='text-sm'>
							{saveMessage}
						</AlertDescription>
					</Alert>
				)}

				{/* Botões de ação */}
				<div className='flex gap-3'>
					<Button
						onClick={handleSave}
						disabled={isPending}
						className='flex-1 h-12 text-base font-semibold touch-target'
						aria-label='Salvar fechamento'
					>
						<Save className='h-4 w-4 mr-2' />
						{isPending ? 'Salvando...' : 'Salvar'}
					</Button>
					<Button
						variant='outline'
						onClick={handleReset}
						className='h-12 px-4 touch-target bg-transparent'
						aria-label='Reiniciar formulário'
					>
						<RotateCcw className='h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	);
}
