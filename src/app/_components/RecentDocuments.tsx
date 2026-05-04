import Link from "next/link"
import { ArrowRight, ChevronRight, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils-client"
import { statusConfig, typeLabels, type Stats } from "./types"

export function RecentDocuments({ documents }: { documents: Stats["recentDocuments"] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight">Actividad reciente</h2>
        <Link href="/documentos">
          <Button variant="ghost" size="sm" className="gap-1 text-neutral-700">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {documents.length === 0 ? <EmptyState /> : <DocumentList documents={documents} />}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <FileText className="h-6 w-6 text-neutral-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold tracking-tight">No hay documentos</h3>
      <p className="mb-5 text-sm text-neutral-500">Empezá creando tu primer presupuesto, recibo o remito.</p>
      <Link href="/documentos/nuevo">
        <Button>
          <Plus className="h-4 w-4" />
          Crear documento
        </Button>
      </Link>
    </div>
  )
}

function DocumentList({ documents }: { documents: Stats["recentDocuments"] }) {
  return (
    <ul className="divide-y divide-neutral-100">
      {documents.map((doc) => {
        const status = statusConfig[doc.status] ?? statusConfig.DRAFT
        return (
          <li key={doc.id}>
            <Link
              href={`/documentos/${doc.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <FileText className="h-5 w-5 text-neutral-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {typeLabels[doc.type]} · #{String(doc.number).padStart(5, "0")}
                </p>
                <p className="truncate text-xs text-neutral-500">{doc.client}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(doc.total)}</p>
                  <Badge variant={status.variant} className="mt-1">
                    {status.label}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300" />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
