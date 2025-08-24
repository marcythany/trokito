"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calculator, RotateCcw, Eye, EyeOff, Coins } from "lucide-react"
import { CurrencyInput } from "./currency-input"
import { DenominationDisplay } from "./denomination-display"
import { calculateOptimalChange, separateNotesAndCoins, getTotalPieces } from "@/lib/change-utils"
import { formatCurrency } from "@/lib/currency-utils"
import type { ChangeResult } from "@/types/currency"

export function ChangeCalculator() {
  const [changeAmount, setChangeAmount] = useState(0)
  const [result, setResult] = useState<ChangeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showExactChange, setShowExactChange] = useState(false)
  const [showCoinSuggestion, setShowCoinSuggestion] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  const suggestCoinsFromCustomer = (changeValue: number) => {
    const suggestions = []
    const cents = Math.round(changeValue * 100) % 100

    if (cents > 0 && cents <= 4) {
      suggestions.push(`Peça ${cents} centavo(s) ao cliente para arredondar para baixo`)
    } else if (cents >= 96) {
      const needed = 100 - cents
      suggestions.push(`Peça ${needed} centavo(s) ao cliente para arredondar para cima`)
    } else if (cents >= 46 && cents <= 54) {
      suggestions.push("Peça R$ 0,50 ao cliente para facilitar o troco")
    } else if (cents >= 21 && cents <= 29) {
      suggestions.push("Peça R$ 0,25 ao cliente para facilitar o troco")
    }

    return suggestions
  }

  const handleCalculate = async () => {
    setError(null)
    setResult(null)

    if (changeAmount <= 0) {
      setError("Digite o valor do troco")
      return
    }

    setIsCalculating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const changeResult = calculateOptimalChange(0, changeAmount)
      setResult(changeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular troco")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleReset = () => {
    setChangeAmount(0)
    setResult(null)
    setError(null)
    setShowExactChange(false)
    setShowCoinSuggestion(false)
  }

  const handleQuickAmount = (amount: number) => {
    setChangeAmount(amount)
  }

  const quickAmounts = [1, 2, 5, 10, 20, 50]
  const coinSuggestions = changeAmount > 0 ? suggestCoinsFromCustomer(changeAmount) : []

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Calcular Troco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CurrencyInput
            label="Valor do Troco (do PDV)"
            value={changeAmount}
            onChange={setChangeAmount}
            placeholder="Digite o valor do troco"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Valores Rápidos:</label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="touch-target"
                >
                  R$ {amount}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex-1 h-14 text-lg font-semibold touch-target"
            >
              {isCalculating ? "Calculando..." : "Calcular Troco"}
            </Button>
            <Button variant="outline" onClick={handleReset} className="h-14 px-4 touch-target bg-transparent">
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {changeAmount > 0 && coinSuggestions.length > 0 && (
        <Card className="border-2 border-accent">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Sugestão para o Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coinSuggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <AlertDescription className="text-base">{suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-lg">{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="border-2 border-accent">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Troco a Dar</h2>
                <div className="text-6xl font-bold text-accent">{formatCurrency(result.totalChange)}</div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {getTotalPieces(result.denominations)} peça(s)
                  </Badge>
                  {!result.isOptimal && (
                    <Badge variant="outline" className="text-sm">
                      Arredondado
                    </Badge>
                  )}
                </div>

                {result.exactChange !== result.totalChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExactChange(!showExactChange)}
                    className="text-sm"
                  >
                    {showExactChange ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showExactChange ? "Ocultar" : "Ver"} troco exato
                  </Button>
                )}

                {showExactChange && result.exactChange !== result.totalChange && (
                  <div className="text-sm text-foreground/70 border-t pt-3">
                    <p>Troco exato: {formatCurrency(result.exactChange)}</p>
                    {result.message && <p className="mt-1">{result.message}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {result.denominations.length > 0 && (
            <>
              {(() => {
                const { notes, coins } = separateNotesAndCoins(result.denominations)
                return (
                  <>
                    {notes.length > 0 && <DenominationDisplay denominations={notes} title="Notas" />}
                    {coins.length > 0 && <DenominationDisplay denominations={coins} title="Moedas" />}
                  </>
                )
              })()}
            </>
          )}

          {result.message && (
            <Alert>
              <AlertDescription className="text-base">{result.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}