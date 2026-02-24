// ============================================================================
// CONSTANTES — Fuera de todos los componentes
// Evita recreación de objetos/arrays en cada render
// ============================================================================

import type { DocumentType } from "./types"
// Íconos se importan en el componente que los usa, acá solo guardamos el nombre
// para evitar importar lucide en un archivo de constantes puras

export const DOCUMENT_TYPE_CONFIG: {
  value: DocumentType
  label: string
  description: string
  iconName: "FileText" | "CreditCard" | "Truck"
  badgeLabel?: string
}[] = [
  { value: "PRESUPUESTO", label: "Presupuesto", description: "Cotización para el cliente", iconName: "FileText" },
  { value: "RECIBO",      label: "Recibo",      description: "Comprobante de pago",        iconName: "CreditCard" },
  { value: "REMITO",      label: "Remito",      description: "Comprobante de entrega",     iconName: "Truck", badgeLabel: "Se envía a reparto" },
]

export const SHIPPING_OPTIONS = [
  "Sin cargo en Villa María",
  "Envío a coordinar",
  "Retira en local",
  "Envío interior (+costo)",
] as const

export const VALID_DAYS_OPTIONS = [3, 7, 15, 30] as const

export const PAYMENT_TYPE_OPTIONS = [
  { value: "Efectivo",      emoji: "💵" },
  { value: "Transferencia", emoji: "🏦" },
  { value: "Débito",        emoji: "💳" },
  { value: "Crédito",       emoji: "💳" },
  { value: "Cheque",        emoji: "📝" },
  { value: "Mixto",         emoji: "🔀" },
] as const

// Mapeo directo de PaymentMethod → número de cuotas
export const INSTALLMENT_COUNT: Record<string, number> = {
  CONTADO:  1,
  CUOTAS_3: 3,
  CUOTAS_6: 6,
  CUOTAS_9: 9,
  CUOTAS_12: 12,
}

// Rates de fallback si el hook no carga (se usan solo mientras carga)
export const DEFAULT_PAYMENT_RATES: Record<string, number> = {
  "1":  0,
  "3":  18,
  "6":  25,
  "9":  35,
  "12": 47,
}

export const DELIVERY_WHATSAPP = "5493535694658"

export const STORE_INFO = {
  name:    "AZUL COLCHONES",
  address: "Balerdi 855, Villa María",
  phone:   "3534096566",
  brand:   "PIERO",
} as const