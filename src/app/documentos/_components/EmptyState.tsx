import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-slate-200/50 to-slate-300/50 blur-2xl" />
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 shadow-lg shadow-slate-900/5">
          <FileText className="h-16 w-16 text-slate-400" />
        </div>
      </div>
      <h3 className="mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold text-transparent">
        {hasFilters ? "No se encontraron documentos" : "No hay documentos aún"}
      </h3>
      <p className="mb-8 max-w-sm text-sm text-slate-600">
        {hasFilters
          ? "Probá ajustando los filtros de búsqueda o eliminándolos completamente."
          : "Comenzá creando tu primer documento para gestionar presupuestos, recibos y remitos."}
      </p>
      {!hasFilters && (
        <Link href="/documentos/nuevo">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40">
            <Plus className="h-5 w-5" />
            Crear primer documento
          </Button>
        </Link>
      )}
    </div>
  )
}
