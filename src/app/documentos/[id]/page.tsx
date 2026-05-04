"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  MessageCircle,
  Package,
  Printer,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Warehouse,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils-client"
import type { DocumentStatus } from "@/types"
import { ErrorState, LoadingState } from "./_components/States"
import {
  BUSINESS,
  type DocumentDetail,
  statusConfig,
  typeLabels,
} from "./_components/types"
import {
  openClientWhatsApp,
  openDeliveryWhatsApp,
  openOwnerWhatsApp,
} from "./_components/whatsapp-messages"

export default function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/documents/${resolvedParams.id}`)
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? "not_found" : "server_error")
          return
        }
        const data = (await res.json()) as DocumentDetail
        if (!cancelled) setDocument(data)
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching document:", err)
          setError("network_error")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
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
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update status")
      }
      const updated = (await res.json()) as DocumentDetail
      setDocument(updated)
    } catch (err) {
      console.error("Error updating status:", err)
      const message = err instanceof Error ? err.message : "Error desconocido"
      alert(`Error al actualizar el estado: ${message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrint = () => window.print()

  const sendWhatsApp = () => {
    if (!document) return
    openClientWhatsApp(document)
    if (document.status === "DRAFT") updateStatus("SENT")
  }

  const notifyOwner = () => document && openOwnerWhatsApp(document)
  const notifyDelivery = () => document && openDeliveryWhatsApp(document)

  if (isLoading) return <LoadingState />
  if (error || !document) return <ErrorState error={error ?? "server_error"} />

  const StatusIcon = statusConfig[document.status].icon
  const hasStockItems = document.items.some((i) => i.source === "STOCK")
  const hasCatalogoItems = document.items.some((i) => i.source === "CATALOGO")
  const isRemito = document.type === "REMITO"

  return (
    <>
      {/* PRINTABLE DOCUMENT */}
      <div className="print-document" id="printable-area">
        <div className="print-header">
          <div className="print-header-left">
            <h1 className="print-business-name">{BUSINESS.name}</h1>
            <p className="print-tagline">{BUSINESS.tagline}</p>
            <div className="print-fiscal-info">
              <span>CUIT: {BUSINESS.cuit}</span>
              <span>Ing. Brutos: {BUSINESS.iibb}</span>
              <span>Inicio Act.: {BUSINESS.inicioActividad}</span>
            </div>
            <div className="print-contact-info">
              <span>{BUSINESS.address}</span>
              <span>Tel: {BUSINESS.phone} · {BUSINESS.email}</span>
            </div>
          </div>
          <div className="print-header-right">
            <div className="print-doc-type-box">
              <span className="print-doc-letter">X</span>
              <span className="print-doc-type">{typeLabels[document.type].toUpperCase()}</span>
              <span className="print-doc-number">N° 0001-{String(document.number).padStart(8, "0")}</span>
              <span className="print-doc-date">Fecha: {formatDate(document.date)}</span>
            </div>
          </div>
        </div>

        <div className="print-client-section">
          <div className="print-section-label">DATOS DEL CLIENTE</div>
          <div className="print-client-name">{document.client.name}</div>
          <div className="print-client-details">
            <span>Tel: {document.client.phone}</span>
            {document.client.address && (
              <span> · {document.client.address}, {document.client.city}</span>
            )}
            {!document.client.address && <span> · {document.client.city}</span>}
          </div>
          <div className="print-doc-meta">
            {document.type === "PRESUPUESTO" && document.validUntil && (
              <span>Válido hasta: {formatDate(document.validUntil)}</span>
            )}
            <span>Envío: {document.shippingType}</span>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th className="print-th-left">Producto</th>
              <th className="print-th-left">Medida</th>
              <th className="print-th-center">Cant.</th>
              {!isRemito && (
                <>
                  <th className="print-th-right">P. Unitario</th>
                  <th className="print-th-right">Subtotal</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "print-row-even" : ""}>
                <td className="print-td">
                  <strong>{item.productName}</strong>
                  <small className={item.source === "STOCK" ? "print-badge-stock" : "print-badge-catalog"}>
                    {item.source === "STOCK" ? "Stock" : "Catálogo"}
                  </small>
                </td>
                <td className="print-td">{item.productSize}</td>
                <td className="print-td-center">{item.quantity}</td>
                {!isRemito && (
                  <>
                    <td className="print-td-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="print-td-right print-td-bold">{formatCurrency(item.subtotal)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!isRemito && (
          <div className="print-totals-wrapper">
            <div className="print-totals">
              <div className="print-total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(document.subtotal)}</span>
              </div>
              {document.surcharge > 0 && (
                <div className="print-total-row">
                  <span>Recargo ({document.surchargeRate}%)</span>
                  <span>{formatCurrency(document.surcharge)}</span>
                </div>
              )}
              {document.shippingCost > 0 && (
                <div className="print-total-row">
                  <span>Envío</span>
                  <span>{formatCurrency(document.shippingCost)}</span>
                </div>
              )}
              <div className="print-total-final">
                <span>TOTAL</span>
                <span>{formatCurrency(document.total)}</span>
              </div>

              {document.type === "RECIBO" && (
                <div className="print-payment-info">
                  {document.amountPaid !== undefined && document.amountPaid > 0 && (
                    <div className="print-paid-row">
                      ✓ Entregó ({document.paymentType || "Efectivo"}): {formatCurrency(document.amountPaid)}
                    </div>
                  )}
                  {document.balance !== undefined && document.balance > 0 && (
                    <div className="print-balance-row">Saldo pendiente: {formatCurrency(document.balance)}</div>
                  )}
                  {document.balance === 0 && document.amountPaid && document.amountPaid > 0 && (
                    <div className="print-paid-full">PAGO COMPLETO</div>
                  )}
                  {document.installments && document.installments > 1 && (
                    <div className="print-installments">
                      {document.installments} cuotas de {formatCurrency(Math.round(document.total / document.installments))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {document.observations && (
          <div className="print-observations">
            <strong>Observaciones:</strong> {document.observations}
          </div>
        )}

        <div className="print-signatures">
          <div className="print-signature-block">
            <div className="print-signature-line" />
            <div className="print-signature-label">Firma Vendedor</div>
            <div className="print-signature-aclaracion">Aclaración: ________________________________</div>
          </div>
          {document.type !== "PRESUPUESTO" && (
            <div className="print-signature-block">
              <div className="print-signature-line" />
              <div className="print-signature-label">
                {document.type === "REMITO" ? "Recibí conforme" : "Firma Cliente"}
              </div>
              <div className="print-signature-aclaracion">Aclaración: ________________________________</div>
              {document.type === "REMITO" && (
                <div className="print-signature-aclaracion">DNI: _______________________</div>
              )}
            </div>
          )}
        </div>

        <div className="print-footer">
          <span>{BUSINESS.name} · {BUSINESS.address} · Tel: {BUSINESS.phone}</span>
          <small>Documento no válido como factura</small>
        </div>
      </div>

      {/* SCREEN-ONLY UI */}
      <div className="screen-only min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 pb-24 md:p-8 md:pt-8 md:pb-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="mb-4 flex items-center gap-3 md:mb-6 md:gap-4">
              <Link href="/documentos">
                <div className="group relative">
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur transition group-hover:opacity-30" />
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
                    <div className={`absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r ${statusConfig[document.status].gradient} opacity-20 blur`} />
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

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:relative md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none">
              <Button variant="outline" size="sm" onClick={sendWhatsApp} disabled={isUpdating}
                className="flex-1 border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 md:flex-none md:text-sm">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">Cliente</span>
              </Button>

              {document.type === "RECIBO" && (
                <Button variant="outline" size="sm" onClick={notifyOwner}
                  className="flex-1 border-emerald-200 bg-emerald-50/50 text-xs font-semibold text-emerald-700 shadow-lg shadow-emerald-500/5 transition-all hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-800 md:flex-none md:text-sm">
                  <Bell className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Notificar Venta</span>
                  <span className="sm:hidden">Notificar</span>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handlePrint}
                className="flex-1 border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:flex-none md:text-sm">
                <Printer className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Imprimir</span>
                <span className="sm:hidden">PDF</span>
              </Button>

              {document.status === "DRAFT" && (
                <Link href={`/documentos/nuevo?from=${document.id}`} className="flex-1 md:flex-none">
                  <Button variant="outline" size="sm"
                    className="w-full border-slate-200 bg-white text-xs font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 md:text-sm">
                    <Edit className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                    Editar
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-4 md:grid md:gap-6 md:space-y-0 lg:grid-cols-3">
            {/* Document Preview (screen) */}
            <div className="lg:col-span-2">
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30" />
                <Card className="relative overflow-hidden border-0 bg-white/95 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
                  <CardContent className="relative p-6 md:p-10" ref={printRef}>
                    {/* Header */}
                    <div className="mb-8 grid grid-cols-[1fr_auto] gap-6 border-b-2 border-blue-600 pb-6">
                      <div>
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
                            <Sparkles className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-blue-900">{BUSINESS.name}</h1>
                            <p className="text-xs font-medium text-slate-600">{BUSINESS.tagline}</p>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-xs text-slate-700">
                          <p className="font-semibold">📍 {BUSINESS.address}</p>
                          <p>📞 {BUSINESS.phone} • ✉️ {BUSINESS.email}</p>
                          <p className="text-slate-500">CUIT: {BUSINESS.cuit} | Ing. Brutos: {BUSINESS.iibb}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-4 text-right shadow-xl">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-200">{typeLabels[document.type]}</p>
                          <p className="text-4xl font-black tabular-nums text-white">{String(document.number).padStart(5, "0")}</p>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-600">{formatDate(document.date)}</p>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="mb-6 overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 shadow-md">
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

                    {/* Tabla */}
                    <div className="mb-6 overflow-hidden rounded-xl border-2 border-slate-200 shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-300 bg-slate-100">
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Producto</th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Cant.</th>
                            {!isRemito && (
                              <>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Precio Unit.</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Subtotal</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {document.items.map((item, index) => (
                            <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              <td className="px-4 py-4">
                                <div className="space-y-1.5">
                                  <p className="font-bold text-slate-900">{item.productName}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600">{item.productSize}</span>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                                      item.source === "STOCK" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                    }`}>
                                      {item.source === "STOCK" ? "✓ Stock" : "📦 Catálogo"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-sm">
                                  {item.quantity}
                                </span>
                              </td>
                              {!isRemito && (
                                <>
                                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-700">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-4 py-4 text-right text-lg font-bold tabular-nums text-slate-900">{formatCurrency(item.subtotal)}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totales */}
                    {!isRemito && (
                      <div className="flex justify-end">
                        <div className="w-full space-y-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-5 shadow-sm md:w-96">
                          <div className="flex justify-between border-b border-slate-300 pb-2.5 text-sm">
                            <span className="font-semibold text-slate-700">Subtotal</span>
                            <span className="font-bold tabular-nums text-slate-900">{formatCurrency(document.subtotal)}</span>
                          </div>
                          {document.surcharge > 0 && (
                            <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2 text-sm">
                              <span className="font-semibold text-orange-800">Recargo {document.installments} cuotas (+{document.surchargeRate}%)</span>
                              <span className="font-bold tabular-nums text-orange-900">{formatCurrency(document.surcharge)}</span>
                            </div>
                          )}
                          {document.shippingCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-slate-700">Envío</span>
                              <span className="font-bold tabular-nums text-slate-900">{formatCurrency(document.shippingCost)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg">
                            <span className="text-sm font-bold uppercase tracking-wider text-white">Total</span>
                            <span className="text-3xl font-black tabular-nums text-white">{formatCurrency(document.total)}</span>
                          </div>

                          {document.type === "RECIBO" && (
                            <div className="space-y-2.5 border-t-2 border-slate-300 pt-3">
                              {document.amountPaid !== undefined && document.amountPaid > 0 && (
                                <div className="rounded-lg bg-emerald-50 px-3 py-2.5 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-800">✓ Entregó ({document.paymentType || "Efectivo"})</span>
                                    <span className="text-lg font-black tabular-nums text-emerald-900">{formatCurrency(document.amountPaid)}</span>
                                  </div>
                                </div>
                              )}
                              {document.balance !== undefined && document.balance > 0 && (
                                <div className="rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-100 to-amber-100 p-4 shadow-md">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="mb-0.5 flex items-center gap-2 text-sm font-black uppercase text-orange-900">
                                        <AlertTriangle className="h-5 w-5" /> Saldo Pendiente
                                      </p>
                                      <p className="text-xs font-semibold text-orange-800">Debe abonar al entregar</p>
                                    </div>
                                    <p className="text-4xl font-black tabular-nums text-orange-900">{formatCurrency(document.balance)}</p>
                                  </div>
                                </div>
                              )}
                              {document.balance === 0 && document.amountPaid && document.amountPaid > 0 && (
                                <div className="rounded-xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-100 to-green-100 p-4 text-center shadow-md">
                                  <CheckCircle className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
                                  <p className="text-lg font-black uppercase text-emerald-900">Pago Completo</p>
                                  <p className="text-xs font-semibold text-emerald-800">Sin saldo pendiente</p>
                                </div>
                              )}
                              {(!document.amountPaid || document.amountPaid === 0) && (
                                <div className="rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-cyan-100 p-3 shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    <Receipt className="h-6 w-6 text-blue-700" />
                                    <div>
                                      <p className="text-sm font-bold text-blue-900">A Cuenta</p>
                                      <p className="text-xs font-semibold text-blue-700">Sin pago registrado - Total adeudado: {formatCurrency(document.total)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {document.installments && document.installments > 1 && (
                                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center shadow-sm">
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

                    {/* Footer info */}
                    <div className="mt-8 space-y-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 shadow-sm">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                            <Truck className="h-5 w-5 text-orange-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase text-slate-500">Envío</p>
                            <p className="text-sm font-semibold leading-tight text-slate-900">{document.shippingType}</p>
                          </div>
                        </div>
                        {hasCatalogoItems && (
                          <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                              <Clock className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase text-slate-500">Entrega</p>
                              <p className="text-sm font-semibold leading-tight text-slate-900">7-10 días</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2.5 rounded-lg bg-white/80 p-3 shadow-sm">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                            <ShieldCheck className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase text-slate-500">Garantía</p>
                            <p className="text-sm font-semibold leading-tight text-slate-900">Oficial PIERO</p>
                          </div>
                        </div>
                      </div>
                      {document.observations && (
                        <div className="rounded-lg border-l-4 border-blue-600 bg-white p-4 shadow-sm">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Observaciones</p>
                          <p className="text-sm leading-relaxed text-slate-700">{document.observations}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Acciones de Estado */}
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-emerald-500/5 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 shadow-lg shadow-emerald-500/20 md:p-2">
                      <Sparkles className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Acciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 p-4 md:space-y-3 md:p-6">
                  {document.status === "DRAFT" && (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
                      onClick={() => { sendWhatsApp(); updateStatus("SENT") }}
                      disabled={isUpdating}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isUpdating ? "Enviando..." : "Enviar al Cliente"}
                    </Button>
                  )}
                  {document.status === "SENT" && (
                    <>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 disabled:opacity-50 md:text-base"
                        onClick={() => updateStatus("APPROVED")} disabled={isUpdating}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isUpdating ? "Procesando..." : "Marcar como Aprobado"}
                      </Button>
                      <Button variant="outline" className="w-full border-red-200 bg-white/50 text-sm font-semibold text-red-600 transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 disabled:opacity-50 md:text-base"
                        onClick={() => updateStatus("CANCELLED")} disabled={isUpdating}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {document.status === "APPROVED" && (
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 disabled:opacity-50 md:text-base"
                      onClick={() => updateStatus("COMPLETED")} disabled={isUpdating}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isUpdating ? "Procesando..." : "Marcar como Completado"}
                    </Button>
                  )}
                  {document.type === "PRESUPUESTO" && document.status === "APPROVED" && (
                    <Link href={`/documentos/nuevo?from=${document.id}&tipo=recibo`}>
                      <Button variant="outline" className="w-full border-slate-200 bg-white/50 text-sm font-semibold transition-all hover:scale-105 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:text-base">
                        Convertir a Recibo
                      </Button>
                    </Link>
                  )}
                  {document.type === "RECIBO" && document.status === "COMPLETED" && (
                    <Button variant="outline"
                      className="w-full border-orange-200 bg-orange-50/50 text-sm font-semibold text-orange-700 transition-all hover:scale-105 hover:border-orange-400 hover:bg-orange-100 hover:text-orange-800 md:text-base"
                      onClick={notifyDelivery}>
                      <Truck className="mr-2 h-4 w-4" />
                      Notificar Remito
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Estado de Pago */}
              {document.type === "RECIBO" && (
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-1 shadow-lg shadow-blue-500/20 md:p-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Estado de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 md:space-y-3.5 md:p-5">
                    {document.paymentType && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">Método de Pago</p>
                        <p className="text-sm font-bold text-slate-900">{document.paymentType}</p>
                      </div>
                    )}
                    {document.amountPaid !== undefined && document.amountPaid > 0 && (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-700">Monto Pagado</p>
                        <p className="text-2xl font-bold text-emerald-900">{formatCurrency(document.amountPaid)}</p>
                      </div>
                    )}
                    {document.balance !== undefined && document.balance > 0 ? (
                      <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="flex items-center gap-1.5 text-sm font-bold text-orange-900">
                              <AlertTriangle className="h-4 w-4" /> Saldo Pendiente
                            </p>
                            <p className="text-xs text-orange-700">A cobrar al cliente</p>
                          </div>
                          <p className="text-3xl font-bold text-orange-900">{formatCurrency(document.balance)}</p>
                        </div>
                      </div>
                    ) : document.amountPaid !== undefined && document.amountPaid > 0 ? (
                      <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-100 to-green-100 p-4 text-center">
                        <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                        <p className="text-lg font-bold text-emerald-900">Pago Completo</p>
                        <p className="text-xs text-emerald-700">Sin saldo pendiente</p>
                      </div>
                    ) : null}
                    {(!document.amountPaid || document.amountPaid === 0) && (
                      <div className="rounded-xl border-2 border-blue-300/50 bg-gradient-to-br from-blue-100/80 to-cyan-100/60 p-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-blue-900">A Cuenta</p>
                            <p className="text-xs text-blue-700">Sin pago registrado</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Info del Cliente */}
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/5 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-lg shadow-violet-500/20 md:p-2">
                      <User className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="mb-3 space-y-1.5 md:mb-4 md:space-y-2">
                    <p className="text-base font-bold text-slate-900 md:text-lg">{document.client.name}</p>
                    <div className="space-y-0.5 text-xs text-slate-600 md:space-y-1 md:text-sm">
                      <p className="font-medium">{document.client.phone}</p>
                      {document.client.email && <p className="truncate">{document.client.email}</p>}
                      {document.client.address && <p className="truncate">{document.client.address}, {document.client.city}</p>}
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-slate-200 bg-white/50 text-xs font-semibold transition-all hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 md:text-sm"
                    onClick={() => {
                      const url = generateWhatsAppLink(document.client.phone, `Hola ${document.client.name}!`)
                      window.open(url, "_blank")
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Notas Internas */}
              {document.internalNotes && (
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-amber-500/5 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-amber-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1 shadow-lg shadow-amber-500/20 md:p-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Notas Internas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-5">
                    <div className="rounded-lg bg-amber-50/50 p-3 backdrop-blur-sm md:p-4">
                      <p className="text-xs leading-relaxed text-slate-700 md:text-sm">{document.internalNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info de Entrega */}
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-1 shadow-lg shadow-blue-500/20 md:p-1.5">
                      <Package className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                    </div>
                    Información de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 p-4 md:space-y-3 md:p-5">
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

      {/* PRINT-SPECIFIC STYLES */}
      <style jsx global>{`
        .print-document { display: none; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media print {
          @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
          .screen-only, header, nav, [role="navigation"], button, a[role="button"] { display: none !important; }
          .print-document {
            display: block !important; width: 100% !important; background: white !important; color: #1a1a2e !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 9pt; line-height: 1.4;
          }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
          .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2pt solid #1e3a5f; padding-bottom: 8pt; margin-bottom: 10pt; }
          .print-header-left { flex: 1; }
          .print-business-name { font-size: 18pt; font-weight: 900; color: #1e3a5f; margin: 0 0 2pt 0; letter-spacing: -0.5pt; }
          .print-tagline { font-size: 7pt; color: #718096; margin: 0 0 6pt 0; }
          .print-fiscal-info { display: flex; gap: 12pt; font-size: 7pt; color: #4a5568; margin-bottom: 2pt; }
          .print-contact-info { display: flex; flex-direction: column; font-size: 7pt; color: #4a5568; gap: 1pt; }
          .print-header-right { flex-shrink: 0; }
          .print-doc-type-box { border: 1.5pt solid #1e3a5f; padding: 6pt 14pt; text-align: center; display: flex; flex-direction: column; gap: 1pt; min-width: 130pt; }
          .print-doc-letter { font-size: 18pt; font-weight: 900; color: #1e3a5f; line-height: 1; }
          .print-doc-type { font-size: 8pt; font-weight: 700; color: #1e3a5f; letter-spacing: 1pt; }
          .print-doc-number { font-size: 10pt; font-weight: 700; color: #1a1a2e; }
          .print-doc-date { font-size: 7pt; color: #718096; }
          .print-client-section { margin-bottom: 10pt; padding-bottom: 6pt; border-bottom: 0.5pt solid #e2e8f0; }
          .print-section-label { font-size: 7pt; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5pt; margin-bottom: 3pt; }
          .print-client-name { font-size: 11pt; font-weight: 700; color: #1a1a2e; margin-bottom: 2pt; }
          .print-client-details { font-size: 8pt; color: #4a5568; }
          .print-doc-meta { font-size: 7pt; color: #718096; margin-top: 3pt; display: flex; gap: 10pt; }
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; page-break-inside: auto; }
          .print-table thead { display: table-header-group; }
          .print-table thead tr { background: #1e3a5f !important; }
          .print-th-left, .print-th-center, .print-th-right { padding: 5pt 6pt; font-size: 7pt; font-weight: 700; color: white !important; text-transform: uppercase; letter-spacing: 0.5pt; }
          .print-th-left { text-align: left; }
          .print-th-center { text-align: center; }
          .print-th-right { text-align: right; }
          .print-td, .print-td-center, .print-td-right { padding: 5pt 6pt; font-size: 8.5pt; border-bottom: 0.3pt solid #e2e8f0; vertical-align: top; }
          .print-td-center { text-align: center; }
          .print-td-right { text-align: right; }
          .print-td-bold { font-weight: 700; }
          .print-td strong { display: block; font-size: 8.5pt; color: #1a1a2e; }
          .print-td small { display: inline-block; font-size: 6pt; padding: 1pt 4pt; border-radius: 2pt; margin-top: 2pt; }
          .print-badge-stock { color: #059669; }
          .print-badge-catalog { color: #3b82f6; }
          .print-row-even { background: #f7fafc !important; }
          .print-table tr { page-break-inside: avoid; }
          .print-totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 8pt; }
          .print-totals { width: 200pt; }
          .print-total-row { display: flex; justify-content: space-between; padding: 3pt 0; font-size: 8.5pt; color: #4a5568; }
          .print-total-final { display: flex; justify-content: space-between; align-items: center; background: #1e3a5f !important; color: white !important; padding: 6pt 10pt; margin-top: 4pt; font-weight: 900; font-size: 12pt; }
          .print-payment-info { margin-top: 6pt; padding-top: 4pt; border-top: 0.5pt solid #e2e8f0; }
          .print-paid-row { font-size: 8pt; color: #059669; padding: 2pt 0; }
          .print-balance-row { font-size: 9pt; font-weight: 700; color: #dc2626; padding: 2pt 0; }
          .print-paid-full { font-size: 9pt; font-weight: 700; color: #059669; padding: 2pt 0; }
          .print-installments { font-size: 7pt; color: #718096; padding: 2pt 0; }
          .print-observations { font-size: 8pt; color: #4a5568; padding: 6pt 8pt; border-left: 2pt solid #3b82f6; background: #f7fafc !important; margin-bottom: 12pt; }
          .print-observations strong { color: #1e3a5f; font-size: 7pt; text-transform: uppercase; }
          .print-signatures { display: flex; justify-content: space-around; margin-top: 30pt; page-break-inside: avoid; }
          .print-signature-block { text-align: center; width: 180pt; }
          .print-signature-line { border-bottom: 1pt solid #1a1a2e; margin-bottom: 4pt; height: 40pt; }
          .print-signature-label { font-size: 8pt; font-weight: 700; color: #1a1a2e; }
          .print-signature-aclaracion { font-size: 7pt; color: #718096; margin-top: 3pt; }
          .print-footer { margin-top: 16pt; padding-top: 6pt; border-top: 0.3pt solid #e2e8f0; text-align: center; font-size: 7pt; color: #718096; page-break-inside: avoid; }
          .print-footer small { display: block; font-size: 6pt; color: #cbd5e1; margin-top: 2pt; }
        }
      `}</style>
    </>
  )
}
