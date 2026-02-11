"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Send,
  Download,
  Copy,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Warehouse,
  MessageCircle,
  Edit,
  MoreVertical,
  Sparkles,
  Package,
  Calendar,
  User,
  FileText,
  ShieldCheck,
  CreditCard,
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

const statusConfig: Record<
  DocumentStatus,
  { label: string; color: "default" | "secondary" | "success" | "warning" | "destructive"; icon: typeof Clock; gradient: string }
> = {
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
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${resolvedParams.id}`)
        if (res.ok) {
          const data = await res.json()
          setDocument(data)
        }
      } catch (error) {
        console.error("Error fetching document:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocument()
  }, [resolvedParams.id])

  const updateStatus = async (status: DocumentStatus) => {
    if (!document) return
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDocument(updated)
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
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

    const typeLabel = typeLabels[document.type].toUpperCase()
    const itemsList = document.items
      .map(
        (i) =>
          `• ${i.productName} ${i.productSize} x${i.quantity} - ${formatCurrency(i.subtotal)}`
      )
      .join("\n")

    let message = `📋 *${typeLabel} N° ${String(document.number).padStart(5, "0")}*
━━━━━━━━━━━━━━━━━━━━━
¡Hola ${document.client.name}! 👋

${itemsList}

💰 *Subtotal:* ${formatCurrency(document.subtotal)}`

    if (document.surcharge > 0) {
      message += `\n📊 *Recargo (+${document.surchargeRate}%):* ${formatCurrency(document.surcharge)}`
    }

    if (document.shippingCost > 0) {
      message += `\n🚚 *Envío:* ${formatCurrency(document.shippingCost)}`
    }

    message += `\n\n💵 *TOTAL: ${formatCurrency(document.total)}*`

    // ✅ INFORMACIÓN DE PAGO
    if (document.type === "RECIBO") {
      if (document.amountPaid && document.amountPaid > 0) {
        message += `\n✅ *Pagado (${document.paymentType || "Efectivo"}):* ${formatCurrency(document.amountPaid)}`
      }
      
      if (document.balance && document.balance > 0) {
        message += `\n⏳ *Saldo Pendiente:* ${formatCurrency(document.balance)}`
      } else if (document.amountPaid && document.amountPaid >= document.total) {
        message += `\n\n🎉 *PAGO COMPLETO*`
      }

      if (document.installments && document.installments > 1) {
        const installmentAmount = Math.round(document.total / document.installments)
        message += `\n📅 *${document.installments} cuotas de ${formatCurrency(installmentAmount)}*`
      }
    }

    const hasCatalogo = document.items.some((i) => i.source === "CATALOGO")

    message += `
━━━━━━━━━━━━━━━━━━━━━
📦 ${document.shippingType}`

    if (hasCatalogo) {
      message += `\n⏱️ Entrega estimada: 24/48hs`
    }

    message += `
✅ Garantía oficial PIERO

*AZUL COLCHONES*
📍 Balerdi 855, Villa María`

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

  if (!document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 md:gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-2xl"></div>
          <FileText className="relative h-16 w-16 text-slate-300 md:h-20 md:w-20" />
        </div>
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900 md:text-2xl">Documento no encontrado</h2>
          <p className="text-sm text-slate-600 md:text-base">El documento que buscas no existe o fue eliminado</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 pb-24 md:p-8 md:pt-8 md:pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Responsive */}
        <div className="mb-6 md:mb-8">
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
              className="flex-1 border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 md:flex-none md:text-sm"
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Enviar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()}
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
          {/* Documento Preview - Mobile Optimized */}
          <div className="lg:col-span-2">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/95 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl md:h-48 md:w-48"></div>
                <CardContent className="relative p-4 md:p-8" ref={previewRef}>
                  {/* Header del documento */}
                  <div className="mb-6 flex flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:justify-between md:mb-8 md:pb-6">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
                        <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent md:text-3xl">
                          AZUL COLCHONES
                        </h2>
                      </div>
                      <p className="text-xs font-medium text-slate-600 md:text-base">
                        Balerdi 855 - Villa María, Córdoba
                      </p>
                      <p className="text-[10px] text-slate-500 md:text-sm">
                        Tel: 03534096566 • info@azulcolchones.com
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="mb-2 inline-block rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-1.5 md:px-4 md:py-2">
                        <p className="text-xs font-bold text-blue-600 md:text-sm">
                          {typeLabels[document.type].toUpperCase()}
                        </p>
                        <p className="text-2xl font-bold text-slate-900 md:text-3xl">
                          N° {String(document.number).padStart(5, "0")}
                        </p>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600 md:text-sm">
                        {formatDate(document.date)}
                      </p>
                    </div>
                  </div>

                  {/* Cliente - Mobile Optimized */}
                  <div className="mb-6 overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 to-blue-50/50 p-3.5 shadow-inner md:mb-8 md:p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-md md:p-1.5">
                        <User className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:text-xs">Cliente</p>
                    </div>
                    <p className="mb-1 text-lg font-bold text-slate-900 md:text-xl">{document.client.name}</p>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-3 md:text-sm">
                      <span className="font-medium">{document.client.phone}</span>
                      {document.client.address && (
                        <>
                          <span className="hidden text-slate-400 sm:inline">•</span>
                          <span className="truncate">{document.client.address}, {document.client.city}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items Table - Mobile Responsive */}
                  <div className="mb-6 overflow-hidden rounded-xl border border-slate-200/50 md:mb-8">
                    {/* Mobile: Card View */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {document.items.map((item) => (
                        <div key={item.id} className="space-y-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                              <p className="text-xs text-slate-500">{item.productSize}</p>
                            </div>
                            <Badge
                              variant={item.source === "STOCK" ? "success" : "secondary"}
                              className="flex-shrink-0 gap-1 text-[10px] font-semibold shadow-sm"
                            >
                              {item.source === "STOCK" ? (
                                <Warehouse className="h-2.5 w-2.5" />
                              ) : (
                                <Truck className="h-2.5 w-2.5" />
                              )}
                              {item.source === "STOCK" ? "Stock" : "Catálogo"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                                {item.quantity}
                              </span>
                              <span className="font-medium text-slate-700">{formatCurrency(item.unitPrice)}</span>
                            </div>
                            <span className="text-base font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: Table View */}
                    <table className="hidden w-full md:table">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-blue-50/50 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-center">Cant.</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {document.items.map((item) => (
                          <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">{item.productName}</span>
                                  <span className="text-sm text-slate-500">{item.productSize}</span>
                                </div>
                                <Badge
                                  variant={item.source === "STOCK" ? "success" : "secondary"}
                                  className="w-fit gap-1 text-xs font-semibold shadow-sm"
                                >
                                  {item.source === "STOCK" ? (
                                    <Warehouse className="h-3 w-3" />
                                  ) : (
                                    <Truck className="h-3 w-3" />
                                  )}
                                  {item.source === "STOCK" ? "En Stock" : "Catálogo"}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-700">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-4 text-right text-lg font-bold text-slate-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales - Mobile Responsive */}
                  <div className="flex justify-end">
                    <div className="w-full space-y-2.5 rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-4 shadow-inner md:w-80 md:space-y-3 md:p-6">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="font-medium text-slate-600">Subtotal</span>
                        <span className="font-bold text-slate-900">{formatCurrency(document.subtotal)}</span>
                      </div>
                      {document.surcharge > 0 && (
                        <div className="flex justify-between rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs md:px-3 md:py-2 md:text-sm">
                          <span className="font-medium text-orange-700">
                            Recargo {document.installments} cuotas (+{document.surchargeRate}%)
                          </span>
                          <span className="font-bold text-orange-700">{formatCurrency(document.surcharge)}</span>
                        </div>
                      )}
                      {document.shippingCost > 0 && (
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="font-medium text-slate-600">Envío</span>
                          <span className="font-bold text-slate-900">{formatCurrency(document.shippingCost)}</span>
                        </div>
                      )}
                      <div className="my-2.5 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:my-3"></div>
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/30 md:p-4">
                        <span className="text-xs font-bold text-white md:text-sm">TOTAL</span>
                        <span className="text-2xl font-bold text-white drop-shadow-lg md:text-3xl">{formatCurrency(document.total)}</span>
                      </div>

                      {/* ✅ INFORMACIÓN DE PAGO EN DOCUMENTO */}
                      {document.type === "RECIBO" && (
                        <>
                          {document.amountPaid !== undefined && document.amountPaid !== null && document.amountPaid > 0 && (
                            <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs md:text-sm">
                              <span className="font-medium text-emerald-700">
                                ✅ Pagado ({document.paymentType || "Efectivo"})
                              </span>
                              <span className="font-bold text-emerald-700">{formatCurrency(document.amountPaid)}</span>
                            </div>
                          )}
                          
                          {document.balance !== undefined && document.balance !== null && document.balance > 0 && (
                            <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2">
                              <span className="font-bold text-orange-700">
                                ⏳ Saldo Pendiente
                              </span>
                              <span className="text-xl font-bold text-orange-700">
                                {formatCurrency(document.balance)}
                              </span>
                            </div>
                          )}

                          {(!document.amountPaid || document.amountPaid === 0) && (
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                              <p className="text-xs font-semibold text-blue-700">
                                💼 A Cuenta - Sin pago registrado
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {document.installments && document.installments > 1 && (
                        <p className="text-center text-xs font-semibold text-slate-600 md:text-sm">
                          {document.installments} cuotas de {formatCurrency(Math.round(document.total / document.installments))}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer - Mobile Responsive */}
                  <div className="mt-6 rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-4 md:mt-8 md:p-5">
                    <div className="mb-3 flex flex-wrap gap-3 text-xs md:gap-4 md:text-sm">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <div className="rounded-lg bg-orange-100 p-1 md:p-1.5">
                          <Truck className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600" />
                        </div>
                        <span className="text-xs md:text-sm">{document.shippingType}</span>
                      </div>
                      {hasCatalogoItems && (
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <div className="rounded-lg bg-blue-100 p-1 md:p-1.5">
                            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                          </div>
                          <span className="text-xs md:text-sm">Entrega: 7-10 días</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <div className="rounded-lg bg-emerald-100 p-1 md:p-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600" />
                        </div>
                        <span className="text-xs md:text-sm">Garantía PIERO</span>
                      </div>
                    </div>
                    {document.observations && (
                      <div className="mt-3 rounded-lg bg-white/60 p-2.5 backdrop-blur-sm md:p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:text-xs">
                          Observaciones
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 md:text-sm">
                          {document.observations}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar - Mobile Optimized */}
          <div className="space-y-4 md:space-y-6">
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
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 md:text-base"
                      onClick={() => {
                        sendWhatsApp()
                        updateStatus("SENT")
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar al Cliente
                    </Button>
                  )}
                  {document.status === "SENT" && (
                    <>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 md:text-base"
                        onClick={() => updateStatus("APPROVED")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como Aprobado
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 bg-white/50 text-sm font-semibold text-red-600 transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 md:text-base"
                        onClick={() => updateStatus("CANCELLED")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {document.status === "APPROVED" && (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 md:text-base"
                      onClick={() => updateStatus("COMPLETED")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Completado
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

            {/* ✅ NUEVA CARD: ESTADO DE PAGO */}
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
                    {/* Tipo de Pago */}
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

                    {/* Monto Pagado */}
                    {document.amountPaid !== undefined && document.amountPaid !== null && document.amountPaid > 0 && (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-700">Monto Pagado</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatCurrency(document.amountPaid)}
                        </p>
                      </div>
                    )}

                    {/* Saldo Pendiente o Pago Completo */}
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

                    {/* A Cuenta (sin pago registrado) */}
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
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}