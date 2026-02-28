// ============================================================================
// whatsapp-messages.ts
// Formateadores de mensajes WhatsApp — completamente separados del componente.
// ─────────────────────────────────────────────────────────────────────────────
// Beneficios:
//  • Testeables en aislamiento (jest/vitest sin montar componentes)
//  • Reutilizables desde lista de documentos (reenvío)
//  • Mantenimiento centralizado del copy
//  • Sin dependencias de React (funciones puras)
//
// NOTA: Sin emojis Unicode para evitar renderizado roto ("�") en
// ciertos dispositivos/versiones de WhatsApp. Formato limpio y profesional.
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
      return `  ${i + 1}. ${item.productName} ${item.productSize}${freeTag} (cant: ${item.quantity})`
    })
    .join("\n")

  const address =
    client.address && client.city
      ? `${client.address}, ${client.city}`
      : client.city || "A COORDINAR"

  const lines: string[] = [
    `*REMITO N° ${padDocNumber(docNumber)}*`,
    ``,
    `*Productos:*`,
    productLines,
    ``,
    `*Cliente:* ${client.name}`,
    `*Tel:* ${client.phone}`,
    `*Direccion:* ${address}`,
    ``,
    `*Envio:* ${shippingType}`,
  ]

  if (observations) {
    lines.push(`*Obs:* ${observations}`)
  }

  lines.push(``, `Confirmar cuando este entregado.`, ``, `_${STORE_INFO.name}_`)

  return lines.join("\n")
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
  const docLabel = type === "PRESUPUESTO" ? "Presupuesto" : "Recibo"

  // ── Lista de productos ─────────────────────────────────────────────────────
  const productLines = items
    .map((item) => {
      if (item.isFree) {
        return `  - ${item.productName} ${item.productSize} x${item.quantity} — *SIN CARGO*`
      }
      return `  - ${item.productName} ${item.productSize} x${item.quantity} — ${fmt(item.subtotal)}`
    })
    .join("\n")

  const lines: string[] = [
    `Hola ${firstName}!`,
    ``,
    `Te paso tu *${docLabel} N° ${padDocNumber(docNumber)}*`,
    ``,
    productLines,
  ]

  // ── Detalle de importes ────────────────────────────────────────────────────
  if (calc.surcharge > 0) {
    lines.push(
      ``,
      `Subtotal: ${fmt(calc.subtotal)}`,
      `Recargo ${calc.installmentsNumber} cuotas: ${fmt(calc.surcharge)}`
    )
  }

  lines.push(``)

  if (calc.hasOnlyFreeItems) {
    lines.push(`*TOTAL: SIN CARGO*`)
  } else {
    lines.push(`*TOTAL: ${fmt(calc.total)}*`)
  }

  // ── Info de pago (solo RECIBO) ─────────────────────────────────────────────
  if (type === "RECIBO") {
    if (amountPaid && amountPaid > 0) {
      lines.push(`Pagado (${paymentType || "Efectivo"}): ${fmt(amountPaid)}`)
    }

    if (calc.balance > 0) {
      lines.push(`*Saldo pendiente: ${fmt(calc.balance)}*`)
    } else if (calc.isPaidInFull) {
      lines.push(`*Pago completo*`)
    }

    if (calc.installmentsNumber > 1) {
      lines.push(`${calc.installmentsNumber} cuotas de ${fmt(calc.installmentAmount)}`)
    }
  }

  // ── Info de entrega ────────────────────────────────────────────────────────
  lines.push(``)

  if (calc.hasStockItems && calc.hasCatalogoItems) {
    lines.push(`Entrega: inmediata (stock) / 7-10 dias (catalogo)`)
  } else if (calc.hasCatalogoItems) {
    lines.push(`Entrega estimada: 7-10 dias habiles`)
  } else {
    lines.push(`Disponible para entrega inmediata`)
  }

  lines.push(`Envio: ${shippingType}`)

  if (type === "PRESUPUESTO" && validDays) {
    lines.push(`Valido por ${validDays} dias`)
  }

  lines.push(`Garantia oficial ${STORE_INFO.brand}`)

  lines.push(
    ``,
    `Cualquier consulta estoy a disposicion.`,
    ``,
    `*${STORE_INFO.name}*`,
    `${STORE_INFO.address}`,
    `Tel: ${STORE_INFO.phone}`
  )

  return lines.join("\n")
}