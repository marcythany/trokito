import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SettingsForm } from "@/components/settings-form"

export const metadata: Metadata = {
  title: "Configurações - Trokito",
  description: "Configure o Trokito para suas necessidades",
}

export default function ConfiguracoesPage() {
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
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto p-4">
        <SettingsForm />
      </main>
    </div>
  )
}
