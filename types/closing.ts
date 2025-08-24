import type { Denomination } from "./currency"

export interface DenominationCount {
  denomination: Denomination
  count: number
}

export interface ClosingRecord {
  id: string
  date: Date
  operator?: string
  observations?: string
  denominationCounts: DenominationCount[]
  totalNotes: number // Total em centavos das notas
  totalCoins: number // Total em centavos das moedas
  totalAmount: number // Total geral em centavos
  createdAt: Date
}

export interface ClosingSummary {
  totalNotes: number
  totalCoins: number
  totalAmount: number
  totalPieces: number
  denominationCounts: DenominationCount[]
}
