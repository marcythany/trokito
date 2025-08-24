export interface AuthConfig {
  requireAuth: boolean
  lockTimeout: number // em minutos
  pinLength: number // 4-6 dígitos
  maxAttempts: number
  biometricEnabled: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  isLocked: boolean
  lastActivity: Date
  failedAttempts: number
  authMethod: "none" | "pin" | "biometric"
  lockUntil?: Date
}

export interface PinData {
  hashedPin: string
  salt: string
  createdAt: Date
  lastUsed?: Date
}

export interface BiometricCredential {
  id: string
  publicKey: string
  counter: number
  createdAt: Date
  lastUsed?: Date
}

export interface AuthResult {
  success: boolean
  method: "pin" | "biometric"
  error?: string
  remainingAttempts?: number
}
