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
  { label: string; color: "default" | "secondary" | "success" | "warning" | "destructive"; icon: typeof Clock }
> = {
  DRAFT: { label: "Borrador", color: "secondary", icon: Clock },
  SENT: { label: "Enviado", color: "warning", icon: Send },
  APPROVED: { label: "Aprobado", color: "default", icon: CheckCircle },
  COMPLETED: { label: "Completado", color: "success", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "destructive", icon: XCircle },
  EXPIRED: { label: "Vencido", color: "secondary", icon: Clock },
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

    if (document.installments && document.installments > 1) {
      const installmentAmount = Math.round(document.total / document.installments)
      message += `\n📅 *${document.installments} cuotas de ${formatCurrency(installmentAmount)}*`
    }

    if (document.type === "RECIBO" && document.amountPaid && document.amountPaid > 0) {
      message += `\n✅ *Pagado:* ${formatCurrency(document.amountPaid)}`
      if (document.balance && document.balance > 0) {
        message += `\n⏳ *Saldo:* ${formatCurrency(document.balance)}`
      }
    }

    const hasCatalogoItems = document.items.some((i) => i.source === "CATALOGO")

    message += `
━━━━━━━━━━━━━━━━━━━━━
📦 ${document.shippingType}`

    if (hasCatalogoItems) {
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Documento no encontrado</p>
        <Link href="/documentos">
          <Button>Volver a Documentos</Button>
        </Link>
      </div>
    )
  }

  const StatusIcon = statusConfig[document.status].icon
  const hasStockItems = document.items.some((i) => i.source === "STOCK")
  const hasCatalogoItems = document.items.some((i) => i.source === "CATALOGO")

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {typeLabels[document.type]} #{String(document.number).padStart(5, "0")}
              </h1>
              <Badge variant={statusConfig[document.status].color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig[document.status].label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Creado el {formatDate(document.date)} por {document.createdBy.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sendWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {document.status === "DRAFT" && (
            <Link href={`/documentos/nuevo?from=${document.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Documento Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6" ref={previewRef}>
              {/* Header del documento */}
              <div className="mb-6 flex justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">
                    AZUL COLCHONES
                  </h2>
                  <p className="text-sm text-gray-500">
                    Balerdi 855 - Villa María, Córdoba
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {typeLabels[document.type].toUpperCase()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    N° {String(document.number).padStart(5, "0")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(document.date)}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">CLIENTE</p>
                <p className="text-lg font-bold">{document.client.name}</p>
                <p className="text-sm text-gray-600">{document.client.phone}</p>
                {document.client.address && (
                  <p className="text-sm text-gray-600">
                    {document.client.address}, {document.client.city}
                  </p>
                )}
              </div>

              {/* Items */}
              <table className="mb-6 w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-gray-500">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-center">Cant.</th>
                    <th className="pb-2 text-right">Precio</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-500">{item.productSize}</span>
                          <Badge
                            variant={
                              item.source === "STOCK" ? "success" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.source === "STOCK" ? (
                              <Warehouse className="mr-1 h-3 w-3" />
                            ) : (
                              <Truck className="mr-1 h-3 w-3" />
                            )}
                            {item.source === "STOCK" ? "Stock" : "Catálogo"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(document.subtotal)}</span>
                  </div>
                  {document.surcharge > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>
                        Recargo {document.installments} cuotas (+
                        {document.surchargeRate}%)
                      </span>
                      <span>{formatCurrency(document.surcharge)}</span>
                    </div>
                  )}
                  {document.shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Envío</span>
                      <span>{formatCurrency(document.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>TOTAL</span>
                    <span>{formatCurrency(document.total)}</span>
                  </div>
                  {document.installments && document.installments > 1 && (
                    <p className="text-right text-sm text-gray-500">
                      {document.installments} cuotas de{" "}
                      {formatCurrency(Math.round(document.total / document.installments))}
                    </p>
                  )}
                  {document.type === "RECIBO" && document.amountPaid !== undefined && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Pagado</span>
                        <span>{formatCurrency(document.amountPaid)}</span>
                      </div>
                      {document.balance !== undefined && document.balance > 0 && (
                        <div className="flex justify-between text-sm font-medium text-red-600">
                          <span>Saldo</span>
                          <span>{formatCurrency(document.balance)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 border-t pt-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {document.shippingType}
                  </div>
                  {hasCatalogoItems && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Entrega: 7-10 días hábiles
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Garantía oficial PIERO
                  </div>
                </div>
                {document.observations && (
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Observaciones:</strong> {document.observations}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Acciones de Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {document.status === "DRAFT" && (
                <Button
                  className="w-full"
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
                    className="w-full"
                    onClick={() => updateStatus("APPROVED")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Aprobado
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateStatus("CANCELLED")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              )}
              {document.status === "APPROVED" && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus("COMPLETED")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como Completado
                </Button>
              )}

              {/* Convertir documento */}
              {document.type === "PRESUPUESTO" &&
                document.status === "APPROVED" && (
                  <Link href={`/documentos/nuevo?from=${document.id}&tipo=recibo`}>
                    <Button variant="outline" className="w-full">
                      Convertir a Recibo
                    </Button>
                  </Link>
                )}
              {document.type === "RECIBO" && document.status === "COMPLETED" && (
                <Link href={`/documentos/nuevo?from=${document.id}&tipo=remito`}>
                  <Button variant="outline" className="w-full">
                    Generar Remito
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Info del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{document.client.name}</p>
                <p className="text-sm text-gray-500">{document.client.phone}</p>
                {document.client.email && (
                  <p className="text-sm text-gray-500">{document.client.email}</p>
                )}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const url = generateWhatsAppLink(
                        document.client.phone,
                        `Hola ${document.client.name}!`
                      )
                      window.open(url, "_blank")
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas Internas */}
          {document.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{document.internalNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Indicadores de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle>Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasStockItems && (
                <Badge variant="success" className="gap-1">
                  <Warehouse className="h-3 w-3" />
                  Productos en stock - Entrega inmediata
                </Badge>
              )}
              {hasCatalogoItems && (
                <Badge variant="secondary" className="gap-1">
                  <Truck className="h-3 w-3" />
                  Productos de catálogo - 7-10 días
                </Badge>
              )}
              <p className="text-sm text-gray-500">{document.shippingType}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
