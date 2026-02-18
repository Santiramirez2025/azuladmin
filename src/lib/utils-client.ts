// lib/utils-client.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// TAILWIND CLASS MERGER
// ============================================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// FORMATEO DE MONEDA (SIN DECIMAL DE PRISMA)
// ============================================================================

/**
 * Formatea un número como moneda argentina (ARS)
 * @param amount - Monto a formatear (solo number)
 * @param showDecimals - Mostrar decimales (default: false)
 */
export function formatCurrency(
  amount: number | null | undefined,
  showDecimals = false
): string {
  if (amount === null || amount === undefined) return "$0"
  
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Convierte string de moneda a número
 * Ejemplo: "$1.234,56" → 1234.56
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  
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
  
  if (cleaned.startsWith("549")) {
    const areaCode = cleaned.slice(3, 6)
    const firstPart = cleaned.slice(6, 9)
    const secondPart = cleaned.slice(9)
    return `+54 9 ${areaCode} ${firstPart}-${secondPart}`
  }
  
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
  
  if (!cleaned.startsWith("549")) {
    return `549${cleaned}`
  }
  
  return cleaned
}

// ============================================================================
// CÁLCULOS DE PAGOS Y RECARGOS
// ============================================================================

/**
 * Calcula precio con recargo por cuotas
 */
export function calculateInstallmentPrice(
  basePrice: number,
  installments: number
): {
  total: number
  installmentAmount: number
  surchargeRate: number
  surchargeAmount: number
} {
  const rates: Record<number, number> = {
    1: 0,
    3: 18,
    6: 25,
    9: 35,
    12: 47,
  }

  const surchargeRate = rates[installments] || 0
  const surchargeAmount = Math.round(basePrice * (surchargeRate / 100))
  const total = Math.round(basePrice + surchargeAmount)
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
 */
export function calculateBalance(
  total: number,
  amountPaid: number | null | undefined
): number {
  const numPaid = amountPaid || 0
  const balance = total - numPaid
  
  return balance < 1 && balance > -1 ? 0 : Math.round(balance)
}

// ============================================================================
// FORMATEO DE DOCUMENTOS
// ============================================================================

/**
 * Formatea número de documento con padding
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