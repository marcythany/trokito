"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Lock, Fingerprint, Shield, Eye, EyeOff } from "lucide-react"
import { authManager } from "@/lib/auth"
import { isWebAuthnSupported } from "@/lib/crypto"
import type { AuthResult } from "@/types/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const config = authManager.getConfig()
  const state = authManager.getState()
  const hasPinConfigured = authManager.hasPinConfigured()
  const hasBiometricConfigured = authManager.hasBiometricConfigured()
  const webAuthnSupported = isWebAuthnSupported()

  useEffect(() => {
    const checkAuth = () => {
      const needsAuth = authManager.requiresAuth()
      setRequiresAuth(needsAuth)
      setIsLoading(false)
    }

    checkAuth()

    // Verifica periodicamente se ainda está autenticado
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePinAuth = async () => {
    if (!pin || pin.length < 4) {
      setAuthResult({ success: false, method: "pin", error: "Digite um PIN válido" })
      return
    }

    setIsAuthenticating(true)
    setAuthResult(null)

    try {
      const result = await authManager.authenticateWithPin(pin)
      setAuthResult(result)

      if (result.success) {
        setPin("")
        setRequiresAuth(false)
      }
    } catch (error) {
      setAuthResult({ success: false, method: "pin", error: "Erro interno" })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true)
    setAuthResult(null)

    try {
      const result = await authManager.authenticateWithBiometric()
      setAuthResult(result)

      if (result.success) {
        setRequiresAuth(false)
      }
    } catch (error) {
      setAuthResult({ success: false, method: "biometric", error: "Erro interno" })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.length >= 4) {
      handlePinAuth()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
          <p className="text-foreground">Verificando segurança...</p>
        </div>
      </div>
    )
  }

  if (!requiresAuth) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Shield className="h-16 w-16 text-accent mx-auto" />
          <h1 className="text-2xl font-bold text-foreground font-serif">Trokito</h1>
          <p className="text-foreground/70">App protegido por segurança</p>
        </div>

        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Autenticação Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Autenticação Biométrica */}
            {webAuthnSupported && hasBiometricConfigured && (
              <Button
                onClick={handleBiometricAuth}
                disabled={isAuthenticating}
                className="w-full h-14 text-lg font-semibold touch-target"
              >
                <Fingerprint className="h-5 w-5 mr-2" />
                {isAuthenticating && authResult?.method === "biometric" ? "Autenticando..." : "Usar Biometria"}
              </Button>
            )}

            {/* Separador */}
            {webAuthnSupported && hasBiometricConfigured && hasPinConfigured && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-foreground/60">ou</span>
                </div>
              </div>
            )}

            {/* Autenticação por PIN */}
            {hasPinConfigured && (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite seu PIN"
                    className="text-xl font-semibold h-14 pr-12 text-center touch-target"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <Button
                  onClick={handlePinAuth}
                  disabled={isAuthenticating || pin.length < 4}
                  className="w-full h-14 text-lg font-semibold touch-target"
                >
                  {isAuthenticating && authResult?.method === "pin" ? "Verificando..." : "Entrar com PIN"}
                </Button>
              </div>
            )}

            {/* Resultado da autenticação */}
            {authResult && !authResult.success && (
              <Alert variant="destructive">
                <AlertDescription className="text-base">
                  {authResult.error}
                  {authResult.remainingAttempts && (
                    <div className="mt-1 text-sm">Tentativas restantes: {authResult.remainingAttempts}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Status de bloqueio */}
            {state.lockUntil && new Date() < state.lockUntil && (
              <Alert>
                <AlertDescription className="text-base">
                  App temporariamente bloqueado. Tente novamente em alguns minutos.
                </AlertDescription>
              </Alert>
            )}

            {/* Informações sobre limitações */}
            <div className="text-xs text-foreground/60 space-y-1">
              <p>🔒 Segurança local: dados protegidos apenas neste dispositivo</p>
              {webAuthnSupported ? (
                <p>✅ Biometria disponível (impressão digital, Face ID, etc.)</p>
              ) : (
                <p>❌ Biometria não disponível neste navegador</p>
              )}
            </div>

            {/* Configuração necessária */}
            {!hasPinConfigured && !hasBiometricConfigured && (
              <Alert>
                <AlertDescription>
                  Nenhum método de autenticação configurado. Vá em Configurações para configurar PIN ou biometria.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status da sessão */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              Timeout: {config.lockTimeout}min
            </Badge>
            <Badge variant="outline" className="text-xs">
              Tentativas: {state.failedAttempts}/{config.maxAttempts}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
