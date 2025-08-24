export async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Deriva uma chave a partir de um PIN usando PBKDF2
export async function deriveKeyFromPin(pin: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, [
    "deriveBits",
    "deriveKey",
  ])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

// Hash do PIN para armazenamento
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Verifica se um PIN está correto
export async function verifyPin(pin: string, hashedPin: string, salt: string): Promise<boolean> {
  const computedHash = await hashPin(pin, salt)
  return computedHash === hashedPin
}

// Criptografa dados usando AES-GCM
export async function encryptData(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(data))

  return {
    encrypted: Array.from(new Uint8Array(encrypted), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    iv: Array.from(iv, (byte) => byte.toString(16).padStart(2, "0")).join(""),
  }
}

// Descriptografa dados usando AES-GCM
export async function decryptData(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder()
  const encrypted = new Uint8Array(encryptedData.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))
  const ivArray = new Uint8Array(iv.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivArray }, key, encrypted)

  return decoder.decode(decrypted)
}

// Verifica se WebAuthn está disponível
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && "credentials" in navigator && "create" in navigator.credentials
}

// Gera um challenge aleatório para WebAuthn
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}
