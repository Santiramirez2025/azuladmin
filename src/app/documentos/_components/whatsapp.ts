import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils-client"
import { CONFIG, TYPE_CONFIG, type DocumentListItem } from "./types"

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function generateClientMessage(doc: DocumentListItem): string {
  const docNumber = `#${String(doc.number).padStart(5, "0")}`
  const typeLabel = TYPE_CONFIG[doc.type].label
  const validUntilText =
    doc.type === "PRESUPUESTO" && doc.validUntil
      ? `\nValido hasta: ${formatDate(new Date(doc.validUntil))}`
      : ""

  return [
    `Hola ${doc.client.name}!`,
    ``,
    `Te paso tu *${typeLabel} ${docNumber}*`,
    ``,
    `*Total: ${formatCurrency(doc.total)}*${validUntilText}`,
    ...(doc.observations ? [``, doc.observations] : []),
    ``,
    `Cualquier consulta estoy a disposicion.`,
    ``,
    `*${CONFIG.businessName}*`,
  ].join("\n")
}

export function generateDeliveryMessage(doc: DocumentListItem): string {
  const docNumber = `#${String(doc.number).padStart(5, "0")}`
  const typeLabel = TYPE_CONFIG[doc.type].label

  return [
    `*ENTREGA ${typeLabel.toUpperCase()} ${docNumber}*`,
    ``,
    `*Cliente:* ${doc.client.name}`,
    `*Tel:* ${doc.client.phone}`,
    `*Direccion:* ${doc.client.address || "Sin direccion"}`,
    `*Ciudad:* ${doc.client.city}`,
    ``,
    `*Envio:* ${doc.shippingType}`,
    ...(doc.observations ? [`*Obs:* ${doc.observations}`] : []),
    ``,
    `Confirmar cuando este entregado.`,
  ].join("\n")
}

export function sendToDeliveryWhatsApp(doc: DocumentListItem): void {
  const message = generateDeliveryMessage(doc)
  const url = generateWhatsAppLink(CONFIG.deliveryPhone, message)
  window.open(url, "_blank")
  toast.success("WhatsApp de reparto abierto")
}
