"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputValidator, type ValidationResult } from "@/lib/validation"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface SecureInputProps {
  label: string
  type: "currency" | "quantity" | "pin" | "operator-name" | "text"
  value: string
  onChange: (value: string, isValid: boolean) => void
  placeholder?: string
  required?: boolean
  className?: string
  autoComplete?: string
  maxLength?: number
}

export function SecureInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  autoComplete = "off",
  maxLength,
}: SecureInputProps) {
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [touched, setTouched] = useState(false)

  const validateInput = useCallback(
    (inputValue: string): ValidationResult => {
      if (!inputValue && !required) {
        return { isValid: true, errors: [] }
      }

      switch (type) {
        case "currency":
          return InputValidator.validateCurrency(inputValue)
        case "quantity":
          return InputValidator.validateQuantity(inputValue)
        case "pin":
          return InputValidator.validatePIN(inputValue)
        case "operator-name":
          return InputValidator.validateOperatorName(inputValue)
        default:
          return { isValid: true, errors: [], sanitizedValue: InputValidator.sanitizeString(inputValue) }
      }
    },
    [type, required],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const validationResult = validateInput(inputValue)

      setValidation(validationResult)
      onChange(inputValue, validationResult.isValid)
    },
    [validateInput, onChange],
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
  }, [])

  // Validar quando o valor muda externamente
  useEffect(() => {
    if (value) {
      const validationResult = validateInput(value)
      setValidation(validationResult)
    }
  }, [value, validateInput])

  const showErrors = touched && !validation.isValid && validation.errors.length > 0
  const showSuccess = touched && validation.isValid && value.length > 0

  return (
    <div className="space-y-2">
      <Label htmlFor={`secure-input-${type}`} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          id={`secure-input-${type}`}
          type={type === "pin" ? "password" : "text"}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            ${className}
            ${showErrors ? "border-destructive focus:border-destructive" : ""}
            ${showSuccess ? "border-green-500 focus:border-green-500" : ""}
            touch-target
          `}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={type === "currency" || type === "quantity" ? "decimal" : "text"}
        />

        {/* Ícone de status */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {showErrors && <AlertTriangle className="h-4 w-4 text-destructive" />}
          {showSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
      </div>

      {/* Mensagens de erro */}
      {showErrors && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{validation.errors.join(". ")}</AlertDescription>
        </Alert>
      )}

      {/* Dicas de formato */}
      {type === "currency" && !touched && (
        <p className="text-xs text-muted-foreground">Formato: R$ 0,00 (use vírgula para centavos)</p>
      )}

      {type === "pin" && !touched && (
        <p className="text-xs text-muted-foreground">4-6 dígitos, evite sequências simples</p>
      )}
    </div>
  )
}
