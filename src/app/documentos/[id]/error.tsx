"use client"

import { useEffect } from "react"
import Link from "next/link"
import { FileX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocumentoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[DocumentoError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
      <FileX className="h-16 w-16 text-slate-300" />
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Error al cargar el documento</h2>
        <p className="text-sm text-slate-600">Hubo un problema al obtener los datos del documento.</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="bg-gradient-to-r from-blue-600 to-indigo-600">
          Reintentar
        </Button>
        <Link href="/documentos">
          <Button variant="outline">Volver a Documentos</Button>
        </Link>
      </div>
    </div>
  )
}
