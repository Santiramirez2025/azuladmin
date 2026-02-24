// ============================================================================
// whatsapp-messages.ts
// Formateadores de mensajes WhatsApp — completamente separados del componente.
// ─────────────────────────────────────────────────────────────────────────────
// Beneficios:
//  • Testeables en aislamiento (jest/vitest sin montar componentes)
//  • Reutilizables desde lista de documentos (reenvío)
//  • Mantenimiento centralizado del copy
//  • Sin dependencias de React (funciones puras)
// ============================================================================

import type { Client, DocumentItem, DocumentType, DocumentCalculations } from "./types"
import { STORE_INFO } from "./constants"

// Formateo de moneda en pesos argentinos — se pasa como parámetro para
// evitar importar utils del cliente en este módulo (que puede usarse en server)
type FormatCurrencyFn = (n: number) => string

function padDocNumber(n: number): string {
  return String(n).padStart(5, "0")
}

// ─────────────────────────────────────────────────────────────────────────────
// REMITO: Sin precios — para el repartidor
// ─────────────────────────────────────────────────────────────────────────────
export function buildRemitoMessage({
  docNumber,
  client,
  items,
  shippingType,
  observations,
}: {
  docNumber: number
  client: Client
  items: DocumentItem[]
  shippingType: string
  observations?: string
}): string {
  const productLines = items
    .map((item, i) => {
      const freeTag = item.isFree ? " [BONIFICADO]" : ""
      return `${i + 1}. ${item.productName} ${item.productSize}${freeTag} (cant: ${item.quantity})`
    })
    .join("\n")

  const address =
    client.address && client.city
      ? `${client.address}, ${client.city}`
      : client.city || "⚠️ COORDINAR DIRECCIÓN"

  const parts = [
    `Hola! 👋`,
    ``,
    `🚚 *REMITO N° ${padDocNumber(docNumber)}*`,
    ``,
    `Tenemos una entrega para coordinar:`,
    ``,
    `📦 *PRODUCTOS:*`,
    productLines,
    ``,
    `👤 *CLIENTE:*`,
    client.name,
    `📞 ${client.phone}`,
    `📍 ${address}`,
    ``,
    `🚛 *${shippingType}*`,
    ...(observations ? [``, `📝 *Obs:* ${observations}`] : []),
    ``,
    `_Remito generado por ${STORE_INFO.name}_`,
  ]

  return parts.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESUPUESTO / RECIBO: Con precios — para el cliente
// ─────────────────────────────────────────────────────────────────────────────
export function buildClientMessage({
  docNumber,
  type,
  client,
  items,
  calc,
  shippingType,
  validDays,
  amountPaid,
  paymentType,
  fmt,
}: {
  docNumber: number
  type: DocumentType
  client: Client
  items: DocumentItem[]
  calc: DocumentCalculations
  shippingType: string
  validDays?: number
  amountPaid?: number
  paymentType?: string
  fmt: FormatCurrencyFn
}): string {
  const firstName = client.name.split(" ")[0]
  const docLabel = type === "PRESUPUESTO" ? "PRESUPUESTO" : "RECIBO"

  // ── Lista de productos ─────────────────────────────────────────────────────
  const productLines = items
    .map((item) => {
      if (item.isFree) {
        // Producto bonificado: mostrar "SIN CARGO" en lugar de precio
        const stockTag = item.source === "STOCK" ? " ✓" : ""
        return `• ${item.productName} ${item.productSize}${stockTag}\n  ${item.quantity} x *SIN CARGO* 🎁`
      }
      const stockTag = item.source === "STOCK" ? " ✓" : ""
      return `• ${item.productName} ${item.productSize}${stockTag}\n  ${item.quantity} x ${fmt(item.unitPrice)} = ${fmt(item.subtotal)}`
    })
    .join("\n\n")

  const lines: string[] = [
    `Hola ${firstName}! 😊`,
    ``,
    `Te envío tu *${docLabel} N° ${padDocNumber(docNumber)}*`,
    ``,
    productLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
  ]

  // ── Detalle de importes ────────────────────────────────────────────────────
  if (calc.hasFreeItems && !calc.hasOnlyFreeItems) {
    lines.push(`Subtotal (sin bonificados): ${fmt(calc.subtotal)}`)
  }

  if (calc.surcharge > 0) {
    lines.push(`Subtotal: ${fmt(calc.subtotal)}`)
    lines.push(`Recargo ${calc.installmentsNumber} cuotas: ${fmt(calc.surcharge)}`)
    lines.push(`━━━━━━━━━━━━━━━━━━━`)
  }

  if (calc.hasOnlyFreeItems) {
    lines.push(`💵 *TOTAL: SIN CARGO* 🎁`)
  } else {
    lines.push(`💵 *TOTAL: ${fmt(calc.total)}*`)
  }

  // ── Info de pago (solo RECIBO) ─────────────────────────────────────────────
  if (type === "RECIBO") {
    if (amountPaid && amountPaid > 0) {
      lines.push(``, `✅ *Pagado (${paymentType ?? ""}):* ${fmt(amountPaid)}`)
    }

    if (calc.balance > 0) {
      lines.push(`⏳ *Saldo Pendiente:* ${fmt(calc.balance)}`)
    } else if (calc.isPaidInFull) {
      lines.push(``, `🎉 *PAGO COMPLETO*`)
    }

    if (calc.installmentsNumber > 1) {
      lines.push(``, `💳 *${calc.installmentsNumber} cuotas de ${fmt(calc.installmentAmount)}*`)
    }
  }

  lines.push(``, `━━━━━━━━━━━━━━━━━━━`)

  // ── Info de entrega ────────────────────────────────────────────────────────
  if (calc.hasStockItems && calc.hasCatalogoItems) {
    lines.push(`📦 En stock: Entrega inmediata`)
    lines.push(`📦 Catálogo: 7-10 días hábiles`)
  } else if (calc.hasCatalogoItems) {
    lines.push(`📦 Entrega estimada: 7-10 días hábiles`)
  } else {
    lines.push(`📦 Disponible para entrega inmediata`)
  }

  lines.push(`🚚 ${shippingType}`)

  if (type === "PRESUPUESTO" && validDays) {
    lines.push(`⏱️ Válido por ${validDays} días`)
  }

  lines.push(
    ``,
    `✅ Garantía oficial ${STORE_INFO.brand}`,
    ``,
    `Cualquier consulta, estoy a disposición! 👍`,
    ``,
    `*${STORE_INFO.name}*`,
    `📍 ${STORE_INFO.address}`,
    `📞 ${STORE_INFO.phone}`
  )

  return lines.join("\n")
}