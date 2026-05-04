"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[DocumentosError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
      <Card className="max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-slate-900">Error al cargar documentos</h2>
          <p className="mb-6 text-sm text-slate-600">
            No pudimos cargar la lista. Verificá tu conexión y reintentá.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={reset} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Reintentar
            </Button>
            <Link href="/">
              <Button variant="outline">Volver al inicio</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
