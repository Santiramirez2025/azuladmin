"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Send,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Warehouse,
  MessageCircle,
  Edit,
  Sparkles,
  Package,
  Calendar,
  User,
  FileText,
  ShieldCheck,
  Receipt,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils"
import type { DocumentStatus, DocumentType } from "@/types"

interface DocumentDetail {
  id: string
  number: number
  type: DocumentType
  status: DocumentStatus
  date: string
  validUntil?: string
  subtotal: number
  surcharge: number
  surchargeRate: number
  total: number
  paymentMethod?: string
  installments?: number
  amountPaid?: number
  balance?: number
  paymentType?: string
  shippingType: string
  shippingCost: number
  observations?: string
  internalNotes?: string
  client: {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
    city: string
  }
  createdBy: {
    name: string
  }
  items: {
    id: string
    productName: string
    productSize: string
    unitPrice: number
    quantity: number
    subtotal: number
    source: "STOCK" | "CATALOGO"
  }[]
}

const statusConfig: Record<DocumentStatus, { label: string; color: "default" | "secondary" | "success" | "warning" | "destructive"; icon: typeof Clock; gradient: string }> = {
  DRAFT: { 
    label: "Borrador", 
    color: "secondary", 
    icon: Clock,
    gradient: "from-slate-500 to-slate-600"
  },
  SENT: { 
    label: "Enviado", 
    color: "warning", 
    icon: Send,
    gradient: "from-amber-500 to-orange-600"
  },
  APPROVED: { 
    label: "Aprobado", 
    color: "default", 
    icon: CheckCircle,
    gradient: "from-blue-500 to-indigo-600"
  },
  COMPLETED: { 
    label: "Completado", 
    color: "success", 
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600"
  },
  CANCELLED: { 
    label: "Cancelado", 
    color: "destructive", 
    icon: XCircle,
    gradient: "from-red-500 to-rose-600"
  },
  EXPIRED: { 
    label: "Vencido", 
    color: "secondary", 
    icon: Clock,
    gradient: "from-slate-400 to-slate-500"
  },
}

const typeLabels: Record<DocumentType, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}

