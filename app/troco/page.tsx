"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ChangeCalculator } from "@/components/change-calculator"

export default function TrocoPage() {
  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="touch-target">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground font-serif">Calcular Troco</h1>
              <p className="text-sm text-foreground/70">Cálculo rápido e otimizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-md mx-auto p-4 pb-8">
        <ChangeCalculator />
      </div>
    </div>
  )
}
