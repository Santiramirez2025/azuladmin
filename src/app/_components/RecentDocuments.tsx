import Link from "next/link"
import { Activity, ArrowRight, FileText, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils-client"
import { statusConfig, typeLabels, type Stats } from "./types"

export function RecentDocuments({ documents }: { documents: Stats["recentDocuments"] }) {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/80">
        <div className="flex items-center justify-between">
          <CardTitle id="recent-documents-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-md">
              <Activity className="h-4 w-4 text-white" />
            </div>
            Actividad Reciente
          </CardTitle>
          <Link href="/documentos">
            <Button variant="ghost" size="sm" className="group gap-1.5 font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700">
              Ver todos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {documents.length === 0 ? <EmptyState /> : <DocumentList documents={documents} />}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="relative mx-auto mb-4 w-fit">
        <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl" />
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
          <FileText className="h-16 w-16 text-blue-500" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">Aún no hay documentos</h3>
      <p className="mb-6 text-sm text-slate-500">Comienza creando tu primer presupuesto, recibo o remito</p>
      <Link href="/documentos/nuevo">
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40">
          <Plus className="mr-2 h-4 w-4" />
          Crear primer documento
        </Button>
      </Link>
    </div>
  )
}

function DocumentList({ documents }: { documents: Stats["recentDocuments"] }) {
  return (
    <div className="space-y-3">
      {documents.map((doc, index) => {
        const statusInfo = statusConfig[doc.status] ?? statusConfig.DRAFT
        return (
          <Link
            key={doc.id}
            href={`/documentos/${doc.id}`}
            className="group relative flex items-center justify-between rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-transparent p-4 transition-all duration-300 hover:border-blue-300/60 hover:bg-blue-50/60 hover:shadow-lg hover:shadow-blue-500/5"
            style={{ animation: `slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both` }}
          >
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  <span className="text-blue-600">#{String(doc.number).padStart(5, "0")}</span> · {typeLabels[doc.type]}
                </p>
                <p className="text-sm text-slate-500">{doc.client}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="mb-1.5 text-lg font-bold text-slate-900">{formatCurrency(doc.total)}</p>
              <Badge variant={statusInfo.variant} className="font-medium shadow-sm">
                {statusInfo.label}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
