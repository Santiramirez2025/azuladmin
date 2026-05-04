"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Algo salió mal</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Hubo un problema al cargar esta sección. Probá de nuevo o volvé al inicio.
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-xs text-neutral-400">Ref: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Inicio
        </Button>
      </div>
    </div>
  )
}
