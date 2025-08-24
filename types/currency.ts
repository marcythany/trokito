export interface Denomination {
  value: number // Valor em centavos para evitar problemas de ponto flutuante
  type: "note" | "coin"
  label: string // Ex: "R$ 100", "R$ 0,50"
  active: boolean // Se está ativa nas configurações
}

export interface ChangeResult {
  totalChange: number // Valor total do troco em centavos
  exactChange: number // Valor exato calculado em centavos
  roundingDifference: number // Diferença do arredondamento em centavos
  denominations: DenominationCount[]
  isOptimal: boolean // Se conseguiu calcular sem arredondamento
  message?: string // Mensagem explicativa se houver arredondamento
}

export interface DenominationCount {
  denomination: Denomination
  count: number
}

export interface RoundingPolicy {
  type: "nearest-0.05" | "nearest-0.10" | "allow-owing-up-to-0.04"
  toleranceCents: number // Máximo de centavos que pode "dever"
}

export interface CalculationConfig {
  roundingPolicy: RoundingPolicy
  activeDenominations: Denomination[]
  prioritizeLessCoins: boolean
}
