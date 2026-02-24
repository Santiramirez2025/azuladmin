// ============================================================================
// TIPOS CENTRALIZADOS
// Single source of truth — importar desde acá en todos los archivos
// ============================================================================

export type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"
export type PaymentMethod = "CONTADO" | "CUOTAS_3" | "CUOTAS_6" | "CUOTAS_9" | "CUOTAS_12"
export type StockSource = "STOCK" | "CATALOGO"

export interface Client {
  id: string
  name: string
  phone: string
  address?: string
  city: string
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentItem: isFree es el flag canónico para productos bonificados.
// NUNCA depender de unitPrice === 0 para esta lógica:
//   - Un vendedor puede ingresar 0 por accidente
//   - isFree es semánticamente explícito e intencional
//   - Permite mostrar "BONIFICADO" vs "$0.00"
//   - El subtotal SIEMPRE se calcula desde calculateItemSubtotal(), nunca directo
// ─────────────────────────────────────────────────────────────────────────────
export interface DocumentItem {
  id: string            // UUID local para keys estables en listas (no variantId)
  variantId?: string
  isCustom: boolean
  isFree: boolean       // ← FLAG EXPLÍCITO para bonificados/sin cargo
  productName: string
  productSize: string
  unitPrice: number     // Precio de lista (puede ser > 0 aunque isFree=true)
  quantity: number
  subtotal: number      // Siempre calculado via calculateItemSubtotal(), NUNCA editado directo
  source: StockSource
}

export interface DocumentCalculations {
  subtotal: number
  surchargeRate: number
  surcharge: number
  shippingTotal: number
  total: number
  installmentsNumber: number
  installmentAmount: number
  balance: number
  isPaidInFull: boolean
  hasPartialPayment: boolean
  hasFreeItems: boolean
  hasOnlyFreeItems: boolean
  hasStockItems: boolean
  hasCatalogoItems: boolean
}