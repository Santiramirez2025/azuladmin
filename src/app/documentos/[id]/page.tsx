"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  MessageCircle,
  Package,
  Printer,
  Send,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
      alert(`Error: ${message}`)
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
      {/* PRINTABLE DOCUMENT (estilos en el style jsx, sin cambios) */}
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

      {/* SCREEN UI */}
      <div className="screen-only mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
        {/* Top */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/documentos">
            <Button variant="ghost" size="icon-sm" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                {typeLabels[document.type]} #{String(document.number).padStart(5, "0")}
              </h1>
              <Badge variant={statusConfig[document.status].color} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig[document.status].label}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {formatDate(document.date)} · por {document.createdBy.name}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={sendWhatsApp} disabled={isUpdating} className="gap-1.5">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          {document.type === "RECIBO" && (
            <Button variant="outline" size="sm" onClick={notifyOwner} className="gap-1.5">
              <Bell className="h-4 w-4" />
              Notificar venta
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {document.status === "DRAFT" && (
            <Link href={`/documentos/nuevo?from=${document.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div ref={printRef} className="rounded-2xl border border-neutral-200 bg-white">
              {/* Header */}
              <div className="border-b border-neutral-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900">
                        <span className="text-sm font-bold text-white">A</span>
                      </div>
                      <h2 className="text-lg font-semibold tracking-tight">{BUSINESS.name}</h2>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {BUSINESS.address} · Tel: {BUSINESS.phone}
                    </p>
                    <p className="text-xs text-neutral-500">CUIT: {BUSINESS.cuit}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-900 px-4 py-2.5 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">{typeLabels[document.type]}</p>
                    <p className="font-mono text-2xl font-semibold tabular-nums text-white">
                      {String(document.number).padStart(5, "0")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="border-b border-neutral-100 px-6 py-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Cliente</p>
                <p className="mt-1 text-base font-semibold">{document.client.name}</p>
                <div className="mt-1 text-sm text-neutral-600">
                  {document.client.phone}
                  {document.client.address && ` · ${document.client.address}, ${document.client.city}`}
                  {!document.client.address && ` · ${document.client.city}`}
                </div>
              </div>

              {/* Items */}
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-500">Producto</th>
                      <th className="px-3 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-neutral-500">Cant.</th>
                      {!isRemito && (
                        <>
                          <th className="px-3 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-neutral-500">P. unit.</th>
                          <th className="px-6 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-neutral-500">Subtotal</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {document.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{item.productName}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                            <span>{item.productSize}</span>
                            <span className="text-neutral-300">·</span>
                            <span className={item.source === "STOCK" ? "text-emerald-700" : "text-neutral-600"}>
                              {item.source === "STOCK" ? "Stock" : "Catálogo"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-neutral-100 px-2 text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                        </td>
                        {!isRemito && (
                          <>
                            <td className="px-3 py-4 text-right text-sm tabular-nums text-neutral-600">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums">{formatCurrency(item.subtotal)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              {!isRemito && (
                <div className="border-t border-neutral-100 px-6 py-5">
                  <dl className="ml-auto max-w-sm space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-neutral-500">Subtotal</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(document.subtotal)}</dd>
                    </div>
                    {document.surcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-neutral-500">Recargo {document.installments} cuotas (+{document.surchargeRate}%)</dt>
                        <dd className="font-medium tabular-nums">{formatCurrency(document.surcharge)}</dd>
                      </div>
                    )}
                    {document.shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-neutral-500">Envío</dt>
                        <dd className="font-medium tabular-nums">{formatCurrency(document.shippingCost)}</dd>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                      <dt className="text-sm font-medium uppercase tracking-wider">Total</dt>
                      <dd className="text-2xl font-semibold tabular-nums">{formatCurrency(document.total)}</dd>
                    </div>

                    {document.type === "RECIBO" && (
                      <div className="space-y-2 pt-3">
                        {document.amountPaid !== undefined && document.amountPaid > 0 && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm ring-1 ring-inset ring-emerald-200">
                            <span className="text-emerald-700">Pagado ({document.paymentType || "Efectivo"})</span>
                            <span className="font-semibold tabular-nums text-emerald-900">{formatCurrency(document.amountPaid)}</span>
                          </div>
                        )}
                        {document.balance !== undefined && document.balance > 0 && (
                          <div className="rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-amber-800">Saldo pendiente</span>
                              <span className="text-lg font-semibold tabular-nums text-amber-900">{formatCurrency(document.balance)}</span>
                            </div>
                          </div>
                        )}
                        {document.balance === 0 && document.amountPaid && document.amountPaid > 0 && (
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm ring-1 ring-inset ring-emerald-200">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-emerald-700">Pago completo</span>
                          </div>
                        )}
                        {(!document.amountPaid || document.amountPaid === 0) && (
                          <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                            <p className="font-medium text-neutral-700">A cuenta</p>
                            <p className="text-xs text-neutral-500">Sin pago registrado</p>
                          </div>
                        )}
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Observaciones */}
              {document.observations && (
                <div className="border-t border-neutral-100 px-6 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Observaciones</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{document.observations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            {/* Acciones */}
            <Section title="Acciones">
              <div className="space-y-2">
                {document.status === "DRAFT" && (
                  <Button
                    className="w-full justify-between"
                    onClick={() => { sendWhatsApp(); updateStatus("SENT") }}
                    disabled={isUpdating}
                  >
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      {isUpdating ? "Enviando…" : "Enviar al cliente"}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {document.status === "SENT" && (
                  <>
                    <Button
                      className="w-full justify-between"
                      onClick={() => updateStatus("APPROVED")}
                      disabled={isUpdating}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Marcar aprobado
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => updateStatus("CANCELLED")}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}
                {document.status === "APPROVED" && (
                  <Button
                    className="w-full justify-between"
                    onClick={() => updateStatus("COMPLETED")}
                    disabled={isUpdating}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Marcar completado
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {document.type === "PRESUPUESTO" && document.status === "APPROVED" && (
                  <Link href={`/documentos/nuevo?from=${document.id}&tipo=recibo`}>
                    <Button variant="outline" className="w-full">
                      Convertir a recibo
                    </Button>
                  </Link>
                )}
                {document.type === "RECIBO" && document.status === "COMPLETED" && (
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={notifyDelivery}>
                    <Truck className="h-4 w-4" />
                    Notificar reparto
                  </Button>
                )}
              </div>
            </Section>

            {/* Cliente */}
            <Section title="Cliente">
              <p className="font-medium">{document.client.name}</p>
              <div className="mt-1 space-y-0.5 text-sm text-neutral-600">
                <p>{document.client.phone}</p>
                {document.client.email && <p className="truncate">{document.client.email}</p>}
                {document.client.address && (
                  <p className="truncate">{document.client.address}, {document.client.city}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() => {
                  const url = generateWhatsAppLink(document.client.phone, `Hola ${document.client.name}!`)
                  window.open(url, "_blank")
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Contactar
              </Button>
            </Section>

            {/* Notas internas */}
            {document.internalNotes && (
              <Section title="Notas internas">
                <p className="text-sm leading-relaxed text-neutral-700">{document.internalNotes}</p>
              </Section>
            )}

            {/* Entrega */}
            <Section title="Entrega">
              <div className="space-y-2">
                {hasStockItems && (
                  <Row icon={Warehouse} title="En stock" subtitle="Entrega inmediata" />
                )}
                {hasCatalogoItems && (
                  <Row icon={Truck} title="Catálogo" subtitle="7-10 días hábiles" />
                )}
                <Row icon={Package} title={document.shippingType} subtitle="" />
                {document.type === "PRESUPUESTO" && document.validUntil && (
                  <Row icon={Clock} title="Válido hasta" subtitle={formatDate(document.validUntil)} />
                )}
              </div>
            </Section>
          </aside>
        </div>
      </div>

      {/* PRINT STYLES (sin cambios — críticos para PDF físico) */}
      <style jsx global>{`
        .print-document { display: none; }

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">{title}</h3>
      {children}
    </div>
  )
}

function Row({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Clock
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
        <Icon className="h-4 w-4 text-neutral-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  )
}
