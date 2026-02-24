"use client"

// ============================================================================
// NuevoDocumentoContent — Orquestador principal
// ─────────────────────────────────────────────────────────────────────────────
// Este componente ahora solo:
//  1. Mantiene el estado del formulario
//  2. Delega cálculos a useDocumentCalculations
//  3. Delega submit a useDocumentSubmit
//  4. Delega keyboard shortcuts a useKeyboardShortcuts
//  5. Renderiza los sub-componentes con useCallback en cada handler
//
// Lo que fue eliminado de este archivo:
//  • Lógica de WhatsApp (~80 líneas)
//  • Lógica de cálculos en render (~15 líneas)
//  • useEffect de keyboard con stale closure
//  • PAYMENT_METHODS recreado en cada render
//  • Constantes mezcladas con lógica
// ============================================================================

import { useState, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Send, Loader2, User, FileText,
  Calendar, Truck, CreditCard, MessageSquare, AlertCircle,
  Sparkles, CheckCircle2, Package, DollarSign, Receipt, AlertTriangle,
} from "lucide-react"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Label }     from "@/components/ui/label"
import { Textarea }  from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }     from "@/components/ui/badge"
import { Skeleton }  from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils-client"
import { usePaymentRates } from "@/hooks/use-payment-rates"

import { ClientSearch }   from "./_components/ClientSearch"
import { ProductSelector } from "./_components/ProductSelector"
import { useDocumentCalculations } from "./_hooks/useDocumentCalculations"
import { useKeyboardShortcuts }    from "./_hooks/useKeyboardShortcuts"
import { useDocumentSubmit }       from "./_hooks/useDocumentSubmit"

import {
  DOCUMENT_TYPE_CONFIG, SHIPPING_OPTIONS, VALID_DAYS_OPTIONS,
  PAYMENT_TYPE_OPTIONS, DEFAULT_PAYMENT_RATES,
} from "./_lib/constants"
import type { Client, DocumentItem, DocumentType, PaymentMethod } from "./_lib/types.ts"

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
        <div className="space-y-4 md:grid md:gap-6 md:space-y-0 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Wrapper de Card reutilizable ─────────────────────────────────────────────

