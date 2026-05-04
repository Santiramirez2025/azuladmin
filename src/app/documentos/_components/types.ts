import { CheckCircle, Clock, FileText, Send, X } from "lucide-react"
import type { DocumentStatus, DocumentType } from "@/types"

export interface DocumentListItem {
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
  client: { id: string; name: string; phone: string; address?: string; city: string }
  createdBy: { id: string; name: string }
  _count: { items: number }
}

export interface QuickProduct {
  name: string
  price: number
  quantity: number
}

export interface DocumentStats {
  total: number
  borradores: number
  enviados: number
  completados: number
}

export const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    color: "default" | "secondary" | "success" | "warning" | "destructive"
    label: string
    icon: typeof CheckCircle
    gradient: string
  }
> = {
  DRAFT: { color: "secondary", label: "Borrador", icon: FileText, gradient: "from-slate-500 to-slate-600" },
  SENT: { color: "warning", label: "Enviado", icon: Send, gradient: "from-blue-500 to-cyan-500" },
  APPROVED: { color: "default", label: "Aprobado", icon: CheckCircle, gradient: "from-violet-500 to-purple-600" },
  COMPLETED: { color: "success", label: "Completado", icon: CheckCircle, gradient: "from-emerald-500 to-green-600" },
  CANCELLED: { color: "destructive", label: "Cancelado", icon: X, gradient: "from-red-500 to-rose-600" },
  EXPIRED: { color: "secondary", label: "Vencido", icon: Clock, gradient: "from-orange-500 to-amber-600" },
}

export const TYPE_CONFIG: Record<
  DocumentType,
  { label: string; shortLabel: string; gradient: string; iconBg: string }
> = {
  PRESUPUESTO: {
    label: "Presupuesto",
    shortLabel: "PRE",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-gradient-to-br from-blue-500/10 to-indigo-600/10",
  },
  RECIBO: {
    label: "Recibo",
    shortLabel: "REC",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-gradient-to-br from-emerald-500/10 to-teal-600/10",
  },
  REMITO: {
    label: "Remito",
    shortLabel: "REM",
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-gradient-to-br from-orange-500/10 to-red-600/10",
  },
}

export const PAGE_SIZE = 20

export const CONFIG = {
  businessName: "AZUL COLCHONES",
  businessPhone: "+54 9 353 123-4567",
  deliveryGroupLink: "https://chat.whatsapp.com/FlK4k2MUJWJ2vSjkek2WOd",
  deliveryPhone: "+54 9 3535 69-4658",
}
