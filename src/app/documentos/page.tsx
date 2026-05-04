"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
      toast.success("PDF descargado correctamente")
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
        toast.success("Documento duplicado exitosamente")
        router.push(`/documentos/${newDoc.id}`)
      } else {
        toast.error("Error al duplicar documento")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al duplicar documento")
    }
  }

  const handleDelete = async (doc: DocumentListItem) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el documento #${String(doc.number).padStart(5, "0")}?\n\nEsta acción no se puede deshacer.`,
    )
    if (!confirmed) return
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Documento eliminado correctamente")
        fetchDocuments(true)
      } else {
        toast.error("Error al eliminar documento")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar documento")
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
    toast.success(`${product.name} creado correctamente`)
  }

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setStatusFilter("all")
    setPage(1)
    toast.info("Filtros limpiados")
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
      `¿Estás seguro de eliminar ${count} ${count === 1 ? "documento" : "documentos"}?\n\nEsta acción no se puede deshacer.`,
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
        toast.error(error.error || "Error al eliminar documentos")
        return
      }
      toast.success(`${count} ${count === 1 ? "documento eliminado" : "documentos eliminados"}`)
      setSelectedIds(new Set())
      fetchDocuments(true)
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar documentos")
    }
  }

  const handleBatchExport = () => {
    toast.info("Función de exportación en desarrollo")
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur" />
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-4xl font-bold text-transparent">
                  Documentos
                </h1>
              </div>
              <p className="text-sm text-slate-600">Gestiona presupuestos, recibos y remitos de forma profesional</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDocuments(true)}
                    disabled={isRefreshing}
                    className="gap-2 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span className="hidden sm:inline">Actualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualizar lista (R)</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickProductOpen(true)}
                className="hidden gap-2 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white sm:flex"
              >
                <Package className="h-4 w-4" />
                Producto Rápido
              </Button>
              <Link href="/documentos/nuevo">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo Documento</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Crear documento (N)</TooltipContent>
                </Tooltip>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <StatsCards stats={stats} isLoading={isLoading && !isRefreshing} />
          </div>

          {/* Filters */}
          <Card className="mb-6 border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search-input"
                    placeholder="Buscar por cliente, número, ciudad... (Presioná /)"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="border-slate-200 bg-white/50 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white/50 lg:w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="PRESUPUESTO">📋 Presupuestos</SelectItem>
                    <SelectItem value="RECIBO">💵 Recibos</SelectItem>
                    <SelectItem value="REMITO">📦 Remitos</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white/50 lg:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="DRAFT">📝 Borrador</SelectItem>
                    <SelectItem value="SENT">📤 Enviado</SelectItem>
                    <SelectItem value="APPROVED">✅ Aprobado</SelectItem>
                    <SelectItem value="COMPLETED">🎉 Completado</SelectItem>
                    <SelectItem value="CANCELLED">❌ Cancelado</SelectItem>
                    <SelectItem value="EXPIRED">⏰ Vencido</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-white/50">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Ordenar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc") }}>📅 Más recientes</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc") }}>📅 Más antiguos</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc") }}>💰 Mayor importe</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc") }}>💰 Menor importe</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("number"); setSortOrder("desc") }}>🔢 Número (desc)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpiar</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 py-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Lista de Documentos
                </CardTitle>
                <div className="flex items-center gap-3">
                  {selectedIds.size > 0 && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 font-medium shadow-lg shadow-blue-500/20">
                      {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="border border-slate-200 bg-slate-50 font-medium">
                    {total} documento{total !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && !isRefreshing ? (
                <div className="p-6">
                  <TableSkeleton />
                </div>
              ) : documents.length === 0 ? (
                <EmptyState hasFilters={hasFilters} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                          <TableHead className="w-12 pl-6">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="Seleccionar todos"
                              className={cn("border-slate-300", isSomeSelected && "data-[state=checked]:bg-blue-600")}
                            />
                          </TableHead>
                          <TableHead className="w-32 font-semibold text-slate-700">Número</TableHead>
                          <TableHead className="w-28 font-semibold text-slate-700">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                          <TableHead className="w-36 font-semibold text-slate-700">Estado</TableHead>
                          <TableHead className="w-32 font-semibold text-slate-700">Fecha</TableHead>
                          <TableHead className="w-20 pr-6 text-right font-semibold text-slate-700">Acciones</TableHead>
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
                                "group cursor-pointer border-slate-100 transition-all hover:bg-blue-50/30",
                                isSelected && "bg-blue-50/50",
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
                              <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                                  aria-label={`Seleccionar documento #${doc.number}`}
                                  className="border-slate-300"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-bold text-slate-900">
                                #{String(doc.number).padStart(5, "0")}
                              </TableCell>
                              <TableCell>
                                <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm", tc.iconBg)}>
                                  <div className={cn("h-1.5 w-1.5 rounded-full bg-gradient-to-r", tc.gradient)} />
                                  {tc.shortLabel}
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-semibold text-slate-900">{doc.client.name}</p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span className="text-slate-400">📱</span>
                                  {doc.client.phone}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn("bg-gradient-to-r bg-clip-text text-base font-bold tabular-nums text-transparent", tc.gradient)}>
                                  {formatCurrency(Number(doc.total))}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={sc.color}
                                  className={cn("gap-1.5 shadow-sm", `bg-gradient-to-r ${sc.gradient} text-white hover:opacity-90`)}
                                >
                                  <sc.icon className="h-3 w-3" />
                                  {sc.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {formatDate(new Date(doc.date))}
                              </TableCell>
                              <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
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
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 px-6 py-5 sm:flex-row">
                      <p className="text-sm text-slate-600">
                        Mostrando <span className="font-semibold text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span>
                        {" - "}
                        <span className="font-semibold text-slate-900">{Math.min(page * PAGE_SIZE, total)}</span>
                        {" de "}
                        <span className="font-semibold text-slate-900">{total}</span> documentos
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="gap-2 border-slate-200 bg-white/50">
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Anterior</span>
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) pageNum = i + 1
                            else if (page <= 3) pageNum = i + 1
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                            else pageNum = page - 2 + i
                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={cn(
                                  "w-10 border-slate-200",
                                  page === pageNum && "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700",
                                )}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="gap-2 border-slate-200 bg-white/50">
                          <span className="hidden sm:inline">Siguiente</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Shortcuts Hint */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            {[
              { key: "N", label: "Nuevo documento" },
              { key: "/", label: "Buscar" },
              { key: "R", label: "Actualizar" },
            ].map((sc) => (
              <div key={sc.key} className="flex items-center gap-2">
                <kbd className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs shadow-sm">{sc.key}</kbd>
                <span>{sc.label}</span>
              </div>
            ))}
          </div>
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
    </TooltipProvider>
  )
}

function DocumentosLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-5 w-96" />
        </div>
        <StatsSkeleton />
        <div className="mt-8">
          <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>
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
