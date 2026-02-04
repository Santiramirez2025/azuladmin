"use client"

import { Suspense, useState, useEffect, useCallback, useMemo, useTransition } from "react"
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
  Filter,
  Archive,
  Send,
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
import { Checkbox } from "@/components/ui/checkbox"

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

interface DocumentStats {
  total: number
  borradores: number
  enviados: number
  completados: number
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
  PRESUPUESTO: { label: "Presupuesto", shortLabel: "PRE", color: "bg-blue-100 text-blue-700 border-blue-300" },
  RECIBO: { label: "Recibo", shortLabel: "REC", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  REMITO: { label: "Remito", shortLabel: "REM", color: "bg-orange-100 text-orange-700 border-orange-300" },
}

const PAGE_SIZE = 20

// ⚙️ CONFIGURACIÓN DEL NEGOCIO
const CONFIG = {
  businessName: "AZUL COLCHONES",
  businessPhone: "+54 9 353 123-4567",
  deliveryGroupLink: "https://chat.whatsapp.com/FlK4k2MUJWJ2vSjkek2WOd",
  deliveryPhone: "+54 9 3535 69-4658", // WhatsApp de reparto individual
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

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

function generateDeliveryMessage(doc: Document): string {
  const docNumber = `#${String(doc.number).padStart(5, "0")}`
  const typeLabel = TYPE_CONFIG[doc.type].label

  return `🚚 *ENTREGA ${typeLabel.toUpperCase()} ${docNumber}*

👤 *Cliente:* ${doc.client.name}
📞 *Teléfono:* ${doc.client.phone}
📍 *Dirección:* ${doc.client.address || "Sin dirección"}
🏙️ *Ciudad:* ${doc.client.city}

🚛 *Envío:* ${doc.shippingType}
${doc.observations ? `\n📝 *Obs:* ${doc.observations}` : ""}

Por favor confirmar cuando esté entregado ✅`
}

// Función para enviar directamente por WhatsApp al reparto (para RECIBOS)
function sendToDeliveryWhatsApp(doc: Document): void {
  const message = generateDeliveryMessage(doc)
  const url = generateWhatsAppLink(CONFIG.deliveryPhone, message)
  window.open(url, "_blank")
  toast.success("WhatsApp de reparto abierto")
}

// ============================================================================
// Custom Hooks
// ============================================================================

function useKeyboardShortcuts(callbacks: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está en un input, textarea o contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()
      if (callbacks[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        callbacks[key]()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [callbacks])
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// Skeleton Components (Optimizados)
// ============================================================================

const TableSkeleton = () => (
  <div className="space-y-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 border-b last:border-0">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-14 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    ))}
  </div>
)

const StatsSkeleton = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-l-4 border-l-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// ============================================================================
// Quick Product Modal (Mejorado)
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