export default function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${resolvedParams.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("not_found")
          } else {
            setError("server_error")
          }
          return
        }
        const data = await res.json()
        setDocument(data)
      } catch (error) {
        console.error("Error fetching document:", error)
        setError("network_error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocument()
  }, [resolvedParams.id])

  const updateStatus = async (status: DocumentStatus) => {
    if (!document || isUpdating) return
    
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update status")
      }
      
      const updated = await res.json()
      setDocument(updated)
    } catch (error: any) {
      console.error("Error updating status:", error)
      alert(`Error al actualizar el estado: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const sendWhatsApp = () => {
    if (!document) return
    const message = generateWhatsAppMessage()
    const url = generateWhatsAppLink(document.client.phone, message)
    window.open(url, "_blank")
    if (document.status === "DRAFT") {
      updateStatus("SENT")
    }
  }

  const generateWhatsAppMessage = () => {
    if (!document) return ""

    // ============================================================================
    // REMITO: Mensaje SIN PRECIOS para repartidor
    // ============================================================================
    if (document.type === "REMITO") {
      const firstName = document.client.name.split(' ')[0]
      const productList = document.items
        .map((item, index) => 
          `${index + 1}. ${item.productName} ${item.productSize} (cantidad: ${item.quantity})`
        )
        .join("\n")

      const addressLine = document.client.address && document.client.city 
        ? `${document.client.address}, ${document.client.city}` 
        : document.client.city || "⚠️ COORDINAR DIRECCIÓN"

      return `Hola! 👋

🚚 *REMITO N° ${String(document.number).padStart(5, "0")}*

Tenemos una entrega para coordinar:

📦 *PRODUCTOS:*
${productList}

👤 *CLIENTE:*
${document.client.name}
📞 ${document.client.phone}
📍 ${addressLine}

🚛 *${document.shippingType}*
${document.observations ? `\n📝 *Obs:* ${document.observations}` : ""}

_Remito generado por AZUL COLCHONES_`
    }

    // ============================================================================
    // PRESUPUESTO y RECIBO: Mensaje profesional CON PRECIOS
    // ============================================================================
    const firstName = document.client.name.split(' ')[0]
    const typeLabel = document.type === "PRESUPUESTO" ? "PRESUPUESTO" : "RECIBO"
    
    const productList = document.items
      .map((item) => {
        const stockBadge = item.source === "STOCK" ? " ✓" : ""
        return `• ${item.productName} ${item.productSize}${stockBadge}\n  ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`
      })
      .join("\n\n")

    let message = `Hola ${firstName}! 😊\n\n`
    message += `Te envío tu *${typeLabel} N° ${String(document.number).padStart(5, "0")}*\n\n`
    message += `${productList}\n\n`
    message += `━━━━━━━━━━━━━━━━━━━\n`

    // Detalle de precios
    if (document.surcharge > 0) {
      message += `Subtotal: ${formatCurrency(document.subtotal)}\n`
      message += `Recargo ${document.installments} cuotas: ${formatCurrency(document.surcharge)}\n`
      message += `━━━━━━━━━━━━━━━━━━━\n`
    }

    message += `💵 *TOTAL: ${formatCurrency(document.total)}*\n`

    // ✅ INFORMACIÓN DE PAGO (solo RECIBO)
    if (document.type === "RECIBO") {
      if (document.amountPaid && document.amountPaid > 0) {
        message += `\n✅ *Pagado (${document.paymentType || "Efectivo"}):* ${formatCurrency(document.amountPaid)}\n`
      }

      if (document.balance && document.balance > 0) {
        message += `⏳ *Saldo Pendiente:* ${formatCurrency(document.balance)}\n`
      } else if (document.amountPaid && document.amountPaid >= document.total) {
        message += `\n🎉 *PAGO COMPLETO*\n`
      }

      if (document.installments && document.installments > 1) {
        const installmentAmount = Math.round(document.total / document.installments)
        message += `\n💳 *${document.installments} cuotas de ${formatCurrency(installmentAmount)}*\n`
      }
    }

    message += `\n━━━━━━━━━━━━━━━━━━━\n`

    // Información de entrega
    const hasCatalogo = document.items.some((i) => i.source === "CATALOGO")
    const hasStock = document.items.some((i) => i.source === "STOCK")

    if (hasStock && hasCatalogo) {
      message += `📦 Productos en stock: Entrega inmediata\n`
      message += `📦 Catálogo: 7-10 días hábiles\n`
    } else if (hasCatalogo) {
      message += `📦 Entrega estimada: 7-10 días hábiles\n`
    } else {
      message += `📦 Disponible para entrega inmediata\n`
    }

    message += `🚚 ${document.shippingType}\n`

    if (document.type === "PRESUPUESTO" && document.validUntil) {
      const validDate = new Date(document.validUntil)
      const daysValid = Math.ceil((validDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      message += `⏱️ Válido por ${daysValid} días\n`
    }

    message += `\n✅ Garantía oficial PIERO\n`
    message += `\nCualquier consulta, estoy a disposición! 👍\n\n`
    message += `*AZUL COLCHONES*\n`
    message += `📍 Balerdi 855, Villa María\n`
    message += `📞 3534096566`

    return message
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-12 w-12 md:h-16 md:w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-base font-semibold text-transparent md:text-lg">
            Cargando documento...
          </p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    const errorMessages = {
      not_found: {
        title: "Documento no encontrado",
        description: "El documento que buscas no existe o fue eliminado"
      },
      server_error: {
        title: "Error del servidor",
        description: "Ocurrió un error al cargar el documento. Por favor, intenta nuevamente."
      },
      network_error: {
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      }
    }

    const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.server_error

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 md:gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-2xl"></div>
          <FileText className="relative h-16 w-16 text-slate-300 md:h-20 md:w-20" />
        </div>
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900 md:text-2xl">
            {errorInfo.title}
          </h2>
          <p className="text-sm text-slate-600 md:text-base">
            {errorInfo.description}
          </p>
        </div>
        <Link href="/documentos">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25 md:text-base">
            Volver a Documentos
          </Button>
        </Link>
      </div>
    )
  }

  const StatusIcon = statusConfig[document.status].icon
  const hasStockItems = document.items.some((i) => i.source === "STOCK")
  const hasCatalogoItems = document.items.some((i) => i.source === "CATALOGO")
  const isRemito = document.type === "REMITO"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 pb-24 md:p-8 md:pt-8 md:pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Responsive */}
        <div className="mb-6 md:mb-8 print:hidden">
          <div className="mb-4 flex items-center gap-3 md:mb-6 md:gap-4">
            <Link href="/documentos">
              <div className="group relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur transition group-hover:opacity-30"></div>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:scale-105 hover:border-blue-300 hover:bg-blue-50 md:h-12 md:w-12">
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 md:gap-3">
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-xl font-bold text-transparent md:text-3xl">
                  {typeLabels[document.type]} #{String(document.number).padStart(5, "0")}
                </h1>
                <div className="relative">
                  <div className={`absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r ${statusConfig[document.status].gradient} opacity-20 blur`}></div>
                  <Badge variant={statusConfig[document.status].color} className="relative gap-1 px-2.5 py-1 text-xs font-bold shadow-lg md:gap-1.5 md:px-3 md:py-1.5 md:text-sm">
                    <StatusIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    {statusConfig[document.status].label}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 md:gap-2 md:text-sm">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="truncate">Creado el {formatDate(document.date)}</span>
                <span className="hidden text-slate-400 sm:inline">•</span>
                <span className="hidden truncate sm:inline">por {document.createdBy.name}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky Mobile */}
          <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:relative md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={sendWhatsApp}
              disabled={isUpdating}
              className="flex-1 border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 md:flex-none md:text-sm"
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Enviar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="flex-1 border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:flex-none md:text-sm"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Imprimir</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            {document.status === "DRAFT" && (
              <Link href={`/documentos/nuevo?from=${document.id}`} className="flex-1 md:flex-none">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 md:text-sm"
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4 md:grid md:gap-6 md:space-y-0 lg:grid-cols-3">
          {/* Documento Preview */}
          <div className="lg:col-span-2">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30 print:hidden"></div>
              <Card className="relative overflow-hidden border-0 bg-white/95 shadow-2xl shadow-blue-500/10 backdrop-blur-sm print:shadow-none">
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl md:h-48 md:w-48 print:hidden"></div>
                <CardContent className="relative p-6 md:p-10" ref={printRef} id="printable-document">
                  {/* ✨ HEADER OPTIMIZADO */}
                  <div className="mb-8 grid grid-cols-[1fr_auto] gap-6 border-b-2 border-blue-600 pb-6 print:border-blue-600">
                    {/* Logo y datos empresa */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg print:shadow-md">
                          <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-black uppercase tracking-tight text-blue-900">
                            Azul Colchones
                          </h1>
                          <p className="text-xs font-medium text-slate-600">
                            Descanso de calidad desde 1989
                          </p>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-xs text-slate-700">
                        <p className="font-semibold">📍 Balerdi 855, Villa María, Córdoba</p>
                        <p>📞 03534 096566 • ✉️ info@azulcolchones.com</p>
                      </div>
                    </div>

                    {/* Número de documento - MÁS DESTACADO */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-4 text-right shadow-xl print:shadow-md">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-200">
                          {typeLabels[document.type]}
                        </p>
                        <p className="text-4xl font-black tabular-nums text-white">
                          {String(document.number).padStart(5, "0")}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {formatDate(document.date)}
                      </p>
                    </div>
                  </div>

                  {/* ✨ CLIENTE OPTIMIZADO */}
                  <div className="mb-6 overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-sm print:border-blue-300 print:bg-blue-50">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 shadow-md print:bg-blue-700">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Cliente</p>
                    </div>
                    <p className="mb-1 text-xl font-black text-slate-900">{document.client.name}</p>
                    <div className="flex flex-col gap-0.5 text-sm text-slate-700">
                      <span className="font-semibold">📞 {document.client.phone}</span>
                      {document.client.address && (
                        <span className="font-medium">📍 {document.client.address}, {document.client.city}</span>
                      )}
                    </div>
                  </div>

                  {/* ✨ TABLA PROFESIONAL OPTIMIZADA */}
                  <div className="mb-6 overflow-hidden rounded-xl border-2 border-slate-200 shadow-sm print:border-slate-300">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-300 bg-slate-100 print:bg-slate-100">
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">
                            Cant.
                          </th>
                          {!isRemito && (
                            <>
                              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">
                                Precio Unit.
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">
                                Subtotal
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {document.items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="px-4 py-4">
                              <div className="space-y-1.5">
                                <p className="font-bold text-slate-900">
                                  {item.productName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-600">{item.productSize}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                                    item.source === "STOCK" 
                                      ? "bg-emerald-100 text-emerald-800 print:bg-emerald-100" 
                                      : "bg-blue-100 text-blue-800 print:bg-blue-100"
                                  }`}>
                                    {item.source === "STOCK" ? "✓ Stock" : "📦 Catálogo"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-sm print:bg-blue-700">
                                {item.quantity}
                              </span>
                            </td>
                            {!isRemito && (
                              <>
                                <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-700">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-4 py-4 text-right text-lg font-bold tabular-nums text-slate-900">
                                  {formatCurrency(item.subtotal)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ✨ TOTALES OPTIMIZADOS - Solo para PRESUPUESTO y RECIBO */}
                  {!isRemito && (
                    <div className="flex justify-end">
                      <div className="w-full space-y-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-5 shadow-sm md:w-96 print:w-96 print:border-slate-300 print:bg-slate-50">
                        {/* Subtotal */}
                        <div className="flex justify-between border-b border-slate-300 pb-2.5 text-sm">
                          <span className="font-semibold text-slate-700">Subtotal</span>
                          <span className="font-bold tabular-nums text-slate-900">
                            {formatCurrency(document.subtotal)}
                          </span>
                        </div>

                        {/* Recargo si aplica */}
                        {document.surcharge > 0 && (
                          <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2 text-sm">
                            <span className="font-semibold text-orange-800">
                              Recargo {document.installments} cuotas (+{document.surchargeRate}%)
                            </span>
                            <span className="font-bold tabular-nums text-orange-900">
                              {formatCurrency(document.surcharge)}
                            </span>
                          </div>
                        )}

                        {/* Costo de envío si aplica */}
                        {document.shippingCost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-slate-700">Envío</span>
                            <span className="font-bold tabular-nums text-slate-900">
                              {formatCurrency(document.shippingCost)}
                            </span>
                          </div>
                        )}

                        {/* TOTAL */}
                        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg print:bg-blue-700 print:shadow-md">
                          <span className="text-sm font-bold uppercase tracking-wider text-white">
                            Total
                          </span>
                          <span className="text-3xl font-black tabular-nums text-white">
                            {formatCurrency(document.total)}
                          </span>
                        </div>

                        {/* ✨ INFORMACIÓN DE PAGO DETALLADA - SOLO RECIBO */}
                        {document.type === "RECIBO" && (
                          <div className="space-y-2.5 border-t-2 border-slate-300 pt-3">
                            {/* Monto Pagado */}
                            {document.amountPaid !== undefined && document.amountPaid !== null && document.amountPaid > 0 && (
                              <div className="rounded-lg bg-emerald-50 px-3 py-2.5 shadow-sm print:bg-emerald-50">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-emerald-800">
                                    ✓ Entregó ({document.paymentType || "Efectivo"})
                                  </span>
                                  <span className="text-lg font-black tabular-nums text-emerald-900">
                                    {formatCurrency(document.amountPaid)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Saldo Pendiente - MUY DESTACADO */}
                            {document.balance !== undefined && document.balance !== null && document.balance > 0 && (
                              <div className="rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-100 to-amber-100 p-4 shadow-md print:border-orange-600 print:bg-orange-100">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="mb-0.5 flex items-center gap-2 text-sm font-black uppercase text-orange-900">
                                      <AlertTriangle className="h-5 w-5" />
                                      Saldo Pendiente
                                    </p>
                                    <p className="text-xs font-semibold text-orange-800">
                                      Debe abonar al entregar
                                    </p>
                                  </div>
                                  <p className="text-4xl font-black tabular-nums text-orange-900">
                                    {formatCurrency(document.balance)}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Pago Completo */}
                            {document.balance !== undefined && document.balance === 0 && document.amountPaid && document.amountPaid > 0 && (
                              <div className="rounded-xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-100 to-green-100 p-4 text-center shadow-md print:border-emerald-600 print:bg-emerald-100">
                                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
                                <p className="text-lg font-black uppercase text-emerald-900">
                                  Pago Completo
                                </p>
                                <p className="text-xs font-semibold text-emerald-800">
                                  Sin saldo pendiente
                                </p>
                              </div>
                            )}

                            {/* A Cuenta */}
                            {(!document.amountPaid || document.amountPaid === 0) && (
                              <div className="rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-cyan-100 p-3 shadow-sm print:border-blue-500 print:bg-blue-100">
                                <div className="flex items-center gap-2.5">
                                  <Receipt className="h-6 w-6 text-blue-700" />
                                  <div>
                                    <p className="text-sm font-bold text-blue-900">
                                      A Cuenta
                                    </p>
                                    <p className="text-xs font-semibold text-blue-700">
                                      Sin pago registrado - Total adeudado: {formatCurrency(document.total)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Plan de cuotas */}
                            {document.installments && document.installments > 1 && (
                              <div className="rounded-lg bg-blue-50 px-3 py-2 text-center shadow-sm print:bg-blue-50">
                                <p className="text-sm font-bold text-blue-900">
                                  💳 {document.installments} cuotas de {formatCurrency(Math.round(document.total / document.installments))}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✨ FOOTER PROFESIONAL */}
                  <div className="mt-8 space-y-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 shadow-sm print:border-slate-300 print:bg-slate-50">
                    {/* Info de entrega */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm print:bg-white">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 print:bg-orange-200">
                          <Truck className="h-5 w-5 text-orange-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase text-slate-500">Envío</p>
                          <p className="text-sm font-semibold leading-tight text-slate-900">{document.shippingType}</p>
                        </div>
                      </div>

                      {hasCatalogoItems && (
                        <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm print:bg-white">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 print:bg-blue-200">
                            <Clock className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase text-slate-500">Entrega</p>
                            <p className="text-sm font-semibold leading-tight text-slate-900">7-10 días</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm print:bg-white">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 print:bg-emerald-200">
                          <ShieldCheck className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase text-slate-500">Garantía</p>
                          <p className="text-sm font-semibold leading-tight text-slate-900">Oficial PIERO</p>
                        </div>
                      </div>
                    </div>

                    {/* Observaciones si las hay */}
                    {document.observations && (
                      <div className="rounded-lg border-l-4 border-blue-600 bg-white p-4 shadow-sm print:bg-white">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Observaciones
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {document.observations}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ✅ ESPACIO PARA FIRMAS - SOLO REMITO - SOLO IMPRESIÓN */}
                  {isRemito && (
                    <div className="mt-12 hidden border-t-2 border-slate-400 pt-8 print:block">
                      <div className="grid grid-cols-2 gap-12">
                        {/* Firma del Cliente */}
                        <div>
                          <div className="mb-16">
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Recibí conforme
                            </p>
                          </div>
                          <div className="border-b-2 border-slate-500"></div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-slate-600">Firma del Cliente</p>
                            <p className="text-xs text-slate-500">Aclaración: _______________________</p>
                            <p className="text-xs text-slate-500">DNI: _______________________</p>
                          </div>
                        </div>

                        {/* Firma de AZUL COLCHONES */}
                        <div>
                          <div className="mb-16">
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Entregado por
                            </p>
                          </div>
                          <div className="border-b-2 border-slate-500"></div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-slate-600">AZUL COLCHONES</p>
                            <p className="text-xs text-slate-500">Aclaración: _______________________</p>
                            <p className="text-xs text-slate-500">Fecha: ____/____/________</p>
                          </div>
                        </div>
                      </div>

                      {/* Nota Legal */}
                      <div className="mt-8 border-t border-slate-300 pt-4">
                        <p className="text-center text-xs leading-relaxed text-slate-600">
                          Este remito constituye comprobante de entrega de la mercadería detallada. 
                          El cliente declara haber recibido los productos en perfectas condiciones.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6 print:hidden">
            {/* Acciones de Estado */}
            <div className="group relative" style={{ animation: 'slideIn 0.4s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-emerald-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 shadow-lg shadow-emerald-500/20 md:p-2">
                      <Sparkles className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Acciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-2.5 p-4 md:space-y-3 md:p-6">
                  {document.status === "DRAFT" && (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed md:text-base"
                      onClick={() => {
                        sendWhatsApp()
                        updateStatus("SENT")
                      }}
                      disabled={isUpdating}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isUpdating ? "Enviando..." : "Enviar al Cliente"}
                    </Button>
                  )}
                  {document.status === "SENT" && (
                    <>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 md:text-base"
                        onClick={() => updateStatus("APPROVED")}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isUpdating ? "Procesando..." : "Marcar como Aprobado"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 bg-white/50 text-sm font-semibold text-red-600 transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 disabled:opacity-50 md:text-base"
                        onClick={() => updateStatus("CANCELLED")}
                        disabled={isUpdating}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {document.status === "APPROVED" && (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 md:text-base"
                      onClick={() => updateStatus("COMPLETED")}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isUpdating ? "Procesando..." : "Marcar como Completado"}
                    </Button>
                  )}

                  {/* Convertir documento */}
                  {document.type === "PRESUPUESTO" && document.status === "APPROVED" && (
                    <Link href={`/documentos/nuevo?from=${document.id}&tipo=recibo`}>
                      <Button variant="outline" className="w-full border-slate-200 bg-white/50 text-sm font-semibold transition-all hover:scale-105 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:text-base">
                        Convertir a Recibo
                      </Button>
                    </Link>
                  )}
                  {document.type === "RECIBO" && document.status === "COMPLETED" && (
                    <Link href={`/documentos/nuevo?from=${document.id}&tipo=remito`}>
                      <Button variant="outline" className="w-full border-slate-200 bg-white/50 text-sm font-semibold transition-all hover:scale-105 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 md:text-base">
                        Generar Remito
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Estado de Pago */}
            {document.type === "RECIBO" && (
              <div className="group relative" style={{ animation: 'slideIn 0.45s ease-out' }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-600/10 blur-3xl md:h-40 md:w-40"></div>
                  <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-1 shadow-lg shadow-blue-500/20 md:p-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Estado de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-3 p-4 md:space-y-3.5 md:p-5">
                    {document.paymentType && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">Método de Pago</p>
                        <p className="text-sm font-bold text-slate-900">
                          {document.paymentType === "Efectivo" && "💵 "}
                          {document.paymentType === "Transferencia" && "🏦 "}
                          {document.paymentType === "Débito" && "💳 "}
                          {document.paymentType === "Crédito" && "💳 "}
                          {document.paymentType === "Cheque" && "📝 "}
                          {document.paymentType === "Mixto" && "🔀 "}
                          {document.paymentType}
                        </p>
                      </div>
                    )}

                    {document.amountPaid !== undefined && document.amountPaid !== null && document.amountPaid > 0 && (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-700">Monto Pagado</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatCurrency(document.amountPaid)}
                        </p>
                      </div>
                    )}

                    {document.balance !== undefined && document.balance !== null && document.balance > 0 ? (
                      <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="flex items-center gap-1.5 text-sm font-bold text-orange-900">
                              <AlertTriangle className="h-4 w-4" />
                              Saldo Pendiente
                            </p>
                            <p className="text-xs text-orange-700">
                              A cobrar al cliente
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-orange-900">
                            {formatCurrency(document.balance)}
                          </p>
                        </div>
                      </div>
                    ) : document.amountPaid !== undefined && document.amountPaid > 0 ? (
                      <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-100 to-green-100 p-4 text-center">
                        <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                        <p className="text-lg font-bold text-emerald-900">
                          Pago Completo
                        </p>
                        <p className="text-xs text-emerald-700">
                          Sin saldo pendiente
                        </p>
                      </div>
                    ) : null}

                    {(!document.amountPaid || document.amountPaid === 0) && (
                      <div className="rounded-xl border-2 border-blue-300/50 bg-gradient-to-br from-blue-100/80 to-cyan-100/60 p-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-blue-900">
                              A Cuenta
                            </p>
                            <p className="text-xs text-blue-700">
                              Sin pago registrado
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Info del Cliente */}
            <div className="group relative" style={{ animation: 'slideIn 0.5s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-lg shadow-violet-500/20 md:p-2">
                      <User className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6">
                  <div className="mb-3 space-y-1.5 md:mb-4 md:space-y-2">
                    <p className="text-base font-bold text-slate-900 md:text-lg">{document.client.name}</p>
                    <div className="space-y-0.5 text-xs text-slate-600 md:space-y-1 md:text-sm">
                      <p className="font-medium">{document.client.phone}</p>
                      {document.client.email && (
                        <p className="truncate">{document.client.email}</p>
                      )}
                      {document.client.address && (
                        <p className="truncate">{document.client.address}, {document.client.city}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-200 bg-white/50 text-xs font-semibold transition-all hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 md:text-sm"
                    onClick={() => {
                      const url = generateWhatsAppLink(
                        document.client.phone,
                        `Hola ${document.client.name}!`
                      )
                      window.open(url, "_blank")
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Notas Internas */}
            {document.internalNotes && (
              <div className="group relative" style={{ animation: 'slideIn 0.6s ease-out' }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-amber-500/5 backdrop-blur-sm">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 blur-3xl md:h-40 md:w-40"></div>
                  <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-amber-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1 shadow-lg shadow-amber-500/20 md:p-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Notas Internas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-4 md:p-5">
                    <div className="rounded-lg bg-amber-50/50 p-3 backdrop-blur-sm md:p-4">
                      <p className="text-xs leading-relaxed text-slate-700 md:text-sm">{document.internalNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Indicadores de Entrega */}
            <div className="group relative" style={{ animation: 'slideIn 0.7s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-1 shadow-lg shadow-blue-500/20 md:p-1.5">
                      <Package className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                    </div>
                    Información de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-2.5 p-4 md:space-y-3 md:p-5">
                  {hasStockItems && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 md:gap-2.5 md:p-3">
                      <div className="rounded-lg bg-emerald-100 p-1.5 md:p-2">
                        <Warehouse className="h-3.5 w-3.5 text-emerald-600 md:h-4 md:w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900 md:text-sm">En Stock</p>
                        <p className="text-[10px] text-emerald-700 md:text-xs">Entrega inmediata</p>
                      </div>
                    </div>
                  )}
                  {hasCatalogoItems && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5 md:gap-2.5 md:p-3">
                      <div className="rounded-lg bg-blue-100 p-1.5 md:p-2">
                        <Truck className="h-3.5 w-3.5 text-blue-600 md:h-4 md:w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900 md:text-sm">Catálogo</p>
                        <p className="text-[10px] text-blue-700 md:text-xs">7-10 días hábiles</p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 p-2.5 md:p-3">
                    <p className="text-xs font-semibold text-slate-700 md:text-sm">{document.shippingType}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media print {
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
          
          html {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          html,
          body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          
          header,
          nav,
          [role="navigation"] {
            display: none !important;
          }
          
          button,
          a[role="button"],
          .print\\:hidden {
            display: none !important;
          }
          
          aside,
          .lg\\:grid-cols-3 > div:last-child {
            display: none !important;
          }
          
          main {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .lg\\:grid-cols-3,
          .md\\:grid {
            display: block !important;
            grid-template-columns: none !important;
          }
          
          .lg\\:col-span-2 {
            grid-column: auto !important;
          }
          
          .max-w-7xl,
          .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
          }
          
          .shadow-2xl,
          .shadow-xl,
          .shadow-lg,
          .shadow-md,
          .shadow-sm,
          .shadow {
            box-shadow: none !important;
          }
          
          .backdrop-blur-sm,
          .backdrop-blur {
            backdrop-filter: none !important;
          }
          
          .rounded-2xl,
          .rounded-xl {
            border-radius: 8px !important;
          }
          
          .bg-gradient-to-br,
          .bg-gradient-to-r,
          .bg-gradient-to-l {
            background: white !important;
          }
          
          .bg-clip-text {
            background: none !important;
            -webkit-background-clip: initial !important;
            -webkit-text-fill-color: currentColor !important;
            color: #1e40af !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          
          thead {
            display: table-header-group !important;
          }
          
          tbody {
            display: table-row-group !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          
          .border-slate-200,
          .border-slate-100,
          .space-y-4 > *,
          .space-y-6 > * {
            page-break-inside: avoid !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
          }
          
          svg {
            display: inline-block !important;
            vertical-align: middle !important;
          }
        }
      `}</style>
    </div>
  )
}