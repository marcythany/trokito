import type { StorageConfig, ClosingRecord, ChangeRecord, AppSettings } from "@/types/storage"

const CONFIG: StorageConfig = {
  dbName: "TrokitoDB",
  version: 1,
  stores: {
    closings: "closings",
    settings: "settings",
    changeHistory: "changeHistory",
  },
}

class TrokitoStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.dbName, CONFIG.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store para fechamentos
        if (!db.objectStoreNames.contains(CONFIG.stores.closings)) {
          const closingsStore = db.createObjectStore(CONFIG.stores.closings, { keyPath: "id" })
          closingsStore.createIndex("timestamp", "timestamp", { unique: false })
          closingsStore.createIndex("operator", "operator", { unique: false })
          closingsStore.createIndex("syncStatus", "syncStatus", { unique: false })
        }

        // Store para histórico de troco
        if (!db.objectStoreNames.contains(CONFIG.stores.changeHistory)) {
          const changeStore = db.createObjectStore(CONFIG.stores.changeHistory, { keyPath: "id" })
          changeStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Store para configurações
        if (!db.objectStoreNames.contains(CONFIG.stores.settings)) {
          db.createObjectStore(CONFIG.stores.settings, { keyPath: "key" })
        }
      }
    })

    return this.initPromise
  }

  private async ensureInit(): Promise<void> {
    if (!this.db) {
      await this.init()
    }
  }

  // Fechamentos
  async saveClosing(closing: Omit<ClosingRecord, "id" | "createdAt" | "syncStatus">): Promise<string> {
    await this.ensureInit()

    const record: ClosingRecord = {
      ...closing,
      id: `closing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      syncStatus: "pending",
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.closings], "readwrite")
      const store = transaction.objectStore(CONFIG.stores.closings)
      const request = store.add(record)

      request.onsuccess = () => resolve(record.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getClosings(limit?: number): Promise<ClosingRecord[]> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.closings], "readonly")
      const store = transaction.objectStore(CONFIG.stores.closings)
      const index = store.index("timestamp")
      const request = index.openCursor(null, "prev") // Mais recentes primeiro

      const results: ClosingRecord[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async deleteClosing(id: string): Promise<void> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.closings], "readwrite")
      const store = transaction.objectStore(CONFIG.stores.closings)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Histórico de troco
  async saveChangeCalculation(change: Omit<ChangeRecord, "id" | "createdAt">): Promise<string> {
    await this.ensureInit()

    const record: ChangeRecord = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.changeHistory], "readwrite")
      const store = transaction.objectStore(CONFIG.stores.changeHistory)
      const request = store.add(record)

      request.onsuccess = () => resolve(record.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getChangeHistory(limit?: number): Promise<ChangeRecord[]> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.changeHistory], "readonly")
      const store = transaction.objectStore(CONFIG.stores.changeHistory)
      const index = store.index("timestamp")
      const request = index.openCursor(null, "prev")

      const results: ChangeRecord[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Configurações
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.settings], "readwrite")
      const store = transaction.objectStore(CONFIG.stores.settings)
      const request = store.put({ key: "app_settings", value: settings })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSettings(): Promise<AppSettings | null> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG.stores.settings], "readonly")
      const store = transaction.objectStore(CONFIG.stores.settings)
      const request = store.get("app_settings")

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Limpeza e manutenção
  async clearOldRecords(daysToKeep = 90): Promise<void> {
    await this.ensureInit()
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000

    const stores = [CONFIG.stores.closings, CONFIG.stores.changeHistory]

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const index = store.index("timestamp")
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate))

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

  async getStorageStats(): Promise<{
    closingsCount: number
    changeHistoryCount: number
    estimatedSize: number
  }> {
    await this.ensureInit()

    const closingsCount = await this.getRecordCount(CONFIG.stores.closings)
    const changeHistoryCount = await this.getRecordCount(CONFIG.stores.changeHistory)

    // Estimativa aproximada do tamanho (não é precisa, mas dá uma ideia)
    const estimatedSize = closingsCount * 1000 + changeHistoryCount * 500 // bytes aproximados

    return {
      closingsCount,
      changeHistoryCount,
      estimatedSize,
    }
  }

  private async getRecordCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const storage = new TrokitoStorage()

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  roundingPolicy: "allow-owing-up-to-0.04",
  enabledDenominations: [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5], // valores em centavos
  prioritizeLessCoins: true,
  toleranceCents: 4,
  autoLockTimeout: 300000, // 5 minutos
  theme: "auto",
  fontSize: "large",
  soundEnabled: true,
  vibrationEnabled: true,
}