function SectionCard({
  title, icon: Icon, gradient, children,
}: {
  title: string
  icon: React.ElementType
  gradient: string   // Ej: "from-blue-500 to-indigo-600"
  children: React.ReactNode
}) {
  return (
    <div className="group relative">
      <div className={cn("absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-30", gradient)} />
      <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white/50 p-4 md:p-6 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:text-lg">
            <div className={cn("rounded-lg bg-gradient-to-br p-1.5 shadow-lg md:p-2", gradient)}>
              <Icon className="h-4 w-4 text-white md:h-5 md:w-5" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-4 md:p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function NuevoDocumentoContent() {
  const searchParams = useSearchParams()
  const { rates: paymentRates, isLoading: loadingRates } = usePaymentRates()

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [type, setType] = useState<DocumentType>(
    (searchParams.get("tipo")?.toUpperCase() as DocumentType) || "PRESUPUESTO"
  )
  const [client, setClient]           = useState<Client | null>(null)
  const [items, setItems]             = useState<DocumentItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CONTADO")
  const [shippingType, setShippingType]   = useState<string>(SHIPPING_OPTIONS[0])
  const [shippingCost, setShippingCost]   = useState(0)
  const [observations, setObservations]   = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [validDays, setValidDays]     = useState(7)
  const [amountPaid, setAmountPaid]   = useState(0)
  const [paymentType, setPaymentType] = useState("Efectivo")

  // ── Rates con fallback ─────────────────────────────────────────────────────
  const effectiveRates = useMemo(
    () => (loadingRates ? DEFAULT_PAYMENT_RATES : paymentRates),
    [paymentRates, loadingRates]
  )

  // ── PAYMENT_METHODS memoizado (depende de effectiveRates) ──────────────────
  const PAYMENT_METHODS = useMemo(() => [
    { value: "CONTADO"   as const, label: "Contado / Transferencia", surcharge: effectiveRates["1"]  ?? 0  },
    { value: "CUOTAS_3"  as const, label: "3 Cuotas",                surcharge: effectiveRates["3"]  ?? 18 },
    { value: "CUOTAS_6"  as const, label: "6 Cuotas",                surcharge: effectiveRates["6"]  ?? 25 },
    { value: "CUOTAS_9"  as const, label: "9 Cuotas",                surcharge: effectiveRates["9"]  ?? 35 },
    { value: "CUOTAS_12" as const, label: "12 Cuotas",               surcharge: effectiveRates["12"] ?? 47 },
  ], [effectiveRates])

  // ── Cálculos centralizados ─────────────────────────────────────────────────
  const calc = useDocumentCalculations({
    items, type, paymentMethod,
    paymentRates: effectiveRates,
    shippingCost, amountPaid,
  })

  // ── Submit ─────────────────────────────────────────────────────────────────
  const { submit, isSubmitting, saveAction } = useDocumentSubmit({
    type, client, items, calc, paymentMethod,
    shippingType, shippingCost, observations, internalNotes,
    validDays, amountPaid, paymentType,
  })

  // ── Handlers estables para sub-componentes memoizados ─────────────────────
  const handleClientChange = useCallback((c: Client | null) => setClient(c), [])
  const handleItemsChange  = useCallback((i: DocumentItem[]) => setItems(i), [])

  const isValid = Boolean(client && items.length > 0)

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    enabled: isValid && !isSubmitting,
    onSave:  () => submit("draft"),
    onSend:  () => submit("send"),
  })

  // ── Handlers de amountPaid (con clamp) ────────────────────────────────────
  const handleAmountPaidChange = useCallback((raw: string) => {
    const value = parseFloat(raw) || 0
    // No aplicar clamp a total=0 para evitar que bloquee el input mientras se agregan items
    setAmountPaid(calc.total > 0 ? Math.min(value, calc.total) : value)
  }, [calc.total])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <div className="mb-4 flex items-center gap-3 md:mb-6">
            <Link href="/documentos">
              <Button variant="ghost" size="icon"
                className="h-10 w-10 rounded-xl border border-slate-200/50 bg-white/80 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:border-blue-300 hover:bg-blue-50 md:h-12 md:w-12">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-xl font-bold text-transparent md:text-3xl">
                  Nuevo Documento
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">
                Creá un presupuesto, recibo o remito · <kbd className="rounded bg-slate-100 px-1 text-[10px] font-mono">⌘S</kbd> guardar · <kbd className="rounded bg-slate-100 px-1 text-[10px] font-mono">⌘↵</kbd> enviar
              </p>
            </div>
          </div>

          {/* Botones — Fixed en móvil, inline en desktop */}
          <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl md:relative md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button variant="outline" onClick={() => submit("draft")}
              disabled={!isValid || isSubmitting} title="Ctrl/Cmd + S"
              className="flex-1 border-slate-200 bg-white font-semibold shadow-lg disabled:opacity-50 md:flex-none md:px-6">
              {isSubmitting && saveAction === "draft"
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Save className="mr-2 h-4 w-4" />
              }
              <span className="hidden md:inline">Guardar Borrador</span>
              <span className="md:hidden">Guardar</span>
            </Button>

            <Button onClick={() => submit("send")}
              disabled={!isValid || isSubmitting} title="Ctrl/Cmd + Enter"
              className={cn(
                "flex-1 overflow-hidden font-bold shadow-2xl transition-all disabled:opacity-50 md:flex-none md:px-6",
                type === "REMITO"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/30"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30"
              )}>
              {isSubmitting && saveAction === "send"
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Send className="mr-2 h-4 w-4" />
              }
              <span className="hidden md:inline">
                {type === "REMITO" ? "Enviar a Reparto" : "Guardar y Enviar"}
              </span>
              <span className="md:hidden">Enviar</span>
            </Button>
          </div>
        </div>

        {/* ── Grid principal ────────────────────────────────────────────────── */}
        <div className="space-y-4 pb-24 md:grid md:gap-6 md:space-y-0 md:pb-0 lg:grid-cols-3">

          {/* Columna izquierda (2/3) */}
          <div className="space-y-4 md:space-y-6 lg:col-span-2">

            {/* Tipo de documento */}
            <SectionCard title="Tipo de Documento" icon={FileText} gradient="from-blue-500 to-indigo-600">
              <div className="grid gap-3 sm:grid-cols-3">
                {DOCUMENT_TYPE_CONFIG.map((cfg) => {
                  const isSelected = type === cfg.value
                  const isRemito   = cfg.value === "REMITO"
                  return (
                    <button key={cfg.value} type="button" onClick={() => setType(cfg.value)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all duration-300 md:p-5",
                        isSelected
                          ? isRemito
                            ? "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-lg shadow-orange-500/20"
                            : "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-lg shadow-blue-500/20"
                          : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-slate-50/50"
                      )}>
                      <p className="mb-0.5 text-sm font-bold text-slate-900 md:text-base">{cfg.label}</p>
                      <p className="text-[10px] text-slate-600 md:text-xs">{cfg.description}</p>
                      {cfg.badgeLabel && (
                        <Badge variant="secondary" className="mt-2 bg-orange-100 text-[10px] font-semibold text-orange-700">
                          {cfg.badgeLabel}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            {/* Cliente */}
            <SectionCard title="Cliente" icon={User} gradient="from-violet-500 to-purple-600">
              <ClientSearch value={client} onChange={handleClientChange} />
            </SectionCard>

            {/* Productos */}
            <SectionCard title="Productos" icon={Package} gradient="from-emerald-500 to-green-600">
              <ProductSelector items={items} onChange={handleItemsChange} />
            </SectionCard>

            {/* Observaciones */}
            <SectionCard title="Observaciones" icon={MessageSquare} gradient="from-amber-500 to-orange-600">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Observaciones <span className="font-normal text-slate-500">(visible para el cliente)</span>
                  </Label>
                  <Textarea
                    placeholder="Condiciones de venta, detalles de entrega, etc."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                    className="resize-none border-slate-200 bg-white/50 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Notas internas <span className="font-normal text-slate-500">(solo vos)</span>
                  </Label>
                  <Textarea
                    placeholder="Notas privadas sobre esta venta..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={2}
                    className="resize-none border-amber-200 bg-amber-50/50 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Columna derecha — Sidebar */}
          <div className="space-y-4 md:space-y-5">

            {/* Forma de pago (solo RECIBO) */}
            {type === "RECIBO" && (
              <SectionCard title="Forma de Pago" icon={CreditCard} gradient="from-blue-500 to-indigo-600">
                <div className="space-y-2">
                  {loadingRates ? (
                    <div className="flex justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    </div>
                  ) : (
                    PAYMENT_METHODS.map((m) => (
                      <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                          paymentMethod === m.value
                            ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-md"
                            : "border-slate-200 bg-white/50 hover:border-slate-300"
                        )}>
                        <span className="font-semibold text-slate-900">{m.label}</span>
                        {m.surcharge > 0 && (
                          <Badge variant="secondary" className="text-xs font-bold">+{m.surcharge}%</Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </SectionCard>
            )}

            {/* Detalles del pago (solo RECIBO) */}
            {type === "RECIBO" && (
              <SectionCard title="Detalles del Pago" icon={DollarSign} gradient="from-emerald-500 to-green-600">
                <div className="space-y-3">
                  {/* Tipo de pago */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Tipo de Pago</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger className="border-slate-200 bg-white/50 text-sm font-semibold focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPE_OPTIONS.map(({ value, emoji }) => (
                          <SelectItem key={value} value={value} className="text-sm">
                            {emoji} {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Monto pagado */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Monto Pagado{" "}
                      <span className="font-normal text-slate-500">(0 = a cuenta)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={amountPaid || ""}
                        onChange={(e) => handleAmountPaidChange(e.target.value)}
                        className="border-slate-200 bg-white/50 pl-7 text-sm font-semibold focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        placeholder="0.00"
                      />
                    </div>
                    {calc.total > 0 && (
                      <p className="text-[10px] text-slate-500">Total del documento: {formatCurrency(calc.total)}</p>
                    )}
                  </div>

                  {/* Indicadores de estado de pago */}
                  {calc.hasPartialPayment && (
                    <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-orange-900">
                            <AlertTriangle className="h-4 w-4" /> Saldo Pendiente
                          </p>
                          <p className="text-xs text-orange-700">A cobrar al cliente</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">{formatCurrency(calc.balance)}</p>
                      </div>
                    </div>
                  )}

                  {calc.isPaidInFull && (
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                      <p className="font-bold text-emerald-900">Pago Completo</p>
                      <p className="text-xs text-emerald-700">Sin saldo pendiente</p>
                    </div>
                  )}

                  {amountPaid === 0 && calc.total > 0 && (
                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-blue-900">A Cuenta</p>
                          <p className="text-xs text-blue-700">Sin pago registrado</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Validez (solo PRESUPUESTO) */}
            {type === "PRESUPUESTO" && (
              <SectionCard title="Validez" icon={Calendar} gradient="from-violet-500 to-purple-600">
                <Select value={String(validDays)} onValueChange={(v) => setValidDays(parseInt(v))}>
                  <SelectTrigger className="border-slate-200 bg-white/50 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_DAYS_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} días</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SectionCard>
            )}

            {/* Envío */}
            <SectionCard title="Envío" icon={Truck} gradient="from-orange-500 to-amber-600">
              <div className="space-y-3">
                <Select value={shippingType} onValueChange={setShippingType}>
                  <SelectTrigger className="border-slate-200 bg-white/50 text-sm font-semibold focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {shippingType.includes("costo") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Costo de envío</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                      <Input type="number" min="0"
                        value={shippingCost || ""}
                        onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                        className="border-slate-200 bg-white/50 pl-7 text-sm font-semibold focus:border-orange-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Resumen / Totales */}
            <div className="group relative">
              <div className={cn(
                "absolute -inset-0.5 rounded-2xl opacity-30 blur transition group-hover:opacity-40",
                type === "REMITO"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600"
                  : "bg-gradient-to-r from-emerald-500 to-green-600"
              )} />
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-2xl backdrop-blur-sm",
                type === "REMITO"
                  ? "bg-gradient-to-br from-orange-50/95 to-amber-50/90"
                  : "bg-gradient-to-br from-emerald-50/95 to-green-50/90"
              )}>
                <CardHeader className={cn(
                  "relative border-b p-4",
                  type === "REMITO" ? "border-orange-200/50" : "border-emerald-200/50"
                )}>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <div className={cn(
                      "rounded-lg p-1 shadow-lg",
                      type === "REMITO"
                        ? "bg-gradient-to-br from-orange-500 to-amber-600"
                        : "bg-gradient-to-br from-emerald-500 to-green-600"
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3 p-4 md:p-5">
                  {type !== "REMITO" ? (
                    <>
                      <div className="flex justify-between rounded-lg bg-white/60 px-3 py-2 text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-bold text-slate-900">{formatCurrency(calc.subtotal)}</span>
                      </div>

                      {calc.surcharge > 0 && (
                        <div className="flex justify-between rounded-lg bg-white/60 px-3 py-2 text-sm">
                          <span className="text-slate-600">Recargo ({calc.surchargeRate}%)</span>
                          <span className="font-bold text-orange-600">{formatCurrency(calc.surcharge)}</span>
                        </div>
                      )}

                      {calc.shippingTotal > 0 && (
                        <div className="flex justify-between rounded-lg bg-white/60 px-3 py-2 text-sm">
                          <span className="text-slate-600">Envío</span>
                          <span className="font-bold text-slate-900">{formatCurrency(calc.shippingTotal)}</span>
                        </div>
                      )}

                      {calc.hasFreeItems && (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-100/60 px-3 py-2 text-xs text-emerald-700">
                          <span>🎁</span>
                          <span className="font-semibold">
                            {items.filter(i => i.isFree).length} producto{items.filter(i => i.isFree).length > 1 ? "s" : ""} bonificado{items.filter(i => i.isFree).length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      <Separator className="bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

                      <div className={cn(
                        "flex items-center justify-between rounded-xl p-3 shadow-lg md:p-4",
                        calc.hasOnlyFreeItems
                          ? "bg-gradient-to-r from-emerald-400 to-green-500"
                          : "bg-gradient-to-r from-emerald-500 to-green-600"
                      )}>
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-white drop-shadow-lg md:text-3xl">
                          {calc.hasOnlyFreeItems ? "SIN CARGO 🎁" : formatCurrency(calc.total)}
                        </span>
                      </div>

                      {/* Resumen de pago */}
                      {type === "RECIBO" && calc.total > 0 && (
                        <>
                          {amountPaid > 0 && (
                            <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                              <span className="text-emerald-700">Pagado</span>
                              <span className="font-bold text-emerald-700">{formatCurrency(amountPaid)}</span>
                            </div>
                          )}
                          {calc.balance > 0 && (
                            <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2 text-sm">
                              <span className="font-bold text-orange-700">Saldo Pendiente</span>
                              <span className="text-lg font-bold text-orange-700">{formatCurrency(calc.balance)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Plan de cuotas */}
                      {type === "RECIBO" && calc.installmentsNumber > 1 && calc.installmentAmount > 0 && (
                        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-900">Plan de cuotas</span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-900">
                                {calc.installmentsNumber} x {formatCurrency(calc.installmentAmount)}
                              </p>
                              <p className="text-[10px] text-blue-700">Total: {formatCurrency(calc.total)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-6 text-center">
                      <Truck className="mx-auto mb-2 h-10 w-10 text-orange-600" />
                      <p className="mb-1 text-base font-bold text-orange-900">Remito de entrega</p>
                      <p className="text-xs text-orange-700">Se enviará sin precios al repartidor</p>
                    </div>
                  )}

                  {!isValid && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-amber-900">
                        Seleccioná cliente y agregá productos
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ─── Page export con Suspense boundary ───────────────────────────────────────

export default function NuevoDocumentoPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NuevoDocumentoContent />
    </Suspense>
  )
}