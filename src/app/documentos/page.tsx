"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Search,
  FileText,
  MessageCircle,
  Download,
  Printer,
  MoreHorizontal,
  X,
  Truck,
  User,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  Loader2,
  Check,
  ExternalLink,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import type { DocumentType, DocumentStatus } from "@/types"

// ============================================================================
// Types
// ============================================================================

interface Document {
  id: string
  number: number
  type: DocumentType
  status: DocumentStatus
  total: number
  subtotal: number
  surcharge: number
  surchargeRate: number
  date: string
  validUntil?: string
  observations?: string
  internalNotes?: string
  paymentMethod?: string
  shippingType: string
  shippingCost: number
  client: {
    id: string
    name: string
    phone: string
    address?: string
    city: string
  }
  createdBy: {
    id: string
    name: string
  }
  _count: {
    items: number
  }
}

interface QuickProduct {
  name: string
  price: number
  quantity: number
}

// ============================================================================
// Constants & Config
// ============================================================================

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    color: "default" | "secondary" | "success" | "warning" | "destructive"
    label: string
    icon: typeof CheckCircle
  }
> = {
  DRAFT: { color: "secondary", label: "Borrador", icon: FileText },
  SENT: { color: "warning", label: "Enviado", icon: MessageCircle },
  APPROVED: { color: "default", label: "Aprobado", icon: CheckCircle },
  COMPLETED: { color: "success", label: "Completado", icon: CheckCircle },
  CANCELLED: { color: "destructive", label: "Cancelado", icon: X },
  EXPIRED: { color: "secondary", label: "Vencido", icon: AlertCircle },
}

const TYPE_CONFIG: Record<
  DocumentType,
  { label: string; shortLabel: string; color: string }
> = {
  PRESUPUESTO: { label: "Presupuesto", shortLabel: "PRE", color: "bg-blue-100 text-blue-700" },
  RECIBO: { label: "Recibo", shortLabel: "REC", color: "bg-emerald-100 text-emerald-700" },
  REMITO: { label: "Remito", shortLabel: "REM", color: "bg-orange-100 text-orange-700" },
}

const PAGE_SIZE = 20

