"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { cn, formatCurrency, formatDate } from "@/lib/utils-client"
import { BatchActionsBar } from "./_components/BatchActionsBar"
import { DocumentActions } from "./_components/DocumentActions"
import { EmptyState } from "./_components/EmptyState"
import { QuickProductModal } from "./_components/QuickProductModal"
import { StatsSkeleton, TableSkeleton } from "./_components/Skeletons"
import { StatsCards } from "./_components/StatsCards"
import { WhatsAppClientModal, WhatsAppDeliveryModal } from "./_components/WhatsAppModals"
import { useDebounce, useKeyboardShortcuts } from "./_components/hooks"
import {
  PAGE_SIZE,
  STATUS_CONFIG,
  TYPE_CONFIG,
  type DocumentListItem,
  type DocumentStats,
  type QuickProduct,
} from "./_components/types"
import { sendToDeliveryWhatsApp } from "./_components/whatsapp"

function DocumentosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 300)
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [sortBy, setSortBy] = useState<"date" | "number" | "total">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<DocumentStats>({ total: 0, borradores: 0, enviados: 0, completados: 0 })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [quickProductOpen, setQuickProductOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchDocuments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (typeFilter !== "all") params.set("type", typeFilter)
        if (statusFilter !== "all") params.set("status", statusFilter)
        params.set("sortBy", sortBy)
        params.set("sortOrder", sortOrder)
        params.set("page", String(page))
        params.set("limit", String(PAGE_SIZE))

        const res = await fetch(`/api/documents?${params}`)
        const data = await res.json()
        setDocuments(data.items || [])
        setTotal(data.total || 0)
        setStats({
          total: data.stats?.total || 0,
          borradores: data.stats?.draft || 0,
          enviados: data.stats?.sent || 0,
          completados: data.stats?.completed || 0,
        })
      } catch (error) {
        console.error("Error fetching documents:", error)
        toast.error("Error al cargar documentos")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [debouncedSearch, typeFilter, statusFilter, sortBy, sortOrder, page],
  )

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    const newUrl = params.toString() ? `?${params}` : "/documentos"
    window.history.replaceState({}, "", newUrl)
  }, [debouncedSearch, typeFilter, statusFilter])

  const handleDownloadPDF = async (doc: DocumentListItem) => {
    setDownloadingId(doc.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}/pdf`)
      if (!res.ok) throw new Error("Error generating PDF")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${TYPE_CONFIG[doc.type].shortLabel}-${String(doc.number).padStart(5, "0")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("PDF descargado")
    } catch (err) {
      console.error(err)
      toast.error("Error al generar PDF")
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePrint = async (doc: DocumentListItem) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/pdf`)
      if (!res.ok) throw new Error("Error generating PDF")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          toast.success("Documento enviado a impresión")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al preparar impresión")
    }
  }

  const handleDuplicate = async (doc: DocumentListItem) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/duplicate`, { method: "POST" })
      if (res.ok) {
        const newDoc = await res.json()
        toast.success("Documento duplicado")
        router.push(`/documentos/${newDoc.id}`)
      } else {
        toast.error("Error al duplicar")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al duplicar")
    }
  }

  const handleDelete = async (doc: DocumentListItem) => {
    const confirmed = window.confirm(
      `¿Eliminar #${String(doc.number).padStart(5, "0")}?\n\nNo se puede deshacer.`,
    )
    if (!confirmed) return
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Documento eliminado")
        fetchDocuments(true)
      } else {
        toast.error("Error al eliminar")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar")
    }
  }

  const handleWhatsAppClient = (doc: DocumentListItem) => {
    setSelectedDocument(doc)
    setClientModalOpen(true)
  }

  const handleWhatsAppDelivery = (doc: DocumentListItem) => {
    if (doc.type === "RECIBO") {
      sendToDeliveryWhatsApp(doc)
    } else {
      setSelectedDocument(doc)
      setDeliveryModalOpen(true)
    }
  }

  const handleQuickProduct = (product: QuickProduct) => {
    toast.success(`${product.name} creado`)
  }

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(documents.map((d) => d.id)))
    else setSelectedIds(new Set())
  }

  const handleSelectDocument = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (checked) newSet.add(id)
      else newSet.delete(id)
      return newSet
    })
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    const count = ids.length
    const confirmed = window.confirm(
      `¿Eliminar ${count} ${count === 1 ? "documento" : "documentos"}?\n\nNo se puede deshacer.`,
    )
    if (!confirmed) return
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        toast.error(error.error || "Error al eliminar")
        return
      }
      toast.success(`${count} ${count === 1 ? "documento eliminado" : "documentos eliminados"}`)
      setSelectedIds(new Set())
      fetchDocuments(true)
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar")
    }
  }

  const handleBatchExport = () => {
    toast.info("Función en desarrollo")
  }

  useKeyboardShortcuts({
    n: () => router.push("/documentos/nuevo"),
    "/": () => document.getElementById("search-input")?.focus(),
    r: () => fetchDocuments(true),
  })

  const hasFilters = Boolean(search || typeFilter !== "all" || statusFilter !== "all")
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < documents.length

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
          <p className="mt-1 text-sm text-neutral-500">Presupuestos, recibos y remitos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fetchDocuments(true)}
            disabled={isRefreshing}
            aria-label="Actualizar"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickProductOpen(true)}
            className="hidden gap-1.5 sm:flex"
          >
            <Package className="h-4 w-4" />
            Producto rápido
          </Button>
          <Link href="/documentos/nuevo">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="mb-5">
        <StatsCards stats={stats} isLoading={isLoading && !isRefreshing} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="search-input"
            placeholder="Buscar por cliente, número, ciudad…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="PRESUPUESTO">Presupuestos</SelectItem>
            <SelectItem value="RECIBO">Recibos</SelectItem>
            <SelectItem value="REMITO">Remitos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="SENT">Enviado</SelectItem>
            <SelectItem value="APPROVED">Aprobado</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
            <SelectItem value="EXPIRED">Vencido</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Ordenar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc") }}>Más recientes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc") }}>Más antiguos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc") }}>Mayor importe</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc") }}>Menor importe</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy("number"); setSortOrder("desc") }}>Número</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Selected counter */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-100 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <span className="text-xs text-neutral-500">{total} en total</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {isLoading && !isRefreshing ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-100 hover:bg-neutral-50">
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos"
                        className={cn(isSomeSelected && "data-[state=checked]:bg-neutral-900")}
                      />
                    </TableHead>
                    <TableHead className="w-28 text-xs font-medium uppercase tracking-wider text-neutral-500">N°</TableHead>
                    <TableHead className="w-24 text-xs font-medium uppercase tracking-wider text-neutral-500">Tipo</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-neutral-500">Cliente</TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Total</TableHead>
                    <TableHead className="w-32 text-xs font-medium uppercase tracking-wider text-neutral-500">Estado</TableHead>
                    <TableHead className="w-28 text-xs font-medium uppercase tracking-wider text-neutral-500">Fecha</TableHead>
                    <TableHead className="w-16 pr-5 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Accs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const sc = STATUS_CONFIG[doc.status]
                    const tc = TYPE_CONFIG[doc.type]
                    const isSelected = selectedIds.has(doc.id)

                    return (
                      <TableRow
                        key={doc.id}
                        className={cn(
                          "cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50",
                          isSelected && "bg-neutral-50",
                        )}
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest('[role="checkbox"]') ||
                            (e.target as HTMLElement).closest('[role="button"]')
                          ) {
                            return
                          }
                          router.push(`/documentos/${doc.id}`)
                        }}
                      >
                        <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                            aria-label={`Seleccionar #${doc.number}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium tabular-nums">
                          #{String(doc.number).padStart(5, "0")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                            {tc.shortLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-neutral-900">{doc.client.name}</p>
                          <p className="text-xs text-neutral-500">{doc.client.phone}</p>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(Number(doc.total))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.color}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">{formatDate(new Date(doc.date))}</TableCell>
                        <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <DocumentActions
                            document={doc}
                            onSendClient={() => handleWhatsAppClient(doc)}
                            onSendDelivery={() => handleWhatsAppDelivery(doc)}
                            onDownloadPDF={() => handleDownloadPDF(doc)}
                            onPrint={() => handlePrint(doc)}
                            onDuplicate={() => handleDuplicate(doc)}
                            onDelete={() => handleDelete(doc)}
                            isDownloading={downloadingId === doc.id}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row">
                <p className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-900">{(page - 1) * PAGE_SIZE + 1}</span>
                  {"–"}
                  <span className="font-medium text-neutral-900">{Math.min(page * PAGE_SIZE, total)}</span>
                  {" de "}
                  <span className="font-medium text-neutral-900">{total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) pageNum = i + 1
                    else if (page <= 3) pageNum = i + 1
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = page - 2 + i
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="icon-sm"
                        onClick={() => setPage(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BatchActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBatchDelete={handleBatchDelete}
        onBatchExport={handleBatchExport}
      />

      <QuickProductModal open={quickProductOpen} onClose={() => setQuickProductOpen(false)} onAdd={handleQuickProduct} />
      <WhatsAppClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} document={selectedDocument} />
      <WhatsAppDeliveryModal open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} document={selectedDocument} />
    </div>
  )
}

function DocumentosLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="mb-5">
        <StatsSkeleton />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <TableSkeleton />
      </div>
    </div>
  )
}

export default function DocumentosPage() {
  return (
    <Suspense fallback={<DocumentosLoading />}>
      <DocumentosContent />
    </Suspense>
  )
}
