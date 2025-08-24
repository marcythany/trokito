import { InputValidator } from "./validation"

export interface SecureStorageOptions {
  encrypt?: boolean
  validate?: boolean
  maxAge?: number // em milissegundos
}

export class SecureStorage {
  private static instance: SecureStorage
  private dbName = "trokito-secure-db"
  private version = 2 // Incrementando versão para incluir validação
  private db: IDBDatabase | null = null

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store para dados criptografados
        if (!db.objectStoreNames.contains("encrypted-data")) {
          const store = db.createObjectStore("encrypted-data", { keyPath: "key" })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("type", "type", { unique: false })
        }

        // Store para logs de segurança
        if (!db.objectStoreNames.contains("security-logs")) {
          const logStore = db.createObjectStore("security-logs", { keyPath: "id", autoIncrement: true })
          logStore.createIndex("timestamp", "timestamp", { unique: false })
          logStore.createIndex("type", "type", { unique: false })
        }
      }
    })
  }

  async setSecure(key: string, value: any, options: SecureStorageOptions = {}): Promise<void> {
    if (!this.db) await this.init()

    // Validar chave
    const sanitizedKey = InputValidator.sanitizeString(key)
    if (!sanitizedKey) {
      throw new Error("Chave inválida")
    }

    // Validar e sanitizar valor baseado no tipo
    let sanitizedValue = value
    if (options.validate) {
      sanitizedValue = this.validateAndSanitizeValue(key, value)
    }

    const timestamp = Date.now()
    const expiresAt = options.maxAge ? timestamp + options.maxAge : null

    const dataToStore = {
      key: sanitizedKey,
      value: sanitizedValue,
      timestamp,
      expiresAt,
      type: typeof value,
    }

    // Criptografar se solicitado
    if (options.encrypt) {
      dataToStore.value = await this.encrypt(JSON.stringify(sanitizedValue))
      dataToStore.type = "encrypted"
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["encrypted-data"], "readwrite")
      const store = transaction.objectStore("encrypted-data")
      const request = store.put(dataToStore)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.logSecurityEvent("data_stored", { key: sanitizedKey, encrypted: !!options.encrypt })
        resolve()
      }
    })
  }

  private validateAndSanitizeValue(key: string, value: any): any {
    // Validação específica baseada na chave
    if (key.includes("currency") || key.includes("troco") || key.includes("valor")) {
      if (typeof value === "string" || typeof value === "number") {
        const validation = InputValidator.validateCurrency(value)
        if (!validation.isValid) {
          throw new Error(`Valor inválido: ${validation.errors.join(", ")}`)
        }
        return validation.sanitizedValue
      }
    }

    if (key.includes("quantity") || key.includes("quantidade")) {
      const validation = InputValidator.validateQuantity(value)
      if (!validation.isValid) {
        throw new Error(`Quantidade inválida: ${validation.errors.join(", ")}`)
      }
      return validation.sanitizedValue
    }

    if (key.includes("operator") || key.includes("operador")) {
      const validation = InputValidator.validateOperatorName(value)
      if (!validation.isValid) {
        throw new Error(`Nome inválido: ${validation.errors.join(", ")}`)
      }
      return validation.sanitizedValue
    }

    // Sanitização geral para strings
    if (typeof value === "string") {
      return InputValidator.sanitizeString(value)
    }

    return value
  }

  async getSecure(key: string): Promise<any> {
    if (!this.db) await this.init()

    const sanitizedKey = InputValidator.sanitizeString(key)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["encrypted-data"], "readonly")
      const store = transaction.objectStore("encrypted-data")
      const request = store.get(sanitizedKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const result = request.result

        if (!result) {
          resolve(null)
          return
        }

        // Verificar expiração
        if (result.expiresAt && Date.now() > result.expiresAt) {
          await this.deleteSecure(sanitizedKey)
          resolve(null)
          return
        }

        let value = result.value

        // Descriptografar se necessário
        if (result.type === "encrypted") {
          try {
            const decrypted = await this.decrypt(value)
            value = JSON.parse(decrypted)
          } catch (error) {
            this.logSecurityEvent("decryption_failed", { key: sanitizedKey, error: error.message })
            reject(new Error("Falha na descriptografia"))
            return
          }
        }

        this.logSecurityEvent("data_accessed", { key: sanitizedKey })
        resolve(value)
      }
    })
  }

  private async logSecurityEvent(type: string, details: any): Promise<void> {
    if (!this.db) return

    const logEntry = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 200), // Limitado para segurança
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["security-logs"], "readwrite")
      const store = transaction.objectStore("security-logs")
      const request = store.add(logEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => resolve() // Não falhar se log não funcionar
    })
  }

  async cleanOldLogs(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init()

    const cutoff = Date.now() - maxAge

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["security-logs"], "readwrite")
      const store = transaction.objectStore("security-logs")
      const index = store.index("timestamp")
      const range = IDBKeyRange.upperBound(cutoff)
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}
