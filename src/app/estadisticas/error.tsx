"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EstadisticasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[EstadisticasError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <AlertCircle className="h-16 w-16 text-red-500" />
      <h2 className="text-xl font-bold text-slate-900">Error al cargar estadísticas</h2>
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/">
          <Button variant="outline">Inicio</Button>
        </Link>
      </div>
    </div>
  )
}
