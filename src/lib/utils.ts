// lib/utils.ts
// ⚠️ ESTE ARCHIVO ES SOLO PARA SERVER COMPONENTS
import { Decimal } from "@prisma/client/runtime/library"

// ============================================================================
// RE-EXPORTAR UTILS DE CLIENTE (para conveniencia)
// ============================================================================
export * from "./utils-client"

// ============================================================================
// UTILS SOLO PARA SERVIDOR (usan Decimal de Prisma)
// ============================================================================

/**
 * Formatea un número como moneda argentina (ARS) - VERSION SERVIDOR
 * Soporta Decimal de Prisma
 */
export function formatCurrencyServer(
  amount: number | Decimal | null | undefined,
  showDecimals = false
): string {
  if (amount === null || amount === undefined) return "$0"
  
  const numAmount = typeof amount === "number" ? amount : Number(amount)
  
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(numAmount)
}

/**
 * Convierte string de moneda a número
 * Ejemplo: "$1.234,56" → 1234.56
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[^\d,.-]/g, "") // Remover todo excepto números, comas y puntos
    .replace(/\./g, "")       // Remover puntos de miles
    .replace(",", ".")        // Convertir coma decimal a punto
  
  return parseFloat(cleaned) || 0
}

// ============================================================================
// FORMATEO DE FECHAS
// ============================================================================

/**
 * Formatea una fecha al formato argentino (dd/mm/yyyy)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  
  const d = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(d.getTime())) return "-"
  
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

/**
 * Formatea una fecha con hora (dd/mm/yyyy HH:mm)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-"
  
  const d = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(d.getTime())) return "-"
  
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/**
 * Formatea fecha relativa ("hace 2 días", "en 3 horas")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "hace un momento"
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`
  
  return formatDate(d)
}

// ============================================================================
// FORMATEO DE TELÉFONO
// ============================================================================

/**
 * Formatea teléfono argentino
 * Ejemplo: "5493513456789" → "+54 9 351 345-6789"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-"
  
  const cleaned = phone.replace(/\D/g, "")
  
  // Formato internacional argentino
  if (cleaned.startsWith("549")) {
    const areaCode = cleaned.slice(3, 6)
    const firstPart = cleaned.slice(6, 9)
    const secondPart = cleaned.slice(9)
    return `+54 9 ${areaCode} ${firstPart}-${secondPart}`
  }
  
  // Formato local (sin +54 9)
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 3)
    const firstPart = cleaned.slice(3, 6)
    const secondPart = cleaned.slice(6)
    return `${areaCode} ${firstPart}-${secondPart}`
  }
  
  return phone
}

/**
 * Convierte teléfono a formato WhatsApp (solo números)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  
  // Si no empieza con 549, agregarlo
  if (!cleaned.startsWith("549")) {
    // Asumir que es local argentino y agregar 549
    return `549${cleaned}`
  }
  
  return cleaned
}

// ============================================================================
// CÁLCULOS DE PAGOS Y RECARGOS
// ============================================================================

/**
 * Calcula precio con recargo por cuotas
 * @param basePrice - Precio base
 * @param installments - Número de cuotas (1, 3, 6, 9, 12)
 * @returns Objeto con total, monto por cuota y tasa de recargo
 */
export function calculateInstallmentPrice(
  basePrice: number | Decimal,
  installments: number
): {
  total: number
  installmentAmount: number
  surchargeRate: number
  surchargeAmount: number
} {
  const numPrice = typeof basePrice === "number" ? basePrice : Number(basePrice)
  
  // Tasas de recargo según número de cuotas
  const rates: Record<number, number> = {
    1: 0,    // Contado - sin recargo
    3: 18,   // +18%
    6: 25,   // +25%
    9: 35,   // +35%
    12: 47,  // +47%
  }

  const surchargeRate = rates[installments] || 0
  const surchargeAmount = Math.round(numPrice * (surchargeRate / 100))
  const total = Math.round(numPrice + surchargeAmount)
  const installmentAmount = Math.round(total / installments)

  return { 
    total, 
    installmentAmount, 
    surchargeRate,
    surchargeAmount
  }
}

/**
 * Calcula el balance restante de un pago
 * @param total - Total del documento
 * @param amountPaid - Monto pagado
 * @returns Balance (0 si está completamente pagado)
 */
export function calculateBalance(
  total: number | Decimal,
  amountPaid: number | Decimal | null | undefined
): number {
  const numTotal = typeof total === "number" ? total : Number(total)
  const numPaid = !amountPaid ? 0 : typeof amountPaid === "number" ? amountPaid : Number(amountPaid)
  
  const balance = numTotal - numPaid
  
  // Si el balance es menor a $1, considerarlo como 0
  return balance < 1 && balance > -1 ? 0 : Math.round(balance)
}

// ============================================================================
// FORMATEO DE DOCUMENTOS
// ============================================================================

/**
 * Formatea número de documento con padding
 * Ejemplo: 42 → "00042"
 */
export function formatDocumentNumber(num: number | null | undefined): string {
  if (!num) return "00000"
  return num.toString().padStart(5, "0")
}

/**
 * Obtiene el label en español para tipo de documento
 */
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PRESUPUESTO: "Presupuesto",
    RECIBO: "Recibo",
    REMITO: "Remito",
  }
  return labels[type] || type
}

/**
 * Obtiene el label en español para status de documento
 */
export function getDocumentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    APPROVED: "Aprobado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    EXPIRED: "Vencido",
  }
  return labels[status] || status
}

// ============================================================================
// WHATSAPP HELPERS
// ============================================================================

/**
 * Genera link de WhatsApp con mensaje pre-cargado
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Genera mensaje de WhatsApp para compartir presupuesto
 */
export function generateBudgetWhatsAppMessage(
  clientName: string,
  documentNumber: number,
  total: number,
  appUrl: string
): string {
  return `Hola ${clientName}! 👋

Te envío tu presupuesto #${formatDocumentNumber(documentNumber)}

💰 Total: ${formatCurrencyServer(total)}

Podés verlo completo aquí:
${appUrl}/presupuestos/${documentNumber}

¿Tenés alguna consulta? ¡Estoy para ayudarte!`
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida formato de DNI argentino
 */
export function isValidDNI(dni: string): boolean {
  const cleaned = dni.replace(/\D/g, "")
  return cleaned.length >= 7 && cleaned.length <= 8
}

/**
 * Valida formato de CUIT/CUIL argentino
 */
export function isValidCUIT(cuit: string): boolean {
  const cleaned = cuit.replace(/\D/g, "")
  return cleaned.length === 11
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// ============================================================================
// CONVERSIÓN DE DECIMALES
// ============================================================================

/**
 * Convierte Decimal de Prisma a número de forma segura - SOLO SERVIDOR
 */
export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return Number(value)
}

/**
 * Convierte número a Decimal de Prisma - SOLO SERVIDOR
 */
export function numberToDecimal(value: number): Decimal {
  return new Decimal(value)
}

// ============================================================================
// HELPERS DE DESARROLLO
// ============================================================================

/**
 * Log estructurado para debugging
 */
export function logDev(label: string, data: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[${label}]`, JSON.stringify(data, null, 2))
  }
}

/**
 * Delay helper para testing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}