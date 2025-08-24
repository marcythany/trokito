import type { ExportData, AppSettings } from "@/types/storage"
import { storage } from "./storage"

export class ExportManager {
  // Export para CSV
  static async exportClosingsToCSV(): Promise<string> {
    const closings = await storage.getClosings()

    const headers = [
      "Data/Hora",
      "Operador",
      "Total (R$)",
      "Total Notas (R$)",
      "Total Moedas (R$)",
      "Total Peças",
      "Observações",
    ]

    const rows = closings.map((closing) => [
      new Date(closing.timestamp).toLocaleString("pt-BR"),
      closing.operator || "N/A",
      (closing.summary.totalAmount / 100).toFixed(2),
      (closing.summary.totalNotes / 100).toFixed(2),
      (closing.summary.totalCoins / 100).toFixed(2),
      closing.summary.totalPieces.toString(),
      closing.notes || "",
    ])

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
  }

  static async exportChangeHistoryToCSV(): Promise<string> {
    const history = await storage.getChangeHistory()

    const headers = [
      "Data/Hora",
      "Valor Compra (R$)",
      "Valor Pago (R$)",
      "Troco (R$)",
      "Troco Exato (R$)",
      "Arredondamento (R$)",
    ]

    const rows = history.map((record) => [
      new Date(record.timestamp).toLocaleString("pt-BR"),
      (record.purchaseAmount / 100).toFixed(2),
      (record.paidAmount / 100).toFixed(2),
      (record.changeAmount / 100).toFixed(2),
      (record.exactChange / 100).toFixed(2),
      (record.roundingApplied / 100).toFixed(2),
    ])

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
  }

  // Export completo em JSON
  static async exportAllData(): Promise<ExportData> {
    const [closings, changeHistory, settings] = await Promise.all([
      storage.getClosings(),
      storage.getChangeHistory(),
      storage.getSettings(),
    ])

    return {
      closings,
      changeHistory,
      settings: settings || ({} as AppSettings),
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    }
  }

  // Import de dados
  static async importData(data: ExportData): Promise<{
    success: boolean
    imported: {
      closings: number
      changeHistory: number
      settings: boolean
    }
    errors: string[]
  }> {
    const result = {
      success: true,
      imported: {
        closings: 0,
        changeHistory: 0,
        settings: false,
      },
      errors: [] as string[],
    }

    try {
      // Import configurações
      if (data.settings) {
        await storage.saveSettings(data.settings)
        result.imported.settings = true
      }

      // Import fechamentos
      if (data.closings && Array.isArray(data.closings)) {
        for (const closing of data.closings) {
          try {
            await storage.saveClosing({
              timestamp: closing.timestamp,
              operator: closing.operator,
              notes: closing.notes,
              summary: closing.summary,
            })
            result.imported.closings++
          } catch (error) {
            result.errors.push(`Erro ao importar fechamento: ${error}`)
          }
        }
      }

      // Import histórico de troco
      if (data.changeHistory && Array.isArray(data.changeHistory)) {
        for (const record of data.changeHistory) {
          try {
            await storage.saveChangeCalculation({
              timestamp: record.timestamp,
              purchaseAmount: record.purchaseAmount,
              paidAmount: record.paidAmount,
              changeAmount: record.changeAmount,
              changeBreakdown: record.changeBreakdown,
              exactChange: record.exactChange,
              roundingApplied: record.roundingApplied,
            })
            result.imported.changeHistory++
          } catch (error) {
            result.errors.push(`Erro ao importar histórico: ${error}`)
          }
        }
      }
    } catch (error) {
      result.success = false
      result.errors.push(`Erro geral na importação: ${error}`)
    }

    return result
  }

  // Utilitários para download
  static downloadFile(content: string, filename: string, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  static async copyToClipboard(content: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (error) {
      console.error("Erro ao copiar para clipboard:", error)
      return false
    }
  }
}
