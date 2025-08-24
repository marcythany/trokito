"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { realsToCents, centsToReals } from "@/lib/currency-utils"

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CurrencyInput({ label, value, onChange, placeholder, disabled, className }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? centsToReals(realsToCents(value)).toFixed(2) : "")
    }
  }, [value, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = inputValue.replace(/[^\d.,]/g, "")

    // Converte vírgula para ponto
    const normalizedValue = cleanValue.replace(",", ".")

    // Converte para número
    const numericValue = Number.parseFloat(normalizedValue) || 0

    onChange(numericValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Formata o valor quando perde o foco
    if (value > 0) {
      setDisplayValue(centsToReals(realsToCents(value)).toFixed(2))
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label} className="text-lg font-semibold text-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">
          R$
        </span>
        <Input
          id={label}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || "0,00"}
          disabled={disabled}
          className="pl-12 text-xl font-semibold h-14 touch-target high-contrast text-secondary-foreground bg-input"
        />
      </div>
    </div>
  )
}
