"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator, FileText, Settings, HelpCircle, History } from "lucide-react"

export default function HomePage() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()
    window.addEventListener("resize", checkInstalled)

    return () => window.removeEventListener("resize", checkInstalled)
  }, [])

  const menuItems = [
    {
      title: "Calcular Troco",
      description: "Calcule o troco de forma rápida e otimizada",
      icon: Calculator,
      href: "/troco",
      color: "bg-primary",
    },
    {
      title: "Fechamento",
      description: "Faça a contagem do vale/caixa",
      icon: FileText,
      href: "/fechamento",
      color: "bg-primary",
    },
    {
      title: "Histórico",
      description: "Veja o histórico de operações",
      icon: History,
      href: "/historico",
      color: "bg-card",
    },
    {
      title: "Configurações",
      description: "Ajuste as configurações do app",
      icon: Settings,
      href: "/configuracoes",
      color: "bg-card",
    },
    {
      title: "Ajuda",
      description: "Tutorial e dicas de uso",
      icon: HelpCircle,
      href: "/ajuda",
      color: "bg-card",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold text-foreground font-serif">Trokito</h1>
          <p className="text-lg text-foreground/80">Calculadora de Troco Inteligente</p>
          {!isInstalled && (
            <p className="text-sm text-foreground/60 mt-4">💡 Adicione à tela inicial para acesso rápido</p>
          )}
        </div>

        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.href} className="border-2 border-border hover:border-accent transition-colors">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-6 flex items-center gap-4 text-left touch-target"
                    onClick={() => (window.location.href = item.href)}
                  >
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground font-serif">{item.title}</h3>
                      <p className="text-foreground/70 mt-1">{item.description}</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center text-sm text-foreground/60 py-4">
          <p>Versão 1.0 - Funciona offline</p>
          <p className="mt-1">Feito para operadores de caixa brasileiros</p>
        </div>
      </div>
    </div>
  )
}
