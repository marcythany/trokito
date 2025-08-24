"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus } from "lucide-react"
import type { DenominationCount } from "@/types/closing"
import { formatCurrency } from "@/lib/currency-utils"
import { getQuickCountOptions } from "@/lib/closing-calculator"

interface DenominationCounterProps {
  item: DenominationCount
  onCountChange: (newCount: number) => void
  className?: string
}

export function DenominationCounter({ item, onCountChange, className }: DenominationCounterProps) {
  const [inputValue, setInputValue] = useState(item.count.toString())

  const handleInputChange = (value: string) => {
    setInputValue(value)
    const numericValue = Number.parseInt(value) || 0
    onCountChange(numericValue)
  }

  const handleIncrement = (amount = 1) => {
    const newCount = Math.max(0, item.count + amount)
    onCountChange(newCount)
    setInputValue(newCount.toString())
  }

  const handleDecrement = (amount = 1) => {
    const newCount = Math.max(0, item.count - amount)
    onCountChange(newCount)
    setInputValue(newCount.toString())
  }

  const quickOptions = getQuickCountOptions(item.denomination.value)
  const totalValue = item.denomination.value * item.count

  return (
    <Card className={`border-2 hover:border-accent/50 transition-colors ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-12 h-8 rounded-md flex items-center justify-center text-xs font-bold border-2 ${
                item.denomination.type === "note"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-secondary text-secondary-foreground border-secondary"
              }`}
            >
              {item.denomination.type === "note" ? "R$" : "¢"}
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-foreground leading-tight">{item.denomination.label}</div>
              {totalValue > 0 && <div className="text-xs text-accent font-semibold">{formatCurrency(totalValue)}</div>}
            </div>
          </div>
          {item.count > 0 && (
            <Badge variant="default" className="text-base font-bold px-2 py-1 bg-accent text-accent-foreground">
              {item.count}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDecrement()}
            disabled={item.count === 0}
            className="touch-target h-10 w-10 p-0 border-2"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="text-center text-base font-bold h-10 flex-1 border-2"
            min="0"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleIncrement()}
            className="touch-target h-10 w-10 p-0 border-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 justify-center">
          {quickOptions.map((option) => (
            <Button
              key={option}
              variant="ghost"
              size="sm"
              onClick={() => handleIncrement(option)}
              className="text-xs h-7 px-2 hover:bg-accent/20"
            >
              +{option}
            </Button>
          ))}
          {item.count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onCountChange(0)
                setInputValue("0")
              }}
              className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
            >
              Zerar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
