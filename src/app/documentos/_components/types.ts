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
  }
> = {
  DRAFT: { color: "secondary", label: "Borrador", icon: FileText },
  SENT: { color: "warning", label: "Enviado", icon: Send },
  APPROVED: { color: "default", label: "Aprobado", icon: CheckCircle },
  COMPLETED: { color: "success", label: "Completado", icon: CheckCircle },
  CANCELLED: { color: "destructive", label: "Cancelado", icon: X },
  EXPIRED: { color: "secondary", label: "Vencido", icon: Clock },
}

export const TYPE_CONFIG: Record<
  DocumentType,
  { label: string; shortLabel: string }
> = {
  PRESUPUESTO: { label: "Presupuesto", shortLabel: "PRE" },
  RECIBO: { label: "Recibo", shortLabel: "REC" },
  REMITO: { label: "Remito", shortLabel: "REM" },
}

export const PAGE_SIZE = 20

export const CONFIG = {
  businessName: "AZUL COLCHONES",
  businessPhone: "+54 9 353 123-4567",
  deliveryGroupLink: "https://chat.whatsapp.com/FlK4k2MUJWJ2vSjkek2WOd",
  deliveryPhone: "+54 9 3535 69-4658",
}
