import { CheckCircle, Download, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  selectedCount: number
  onClearSelection: () => void
  onBatchDelete: () => void
  onBatchExport: () => void
}

export function BatchActionsBar({ selectedCount, onClearSelection, onBatchDelete, onBatchExport }: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-5">
      <div className="relative">
        <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-40 blur-lg" />
        <Card className="relative border-0 bg-white/95 shadow-2xl backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-lg shadow-blue-500/30">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">
                {selectedCount} {selectedCount === 1 ? "documento" : "documentos"}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onBatchExport} className="gap-2 border-slate-200 bg-white/50 hover:bg-slate-50">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={onBatchDelete} className="gap-2 border-red-200 bg-white/50 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={onClearSelection} className="gap-2 hover:bg-slate-100">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancelar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
