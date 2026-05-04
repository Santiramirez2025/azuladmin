"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
      <Card className="max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-xl" />
            <AlertCircle className="relative h-16 w-16 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Algo salió mal</h2>
          <p className="mb-6 text-sm text-slate-600">
            Hubo un problema al cargar esta sección. Probá de nuevo o volvé al inicio.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-slate-400">Ref: {error.digest}</p>
          )}
          <div className="flex justify-center gap-2">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg hover:shadow-xl"
            >
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
