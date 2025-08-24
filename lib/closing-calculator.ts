import type { DenominationCount, ClosingSummary, ClosingRecord } from "@/types/closing"
import { BRAZILIAN_DENOMINATIONS } from "./currency-utils"

// Calcula o resumo do fechamento
export function calculateClosingSummary(counts: DenominationCount[]): ClosingSummary {
  let totalNotes = 0
  let totalCoins = 0
  let totalPieces = 0

  const validCounts = counts.filter((item) => item.count > 0)

  for (const item of validCounts) {
    const value = item.denomination.value * item.count
    totalPieces += item.count

    if (item.denomination.type === "note") {
      totalNotes += value
    } else {
      totalCoins += value
    }
  }

  const totalAmount = totalNotes + totalCoins

  return {
    totalNotes,
    totalCoins,
    totalAmount,
    totalPieces,
    denominationCounts: validCounts,
  }
}

// Cria um novo registro de fechamento
export function createClosingRecord(
  counts: DenominationCount[],
  operator?: string,
  observations?: string,
): ClosingRecord {
  const summary = calculateClosingSummary(counts)
  const now = new Date()

  return {
    id: `closing_${now.getTime()}`,
    date: now,
    operator,
    observations,
    denominationCounts: summary.denominationCounts,
    totalNotes: summary.totalNotes,
    totalCoins: summary.totalCoins,
    totalAmount: summary.totalAmount,
    createdAt: now,
  }
}

// Inicializa contadores com todas as denominações zeradas
export function initializeDenominationCounts(): DenominationCount[] {
  return BRAZILIAN_DENOMINATIONS.filter((d) => d.active).map((denomination) => ({
    denomination,
    count: 0,
  }))
}

// Atualiza a contagem de uma denominação específica
export function updateDenominationCount(
  counts: DenominationCount[],
  denominationValue: number,
  newCount: number,
): DenominationCount[] {
  return counts.map((item) =>
    item.denomination.value === denominationValue ? { ...item, count: Math.max(0, newCount) } : item,
  )
}

// Incrementa a contagem de uma denominação
export function incrementDenominationCount(
  counts: DenominationCount[],
  denominationValue: number,
  increment = 1,
): DenominationCount[] {
  return counts.map((item) =>
    item.denomination.value === denominationValue ? { ...item, count: Math.max(0, item.count + increment) } : item,
  )
}

// Valida se um fechamento está completo
export function validateClosing(summary: ClosingSummary): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (summary.totalAmount === 0) {
    warnings.push("Nenhum valor foi contado")
  }

  if (summary.totalPieces === 0) {
    warnings.push("Nenhuma peça foi contada")
  }

  // Verifica se há denominações com quantidades muito altas (possível erro)
  for (const item of summary.denominationCounts) {
    if (item.count > 1000) {
      warnings.push(`Quantidade muito alta para ${item.denomination.label}: ${item.count}`)
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}

// Gera atalhos rápidos para denominações comuns
export function getQuickCountOptions(denominationValue: number): number[] {
  // Atalhos baseados no valor da denominação
  if (denominationValue >= 1000) {
    // Para notas grandes: 1, 5, 10, 20, 50
    return [1, 5, 10, 20, 50]
  }
  if (denominationValue >= 100) {
    // Para notas pequenas e moeda de R$1: 1, 5, 10, 25, 50
    return [1, 5, 10, 25, 50]
  }
  // Para moedas pequenas: 1, 5, 10, 20, 100
  return [1, 5, 10, 20, 100]
}
