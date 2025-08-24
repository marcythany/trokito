import type { Denomination } from "@/types/currency"

// Denominações brasileiras em centavos (para evitar problemas de ponto flutuante)
export const BRAZILIAN_DENOMINATIONS: Denomination[] = [
  { value: 20000, type: "note", label: "R$ 200", active: true },
  { value: 10000, type: "note", label: "R$ 100", active: true },
  { value: 5000, type: "note", label: "R$ 50", active: true },
  { value: 2000, type: "note", label: "R$ 20", active: true },
  { value: 1000, type: "note", label: "R$ 10", active: true },
  { value: 500, type: "note", label: "R$ 5", active: true },
  { value: 200, type: "note", label: "R$ 2", active: true },
  { value: 100, type: "coin", label: "R$ 1", active: true },
  { value: 50, type: "coin", label: "R$ 0,50", active: true },
  { value: 25, type: "coin", label: "R$ 0,25", active: true },
  { value: 10, type: "coin", label: "R$ 0,10", active: true },
  { value: 5, type: "coin", label: "R$ 0,05", active: true },
]

// Converte reais para centavos
export function realsToCents(reals: number): number {
  return Math.round(reals * 100)
}

// Converte centavos para reais
export function centsToReals(cents: number): number {
  return cents / 100
}

// Formata valor em centavos para string em reais
export function formatCurrency(cents: number): string {
  const reals = centsToReals(cents)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reals)
}

// Arredonda para múltiplo de 5 centavos
export function roundToNearestFiveCents(cents: number): number {
  return Math.round(cents / 5) * 5
}

// Arredonda para múltiplo de 10 centavos
export function roundToNearestTenCents(cents: number): number {
  return Math.round(cents / 10) * 10
}

// Verifica se um valor pode ser representado sem centavos
export function canRepresentWithoutCents(cents: number): boolean {
  return cents % 5 === 0
}

// Calcula a diferença de arredondamento
export function calculateRoundingDifference(original: number, rounded: number): number {
  return rounded - original
}

// Valida se um valor monetário é válido
export function isValidMonetaryValue(value: number): boolean {
  return value >= 0 && Number.isFinite(value)
}

// Obtém denominações ativas ordenadas por valor (maior para menor)
export function getActiveDenominations(denominations: Denomination[]): Denomination[] {
  return denominations.filter((d) => d.active).sort((a, b) => b.value - a.value)
}
