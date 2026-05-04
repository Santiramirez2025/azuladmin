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
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <FileX className="h-6 w-6 text-neutral-500" />
      </div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Error al cargar el documento</h2>
      <p className="mb-6 text-sm text-neutral-500">Hubo un problema al obtener los datos.</p>
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/documentos">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    </div>
  )
}
