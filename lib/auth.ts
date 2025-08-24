import type { AuthConfig, AuthState, PinData, BiometricCredential, AuthResult } from "@/types/auth"
import { hashPin, verifyPin, generateSalt, isWebAuthnSupported, generateChallenge } from "./crypto"

// Configuração padrão de autenticação
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  requireAuth: false, // Desabilitado por padrão
  lockTimeout: 15, // 15 minutos
  pinLength: 4,
  maxAttempts: 3,
  biometricEnabled: true,
}

// Chaves para localStorage/IndexedDB
const STORAGE_KEYS = {
  AUTH_CONFIG: "trokito_auth_config",
  AUTH_STATE: "trokito_auth_state",
  PIN_DATA: "trokito_pin_data",
  BIOMETRIC_CREDENTIAL: "trokito_biometric_credential",
}

// Gerenciador de autenticação
export class AuthManager {
  private config: AuthConfig
  private state: AuthState
  private lockTimer?: NodeJS.Timeout

  constructor() {
    this.config = this.loadConfig()
    this.state = this.loadState()
    this.setupLockTimer()
  }

  // Carrega configuração do localStorage
  private loadConfig(): AuthConfig {
    if (typeof window === "undefined") return DEFAULT_AUTH_CONFIG

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_CONFIG)
      return stored ? { ...DEFAULT_AUTH_CONFIG, ...JSON.parse(stored) } : DEFAULT_AUTH_CONFIG
    } catch {
      return DEFAULT_AUTH_CONFIG
    }
  }

  // Carrega estado do localStorage
  private loadState(): AuthState {
    if (typeof window === "undefined") {
      return {
        isAuthenticated: false,
        isLocked: false,
        lastActivity: new Date(),
        failedAttempts: 0,
        authMethod: "none",
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_STATE)
      if (stored) {
        const state = JSON.parse(stored)
        state.lastActivity = new Date(state.lastActivity)
        if (state.lockUntil) state.lockUntil = new Date(state.lockUntil)
        return state
      }
    } catch {
      // Ignora erros de parsing
    }

    return {
      isAuthenticated: false,
      isLocked: false,
      lastActivity: new Date(),
      failedAttempts: 0,
      authMethod: "none",
    }
  }

  // Salva configuração no localStorage
  private saveConfig(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.AUTH_CONFIG, JSON.stringify(this.config))
    }
  }

  // Salva estado no localStorage
  private saveState(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(this.state))
    }
  }

  // Configura timer de bloqueio automático
  private setupLockTimer(): void {
    if (this.lockTimer) clearTimeout(this.lockTimer)

    if (this.config.requireAuth && this.state.isAuthenticated) {
      this.lockTimer = setTimeout(
        () => {
          this.lock()
        },
        this.config.lockTimeout * 60 * 1000,
      )
    }
  }

  // Atualiza atividade do usuário
  private updateActivity(): void {
    this.state.lastActivity = new Date()
    this.saveState()
    this.setupLockTimer()
  }

  // Verifica se está bloqueado temporariamente
  private isTemporarilyLocked(): boolean {
    if (!this.state.lockUntil) return false
    return new Date() < this.state.lockUntil
  }

  // Obtém configuração atual
  getConfig(): AuthConfig {
    return { ...this.config }
  }

  // Obtém estado atual
  getState(): AuthState {
    return { ...this.state }
  }

  // Atualiza configuração
  updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()

    // Se desabilitou autenticação, desbloqueia
    if (!this.config.requireAuth) {
      this.state.isAuthenticated = true
      this.state.isLocked = false
      this.saveState()
    }
  }

  // Verifica se precisa de autenticação
  requiresAuth(): boolean {
    return this.config.requireAuth && (!this.state.isAuthenticated || this.state.isLocked)
  }

  // Configura PIN
  async setupPin(pin: string): Promise<boolean> {
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return false
    }

    try {
      const salt = await generateSalt()
      const hashedPin = await hashPin(pin, salt)

      const pinData: PinData = {
        hashedPin,
        salt,
        createdAt: new Date(),
      }

      localStorage.setItem(STORAGE_KEYS.PIN_DATA, JSON.stringify(pinData))
      return true
    } catch {
      return false
    }
  }

  // Autentica com PIN
  async authenticateWithPin(pin: string): Promise<AuthResult> {
    if (this.isTemporarilyLocked()) {
      return {
        success: false,
        method: "pin",
        error: "Muitas tentativas. Tente novamente mais tarde.",
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PIN_DATA)
      if (!stored) {
        return { success: false, method: "pin", error: "PIN não configurado" }
      }

      const pinData: PinData = JSON.parse(stored)
      const isValid = await verifyPin(pin, pinData.hashedPin, pinData.salt)

      if (isValid) {
        this.state.isAuthenticated = true
        this.state.isLocked = false
        this.state.failedAttempts = 0
        this.state.authMethod = "pin"
        this.state.lockUntil = undefined
        this.updateActivity()

        // Atualiza último uso
        pinData.lastUsed = new Date()
        localStorage.setItem(STORAGE_KEYS.PIN_DATA, JSON.stringify(pinData))

        return { success: true, method: "pin" }
      } else {
        this.state.failedAttempts++
        this.saveState()

        // Bloqueia temporariamente após muitas tentativas
        if (this.state.failedAttempts >= this.config.maxAttempts) {
          this.state.lockUntil = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
          this.saveState()
          return {
            success: false,
            method: "pin",
            error: "Muitas tentativas incorretas. Bloqueado por 5 minutos.",
          }
        }

        return {
          success: false,
          method: "pin",
          error: "PIN incorreto",
          remainingAttempts: this.config.maxAttempts - this.state.failedAttempts,
        }
      }
    } catch {
      return { success: false, method: "pin", error: "Erro ao verificar PIN" }
    }
  }

  // Configura autenticação biométrica
  async setupBiometric(): Promise<boolean> {
    if (!isWebAuthnSupported()) return false

    try {
      const challenge = generateChallenge()

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Trokito",
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: "Operador Trokito",
            displayName: "Operador",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      })

      if (credential) {
        const biometricData: BiometricCredential = {
          id: credential.id,
          publicKey: "", // Simplificado para o exemplo
          counter: 0,
          createdAt: new Date(),
        }

        localStorage.setItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL, JSON.stringify(biometricData))
        return true
      }

      return false
    } catch {
      return false
    }
  }

  // Autentica com biometria
  async authenticateWithBiometric(): Promise<AuthResult> {
    if (!isWebAuthnSupported()) {
      return { success: false, method: "biometric", error: "Biometria não suportada" }
    }

    if (this.isTemporarilyLocked()) {
      return {
        success: false,
        method: "biometric",
        error: "Muitas tentativas. Tente novamente mais tarde.",
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL)
      if (!stored) {
        return { success: false, method: "biometric", error: "Biometria não configurada" }
      }

      const biometricData: BiometricCredential = JSON.parse(stored)
      const challenge = generateChallenge()

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: new TextEncoder().encode(biometricData.id),
              type: "public-key",
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      })

      if (assertion) {
        this.state.isAuthenticated = true
        this.state.isLocked = false
        this.state.failedAttempts = 0
        this.state.authMethod = "biometric"
        this.state.lockUntil = undefined
        this.updateActivity()

        // Atualiza último uso
        biometricData.lastUsed = new Date()
        localStorage.setItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL, JSON.stringify(biometricData))

        return { success: true, method: "biometric" }
      }

      return { success: false, method: "biometric", error: "Falha na autenticação biométrica" }
    } catch (error) {
      // Incrementa tentativas falhadas apenas para erros não relacionados ao cancelamento
      if (error instanceof Error && !error.message.includes("cancel")) {
        this.state.failedAttempts++
        this.saveState()
      }

      return { success: false, method: "biometric", error: "Erro na autenticação biométrica" }
    }
  }

  // Bloqueia o app
  lock(): void {
    this.state.isLocked = true
    this.state.isAuthenticated = false
    this.saveState()

    if (this.lockTimer) {
      clearTimeout(this.lockTimer)
      this.lockTimer = undefined
    }
  }

  // Desbloqueia o app (apenas internamente após autenticação)
  private unlock(): void {
    this.state.isLocked = false
    this.state.isAuthenticated = true
    this.updateActivity()
  }

  // Verifica se tem PIN configurado
  hasPinConfigured(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.PIN_DATA)
  }

  // Verifica se tem biometria configurada
  hasBiometricConfigured(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL)
  }

  // Remove PIN
  removePin(): void {
    localStorage.removeItem(STORAGE_KEYS.PIN_DATA)
  }

  // Remove biometria
  removeBiometric(): void {
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL)
  }

  // Reset completo da autenticação
  resetAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_CONFIG)
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE)
    localStorage.removeItem(STORAGE_KEYS.PIN_DATA)
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL)

    this.config = DEFAULT_AUTH_CONFIG
    this.state = {
      isAuthenticated: false,
      isLocked: false,
      lastActivity: new Date(),
      failedAttempts: 0,
      authMethod: "none",
    }

    if (this.lockTimer) {
      clearTimeout(this.lockTimer)
      this.lockTimer = undefined
    }
  }
}

// Instância global do gerenciador de autenticação
export const authManager = new AuthManager()