  // Reset form cuando se cierra
  useEffect(() => {
    if (!open) {
      setName("")
      setSize("")
      setPrice("")
      setQuantity("1")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price || !size.trim()) {
      toast.error("Completá todos los campos requeridos")
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresá un precio válido")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/products/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, size, price: priceNum }),
      })

      if (res.ok) {
        onAdd({
          name: `${name} - ${size}`,
          price: priceNum,
          quantity: parseInt(quantity),
        })
        toast.success("Producto creado y listo para agregar")
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.message || "Error al crear producto")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión al crear producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            Producto Rápido
          </DialogTitle>
          <DialogDescription>
            Creá un producto nuevo y agregalo al documento en un solo paso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">
              Nombre del producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="Ej: Colchón Piero Paraíso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-size">
              Medida <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-size"
              placeholder="Ej: 140x190"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">
                Precio unitario <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !price || !size.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creando..." : "Crear y agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// WhatsApp Modals (Optimizados)
// ============================================================================

interface WhatsAppClientModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

function WhatsAppClientModal({ open, onClose, document: doc }: WhatsAppClientModalProps) {
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (doc && open) {
      setMessage(generateClientMessage(doc))
      setPhone(doc.client.phone)
    }
  }, [doc, open])

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Ingresá un número de teléfono")
      return
    }

    setIsSending(true)
    
    try {
      // Opcional: marcar documento como "SENT"
      if (doc && doc.status === "DRAFT") {
        await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        })
      }

      const url = generateWhatsAppLink(phone, message)
      window.open(url, "_blank")
      toast.success("WhatsApp abierto correctamente")
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Error al abrir WhatsApp")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-green-100 p-2">
              <User className="h-5 w-5 text-green-600" />
            </div>
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
              disabled={isSending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-message">Mensaje</Label>
            <Textarea
              id="client-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="font-mono text-sm resize-none"
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              💡 Este mensaje incluye el total y detalles del documento.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            className="gap-2 bg-green-600 hover:bg-green-700"
            disabled={isSending || !phone.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {isSending ? "Enviando..." : "Enviar por WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface WhatsAppDeliveryModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

function WhatsAppDeliveryModal({ open, onClose, document: doc }: WhatsAppDeliveryModalProps) {
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (doc && open) {
      setMessage(generateDeliveryMessage(doc))
      setCopied(false)
    }
  }, [doc, open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Mensaje copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
      toast.error("Error al copiar mensaje")
    }
  }

  const handleOpenGroup = () => {
    window.open(CONFIG.deliveryGroupLink, "_blank")
    toast.info("Grupo de reparto abierto")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-100 p-2">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            Enviar a Reparto
          </DialogTitle>
          <DialogDescription>
            Copiá el mensaje y pegalo en el grupo de WhatsApp del reparto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensaje para el reparto</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="font-mono text-sm bg-orange-50/30 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              💡 Este mensaje no incluye precios, solo datos de entrega.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleOpenGroup} 
            className="gap-2 w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Grupo
          </Button>
          <Button
            onClick={handleCopy}
            className={cn(
              "gap-2 w-full sm:w-auto transition-colors",
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
// Document Actions (Optimizado)
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

const DocumentActions = ({
  document: doc,
  onSendClient,
  onSendDelivery,
  onDownloadPDF,
  onPrint,
  onDuplicate,
  onDelete,
  isDownloading,
}: DocumentActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
      >
        <span className="sr-only">Abrir menú de acciones</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        Documento #{String(doc.number).padStart(5, "0")}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <Link href={`/documentos/${doc.id}`}>
        <DropdownMenuItem className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-gray-600" />
          Ver detalle
        </DropdownMenuItem>
      </Link>

      <DropdownMenuSeparator />

      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        Enviar
      </DropdownMenuLabel>

      <DropdownMenuItem onClick={onSendClient} className="cursor-pointer">
        <User className="mr-2 h-4 w-4 text-green-600" />
        Enviar a cliente
      </DropdownMenuItem>

      {(doc.type === "REMITO" || doc.type === "RECIBO") && (
        <DropdownMenuItem onClick={onSendDelivery} className="cursor-pointer">
          <Truck className="mr-2 h-4 w-4 text-orange-600" />
          {doc.type === "RECIBO" ? "Enviar a reparto" : "Copiar para reparto"}
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        Documentos
      </DropdownMenuLabel>

      <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading} className="cursor-pointer">
        {isDownloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <Download className="mr-2 h-4 w-4 text-blue-600" />
        )}
        Descargar PDF
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
        <Printer className="mr-2 h-4 w-4 text-purple-600" />
        Imprimir
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
        <Copy className="mr-2 h-4 w-4 text-gray-600" />
        Duplicar
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onDelete}
        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

// ============================================================================
// Empty State (Mejorado)
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-inner">
        <FileText className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">
        {hasFilters ? "No se encontraron documentos" : "No hay documentos aún"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Probá ajustando los filtros de búsqueda o eliminándolos completamente."
          : "Comenzá creando tu primer documento para gestionar presupuestos, recibos y remitos."}
      </p>
      {!hasFilters && (
        <Link href="/documentos/nuevo" className="mt-8">
          <Button size="lg" className="gap-2 shadow-md">
            <Plus className="h-5 w-5" />
            Crear primer documento
          </Button>
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// Stats Cards (Optimizados)
// ============================================================================

function StatsCards({ stats, isLoading }: { stats: DocumentStats; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />

  const items = [
    { 
      label: "Total", 
      value: stats.total, 
      icon: FileText, 
      color: "text-gray-700 bg-gray-100",
      borderColor: "border-l-gray-400"
    },
    { 
      label: "Borradores", 
      value: stats.borradores, 
      icon: FileText, 
      color: "text-amber-700 bg-amber-50",
      borderColor: "border-l-amber-400"
    },
    { 
      label: "Enviados", 
      value: stats.enviados, 
      icon: Send, 
      color: "text-blue-700 bg-blue-50",
      borderColor: "border-l-blue-400"
    },
    { 
      label: "Completados", 
      value: stats.completados, 
      icon: CheckCircle, 
      color: "text-emerald-700 bg-emerald-50",
      borderColor: "border-l-emerald-400"
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4",
            item.borderColor
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-bold">{item.value}</p>
              </div>
              <div className={cn("rounded-xl p-3 shadow-sm", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Batch Actions Bar (Nueva funcionalidad)
// ============================================================================

interface BatchActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBatchDelete: () => void
  onBatchExport: () => void
}

function BatchActionsBar({ 
  selectedCount, 
  onClearSelection, 
  onBatchDelete,
  onBatchExport 
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <Card className="shadow-2xl border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {selectedCount} {selectedCount === 1 ? "documento seleccionado" : "documentos seleccionados"}
            </span>
          </div>
          <div className="h-6 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBatchExport}
              className="gap-2 bg-white hover:bg-blue-100"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onBatchDelete}
              className="gap-2 bg-white hover:bg-red-100 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Content Component (Optimizado y Profesional)
// ============================================================================

function DocumentosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // State
  const [documents, setDocuments] = useState<Document[]>([])
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
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    borradores: 0,
    enviados: 0,
    completados: 0,
  })

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
  }, [debouncedSearch, typeFilter, statusFilter, sortBy, sortOrder, page])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)

    const newUrl = params.toString() ? `?${params}` : "/documentos"
    window.history.replaceState({}, "", newUrl)
  }, [debouncedSearch, typeFilter, statusFilter])

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
      toast.success("PDF descargado correctamente")
    } catch (err) {
      console.error(err)
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

  const handleDuplicate = async (doc: Document) => {
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

  const handleDelete = async (doc: Document) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el documento #${String(doc.number).padStart(5, "0")}?\n\nEsta acción no se puede deshacer.`
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

  const handleWhatsAppClient = (doc: Document) => {
    setSelectedDocument(doc)
    setClientModalOpen(true)
  }

  const handleWhatsAppDelivery = (doc: Document) => {
    if (doc.type === "RECIBO") {
      // Para RECIBOS: enviar directo por WhatsApp sin modal
      sendToDeliveryWhatsApp(doc)
    } else {
      // Para REMITOS: abrir modal para copiar mensaje
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(documents.map(d => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectDocument = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleBatchDelete = async () => {
    const count = selectedIds.size
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar ${count} ${count === 1 ? "documento" : "documentos"}?\n\nEsta acción no se puede deshacer.`
    )
    
    if (!confirmed) return

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/documents/${id}`, { method: "DELETE" })
      )
      
      await Promise.all(promises)
      toast.success(`${count} ${count === 1 ? "documento eliminado" : "documentos eliminados"}`)
      setSelectedIds(new Set())
      fetchDocuments(true)
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar documentos")
    }
  }

  const handleBatchExport = async () => {
    toast.info("Función de exportación en desarrollo")
    // Aquí iría la lógica de exportación
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    "n": () => router.push("/documentos/nuevo"),
    "/": () => document.getElementById("search-input")?.focus(),
    "r": () => fetchDocuments(true),
  })

  const hasFilters = Boolean(search || typeFilter !== "all" || statusFilter !== "all")
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < documents.length

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Documentos
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestiona presupuestos, recibos y remitos de forma profesional
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
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span className="hidden sm:inline">Actualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualizar lista (R)</p>
                </TooltipContent>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" className="gap-2 shadow-sm">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo Documento</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Crear documento (N)</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsCards stats={stats} isLoading={isLoading && !isRefreshing} />
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="search-input"
                    placeholder="Buscar por cliente, número, ciudad o notas... (Presioná /)"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full lg:w-44 border-gray-300">
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
                  <SelectTrigger className="w-full lg:w-44 border-gray-300">
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
                    <Button variant="outline" size="sm" className="gap-2 border-gray-300">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Ordenar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc") }}>
                      📅 Más recientes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc") }}>
                      📅 Más antiguos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc") }}>
                      💰 Mayor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc") }}>
                      💰 Menor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("number"); setSortOrder("desc") }}>
                      🔢 Número (desc)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {hasFilters && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1 text-muted-foreground hover:text-gray-900"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Limpiar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Limpiar todos los filtros</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-md border-gray-200">
            <CardHeader className="border-b bg-gray-50/50 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Lista de Documentos
                </CardTitle>
                <div className="flex items-center gap-3">
                  {selectedIds.size > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                    </span>
                  )}
                  <Badge variant="secondary" className="font-normal">
                    {total} {total === 1 ? "documento" : "documentos"}
                  </Badge>
                </div>
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
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="Seleccionar todos"
                              className={cn(
                                isSomeSelected && "data-[state=checked]:bg-blue-600"
                              )}
                            />
                          </TableHead>
                          <TableHead className="w-28 font-semibold">Número</TableHead>
                          <TableHead className="w-28 font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="text-right font-semibold">Total</TableHead>
                          <TableHead className="w-32 font-semibold">Estado</TableHead>
                          <TableHead className="w-28 font-semibold">Fecha</TableHead>
                          <TableHead className="w-20 text-right font-semibold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => {
                          const statusConfig = STATUS_CONFIG[doc.status]
                          const typeConfig = TYPE_CONFIG[doc.type]
                          const isSelected = selectedIds.has(doc.id)

                          return (
                            <TableRow
                              key={doc.id}
                              className={cn(
                                "group cursor-pointer transition-all hover:bg-blue-50/30",
                                isSelected && "bg-blue-50/50"
                              )}
                              onClick={(e) => {
                                // No navegar si se clickeó el checkbox o el menú
                                if (
                                  (e.target as HTMLElement).closest('[role="checkbox"]') ||
                                  (e.target as HTMLElement).closest('[role="button"]')
                                ) {
                                  return
                                }
                                router.push(`/documentos/${doc.id}`)
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleSelectDocument(doc.id, checked as boolean)
                                  }
                                  aria-label={`Seleccionar documento #${doc.number}`}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-semibold text-gray-900">
                                #{String(doc.number).padStart(5, "0")}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={cn("font-semibold border", typeConfig.color)}
                                >
                                  {typeConfig.shortLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-gray-900">{doc.client.name}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    📱 {doc.client.phone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold tabular-nums text-gray-900">
                                {formatCurrency(Number(doc.total))}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.color} className="gap-1">
                                  <statusConfig.icon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-gray-50/30 px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> -{" "}
                        <span className="font-medium">{Math.min(page * PAGE_SIZE, total)}</span> de{" "}
                        <span className="font-medium">{total}</span> documentos
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (page <= 3) {
                              pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = page - 2 + i
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={cn(
                                  "w-10",
                                  page === pageNum && "bg-blue-600 hover:bg-blue-700"
                                )}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="gap-2"
                        >
                          Siguiente
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs shadow-sm">
                N
              </kbd>
              <span>Nuevo documento</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs shadow-sm">
                /
              </kbd>
              <span>Buscar</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs shadow-sm">
                R
              </kbd>
              <span>Actualizar</span>
            </div>
          </div>
        </div>

        {/* Batch Actions Bar */}
        <BatchActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onBatchDelete={handleBatchDelete}
          onBatchExport={handleBatchExport}
        />

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <StatsSkeleton />
        <div className="mt-6">
          <Card>
            <CardContent className="p-4">
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>
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