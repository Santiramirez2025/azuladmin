import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <FileText className="h-6 w-6 text-neutral-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold tracking-tight">
        {hasFilters ? "No se encontraron documentos" : "No hay documentos aún"}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">
        {hasFilters
          ? "Probá ajustar los filtros de búsqueda."
          : "Empezá creando tu primer documento."}
      </p>
      {!hasFilters && (
        <Link href="/documentos/nuevo">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Crear documento
          </Button>
        </Link>
      )}
    </div>
  )
}
