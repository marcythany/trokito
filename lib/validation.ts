export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: any
}

export class InputValidator {
  // Validação de valores monetários
  static validateCurrency(value: string | number): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: number | undefined

    try {
      // Converter para string se necessário
      const stringValue = typeof value === "number" ? value.toString() : value

      // Remover caracteres não numéricos exceto vírgula e ponto
      const cleanValue = stringValue.replace(/[^\d.,]/g, "")

      // Converter vírgula para ponto (padrão brasileiro)
      const normalizedValue = cleanValue.replace(",", ".")

      // Validar formato
      if (!/^\d*\.?\d{0,2}$/.test(normalizedValue)) {
        errors.push("Formato de moeda inválido")
      }

      const numericValue = Number.parseFloat(normalizedValue)

      // Validar limites
      if (isNaN(numericValue)) {
        errors.push("Valor deve ser um número válido")
      } else if (numericValue < 0) {
        errors.push("Valor não pode ser negativo")
      } else if (numericValue > 999999.99) {
        errors.push("Valor muito alto (máximo R$ 999.999,99)")
      } else {
        sanitizedValue = Math.round(numericValue * 100) / 100 // Arredondar para 2 casas decimais
      }
    } catch (error) {
      errors.push("Erro ao processar valor")
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    }
  }

  // Validação de quantidades (para fechamento)
  static validateQuantity(value: string | number): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: number | undefined

    try {
      const numericValue = typeof value === "string" ? Number.parseInt(value, 10) : value

      if (isNaN(numericValue)) {
        errors.push("Quantidade deve ser um número válido")
      } else if (numericValue < 0) {
        errors.push("Quantidade não pode ser negativa")
      } else if (numericValue > 9999) {
        errors.push("Quantidade muito alta (máximo 9999)")
      } else if (!Number.isInteger(numericValue)) {
        errors.push("Quantidade deve ser um número inteiro")
      } else {
        sanitizedValue = numericValue
      }
    } catch (error) {
      errors.push("Erro ao processar quantidade")
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    }
  }

  // Validação de PIN
  static validatePIN(pin: string): ValidationResult {
    const errors: string[] = []

    if (!pin || typeof pin !== "string") {
      errors.push("PIN é obrigatório")
    } else if (pin.length < 4 || pin.length > 6) {
      errors.push("PIN deve ter entre 4 e 6 dígitos")
    } else if (!/^\d+$/.test(pin)) {
      errors.push("PIN deve conter apenas números")
    } else if (/^(\d)\1+$/.test(pin)) {
      errors.push("PIN não pode ter todos os dígitos iguais")
    } else if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin)) {
      errors.push("PIN não pode ser uma sequência simples")
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: pin,
    }
  }

  // Validação de nome do operador
  static validateOperatorName(name: string): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: string | undefined

    try {
      if (!name || typeof name !== "string") {
        errors.push("Nome é obrigatório")
      } else {
        // Sanitizar: remover caracteres especiais perigosos
        const sanitized = name
          .trim()
          .replace(/[<>"'&]/g, "") // Remove caracteres HTML perigosos
          .substring(0, 50) // Limita tamanho

        if (sanitized.length < 2) {
          errors.push("Nome deve ter pelo menos 2 caracteres")
        } else if (sanitized.length > 50) {
          errors.push("Nome muito longo (máximo 50 caracteres)")
        } else {
          sanitizedValue = sanitized
        }
      }
    } catch (error) {
      errors.push("Erro ao processar nome")
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    }
  }

  // Sanitização geral para prevenir XSS
  static sanitizeString(input: string): string {
    if (typeof input !== "string") return ""

    return input
      .trim()
      .replace(/[<>"'&]/g, "") // Remove caracteres HTML perigosos
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+=/gi, "") // Remove event handlers
      .substring(0, 1000) // Limita tamanho
  }
}

// Rate limiting para prevenir ataques de força bruta
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    // 5 tentativas em 15 minutos
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Reset se passou da janela de tempo
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Incrementar tentativas
    record.count++
    record.lastAttempt = now

    return record.count <= this.maxAttempts
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record || record.count <= this.maxAttempts) return 0

    const elapsed = Date.now() - record.lastAttempt
    return Math.max(0, this.windowMs - elapsed)
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}
