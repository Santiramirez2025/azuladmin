import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear moneda argentina (sin decimales)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Formatear fecha argentina
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

// Formatear teléfono argentino
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("549")) {
    return `+54 9 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

// Calcular precio con recargo por cuotas
export function calculateInstallmentPrice(
  basePrice: number,
  installments: number
): { total: number; installmentAmount: number; surchargeRate: number } {
  const rates: Record<number, number> = {
    1: 0,    // Contado
    3: 18,   // +18%
    6: 25,   // +25%
    9: 35,   // +35%
    12: 47,  // +47%
  }

  const surchargeRate = rates[installments] || 0
  const total = Math.round(basePrice * (1 + surchargeRate / 100))
  const installmentAmount = Math.round(total / installments)

  return { total, installmentAmount, surchargeRate }
}

// Generar número de documento con padding
export function formatDocumentNumber(num: number): string {
  return num.toString().padStart(5, "0")
}

// Generar link de WhatsApp
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
