// ============================================================================
// useDocumentCalculations
// Todos los cálculos del documento en un solo useMemo.
// ─────────────────────────────────────────────────────────────────────────────
// REGLAS DE NEGOCIO:
//  • isFree=true → subtotal siempre 0, sin importar unitPrice
//  • Recargo solo aplica en RECIBO con cuotas (no en PRESUPUESTO/REMITO)
//  • balance < $0.01 se considera "pagado completo" (tolerancia de redondeo)
//  • amountPaid se normaliza entre 0 y total (no puede superar el total)
// ============================================================================

import { useMemo } from "react"
import type { DocumentItem, DocumentType, PaymentMethod, DocumentCalculations } from "../_lib/types"
import { INSTALLMENT_COUNT } from "../_lib/constants"

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad pública: redondeo de 2 decimales sin float issues
// 100 * 0.18 = 18.000000000000004  →  roundCurrency(100 * 0.18) = 18.00
// ─────────────────────────────────────────────────────────────────────────────
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad pública: subtotal seguro de un item
// Usada también en ProductSelector al crear/modificar un item
// ─────────────────────────────────────────────────────────────────────────────
export function calculateItemSubtotal(
  item: Pick<DocumentItem, "unitPrice" | "quantity" | "isFree">
): number {
  if (item.isFree) return 0
  if (!item.unitPrice || item.unitPrice < 0) return 0
  return roundCurrency(item.unitPrice * item.quantity)
}

interface UseDocumentCalculationsProps {
  items: DocumentItem[]
  type: DocumentType
  paymentMethod: PaymentMethod
  paymentRates: Record<string, number>
  shippingCost: number
  amountPaid: number
}

export function useDocumentCalculations({
  items,
  type,
  paymentMethod,
  paymentRates,
  shippingCost,
  amountPaid,
}: UseDocumentCalculationsProps): DocumentCalculations {
  return useMemo(() => {
    // ── Subtotal ──────────────────────────────────────────────────────────────
    const subtotal = roundCurrency(
      items.reduce((sum, item) => sum + item.subtotal, 0)
    )

    // ── Cuotas e installments ─────────────────────────────────────────────────
    const installmentsNumber = INSTALLMENT_COUNT[paymentMethod] ?? 1
    const rateKey = String(installmentsNumber)
    const surchargeRate = paymentRates[rateKey] ?? 0

    // Recargo solo aplica en RECIBO y solo con cuotas (no CONTADO)
    const surcharge =
      type === "RECIBO" && paymentMethod !== "CONTADO"
        ? roundCurrency(subtotal * (surchargeRate / 100))
        : 0

    // ── Envío ─────────────────────────────────────────────────────────────────
    const shippingTotal = Math.max(0, roundCurrency(shippingCost))

    // ── Total ─────────────────────────────────────────────────────────────────
    const total = roundCurrency(subtotal + surcharge + shippingTotal)

    // ── Monto por cuota ───────────────────────────────────────────────────────
    const installmentAmount =
      installmentsNumber > 1 && total > 0
        ? roundCurrency(total / installmentsNumber)
        : 0

    // ── Pago parcial (solo relevante en RECIBO) ───────────────────────────────
    const normalizedAmountPaid =
      type === "RECIBO"
        ? Math.min(Math.max(0, roundCurrency(amountPaid)), total)
        : 0

    const balance =
      total > 0
        ? roundCurrency(Math.max(0, total - normalizedAmountPaid))
        : 0

    // Tolerancia de $0.01 para evitar "saldo de 1 centavo" por flotantes
    const isPaidInFull = type === "RECIBO" && total > 0 && balance < 0.01
    const hasPartialPayment =
      type === "RECIBO" && normalizedAmountPaid > 0 && !isPaidInFull

    // ── Flags de items ────────────────────────────────────────────────────────
    const hasFreeItems    = items.some((i) => i.isFree)
    const hasOnlyFreeItems = items.length > 0 && items.every((i) => i.isFree)
    const hasStockItems   = items.some((i) => i.source === "STOCK")
    const hasCatalogoItems = items.some((i) => i.source === "CATALOGO")

    return {
      subtotal,
      surchargeRate,
      surcharge,
      shippingTotal,
      total,
      installmentsNumber,
      installmentAmount,
      balance,
      isPaidInFull,
      hasPartialPayment,
      hasFreeItems,
      hasOnlyFreeItems,
      hasStockItems,
      hasCatalogoItems,
    }
  }, [items, type, paymentMethod, paymentRates, shippingCost, amountPaid])
}