"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Palette, Smartphone, Shield, Coins } from "lucide-react"
import { storage, DEFAULT_SETTINGS } from "@/lib/storage"
import { BRAZILIAN_DENOMINATIONS } from "@/lib/currency-utils"
import type { AppSettings } from "@/types/storage"

export function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getSettings()
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await storage.saveSettings(settings)
      // Feedback visual de sucesso
      if (settings.vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate(200)
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleDenomination = (value: number) => {
    const enabled = settings.enabledDenominations.includes(value)
    if (enabled) {
      updateSetting(
        "enabledDenominations",
        settings.enabledDenominations.filter((d) => d !== value),
      )
    } else {
      updateSetting(
        "enabledDenominations",
        [...settings.enabledDenominations, value].sort((a, b) => b - a),
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-foreground/70">Carregando configurações...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Operador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operator-name">Nome do Operador (opcional)</Label>
              <Input
                id="operator-name"
                value={settings.operatorName || ""}
                onChange={(e) => updateSetting("operatorName", e.target.value)}
                placeholder="Digite seu nome"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cálculo de Troco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Cálculo de Troco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Política de Arredondamento</Label>
            <Select
              value={settings.roundingPolicy}
              onValueChange={(value: AppSettings["roundingPolicy"]) => updateSetting("roundingPolicy", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow-owing-up-to-0.04">Permitir dever até R$ 0,04 (Recomendado)</SelectItem>
                <SelectItem value="nearest-0.05">Arredondar para múltiplos de R$ 0,05</SelectItem>
                <SelectItem value="nearest-0.10">Arredondar para múltiplos de R$ 0,10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Priorizar Menos Moedas</Label>
              <p className="text-sm text-foreground/70 mt-1">Minimiza o número de moedas no troco</p>
            </div>
            <Switch
              checked={settings.prioritizeLessCoins}
              onCheckedChange={(checked) => updateSetting("prioritizeLessCoins", checked)}
            />
          </div>

          <div>
            <Label>Tolerância em Centavos</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={settings.toleranceCents}
              onChange={(e) => updateSetting("toleranceCents", Number.parseInt(e.target.value) || 0)}
              className="mt-2"
            />
            <p className="text-sm text-foreground/70 mt-1">Máximo de centavos que pode ser devido (0-10)</p>
          </div>
        </CardContent>
      </Card>

      {/* Denominações Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Denominações Ativas</CardTitle>
          <p className="text-sm text-foreground/70">Selecione quais notas e moedas estão disponíveis no seu caixa</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Notas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BRAZILIAN_DENOMINATIONS.filter((d) => d.type === "note").map((denomination) => (
                  <Badge
                    key={denomination.value}
                    variant={settings.enabledDenominations.includes(denomination.value) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => toggleDenomination(denomination.value)}
                  >
                    {denomination.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Moedas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BRAZILIAN_DENOMINATIONS.filter((d) => d.type === "coin").map((denomination) => (
                  <Badge
                    key={denomination.value}
                    variant={settings.enabledDenominations.includes(denomination.value) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => toggleDenomination(denomination.value)}
                  >
                    {denomination.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: AppSettings["theme"]) => updateSetting("theme", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (Sistema)</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tamanho da Fonte</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value: AppSettings["fontSize"]) => updateSetting("fontSize", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Grande (Recomendado)</SelectItem>
                <SelectItem value="extra-large">Extra Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sons</Label>
              <p className="text-sm text-foreground/70 mt-1">Feedback sonoro para ações</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Vibração</Label>
              <p className="text-sm text-foreground/70 mt-1">Feedback tátil para ações</p>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting("vibrationEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Timeout de Bloqueio (minutos)</Label>
            <Input
              type="number"
              min="1"
              max="60"
              value={Math.round(settings.autoLockTimeout / 60000)}
              onChange={(e) => updateSetting("autoLockTimeout", (Number.parseInt(e.target.value) || 5) * 60000)}
              className="mt-2"
            />
            <p className="text-sm text-foreground/70 mt-1">Tempo para bloquear automaticamente o app (1-60 minutos)</p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-center pt-4">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="min-w-48">
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
