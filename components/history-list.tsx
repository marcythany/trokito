"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, CreditCard, Download, Copy, Trash2, Calendar, User } from "lucide-react"
import { storage } from "@/lib/storage"
import { ExportManager } from "@/lib/export"
import { formatCurrency } from "@/lib/currency-utils"
import type { ClosingRecord, ChangeRecord } from "@/types/storage"

export function HistoryList() {
  const [closings, setClosings] = useState<ClosingRecord[]>([])
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const [closingsData, changeData] = await Promise.all([
        storage.getClosings(50), // Últimos 50 registros
        storage.getChangeHistory(100), // Últimos 100 cálculos
      ])
      setClosings(closingsData)
      setChangeHistory(changeData)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportClosingsCSV = async () => {
    setExporting(true)
    try {
      const csv = await ExportManager.exportClosingsToCSV()
      const filename = `trokito-fechamentos-${new Date().toISOString().split("T")[0]}.csv`
      ExportManager.downloadFile(csv, filename, "text/csv")
    } catch (error) {
      console.error("Erro ao exportar fechamentos:", error)
    } finally {
      setExporting(false)
    }
  }

  const exportChangeCSV = async () => {
    setExporting(true)
    try {
      const csv = await ExportManager.exportChangeHistoryToCSV()
      const filename = `trokito-trocos-${new Date().toISOString().split("T")[0]}.csv`
      ExportManager.downloadFile(csv, filename, "text/csv")
    } catch (error) {
      console.error("Erro ao exportar histórico de trocos:", error)
    } finally {
      setExporting(false)
    }
  }

  const copyClosingToClipboard = async (closing: ClosingRecord) => {
    const text = `
Fechamento - ${new Date(closing.timestamp).toLocaleString("pt-BR")}
Operador: ${closing.operator || "N/A"}
Total: ${formatCurrency(closing.summary.totalAmount)}
Notas: ${formatCurrency(closing.summary.totalNotes)}
Moedas: ${formatCurrency(closing.summary.totalCoins)}
Peças: ${closing.summary.totalPieces}
Observações: ${closing.notes || "Nenhuma"}
    `.trim()

    const success = await ExportManager.copyToClipboard(text)
    if (success && "vibrate" in navigator) {
      navigator.vibrate(100)
    }
  }

  const deleteClosing = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fechamento?")) {
      try {
        await storage.deleteClosing(id)
        setClosings((prev) => prev.filter((c) => c.id !== id))
      } catch (error) {
        console.error("Erro ao excluir fechamento:", error)
      }
    }
  }

  const clearOldRecords = async () => {
    if (confirm("Excluir registros com mais de 90 dias? Esta ação não pode ser desfeita.")) {
      try {
        await storage.clearOldRecords(90)
        await loadHistory() // Recarregar dados
      } catch (error) {
        console.error("Erro ao limpar registros antigos:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-foreground/70">Carregando histórico...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ações de Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportClosingsCSV} disabled={exporting || closings.length === 0} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Fechamentos CSV
            </Button>
            <Button onClick={exportChangeCSV} disabled={exporting || changeHistory.length === 0} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Trocos CSV
            </Button>
            <Button
              onClick={clearOldRecords}
              variant="outline"
              className="text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Antigos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico em Abas */}
      <Tabs defaultValue="closings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="closings" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Fechamentos ({closings.length})
          </TabsTrigger>
          <TabsTrigger value="changes" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Trocos ({changeHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Histórico de Fechamentos */}
        <TabsContent value="closings" className="space-y-4">
          {closings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                <p className="text-foreground/70">Nenhum fechamento registrado ainda</p>
              </CardContent>
            </Card>
          ) : (
            closings.map((closing) => (
              <Card key={closing.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-foreground/70" />
                      <span className="text-sm text-foreground/70">
                        {new Date(closing.timestamp).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copyClosingToClipboard(closing)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteClosing(closing.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {closing.operator && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-foreground/70" />
                      <span className="text-sm">{closing.operator}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-accent">
                        {formatCurrency(closing.summary.totalAmount)}
                      </div>
                      <div className="text-xs text-foreground/70">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatCurrency(closing.summary.totalNotes)}
                      </div>
                      <div className="text-xs text-foreground/70">Notas</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatCurrency(closing.summary.totalCoins)}
                      </div>
                      <div className="text-xs text-foreground/70">Moedas</div>
                    </div>
                  </div>

                  {closing.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-foreground/70">Observações:</p>
                        <p className="text-sm mt-1">{closing.notes}</p>
                      </div>
                    </>
                  )}

                  <div className="flex justify-center">
                    <Badge variant="outline">{closing.summary.totalPieces} peça(s)</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Histórico de Trocos */}
        <TabsContent value="changes" className="space-y-4">
          {changeHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calculator className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                <p className="text-foreground/70">Nenhum cálculo de troco registrado ainda</p>
              </CardContent>
            </Card>
          ) : (
            changeHistory.map((record) => (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-foreground/70" />
                    <span className="text-sm text-foreground/70">
                      {new Date(record.timestamp).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-foreground/70">Compra:</span>
                      <span className="ml-2 font-medium">{formatCurrency(record.purchaseAmount)}</span>
                    </div>
                    <div>
                      <span className="text-foreground/70">Pago:</span>
                      <span className="ml-2 font-medium">{formatCurrency(record.paidAmount)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent mb-1">{formatCurrency(record.changeAmount)}</div>
                    <div className="text-xs text-foreground/70">Troco Sugerido</div>

                    {record.roundingApplied !== 0 && (
                      <div className="text-xs text-foreground/70 mt-1">
                        Exato: {formatCurrency(record.exactChange)}
                        (ajuste: {formatCurrency(Math.abs(record.roundingApplied))})
                      </div>
                    )}
                  </div>

                  {record.changeBreakdown.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-foreground/70 mb-2">Composição:</p>
                        <div className="flex flex-wrap gap-1">
                          {record.changeBreakdown.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item.count}× {item.denomination.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
