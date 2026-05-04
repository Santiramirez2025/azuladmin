import type { DocumentStatus, DocumentType } from "@/types"

export interface Stats {
  salesThisMonth: { total: number; count: number; change: number }
  documentsThisMonth: number
  documentsToday: number
  pendingPayments: { total: number; count: number }
  topProducts: { name: string; quantity: number; revenue: number }[]
  recentDocuments: {
    id: string
    number: number
    type: DocumentType
    client: string
    total: number
    status: DocumentStatus
    date: string
  }[]
}

export const statusConfig: Record<
  DocumentStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string }
> = {
  DRAFT: { variant: "secondary", label: "Borrador", color: "slate" },
  SENT: { variant: "default", label: "Enviado", color: "blue" },
  APPROVED: { variant: "default", label: "Aprobado", color: "indigo" },
  COMPLETED: { variant: "default", label: "Completado", color: "emerald" },
  CANCELLED: { variant: "destructive", label: "Cancelado", color: "red" },
  EXPIRED: { variant: "secondary", label: "Vencido", color: "orange" },
}

export const typeLabels: Record<DocumentType, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}
