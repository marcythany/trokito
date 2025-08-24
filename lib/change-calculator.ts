import type { ChangeResult, DenominationCount, CalculationConfig, RoundingPolicy } from "@/types/currency"
import {
  realsToCents,
  roundToNearestFiveCents,
  roundToNearestTenCents,
  canRepresentWithoutCents,
  calculateRoundingDifference,
  isValidMonetaryValue,
  getActiveDenominations,
  BRAZILIAN_DENOMINATIONS,
} from "./currency-utils"

// Configuração padrão
export const DEFAULT_CONFIG: CalculationConfig = {
  roundingPolicy: {
    type: "allow-owing-up-to-0.04",
    toleranceCents: 4,
  },
  activeDenominations: BRAZILIAN_DENOMINATIONS,
  prioritizeLessCoins: true,
}

// Algoritmo guloso para calcular troco
function calculateGreedyChange(
  changeCents: number,
  denominations: typeof BRAZILIAN_DENOMINATIONS,
): DenominationCount[] {
  const result: DenominationCount[] = []
  let remainingChange = changeCents

  for (const denomination of denominations) {
    if (remainingChange >= denomination.value) {
      const count = Math.floor(remainingChange / denomination.value)
      if (count > 0) {
        result.push({ denomination, count })
        remainingChange -= count * denomination.value
      }
    }
  }

  return result
}

// Aplica política de arredondamento
function applyRoundingPolicy(changeCents: number, policy: RoundingPolicy): number {
  switch (policy.type) {
    case "nearest-0.05":
      return roundToNearestFiveCents(changeCents)

    case "nearest-0.10":
      return roundToNearestTenCents(changeCents)

    case "allow-owing-up-to-0.04":
      // Se pode representar exatamente, usa o valor exato
      if (canRepresentWithoutCents(changeCents)) {
        return changeCents
      }

      // Tenta arredondar para baixo (cliente "deve" alguns centavos)
      const roundedDown = roundToNearestFiveCents(changeCents)
      const difference = changeCents - roundedDown

      // Se a diferença está dentro da tolerância, arredonda para baixo
      if (difference >= 0 && difference <= policy.toleranceCents) {
        return roundedDown
      }

      // Caso contrário, arredonda para cima
      return roundToNearestFiveCents(changeCents)

    default:
      return roundToNearestFiveCents(changeCents)
  }
}

// Função principal para calcular troco
export function calculateOptimalChange(
  purchaseAmount: number,
  paidAmount: number,
  config: CalculationConfig = DEFAULT_CONFIG,
): ChangeResult {
  // Validações básicas
  if (!isValidMonetaryValue(purchaseAmount) || !isValidMonetaryValue(paidAmount)) {
    throw new Error("Valores monetários inválidos")
  }

  if (paidAmount < purchaseAmount) {
    throw new Error("Valor pago é menor que o valor da compra")
  }

  // Converte para centavos
  const purchaseCents = realsToCents(purchaseAmount)
  const paidCents = realsToCents(paidAmount)
  const exactChangeCents = paidCents - purchaseCents

  // Se não há troco, retorna resultado vazio
  if (exactChangeCents === 0) {
    return {
      totalChange: 0,
      exactChange: 0,
      roundingDifference: 0,
      denominations: [],
      isOptimal: true,
      message: "Não há troco a ser dado",
    }
  }

  // Obtém denominações ativas ordenadas
  const activeDenominations = getActiveDenominations(config.activeDenominations)

  // Aplica política de arredondamento
  const roundedChangeCents = applyRoundingPolicy(exactChangeCents, config.roundingPolicy)
  const roundingDifference = calculateRoundingDifference(exactChangeCents, roundedChangeCents)

  // Calcula a combinação de denominações
  const denominationCounts = calculateGreedyChange(roundedChangeCents, activeDenominations)

  // Verifica se conseguiu representar o troco completamente
  const totalRepresented = denominationCounts.reduce((sum, item) => sum + item.denomination.value * item.count, 0)

  const isOptimal = totalRepresented === roundedChangeCents && roundingDifference === 0

  // Gera mensagem explicativa se houver arredondamento
  let message: string | undefined
  if (roundingDifference !== 0) {
    if (roundingDifference > 0) {
      message = `Troco arredondado para cima em ${Math.abs(roundingDifference)} centavo(s)`
    } else {
      message = `Cliente deve ${Math.abs(roundingDifference)} centavo(s) (dentro da tolerância)`
    }
  }

  return {
    totalChange: roundedChangeCents,
    exactChange: exactChangeCents,
    roundingDifference,
    denominations: denominationCounts,
    isOptimal,
    message,
  }
}

// Função auxiliar para calcular total de peças
export function getTotalPieces(denominations: DenominationCount[]): number {
  return denominations.reduce((sum, item) => sum + item.count, 0)
}

// Função auxiliar para separar notas e moedas
export function separateNotesAndCoins(denominations: DenominationCount[]): {
  notes: DenominationCount[]
  coins: DenominationCount[]
} {
  const notes = denominations.filter((item) => item.denomination.type === "note")
  const coins = denominations.filter((item) => item.denomination.type === "coin")

  return { notes, coins }
}

// Função para validar se uma configuração é válida
export function validateConfig(config: CalculationConfig): boolean {
  if (!config.activeDenominations || config.activeDenominations.length === 0) {
    return false
  }

  if (!config.roundingPolicy || config.roundingPolicy.toleranceCents < 0) {
    return false
  }

  return true
}
