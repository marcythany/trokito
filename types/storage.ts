export interface StorageConfig {
  dbName: string
  version: number
  stores: {
    closings: string
    settings: string
    changeHistory: string
  }
}

export interface ClosingRecord {
  id: string
  timestamp: number
  operator?: string
  notes: string
  summary: {
    totalAmount: number
    totalNotes: number
    totalCoins: number
    totalPieces: number
    denominationCounts: Array<{
      denomination: {
        value: number
        label: string
        type: "note" | "coin"
      }
      count: number
    }>
  }
  createdAt: Date
  syncStatus: "pending" | "synced" | "error"
}

export interface ChangeRecord {
  id: string
  timestamp: number
  purchaseAmount: number
  paidAmount: number
  changeAmount: number
  changeBreakdown: Array<{
    denomination: {
      value: number
      label: string
      type: "note" | "coin"
    }
    count: number
  }>
  exactChange: number
  roundingApplied: number
  createdAt: Date
}

export interface AppSettings {
  roundingPolicy: "nearest-0.05" | "nearest-0.10" | "allow-owing-up-to-0.04"
  enabledDenominations: number[]
  prioritizeLessCoins: boolean
  toleranceCents: number
  autoLockTimeout: number
  operatorName?: string
  theme: "light" | "dark" | "auto"
  fontSize: "normal" | "large" | "extra-large"
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export interface ExportData {
  closings: ClosingRecord[]
  changeHistory: ChangeRecord[]
  settings: AppSettings
  exportDate: string
  version: string
}
