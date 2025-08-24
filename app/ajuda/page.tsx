"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calculator, Coins, Settings, History, ChevronRight, ChevronDown } from "lucide-react"

export default function AjudaPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handleGoBack = () => {
    window.history.back()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const tutorialSections = [
    {
      id: "troco",
      title: "Calcular Troco",
      icon: Calculator,
      description: "Como usar a calculadora de troco otimizada",
      content: [
        "1. Digite apenas o valor do troco que o PDV calculou",
        "2. O app mostra a combinação otimizada de notas e moedas",
        "3. Use a função 'Sugerir Moedas' para pedir ao cliente moedas que ajudem no arredondamento",
        "4. O sistema evita centavos e minimiza o número de peças",
        "5. Tolerância de até R$ 0,04 para arredondamento quando necessário",
      ],
    },
    {
      id: "fechamento",
      title: "Fechamento de Caixa",
      icon: Coins,
      description: "Como fazer a contagem do vale/caixa",
      content: [
        "1. Use os botões + e - para contar cada denominação",
        "2. Atalhos rápidos: toque longo para +5, duplo toque para +10",
        "3. O total é calculado automaticamente",
        "4. Adicione nome do operador e observações se necessário",
        "5. Salve o fechamento - fica armazenado offline no dispositivo",
      ],
    },
    {
      id: "configuracoes",
      title: "Configurações",
      icon: Settings,
      description: "Personalize o app para suas necessidades",
      content: [
        "1. Política de arredondamento: escolha como arredondar valores",
        "2. Denominações ativas: desative moedas que sua loja não usa",
        "3. Priorizar menos moedas: minimize o número de moedas no troco",
        "4. Configurações de segurança: PIN e timeout de bloqueio",
        "5. Aparência: ajuste tema, tamanho da fonte e feedback",
      ],
    },
    {
      id: "historico",
      title: "Histórico",
      icon: History,
      description: "Consulte registros anteriores",
      content: [
        "1. Veja todos os fechamentos salvos",
        "2. Histórico de cálculos de troco realizados",
        "3. Exporte dados em CSV para backup",
        "4. Copie informações para a área de transferência",
        "5. Limpe registros antigos quando necessário",
      ],
    },
  ]

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
              <h1 className="text-xl font-bold text-foreground font-serif">Ajuda</h1>
              <p className="text-sm text-foreground/70">Tutorial e guia de uso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-md mx-auto p-4 pb-8 space-y-6">
        {/* Introdução */}
        <Card className="border-2 border-accent">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao Trokito!</h2>
            <p className="text-foreground/80 mb-4">
              Ferramenta offline para operadores de caixa no Brasil. Calcule troco otimizado e faça fechamentos rápidos.
            </p>
            <Badge variant="secondary" className="text-sm">
              Funciona 100% offline
            </Badge>
          </CardContent>
        </Card>

        {/* Modo Rápido */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">🚀 Modo Rápido</h3>
            <p className="text-sm text-foreground/80 mb-3">
              Para usar rapidamente: vá em <strong>Calcular Troco</strong>, digite o valor do troco e veja a sugestão
              otimizada!
            </p>
          </CardContent>
        </Card>

        {/* Tutorial Sections */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Tutorial Completo</h3>

          {tutorialSections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSection === section.id

            return (
              <Card key={section.id} className="border border-border">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-accent" />
                      {section.title}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-foreground/60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-foreground/60" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-foreground/70">{section.description}</p>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {section.content.map((step, index) => (
                        <p key={index} className="text-sm text-foreground/80 leading-relaxed">
                          {step}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Dicas Importantes */}
        <Card className="border border-border bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">💡 Dicas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-foreground/80">
              • <strong>Tolerância de R$ 0,04:</strong> O app pode sugerir arredondar até 4 centavos para evitar usar
              centavos
            </p>
            <p className="text-sm text-foreground/80">
              • <strong>Sem centavos:</strong> O sistema não usa moedas de 1 centavo (fora de circulação prática)
            </p>
            <p className="text-sm text-foreground/80">
              • <strong>Offline:</strong> Todos os dados ficam salvos no seu dispositivo, funciona sem internet
            </p>
            <p className="text-sm text-foreground/80">
              • <strong>Segurança:</strong> Use PIN ou biometria para proteger os dados
            </p>
          </CardContent>
        </Card>

        {/* Suporte */}
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-foreground mb-2">Precisa de mais ajuda?</h3>
            <p className="text-sm text-foreground/70 mb-3">
              Este app foi desenvolvido especialmente para operadores de caixa com discalculia.
            </p>
            <p className="text-xs text-foreground/60">Versão 1.0 - Desenvolvido para o mercado brasileiro</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
