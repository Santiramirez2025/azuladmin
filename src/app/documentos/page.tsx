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
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
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
import { formatCurrency, formatDate, cn } from "@/lib/utils-client"
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
    gradient: string
  }
> = {
  DRAFT: { 
    color: "secondary", 
    label: "Borrador", 
    icon: FileText,
    gradient: "from-slate-500 to-slate-600"
  },
  SENT: { 
    color: "warning", 
    label: "Enviado", 
    icon: Send,
    gradient: "from-blue-500 to-cyan-500"
  },
  APPROVED: { 
    color: "default", 
    label: "Aprobado", 
    icon: CheckCircle,
    gradient: "from-violet-500 to-purple-600"
  },
  COMPLETED: { 
    color: "success", 
    label: "Completado", 
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600"
  },
  CANCELLED: { 
    color: "destructive", 
    label: "Cancelado", 
    icon: X,
    gradient: "from-red-500 to-rose-600"
  },
  EXPIRED: { 
    color: "secondary", 
    label: "Vencido", 
    icon: Clock,
    gradient: "from-orange-500 to-amber-600"
  },
}

const TYPE_CONFIG: Record<
  DocumentType,
  { label: string; shortLabel: string; gradient: string; iconBg: string }
> = {
  PRESUPUESTO: { 
    label: "Presupuesto", 
    shortLabel: "PRE", 
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
  },
  RECIBO: { 
    label: "Recibo", 
    shortLabel: "REC", 
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-gradient-to-br from-emerald-500/10 to-teal-600/10"
  },
  REMITO: { 
    label: "Remito", 
    shortLabel: "REM", 
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-gradient-to-br from-orange-500/10 to-red-600/10"
  },
}

const PAGE_SIZE = 20

// ⚙️ CONFIGURACIÓN DEL NEGOCIO
const CONFIG = {
  businessName: "AZUL COLCHONES",
  businessPhone: "+54 9 353 123-4567",
  deliveryGroupLink: "https://chat.whatsapp.com/FlK4k2MUJWJ2vSjkek2WOd",
  deliveryPhone: "+54 9 3535 69-4658",
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
// Skeleton Components
// ============================================================================

const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent p-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    ))}
  </div>
)

const StatsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="group relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/10 blur-2xl"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-14 w-14 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

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
      <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Producto Rápido
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Creá un producto nuevo y agregalo al documento en un solo paso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-sm font-semibold text-slate-700">
              Nombre del producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="Ej: Colchón Piero Paraíso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-size" className="text-sm font-semibold text-slate-700">
              Medida <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-size"
              placeholder="Ej: 140x190"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={isSubmitting}
              className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price" className="text-sm font-semibold text-slate-700">
                Precio unitario <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
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
                  className="border-slate-200 bg-white/50 pl-7 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-quantity" className="text-sm font-semibold text-slate-700">
                Cantidad
              </Label>
              <Input
                id="product-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isSubmitting}
                className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !price || !size.trim() || isSubmitting}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
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
// WhatsApp Modals
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
      <DialogContent className="sm:max-w-lg border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 shadow-lg shadow-green-500/30">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enviar a Cliente
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Personalizá el mensaje antes de enviar por WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client-phone" className="text-sm font-semibold text-slate-700">
              Teléfono del cliente
            </Label>
            <Input
              id="client-phone"
              placeholder="+54 9 351 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSending}
              className="border-slate-200 bg-white/50 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-message" className="text-sm font-semibold text-slate-700">
              Mensaje
            </Label>
            <Textarea
              id="client-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="resize-none border-slate-200 bg-white/50 font-mono text-sm focus:border-green-500 focus:ring-green-500/20"
              disabled={isSending}
            />
            <p className="text-xs text-slate-500">
              💡 Este mensaje incluye el total y detalles del documento.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSending}
            className="border-slate-200 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40"
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
      <DialogContent className="sm:max-w-lg border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-2.5 shadow-lg shadow-orange-500/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enviar a Reparto
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Copiá el mensaje y pegalo en el grupo de WhatsApp del reparto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Mensaje para el reparto
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="resize-none border-slate-200 bg-orange-50/30 font-mono text-sm focus:border-orange-500 focus:ring-orange-500/20"
            />
            <p className="text-xs text-slate-500">
              💡 Este mensaje no incluye precios, solo datos de entrega.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full border-slate-200 hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleOpenGroup} 
            className="w-full gap-2 border-slate-200 hover:bg-slate-50 sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Grupo
          </Button>
          <Button
            onClick={handleCopy}
            className={cn(
              "w-full gap-2 font-semibold shadow-lg transition-all sm:w-auto",
              copied 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40" 
                : "bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40"
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
        className="h-9 w-9 rounded-xl p-0 transition-all hover:bg-slate-100 hover:shadow-md"
      >
        <span className="sr-only">Abrir menú de acciones</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl">
      <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        #{String(doc.number).padStart(5, "0")}
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-slate-100" />

      <Link href={`/documentos/${doc.id}`}>
        <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
          <Eye className="h-4 w-4 text-slate-600" />
          <span className="font-medium">Ver detalle</span>
        </DropdownMenuItem>
      </Link>

      <DropdownMenuSeparator className="bg-slate-100" />

      <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Enviar
      </DropdownMenuLabel>

      <DropdownMenuItem onClick={onSendClient} className="cursor-pointer gap-2 rounded-lg">
        <User className="h-4 w-4 text-green-600" />
        <span className="font-medium">Enviar a cliente</span>
      </DropdownMenuItem>

      {(doc.type === "REMITO" || doc.type === "RECIBO") && (
        <DropdownMenuItem onClick={onSendDelivery} className="cursor-pointer gap-2 rounded-lg">
          <Truck className="h-4 w-4 text-orange-600" />
          <span className="font-medium">
            {doc.type === "RECIBO" ? "Enviar a reparto" : "Copiar para reparto"}
          </span>
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator className="bg-slate-100" />

      <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Documentos
      </DropdownMenuLabel>

      <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading} className="cursor-pointer gap-2 rounded-lg">
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <Download className="h-4 w-4 text-blue-600" />
        )}
        <span className="font-medium">Descargar PDF</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onPrint} className="cursor-pointer gap-2 rounded-lg">
        <Printer className="h-4 w-4 text-purple-600" />
        <span className="font-medium">Imprimir</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="bg-slate-100" />

      <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer gap-2 rounded-lg">
        <Copy className="h-4 w-4 text-slate-600" />
        <span className="font-medium">Duplicar</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onDelete}
        className="cursor-pointer gap-2 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
        <span className="font-medium">Eliminar</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-slate-200/50 to-slate-300/50 blur-2xl"></div>
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

// ============================================================================
// Stats Cards
// ============================================================================

function StatsCards({ stats, isLoading }: { stats: DocumentStats; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />

  const items = [
    { 
      label: "Total Documentos", 
      value: stats.total, 
      icon: FileText, 
      gradient: "from-slate-500 to-slate-600",
      iconBg: "from-slate-500/10 to-slate-600/10",
      change: "+12%",
      changePositive: true
    },
    { 
      label: "Borradores", 
      value: stats.borradores, 
      icon: FileText, 
      gradient: "from-amber-500 to-orange-600",
      iconBg: "from-amber-500/10 to-orange-600/10",
      change: "3 activos",
      changePositive: null
    },
    { 
      label: "Enviados", 
      value: stats.enviados, 
      icon: Send, 
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "from-blue-500/10 to-cyan-600/10",
      change: "+8%",
      changePositive: true
    },
    { 
      label: "Completados", 
      value: stats.completados, 
      icon: CheckCircle, 
      gradient: "from-emerald-500 to-green-600",
      iconBg: "from-emerald-500/10 to-green-600/10",
      change: "+24%",
      changePositive: true
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className="group relative" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className={cn(
            "absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-40",
            item.gradient
          )}></div>
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={cn(
              "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-2xl",
              item.iconBg
            )}></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {item.label}
                  </p>
                  <p className={cn(
                    "bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent",
                    item.gradient
                  )}>
                    {item.value}
                  </p>
                  {item.change && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      item.changePositive === true && "text-emerald-600",
                      item.changePositive === false && "text-red-600",
                      item.changePositive === null && "text-slate-600"
                    )}>
                      {item.changePositive === true && <TrendingUp className="h-3.5 w-3.5" />}
                      <span>{item.change}</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "rounded-2xl bg-gradient-to-br p-4 shadow-lg transition-transform group-hover:scale-110",
                  item.gradient,
                  "shadow-" + item.gradient.split(" ")[0].replace("from-", "") + "/20"
                )}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Batch Actions Bar
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
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-5">
      <div className="relative">
        <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-40 blur-lg"></div>
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
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onBatchExport}
                className="gap-2 border-slate-200 bg-white/50 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onBatchDelete}
                className="gap-2 border-red-200 bg-white/50 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="gap-2 hover:bg-slate-100"
              >
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

