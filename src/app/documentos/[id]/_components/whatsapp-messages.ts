import { formatCurrency, generateWhatsAppLink } from "@/lib/utils-client"
import {
  BUSINESS,
  DELIVERY_NOTIFICATION_PHONE,
  OWNER_NOTIFICATION_PHONE,
  type DocumentDetail,
} from "./types"

export function buildOwnerNotification(doc: DocumentDetail): string {
  const docNumber = String(doc.number).padStart(5, "0")
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const items = doc.items
    .map((i) => `  • ${i.productName} ${i.productSize} x${i.quantity} — ${formatCurrency(i.subtotal)}`)
    .join("\n")

  const hasStock = doc.items.some((i) => i.source === "STOCK")
  const hasCatalogo = doc.items.some((i) => i.source === "CATALOGO")
  const entrega = hasStock && hasCatalogo
    ? "Inmediata (stock) / 7-10 días (catálogo)"
    : hasCatalogo
    ? "7-10 días hábiles (catálogo)"
    : "Inmediata (stock)"

  const lines: string[] = [
    `🔔 *NUEVA VENTA REGISTRADA*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📄 *Recibo #${docNumber}*`,
    `📅 ${fecha}`,
    ``,
    `👤 *Cliente:* ${doc.client.name}`,
    `📞 *Tel:* ${doc.client.phone}`,
  ]

  if (doc.client.address) lines.push(`📍 *Dir:* ${doc.client.address}, ${doc.client.city}`)

  lines.push(``, `📦 *Productos:*`, items, ``, `━━━━━━━━━━━━━━━━━━━━`)

  if (doc.surcharge > 0) {
    lines.push(`  Subtotal: ${formatCurrency(doc.subtotal)}`)
    lines.push(`  Recargo (${doc.surchargeRate}%): ${formatCurrency(doc.surcharge)}`)
  }
  if (doc.shippingCost > 0) lines.push(`  Envío: ${formatCurrency(doc.shippingCost)}`)
  lines.push(`💰 *TOTAL: ${formatCurrency(doc.total)}*`)

  if (doc.paymentType) lines.push(`💳 *Método:* ${doc.paymentType}`)
  if (doc.installments && doc.installments > 1) {
    const cuota = Math.round(doc.total / doc.installments)
    lines.push(`📊 *Plan:* ${doc.installments} cuotas de ${formatCurrency(cuota)}`)
  }

  if (doc.amountPaid && doc.amountPaid > 0) {
    lines.push(`✅ *Pagado:* ${formatCurrency(doc.amountPaid)}`)
    if (doc.balance && doc.balance > 0) {
      lines.push(`⚠️ *Saldo pendiente:* ${formatCurrency(doc.balance)}`)
    } else {
      lines.push(`✅ *PAGO COMPLETO*`)
    }
  } else {
    lines.push(`⏳ *Sin pago registrado — A cuenta*`)
  }

  lines.push(``, `🚚 *Entrega:* ${entrega}`, `📦 *Envío:* ${doc.shippingType}`)

  if (doc.observations) lines.push(``, `📝 *Obs:* ${doc.observations}`)
  if (doc.internalNotes) lines.push(`🔒 *Nota interna:* ${doc.internalNotes}`)

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━`, `_${BUSINESS.name}_`)
  return lines.join("\n")
}

export function buildDeliveryNotification(doc: DocumentDetail): string {
  const docNumber = String(doc.number).padStart(5, "0")
  const items = doc.items
    .map((i, idx) => `  ${idx + 1}. ${i.productName} ${i.productSize} (cant: ${i.quantity})`)
    .join("\n")
  const addressLine = doc.client.address
    ? `${doc.client.address}, ${doc.client.city}`
    : doc.client.city || "A COORDINAR"

  const hasStock = doc.items.some((i) => i.source === "STOCK")
  const hasCatalogo = doc.items.some((i) => i.source === "CATALOGO")

  const lines: string[] = [
    `🚚 *ENTREGA PENDIENTE*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📄 *Recibo #${docNumber}*`,
    ``,
    `👤 *Cliente:* ${doc.client.name}`,
    `📞 *Tel:* ${doc.client.phone}`,
    `📍 *Dirección:* ${addressLine}`,
    ``,
    `📦 *Productos a entregar:*`,
    items,
  ]

  if (hasStock && hasCatalogo) {
    lines.push(``, `⏱ Algunos productos son de catálogo (7-10 días)`)
  } else if (hasCatalogo) {
    lines.push(``, `⏱ Productos de catálogo — confirmar disponibilidad`)
  }

  lines.push(``, `🚛 *Envío:* ${doc.shippingType}`)

  if (doc.balance && doc.balance > 0) {
    lines.push(``, `💰 *COBRAR AL ENTREGAR: ${formatCurrency(doc.balance)}*`, `💳 Método: ${doc.paymentType || "Consultar"}`)
  } else if (doc.amountPaid && doc.amountPaid > 0) {
    lines.push(``, `✅ *PAGO COMPLETO — No cobrar*`)
  } else {
    lines.push(``, `⚠️ *SIN PAGO — Cobrar total: ${formatCurrency(doc.total)}*`)
  }

  if (doc.observations) lines.push(``, `📝 *Obs:* ${doc.observations}`)

  lines.push(``, `Confirmar cuando esté entregado. 👍`, ``, `━━━━━━━━━━━━━━━━━━━━`, `_${BUSINESS.name}_`)
  return lines.join("\n")
}

