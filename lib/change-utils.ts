import type { ChangeResult, DenominationItem } from "@/types/currency"
import type { DenominationCount } from "@/types/closing"
import { DENOMINATIONS } from "@/constants/currency"

export function calculateOptimalChange(paidAmount: number, changeAmount: number): ChangeResult {
  const exactChange = changeAmount
  let remainingChange = Math.round(changeAmount * 100) / 100
  const denominations: DenominationItem[] = []
  let message = ""

  // Se o troco tem centavos menores que 5 centavos
  const cents = Math.round(remainingChange * 100) % 100
  if (cents > 0 && cents < 5) {
    // Arredonda para baixo (remove os centavos)
    remainingChange = Math.floor(remainingChange)
    message = `Troco arredondado para baixo (removidos ${cents} centavo${cents > 1 ? 's' : ''})`
  } else if (cents > 5 && cents % 5 !== 0) {
    // Arredonda para o múltiplo de 5 mais próximo
    const roundedCents = Math.round(cents / 5) * 5
    remainingChange = Math.floor(remainingChange) + roundedCents / 100
    message = `Troco arredondado para ${roundedCents} centavos`
  }

  // Calcula as denominações necessárias
  for (const denomination of DENOMINATIONS) {
    if (remainingChange >= denomination.value) {
      const count = Math.floor(remainingChange / denomination.value)
      if (count > 0) {
        denominations.push({
          denomination,
          count,
          total: count * denomination.value
        })
        remainingChange = Math.round((remainingChange - (count * denomination.value)) * 100) / 100
      }
    }
  }

  return {
    paidAmount,
    totalChange: Math.round((changeAmount - (exactChange - changeAmount)) * 100) / 100,
    exactChange,
    denominations,
    isOptimal: cents === 0 || cents % 5 === 0,
    message
  }
}

export function separateNotesAndCoins(items: DenominationItem[]): {
  notes: DenominationItem[]
  coins: DenominationItem[]
} {
  const notes = items.filter(item => item.denomination.type === 'note')
  const coins = items.filter(item => item.denomination.type === 'coin')
  return { notes, coins }
}

// Sobrecarga para DenominationCount (usado no fechamento)
export function separateNotesAndCoins(items: DenominationCount[]): {
  notes: DenominationCount[]
  coins: DenominationCount[]
}

// Sobrecarga para DenominationItem (usado no troco)
export function separateNotesAndCoins(items: DenominationItem[]): {
  notes: DenominationItem[]
  coins: DenominationItem[]
}

// Implementação única que funciona para ambos os tipos
export function separateNotesAndCoins(
  items: DenominationCount[] | DenominationItem[]
): {
  notes: (DenominationCount | DenominationItem)[]
  coins: (DenominationCount | DenominationItem)[]
} {
  const notes = items.filter(item => item.denomination.type === 'note')
  const coins = items.filter(item => item.denomination.type === 'coin')
  return { notes, coins }
}

export function getTotalPieces(denominations: DenominationItem[]): number {
  return denominations.reduce((total, item) => total + item.count, 0)
}