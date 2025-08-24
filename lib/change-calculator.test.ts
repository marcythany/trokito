import { calculateOptimalChange, DEFAULT_CONFIG, getTotalPieces } from "../change-calculator"
import { realsToCents } from "../currency-utils"

describe("Change Calculator", () => {
  describe("calculateOptimalChange", () => {
    test("should calculate exact change when possible", () => {
      // Compra R$23,50 pago R$50,00 = troco R$26,50
      const result = calculateOptimalChange(23.5, 50.0)

      expect(result.exactChange).toBe(realsToCents(26.5))
      expect(result.totalChange).toBe(realsToCents(26.5))
      expect(result.roundingDifference).toBe(0)
      expect(result.isOptimal).toBe(true)
      expect(result.message).toBeUndefined()
    })

    test("should handle rounding when exact change includes cents", () => {
      // Compra R$23,47 pago R$50,00 = troco R$26,53
      const result = calculateOptimalChange(23.47, 50.0)

      expect(result.exactChange).toBe(realsToCents(26.53))
      expect(result.totalChange).toBe(realsToCents(26.5)) // Arredondado para R$26,50
      expect(result.roundingDifference).toBe(-3) // Cliente deve 3 centavos
      expect(result.isOptimal).toBe(false)
      expect(result.message).toContain("Cliente deve 3 centavo(s)")
    })

    test("should minimize number of pieces", () => {
      // Troco de R$26,50 deve usar 1x R$20 + 1x R$5 + 1x R$1 + 1x R$0,50
      const result = calculateOptimalChange(23.5, 50.0)

      const totalPieces = getTotalPieces(result.denominations)
      expect(totalPieces).toBe(4)

      // Verifica se usou as denominações corretas
      const denominationValues = result.denominations.map((d) => d.denomination.value)
      expect(denominationValues).toContain(2000) // R$20
      expect(denominationValues).toContain(500) // R$5
      expect(denominationValues).toContain(100) // R$1
      expect(denominationValues).toContain(50) // R$0,50
    })

    test("should handle no change scenario", () => {
      const result = calculateOptimalChange(25.0, 25.0)

      expect(result.totalChange).toBe(0)
      expect(result.exactChange).toBe(0)
      expect(result.denominations).toHaveLength(0)
      expect(result.isOptimal).toBe(true)
      expect(result.message).toBe("Não há troco a ser dado")
    })

    test("should throw error when paid amount is less than purchase", () => {
      expect(() => {
        calculateOptimalChange(50.0, 25.0)
      }).toThrow("Valor pago é menor que o valor da compra")
    })

    test("should handle large amounts correctly", () => {
      // Compra R$1.234,56 pago R$1.500,00 = troco R$265,44
      const result = calculateOptimalChange(1234.56, 1500.0)

      expect(result.exactChange).toBe(realsToCents(265.44))
      // Deve arredondar para R$265,45 (mais próximo múltiplo de 5 centavos)
      expect(result.totalChange).toBe(realsToCents(265.45))
      expect(result.roundingDifference).toBe(1) // Arredondado para cima em 1 centavo
    })

    test("should respect tolerance policy", () => {
      // Teste com tolerância de 4 centavos
      const result = calculateOptimalChange(10.04, 20.0, DEFAULT_CONFIG)

      expect(result.exactChange).toBe(realsToCents(9.96))
      expect(result.totalChange).toBe(realsToCents(9.95)) // Arredondado para baixo
      expect(result.roundingDifference).toBe(-1) // Cliente deve 1 centavo
      expect(result.message).toContain("Cliente deve 1 centavo(s)")
    })
  })

  describe("Edge cases", () => {
    test("should handle very small amounts", () => {
      const result = calculateOptimalChange(0.01, 0.1)

      expect(result.exactChange).toBe(9) // 9 centavos
      expect(result.totalChange).toBe(10) // Arredondado para 10 centavos
    })

    test("should handle amounts that require many coins", () => {
      // Troco que requer muitas moedas pequenas
      const result = calculateOptimalChange(0.05, 2.0)

      expect(result.exactChange).toBe(realsToCents(1.95))
      expect(result.totalChange).toBe(realsToCents(1.95))
      expect(result.isOptimal).toBe(true)
    })
  })
})