export function buildClientMessage(doc: DocumentDetail): string {
  if (doc.type === "REMITO") {
    const productList = doc.items
      .map((item, i) => `  ${i + 1}. ${item.productName} ${item.productSize} (cant: ${item.quantity})`)
      .join("\n")
    const addressLine = doc.client.address && doc.client.city
      ? `${doc.client.address}, ${doc.client.city}`
      : doc.client.city || "A COORDINAR"
    return [
      `*REMITO N° ${String(doc.number).padStart(5, "0")}*`,
      ``,
      `*Productos:*`,
      productList,
      ``,
      `*Cliente:* ${doc.client.name}`,
      `*Tel:* ${doc.client.phone}`,
      `*Direccion:* ${addressLine}`,
      ``,
      `*Envio:* ${doc.shippingType}`,
      ...(doc.observations ? [`*Obs:* ${doc.observations}`] : []),
      ``,
      `Confirmar cuando este entregado.`,
      ``,
      `_AZUL COLCHONES_`,
    ].join("\n")
  }

  const firstName = doc.client.name.split(" ")[0]
  const typeLabel = doc.type === "PRESUPUESTO" ? "Presupuesto" : "Recibo"
  const productList = doc.items
    .map((item) => `  - ${item.productName} ${item.productSize} x${item.quantity} — ${formatCurrency(item.subtotal)}`)
    .join("\n")

  const lines: string[] = [
    `Hola ${firstName}!`,
    ``,
    `Te paso tu *${typeLabel} N° ${String(doc.number).padStart(5, "0")}*`,
    ``,
    productList,
  ]

  if (doc.surcharge > 0) {
    lines.push(``, `Subtotal: ${formatCurrency(doc.subtotal)}`, `Recargo ${doc.installments} cuotas: ${formatCurrency(doc.surcharge)}`)
  }
  lines.push(``, `*TOTAL: ${formatCurrency(doc.total)}*`)

  if (doc.type === "RECIBO") {
    if (doc.amountPaid && doc.amountPaid > 0) {
      lines.push(`Pagado (${doc.paymentType || "Efectivo"}): ${formatCurrency(doc.amountPaid)}`)
    }
    if (doc.balance && doc.balance > 0) {
      lines.push(`*Saldo pendiente: ${formatCurrency(doc.balance)}*`)
    } else if (doc.amountPaid && doc.amountPaid >= doc.total) {
      lines.push(`*Pago completo*`)
    }
    if (doc.installments && doc.installments > 1) {
      const cuota = Math.round(doc.total / doc.installments)
      lines.push(`${doc.installments} cuotas de ${formatCurrency(cuota)}`)
    }
  }

  lines.push(``)

  const hasCatalogo = doc.items.some((i) => i.source === "CATALOGO")
  const hasStock = doc.items.some((i) => i.source === "STOCK")
  if (hasStock && hasCatalogo) lines.push(`Entrega: inmediata (stock) / 7-10 dias (catalogo)`)
  else if (hasCatalogo) lines.push(`Entrega estimada: 7-10 dias habiles`)
  else lines.push(`Disponible para entrega inmediata`)

  lines.push(`Envio: ${doc.shippingType}`)

  if (doc.type === "PRESUPUESTO" && doc.validUntil) {
    const validDate = new Date(doc.validUntil)
    const daysValid = Math.ceil((validDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    lines.push(`Valido por ${daysValid} dias`)
  }

  lines.push(`Garantia oficial PIERO`)
  lines.push(``, `Cualquier consulta estoy a disposicion.`, ``, `*AZUL COLCHONES*`, `Balerdi 855, Villa Maria`, `Tel: 3534096566`)
  return lines.join("\n")
}

export function openClientWhatsApp(doc: DocumentDetail): void {
  const url = generateWhatsAppLink(doc.client.phone, buildClientMessage(doc))
  window.open(url, "_blank")
}

export function openOwnerWhatsApp(doc: DocumentDetail): void {
  const url = generateWhatsAppLink(OWNER_NOTIFICATION_PHONE, buildOwnerNotification(doc))
  window.open(url, "_blank")
}

export function openDeliveryWhatsApp(doc: DocumentDetail): void {
  const url = generateWhatsAppLink(DELIVERY_NOTIFICATION_PHONE, buildDeliveryNotification(doc))
  window.open(url, "_blank")
}
