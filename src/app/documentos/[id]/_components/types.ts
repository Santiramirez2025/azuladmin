import { CheckCircle, Clock, Send, XCircle } from "lucide-react"
import type { DocumentStatus, DocumentType } from "@/types"

export interface DocumentDetail {
  id: string
  number: number
  type: DocumentType
  status: DocumentStatus
  date: string
  validUntil?: string
  subtotal: number
  surcharge: number
  surchargeRate: number
  total: number
  paymentMethod?: string
  installments?: number
  amountPaid?: number
  balance?: number
  paymentType?: string
  shippingType: string
  shippingCost: number
  observations?: string
  internalNotes?: string
  client: {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
    city: string
  }
  createdBy: { name: string }
  items: Array<{
    id: string
    productName: string
    productSize: string
    unitPrice: number
    quantity: number
    subtotal: number
    source: "STOCK" | "CATALOGO"
  }>
}

export const BUSINESS = {
  name: "AZUL COLCHONES",
  tagline: "Descanso de calidad desde 1989",
  address: "Balerdi 855, Villa María, Córdoba",
  phone: "3534 096566",
  email: "info@azulcolchones.com",
  cuit: "20-18015808-2",
  iibb: "215-266214",
  inicioActividad: "01/11/2006",
}

export const OWNER_NOTIFICATION_PHONE = "3536560294"
export const DELIVERY_NOTIFICATION_PHONE = "5493535694658"

export const statusConfig: Record<
  DocumentStatus,
  {
    label: string
    color: "default" | "secondary" | "success" | "warning" | "destructive"
    icon: typeof Clock
    gradient: string
  }
> = {
  DRAFT: { label: "Borrador", color: "secondary", icon: Clock, gradient: "from-slate-500 to-slate-600" },
  SENT: { label: "Enviado", color: "warning", icon: Send, gradient: "from-amber-500 to-orange-600" },
  APPROVED: { label: "Aprobado", color: "default", icon: CheckCircle, gradient: "from-blue-500 to-indigo-600" },
  COMPLETED: { label: "Completado", color: "success", icon: CheckCircle, gradient: "from-emerald-500 to-green-600" },
  CANCELLED: { label: "Cancelado", color: "destructive", icon: XCircle, gradient: "from-red-500 to-rose-600" },
  EXPIRED: { label: "Vencido", color: "secondary", icon: Clock, gradient: "from-slate-400 to-slate-500" },
}

export const typeLabels: Record<DocumentType, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}
