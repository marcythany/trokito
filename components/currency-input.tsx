'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { centsToReals, realsToCents } from '@/lib/currency-utils';
import { useCallback, useEffect, useState, useTransition } from 'react';

interface CurrencyInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	name?: string;
	required?: boolean;
}

export function CurrencyInput({
	label,
	value,
	onChange,
	placeholder,
	disabled,
	className,
	name,
	required = false,
}: CurrencyInputProps) {
	const [displayValue, setDisplayValue] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [, startTransition] = useTransition(); // Removemos isPending não utilizado

	// Função de formatação otimizada com useCallback
	const formatCurrencyValue = useCallback((value: number): string => {
		if (value <= 0) return '';
		return centsToReals(realsToCents(value)).toFixed(2);
	}, []);

	// Efeito para atualizar o valor de exibição quando não está em foco
	useEffect(() => {
		if (!isFocused) {
			setDisplayValue(formatCurrencyValue(value));
		}
	}, [value, isFocused, formatCurrencyValue]);

	// Handler de mudança otimizado
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;
			setDisplayValue(inputValue);

			// Processamento em transição para não bloquear a UI
			startTransition(() => {
				// Remove caracteres não numéricos exceto vírgula e ponto
				const cleanValue = inputValue.replace(/[^\d.,]/g, '');

				// Converte vírgula para ponto (padrão brasileiro)
				const normalizedValue = cleanValue.replace(',', '.');

				// Converte para número
				const numericValue = Number.parseFloat(normalizedValue) || 0;

				onChange(numericValue);
			});
		},
		[onChange]
	);

	// Handlers de foco otimizados
	const handleFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
		setIsFocused(false);
		// Formata o valor quando perde o foco
		if (value > 0) {
			setDisplayValue(formatCurrencyValue(value));
		}
	}, [value, formatCurrencyValue]);

	return (
		<div className={`space-y-2 ${className}`}>
			<Label htmlFor={label} className='text-lg font-semibold text-foreground'>
				{label}
				{required && <span className='text-destructive ml-1'>*</span>}
			</Label>
			<div className='relative'>
				<span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground'>
					R$
				</span>
				<Input
					id={label}
					name={name}
					type='text'
					inputMode='decimal'
					value={displayValue}
					onChange={handleInputChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					placeholder={placeholder || '0,00'}
					disabled={disabled}
					required={required}
					aria-label={label}
					aria-describedby={`${label}-description`}
					className='pl-12 text-xl font-semibold h-14 touch-target high-contrast text-secondary-foreground bg-input 
                   [appearance:textfield] 
                   [&::-webkit-outer-spin-button]:appearance-none 
                   [&::-webkit-inner-spin-button]:appearance-none
                   [-moz-appearance:textfield]'
				/>
			</div>
			<div
				id={`${label}-description`}
				className='text-sm text-muted-foreground'
			>
				Use vírgula para centavos (ex: 1,99)
			</div>
		</div>
	);
}
