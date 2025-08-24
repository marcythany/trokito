import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { HistoryList } from "@/components/history-list"

export const metadata: Metadata = {
  title: "Histórico - Trokito",
  description: "Veja o histórico de operações do Trokito",
}

export default function HistoricoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Histórico</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto p-4">
        <HistoryList />
      </main>
    </div>
  )
}
