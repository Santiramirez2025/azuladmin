"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProductosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ProductosError]", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Error al cargar productos</h2>
      <div className="mt-4 flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/">
          <Button variant="outline">Inicio</Button>
        </Link>
      </div>
    </div>
  )
}
