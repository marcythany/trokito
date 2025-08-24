"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Lock, Fingerprint, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { authManager } from "@/lib/auth"
import { isWebAuthnSupported } from "@/lib/crypto"
import type { AuthConfig } from "@/types/auth"

export function SecuritySettings() {
  const [config, setConfig] = useState<AuthConfig>(authManager.getConfig())
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showPins, setShowPins] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const state = authManager.getState()
  const hasPinConfigured = authManager.hasPinConfigured()
  const hasBiometricConfigured = authManager.hasBiometricConfigured()
  const webAuthnSupported = isWebAuthnSupported()

  useEffect(() => {
    setConfig(authManager.getConfig())
  }, [])

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleConfigChange = (key: keyof AuthConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    authManager.updateConfig({ [key]: value })
    showMessage("success", "Configuração atualizada")
  }

  const handleSetupPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      showMessage("error", "PIN deve ter entre 4 e 6 dígitos")
      return
    }

    if (!/^\d+$/.test(newPin)) {
      showMessage("error", "PIN deve conter apenas números")
      return
    }

    if (newPin !== confirmPin) {
      showMessage("error", "PINs não coincidem")
      return
    }

    setIsLoading(true)

    try {
      const success = await authManager.setupPin(newPin)
      if (success) {
        setNewPin("")
        setConfirmPin("")
        showMessage("success", "PIN configurado com sucesso")
      } else {
        showMessage("error", "Erro ao configurar PIN")
      }
    } catch {
      showMessage("error", "Erro interno ao configurar PIN")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupBiometric = async () => {
    if (!webAuthnSupported) {
      showMessage("error", "Biometria não suportada neste navegador")
      return
    }

    setIsLoading(true)

    try {
      const success = await authManager.setupBiometric()
      if (success) {
        showMessage("success", "Biometria configurada com sucesso")
      } else {
        showMessage("error", "Erro ao configurar biometria")
      }
    } catch {
      showMessage("error", "Erro interno ao configurar biometria")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePin = () => {
    if (confirm("Tem certeza que deseja remover o PIN? Isso pode deixar o app menos seguro.")) {
      authManager.removePin()
      showMessage("success", "PIN removido")
    }
  }

  const handleRemoveBiometric = () => {
    if (confirm("Tem certeza que deseja remover a biometria?")) {
      authManager.removeBiometric()
      showMessage("success", "Biometria removida")
    }
  }

  const handleResetAuth = () => {
    if (
      confirm(
        "ATENÇÃO: Isso irá remover TODAS as configurações de segurança e desbloquear o app. Tem certeza que deseja continuar?",
      )
    ) {
      authManager.resetAuth()
      setConfig(authManager.getConfig())
      showMessage("success", "Configurações de segurança resetadas")
    }
  }

  return (
    <div className="space-y-6">
      {/* Status da Segurança */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status da Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Proteção Ativa</span>
            <Badge variant={config.requireAuth ? "default" : "outline"}>
              {config.requireAuth ? "Ativada" : "Desativada"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground">PIN Configurado</span>
            <Badge variant={hasPinConfigured ? "default" : "outline"}>{hasPinConfigured ? "Sim" : "Não"}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground">Biometria Configurada</span>
            <Badge variant={hasBiometricConfigured ? "default" : "outline"}>
              {hasBiometricConfigured ? "Sim" : "Não"}
            </Badge>
          </div>

          {state.authMethod !== "none" && (
            <div className="flex items-center justify-between">
              <span className="text-foreground">Último Método</span>
              <Badge variant="secondary">{state.authMethod === "pin" ? "PIN" : "Biometria"}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground">Exigir Autenticação</Label>
              <p className="text-sm text-foreground/70">Protege o app com PIN ou biometria</p>
            </div>
            <Switch
              checked={config.requireAuth}
              onCheckedChange={(checked) => handleConfigChange("requireAuth", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-foreground">Timeout de Bloqueio (minutos)</Label>
            <Input
              type="number"
              value={config.lockTimeout}
              onChange={(e) => handleConfigChange("lockTimeout", Number.parseInt(e.target.value) || 15)}
              min="1"
              max="60"
              className="h-12"
            />
            <p className="text-xs text-foreground/60">App bloqueia automaticamente após inatividade</p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Máximo de Tentativas</Label>
            <Input
              type="number"
              value={config.maxAttempts}
              onChange={(e) => handleConfigChange("maxAttempts", Number.parseInt(e.target.value) || 3)}
              min="1"
              max="10"
              className="h-12"
            />
            <p className="text-xs text-foreground/60">Bloqueia temporariamente após tentativas falhadas</p>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de PIN */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5" />
            PIN de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPinConfigured ? (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>PIN já configurado. Configure um novo para substituir o atual.</AlertDescription>
              </Alert>
              <Button variant="destructive" onClick={handleRemovePin} className="w-full touch-target">
                <Trash2 className="h-4 w-4 mr-2" />
                Remover PIN
              </Button>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-foreground">Novo PIN (4-6 dígitos)</Label>
              <div className="relative">
                <Input
                  type={showPins ? "text" : "password"}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Digite o PIN"
                  className="text-xl font-semibold h-12 pr-12 text-center"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPins(!showPins)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Confirmar PIN</Label>
              <Input
                type={showPins ? "text" : "password"}
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Confirme o PIN"
                className="text-xl font-semibold h-12 text-center"
                maxLength={6}
              />
            </div>

            <Button
              onClick={handleSetupPin}
              disabled={isLoading || newPin.length < 4 || newPin !== confirmPin}
              className="w-full h-12 touch-target"
            >
              {isLoading ? "Configurando..." : hasPinConfigured ? "Alterar PIN" : "Configurar PIN"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Biometria */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticação Biométrica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!webAuthnSupported ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Biometria não suportada neste navegador. Use um navegador moderno com suporte a WebAuthn.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground/70">
                Use impressão digital, Face ID, ou outros métodos biométricos do seu dispositivo.
              </p>

              {hasBiometricConfigured ? (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>Biometria já configurada e funcionando.</AlertDescription>
                  </Alert>
                  <Button variant="destructive" onClick={handleRemoveBiometric} className="w-full touch-target">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Biometria
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSetupBiometric} disabled={isLoading} className="w-full h-12 touch-target">
                  <Fingerprint className="h-4 w-4 mr-2" />
                  {isLoading ? "Configurando..." : "Configurar Biometria"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Reset de Segurança */}
      <Card className="border border-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-foreground/70">
              Remove todas as configurações de segurança e desbloqueia o app permanentemente.
            </p>
            <Button variant="destructive" onClick={handleResetAuth} className="w-full touch-target">
              <Trash2 className="h-4 w-4 mr-2" />
              Resetar Toda Segurança
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Limitações */}
      <Alert>
        <AlertDescription className="text-sm space-y-2">
          <p className="font-medium">Limitações da Segurança Web:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Dados protegidos apenas neste dispositivo e navegador</li>
            <li>Limpeza de dados do navegador remove as configurações</li>
            <li>Biometria depende do suporte do dispositivo e navegador</li>
            <li>Não substitui medidas de segurança profissionais</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
