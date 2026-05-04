import { Download, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  selectedCount: number
  onClearSelection: () => void
  onBatchDelete: () => void
  onBatchExport: () => void
}

export function BatchActionsBar({ selectedCount, onClearSelection, onBatchDelete, onBatchExport }: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 md:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
        <span className="text-sm font-medium text-neutral-900">
          {selectedCount} {selectedCount === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <div className="h-5 w-px bg-neutral-200" />
        <Button size="sm" variant="ghost" onClick={onBatchExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={onBatchDelete} className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Eliminar</span>
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onClearSelection} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