// ============================================================================
// Main Content Component
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
  }

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-4xl font-bold text-transparent">
                  Documentos
                </h1>
              </div>
              <p className="text-sm text-slate-600">
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
                    className="gap-2 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span className="hidden sm:inline">Actualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                  <p>Actualizar lista (R)</p>
                </TooltipContent>
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
                    <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo Documento</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                    <p>Crear documento (N)</p>
                  </TooltipContent>
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
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
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
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
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
                  <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white/95 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ordenar por
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc") }} className="cursor-pointer rounded-lg">
                      📅 Más recientes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc") }} className="cursor-pointer rounded-lg">
                      📅 Más antiguos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc") }} className="cursor-pointer rounded-lg">
                      💰 Mayor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc") }} className="cursor-pointer rounded-lg">
                      💰 Menor importe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("number"); setSortOrder("desc") }} className="cursor-pointer rounded-lg">
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
                        className="gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Limpiar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                      Limpiar todos los filtros
                    </TooltipContent>
                  </Tooltip>
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
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Lista de Documentos
                  </span>
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
                              className={cn(
                                "border-slate-300",
                                isSomeSelected && "data-[state=checked]:bg-blue-600"
                              )}
                            />
                          </TableHead>
                          <TableHead className="w-32 font-semibold text-slate-700">Número</TableHead>
                          <TableHead className="w-28 font-semibold text-slate-700">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                          <TableHead className="w-36 font-semibold text-slate-700">Estado</TableHead>
                          <TableHead className="w-32 font-semibold text-slate-700">Fecha</TableHead>
                          <TableHead className="w-20 pr-6 text-right font-semibold text-slate-700">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc, index) => {
                          const statusConfig = STATUS_CONFIG[doc.status]
                          const typeConfig = TYPE_CONFIG[doc.type]
                          const isSelected = selectedIds.has(doc.id)

                          return (
                            <TableRow
                              key={doc.id}
                              className={cn(
                                "group cursor-pointer border-slate-100 transition-all hover:bg-blue-50/30",
                                isSelected && "bg-blue-50/50"
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
                              style={{
                                animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                              }}
                            >
                              <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleSelectDocument(doc.id, checked as boolean)
                                  }
                                  aria-label={`Seleccionar documento #${doc.number}`}
                                  className="border-slate-300"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-bold text-slate-900">
                                #{String(doc.number).padStart(5, "0")}
                              </TableCell>
                              <TableCell>
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                                  typeConfig.iconBg
                                )}>
                                  <div className={cn(
                                    "h-1.5 w-1.5 rounded-full bg-gradient-to-r",
                                    typeConfig.gradient
                                  )}></div>
                                  {typeConfig.shortLabel}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-900">{doc.client.name}</p>
                                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="text-slate-400">📱</span>
                                    {doc.client.phone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  "bg-gradient-to-r bg-clip-text text-base font-bold tabular-nums text-transparent",
                                  typeConfig.gradient
                                )}>
                                  {formatCurrency(Number(doc.total))}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={statusConfig.color} 
                                  className={cn(
                                    "gap-1.5 shadow-sm",
                                    `bg-gradient-to-r ${statusConfig.gradient} text-white hover:opacity-90`
                                  )}
                                >
                                  <statusConfig.icon className="h-3 w-3" />
                                  {statusConfig.label}
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
                        Mostrando{" "}
                        <span className="font-semibold text-slate-900">
                          {(page - 1) * PAGE_SIZE + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-semibold text-slate-900">
                          {Math.min(page * PAGE_SIZE, total)}
                        </span>{" "}
                        de{" "}
                        <span className="font-semibold text-slate-900">{total}</span>{" "}
                        documentos
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="gap-2 border-slate-200 bg-white/50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Anterior</span>
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
                                  "w-10 border-slate-200",
                                  page === pageNum &&
                                    "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"
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
                          className="gap-2 border-slate-200 bg-white/50"
                        >
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
            <div className="flex items-center gap-2">
              <kbd className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs shadow-sm">
                N
              </kbd>
              <span>Nuevo documento</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs shadow-sm">
                /
              </kbd>
              <span>Buscar</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs shadow-sm">
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

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </TooltipProvider>
  )
}

// ============================================================================
// Loading Component
// ============================================================================

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