// ⚙️ CONFIGURACIÓN DEL NEGOCIO
const CONFIG = {
  businessName: "AZUL COLCHONES",
  businessPhone: "+54 9 353 123-4567",
  // Link del grupo de WhatsApp de reparto
  deliveryGroupLink: "https://chat.whatsapp.com/FlK4k2MUJWJ2vSjkek2WOd",
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

// Mensaje para CLIENTE (con precios)
function generateClientMessage(doc: Document): string {
  const docNumber = `#${String(doc.number).padStart(5, "0")}`
  const typeLabel = TYPE_CONFIG[doc.type].label

  const validUntilText = doc.type === "PRESUPUESTO" && doc.validUntil
    ? `\n📅 Válido hasta: ${formatDate(new Date(doc.validUntil))}`
    : ""

  return `¡Hola ${doc.client.name}! 👋

Te envío tu *${typeLabel} ${docNumber}*

💰 Total: *${formatCurrency(doc.total)}*${validUntilText}

${doc.observations ? `📝 ${doc.observations}\n` : ""}
Cualquier consulta estoy a tu disposición. ¡Gracias por tu confianza! 🙌

_${CONFIG.businessName}_`
}

// Mensaje para REPARTO (SIN PRECIOS)
function generateDeliveryMessage(doc: Document): string {
  const docNumber = `#${String(doc.number).padStart(5, "0")}`

  return `🚚 *ENTREGA ${docNumber}*

👤 *Cliente:* ${doc.client.name}
📞 *Teléfono:* ${doc.client.phone}
📍 *Dirección:* ${doc.client.address || "Sin dirección"}
🏙️ *Ciudad:* ${doc.client.city}

🚛 *Envío:* ${doc.shippingType}
${doc.observations ? `\n📝 *Obs:* ${doc.observations}` : ""}

Por favor confirmar cuando esté entregado ✅`
}

// ============================================================================
// Skeleton Components
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Quick Product Modal
// ============================================================================

interface QuickProductModalProps {
  open: boolean
  onClose: () => void
  onAdd: (product: QuickProduct) => void
}

function QuickProductModal({ open, onClose, onAdd }: QuickProductModalProps) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !size) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/products/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, size, price: parseFloat(price) }),
      })

      if (res.ok) {
        onAdd({
          name: `${name} - ${size}`,
          price: parseFloat(price),
          quantity: parseInt(quantity),
        })
        toast.success("Producto creado y agregado")
        setName("")
        setSize("")
        setPrice("")
        setQuantity("1")
        onClose()
      } else {
        toast.error("Error al crear producto")
      }
    } catch {
      toast.error("Error al crear producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Agregar Producto Rápido
          </DialogTitle>
          <DialogDescription>
            Creá un producto nuevo y agregalo directamente al documento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre del producto</Label>
            <Input
              id="product-name"
              placeholder="Ej: Colchón Piero Paraíso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-size">Medida</Label>
            <Input
              id="product-size"
              placeholder="Ej: 140x190"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio unitario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-quantity">Cantidad</Label>
              <Input
                id="product-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name || !price || !size || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar al documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// WhatsApp Modal (Cliente)
// ============================================================================

interface WhatsAppClientModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

function WhatsAppClientModal({ open, onClose, document: doc }: WhatsAppClientModalProps) {
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (doc) {
      setMessage(generateClientMessage(doc))
      setPhone(doc.client.phone)
    }
  }, [doc])

  const handleSend = () => {
    if (!phone) {
      toast.error("Ingresá un número de teléfono")
      return
    }
    const url = generateWhatsAppLink(phone, message)
    window.open(url, "_blank")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Enviar a Cliente
          </DialogTitle>
          <DialogDescription>
            Personalizá el mensaje antes de enviar por WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-phone">Teléfono del cliente</Label>
            <Input
              id="client-phone"
              placeholder="+54 9 351 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-message">Mensaje</Label>
            <Textarea
              id="client-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} className="gap-2 bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4" />
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// WhatsApp Modal (Reparto - Copiar al portapapeles)
// ============================================================================

interface WhatsAppDeliveryModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

function WhatsAppDeliveryModal({ open, onClose, document: doc }: WhatsAppDeliveryModalProps) {
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (doc) {
      setMessage(generateDeliveryMessage(doc))
      setCopied(false)
    }
  }, [doc])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Mensaje copiado al portapapeles")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Error al copiar")
    }
  }

  const handleOpenGroup = () => {
    window.open(CONFIG.deliveryGroupLink, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" />
            Enviar a Grupo de Reparto
          </DialogTitle>
          <DialogDescription>
            Copiá el mensaje y pegalo en el grupo de WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensaje para el reparto</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="font-mono text-sm bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              💡 Este mensaje no incluye precios, solo datos de entrega.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleOpenGroup} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir Grupo
          </Button>
          <Button
            onClick={handleCopy}
            className={cn(
              "gap-2",
              copied ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Mensaje
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Document Actions
// ============================================================================

interface DocumentActionsProps {
  document: Document
  onSendClient: () => void
  onSendDelivery: () => void
  onDownloadPDF: () => void
  onPrint: () => void
  onDuplicate: () => void
  onDelete: () => void
  isDownloading: boolean
}

function DocumentActions({
  document: doc,
  onSendClient,
  onSendDelivery,
  onDownloadPDF,
  onPrint,
  onDuplicate,
  onDelete,
  isDownloading,
}: DocumentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <Link href={`/documentos/${doc.id}`}>
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSendClient}>
          <User className="mr-2 h-4 w-4 text-green-600" />
          Enviar a cliente
        </DropdownMenuItem>

        {doc.type === "REMITO" && (
          <DropdownMenuItem onClick={onSendDelivery}>
            <Truck className="mr-2 h-4 w-4 text-orange-600" />
            Copiar para reparto
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4 text-blue-600" />
          )}
          Descargar PDF
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4 text-purple-600" />
          Imprimir
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <FileText className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {hasFilters ? "No se encontraron documentos" : "No hay documentos aún"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Probá ajustando los filtros de búsqueda"
          : "Comenzá creando tu primer presupuesto o recibo para gestionar tus ventas."}
      </p>
      {!hasFilters && (
        <Link href="/documentos/nuevo" className="mt-6">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear primer documento
          </Button>
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// Stats Cards
// ============================================================================

interface DocumentStats {
  total: number
  borradores: number
  enviados: number
  completados: number
}

function StatsCards({ stats, isLoading }: { stats: DocumentStats; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />

  const items = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-gray-600 bg-gray-100" },
    { label: "Borradores", value: stats.borradores, icon: FileText, color: "text-amber-600 bg-amber-100" },
    { label: "Enviados", value: stats.enviados, icon: MessageCircle, color: "text-blue-600 bg-blue-100" },
    { label: "Completados", value: stats.completados, icon: CheckCircle, color: "text-emerald-600 bg-emerald-100" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
              <div className={cn("rounded-lg p-2", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Main Content Component
// ============================================================================

function DocumentosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [sortBy, setSortBy] = useState<"date" | "number" | "total">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    borradores: 0,
    enviados: 0,
    completados: 0,
  })

  // Modal State
  const [quickProductOpen, setQuickProductOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
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
  }, [search, typeFilter, statusFilter, sortBy, sortOrder, page])

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => fetchDocuments(), 300)
    return () => clearTimeout(timer)
  }, [fetchDocuments])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)

    const newUrl = params.toString() ? `?${params}` : "/documentos"
    window.history.replaceState({}, "", newUrl)
  }, [search, typeFilter, statusFilter])

  // Handlers
  const handleDownloadPDF = async (doc: Document) => {
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
    } catch {
      toast.error("Error al generar PDF")
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePrint = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/pdf`)
      if (!res.ok) throw new Error("Error generating PDF")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => printWindow.print()
      }
    } catch {
      toast.error("Error al preparar impresión")
    }
  }

  const handleDuplicate = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/duplicate`, { method: "POST" })
      if (res.ok) {
        const newDoc = await res.json()
        toast.success("Documento duplicado")
        router.push(`/documentos/${newDoc.id}`)
      } else {
        toast.error("Error al duplicar")
      }
    } catch {
      toast.error("Error al duplicar")
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`¿Seguro que querés eliminar el documento #${String(doc.number).padStart(5, "0")}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Documento eliminado")
        fetchDocuments(true)
      } else {
        toast.error("Error al eliminar")
      }
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const handleWhatsAppClient = (doc: Document) => {
    setSelectedDocument(doc)
    setClientModalOpen(true)
  }

  const handleWhatsAppDelivery = (doc: Document) => {
    setSelectedDocument(doc)
    setDeliveryModalOpen(true)
  }

  const handleQuickProduct = (product: QuickProduct) => {
    toast.success(`${product.name} creado correctamente`)
  }

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  const hasFilters = Boolean(search || typeFilter !== "all" || statusFilter !== "all")
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50/50 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documentos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestiona presupuestos, recibos y remitos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDocuments(true)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualizar</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickProductOpen(true)}
                className="hidden sm:flex gap-2"
              >
                <Package className="h-4 w-4" />
                Producto Rápido
              </Button>
              <Link href="/documentos/nuevo">
                <Button size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Nuevo Documento
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsCards stats={stats} isLoading={isLoading && !isRefreshing} />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente, número o notas..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full lg:w-44">
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
                  <SelectTrigger className="w-full lg:w-44">
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
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Ordenar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc") }}>
                      Más recientes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc") }}>
                      Más antiguos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc") }}>
                      Mayor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc") }}>
                      Menor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("number"); setSortOrder("desc") }}>
                      Número (desc)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="border-b py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Lista de Documentos</CardTitle>
                <Badge variant="secondary" className="font-normal">
                  {total} {total === 1 ? "documento" : "documentos"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-28">Número</TableHead>
                          <TableHead className="w-28">Tipo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-32">Estado</TableHead>
                          <TableHead className="w-28">Fecha</TableHead>
                          <TableHead className="w-20 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => {
                          const statusConfig = STATUS_CONFIG[doc.status]
                          const typeConfig = TYPE_CONFIG[doc.type]

                          return (
                            <TableRow
                              key={doc.id}
                              className="group cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => router.push(`/documentos/${doc.id}`)}
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                #{String(doc.number).padStart(5, "0")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("font-medium", typeConfig.color)}>
                                  {typeConfig.shortLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-gray-900">{doc.client.name}</p>
                                  <p className="text-sm text-muted-foreground">{doc.client.phone}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatCurrency(Number(doc.total))}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(new Date(doc.date))}
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} de {total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">Página {page} de {totalPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
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
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-xs">N</kbd> nuevo documento ·{" "}
            <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-xs">/</kbd> buscar
          </p>
        </div>

        {/* Modals */}
        <QuickProductModal
          open={quickProductOpen}
          onClose={() => setQuickProductOpen(false)}
          onAdd={handleQuickProduct}
        />

        <WhatsAppClientModal
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          document={selectedDocument}
        />

        <WhatsAppDeliveryModal
          open={deliveryModalOpen}
          onClose={() => setDeliveryModalOpen(false)}
          document={selectedDocument}
        />
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// Loading Component
// ============================================================================

function DocumentosLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <StatsSkeleton />
      </div>
    </div>
  )
}

// ============================================================================
// Page Component with Suspense
// ============================================================================

export default function DocumentosPage() {
  return (
    <Suspense fallback={<DocumentosLoading />}>
      <DocumentosContent />
    </Suspense>
  )
}