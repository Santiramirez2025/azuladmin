"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  User,
  FileText,
  Calendar,
  Truck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn, formatCurrency } from "@/lib/utils"
import { ProductSelector, type DocumentItem } from "@/components/product-selector"
import { usePaymentRates } from "@/hooks/use-payment-rates"

// ============================================================================
// Types
// ============================================================================

interface Client {
  id: string
  name: string
  phone: string
  address?: string
  city: string
}

type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"
type PaymentMethod = "CONTADO" | "CUOTAS_3" | "CUOTAS_6" | "CUOTAS_9" | "CUOTAS_12"

// ============================================================================
// Constants
// ============================================================================

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string; icon: any }[] = [
  { value: "PRESUPUESTO", label: "Presupuesto", description: "Cotización para el cliente", icon: FileText },
  { value: "RECIBO", label: "Recibo", description: "Comprobante de pago", icon: CreditCard },
  { value: "REMITO", label: "Remito", description: "Comprobante de entrega", icon: Truck },
]

const SHIPPING_OPTIONS = [
  "Sin cargo en Villa María",
  "Envío a coordinar",
  "Retira en local",
  "Envío interior (+costo)",
]

const DELIVERY_WHATSAPP = "5493535694658"

// ============================================================================
// Loading Skeleton
// ============================================================================

function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <Skeleton className="h-10 w-10 rounded-xl md:h-12 md:w-12" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-6 w-40 md:h-8 md:w-56" />
            <Skeleton className="h-3 w-52 md:h-4 md:w-72" />
          </div>
        </div>
        <div className="space-y-4 md:grid md:gap-6 md:space-y-0 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl md:h-48" />
            ))}
          </div>
          <div className="space-y-4 md:space-y-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl md:h-56" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Client Search
// ============================================================================

interface ClientSearchProps {
  value: Client | null
  onChange: (client: Client | null) => void
}

function ClientSearch({ value, onChange }: ClientSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setClients([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setClients(data.items || [])
        }
      } catch (error) {
        console.error("Error searching clients:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-3.5 shadow-sm transition-all hover:shadow-md md:p-4">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-2xl md:h-24 md:w-24"></div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 md:h-12 md:w-12">
              <User className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 md:text-base">{value.name}</p>
              <p className="truncate text-xs text-slate-600 md:text-sm">{value.phone}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:bg-blue-100 hover:text-blue-700 md:text-sm"
          >
            Cambiar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-start border-slate-200 bg-white/50 text-sm font-medium text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50/50 md:text-base"
        >
          <User className="mr-2 h-4 w-4" />
          Buscar cliente...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] border-slate-200/50 bg-white/95 p-0 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:w-[400px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nombre o teléfono..."
            value={search}
            onValueChange={setSearch}
            className="border-0"
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              </div>
            )}
            {!isLoading && search.length >= 2 && clients.length === 0 && (
              <CommandEmpty>
                <div className="py-8 text-center">
                  <User className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="mb-1 text-sm font-semibold text-slate-700 md:text-base">No se encontraron clientes</p>
                  <p className="mb-4 text-xs text-slate-500 md:text-sm">Crea un nuevo cliente para continuar</p>
                  <Link href="/clientes/nuevo">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25">
                      + Crear nuevo cliente
                    </Button>
                  </Link>
                </div>
              </CommandEmpty>
            )}
            {!isLoading && clients.length > 0 && (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => {
                      onChange(client)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="cursor-pointer rounded-lg px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{client.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {client.phone} · {client.city}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Main Form Content
// ============================================================================

function NuevoDocumentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { rates: paymentRates, isLoading: loadingRates } = usePaymentRates()

  const [type, setType] = useState<DocumentType>(
    (searchParams.get("tipo")?.toUpperCase() as DocumentType) || "PRESUPUESTO"
  )
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<DocumentItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CONTADO")
  const [shippingType, setShippingType] = useState(SHIPPING_OPTIONS[0])
  const [shippingCost, setShippingCost] = useState(0)
  const [observations, setObservations] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [validDays, setValidDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveAction, setSaveAction] = useState<"draft" | "send">("draft")

  const PAYMENT_METHODS = [
    { value: "CONTADO" as const, label: "Contado / Transferencia", surcharge: paymentRates["1"] || 0 },
    { value: "CUOTAS_3" as const, label: "3 Cuotas", surcharge: paymentRates["3"] || 18 },
    { value: "CUOTAS_6" as const, label: "6 Cuotas", surcharge: paymentRates["6"] || 25 },
    { value: "CUOTAS_9" as const, label: "9 Cuotas", surcharge: paymentRates["9"] || 35 },
    { value: "CUOTAS_12" as const, label: "12 Cuotas", surcharge: paymentRates["12"] || 47 },
  ]

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const surchargeRate = PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.surcharge || 0
  const surcharge = type === "RECIBO" ? subtotal * (surchargeRate / 100) : 0
  const total = subtotal + surcharge + shippingCost
  const isValid = client && items.length > 0

  const installmentsNumber = paymentMethod === "CONTADO" ? 1 : parseInt(paymentMethod.split("_")[1]) || 1
  const installmentAmount = installmentsNumber > 1 ? total / installmentsNumber : 0

  const handleSubmit = async (action: "draft" | "send") => {
    if (!client || items.length === 0) {
      toast.error("Completá cliente y productos")
      return
    }

    setIsSubmitting(true)
    setSaveAction(action)

    try {
      const apiItems = items.map((item) => ({
        variantId: item.variantId || undefined,
        isCustom: item.isCustom,
        productName: item.productName,
        productSize: item.productSize,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }))

      const validUntil =
        type === "PRESUPUESTO"
          ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          type,
          items: apiItems,
          observations,
          internalNotes,
          validUntil,
          surchargeRate: type === "RECIBO" ? surchargeRate : 0,
          paymentMethod: type === "RECIBO" ? paymentMethod : undefined,
          installments: type === "RECIBO" ? installmentsNumber : undefined,
          shippingType,
          shippingCost,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear documento")
      }

      const document = await res.json()

      if (action === "send") {
        try {
          await fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "SENT" }),
          })
        } catch (error) {
          console.error("Error al actualizar estado:", error)
        }

        if (type === "REMITO") {
          // Mensaje para repartidor
          const productList = items
            .map((item, index) => 
              `${index + 1}. ${item.productName} ${item.productSize ? `- ${item.productSize}` : ""} x${item.quantity}`
            )
            .join("\n")

          const deliveryMessage = 
            `🚚 *REMITO #${String(document.number).padStart(5, "0")}*\n\n` +
            `*Cliente:* ${client.name}\n` +
            `*Teléfono:* ${client.phone}\n` +
            `*Dirección:* ${client.address || "A coordinar"}\n` +
            `*Ciudad:* ${client.city}\n\n` +
            `*PRODUCTOS A ENTREGAR:*\n${productList}\n\n` +
            `${shippingType ? `*Envío:* ${shippingType}\n` : ""}` +
            `${observations ? `\n*Obs:* ${observations}` : ""}`

          const deliveryWhatsappUrl = `https://wa.me/${DELIVERY_WHATSAPP}?text=${encodeURIComponent(deliveryMessage)}`
          window.open(deliveryWhatsappUrl, "_blank")
          toast.success("Remito enviado al repartidor")
        } else {
          // ✅ MENSAJE PROFESIONAL ÚNICO para cliente
          const productList = items
            .map((item) => {
              const stockBadge = item.source === "STOCK" ? " ✓" : ""
              return `• ${item.productName} ${item.productSize}${stockBadge}\n  ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`
            })
            .join("\n\n")

          const docType = type === "PRESUPUESTO" ? "PRESUPUESTO" : "RECIBO"
          
          let message = `Hola *${client.name}*\n\n`
          message += `Te envío tu *${docType} #${String(document.number).padStart(5, "0")}*\n`
          message += `━━━━━━━━━━━━━━━━━━━━━\n\n`
          message += `${productList}\n\n`
          message += `━━━━━━━━━━━━━━━━━━━━━\n`
          
          // Detalle de precios
          if (surcharge > 0) {
            message += `Subtotal: ${formatCurrency(subtotal)}\n`
            message += `Recargo ${installmentsNumber} cuotas: ${formatCurrency(surcharge)}\n`
            message += `━━━━━━━━━━━━━━━━━━━━━\n`
          }
          
          message += `*TOTAL: ${formatCurrency(total)}*\n`

          // Plan de cuotas (solo si aplica)
          if (type === "RECIBO" && installmentsNumber > 1) {
            message += `\n💳 *${installmentsNumber} cuotas de ${formatCurrency(installmentAmount)}*\n`
          }

          message += `\n`

          // Información de entrega
          const hasCatalogo = items.some(i => i.source === "CATALOGO")
          const hasStock = items.some(i => i.source === "STOCK")
          
          if (hasStock && hasCatalogo) {
            message += `📦 Entrega: Productos en stock inmediatos\n`
            message += `   Catálogo en 7-10 días hábiles\n`
          } else if (hasCatalogo) {
            message += `📦 Entrega estimada: 7-10 días hábiles\n`
          } else {
            message += `📦 Disponible para entrega inmediata\n`
          }

          message += `🚚 ${shippingType}\n`
          
          if (type === "PRESUPUESTO" && validDays) {
            message += `⏱️ Válido por ${validDays} días\n`
          }

          message += `\n`
          message += `Cualquier consulta, estoy a disposición.\n\n`
          message += `*AZUL COLCHONES*\n`
          message += `Balerdi 855, Villa María\n`
          message += `Garantía oficial PIERO`

          const clientPhone = client.phone.replace(/\D/g, "")
          const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`
          
          window.open(whatsappUrl, "_blank")
          toast.success(type === "PRESUPUESTO" ? "Presupuesto enviado" : "Recibo enviado")
        }
      } else {
        toast.success("Borrador guardado")
      }

      router.push(`/documentos/${document.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-xl font-bold text-transparent md:text-3xl">
                  Nuevo Documento
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">
                Creá un presupuesto, recibo o remito
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:relative md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={!isValid || isSubmitting}
              className="flex-1 border-slate-200 bg-white font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 md:flex-none md:px-6"
            >
              {isSubmitting && saveAction === "draft" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
              <span className="hidden md:inline">Guardar Borrador</span>
              <span className="md:hidden">Guardar</span>
            </Button>
            <Button
              onClick={() => handleSubmit("send")}
              disabled={!isValid || isSubmitting}
              className={cn(
                "relative flex-1 overflow-hidden font-bold shadow-2xl transition-all disabled:opacity-50 md:flex-none md:px-6",
                type === "REMITO" 
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/30" 
                  : "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30"
              )}
            >
              {isSubmitting && saveAction === "send" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {!isSubmitting && <Send className="mr-2 h-4 w-4" />}
              <span className="hidden md:inline">
                {type === "REMITO" ? "Enviar a Reparto" : "Guardar y Enviar"}
              </span>
              <span className="md:hidden">Enviar</span>
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-4 pb-24 md:grid md:gap-6 md:space-y-0 md:pb-0 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            {/* Document Type */}
            <div className="group relative" style={{ animation: 'slideIn 0.3s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:p-6 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-lg shadow-blue-500/20 md:p-2">
                      <FileText className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Tipo de Documento
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6">
                  <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
                    {DOCUMENT_TYPES.map((docType) => {
                      const Icon = docType.icon
                      const isSelected = type === docType.value
                      const isRemito = docType.value === "REMITO"
                      
                      return (
                        <button
                          key={docType.value}
                          type="button"
                          onClick={() => setType(docType.value)}
                          className={cn(
                            "group relative overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all duration-300 md:p-5",
                            isSelected
                              ? isRemito
                                ? "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-lg shadow-orange-500/20"
                                : "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-lg shadow-blue-500/20"
                              : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="relative">
                            <div className={cn(
                              "mb-2.5 inline-flex rounded-lg p-2 shadow-md transition-transform group-hover:scale-110 md:mb-3 md:p-2.5",
                              isSelected
                                ? isRemito
                                  ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30"
                                  : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30"
                                : "bg-slate-100"
                            )}>
                              <Icon className={cn("h-4 w-4 md:h-5 md:w-5", isSelected ? "text-white" : "text-slate-600")} />
                            </div>
                            <p className="mb-0.5 text-sm font-bold text-slate-900 md:mb-1 md:text-base">{docType.label}</p>
                            <p className="text-[10px] text-slate-600 md:text-xs">{docType.description}</p>
                            {isRemito && (
                              <Badge variant="secondary" className="mt-2 bg-orange-100 text-[10px] font-semibold text-orange-700 shadow-sm md:mt-3 md:text-xs">
                                Se envía a reparto
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client */}
            <div className="group relative" style={{ animation: 'slideIn 0.4s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 p-4 md:p-6 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-lg shadow-violet-500/20 md:p-2">
                      <User className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6">
                  <ClientSearch value={client} onChange={setClient} />
                </CardContent>
              </Card>
            </div>

            {/* Products */}
            <div className="group relative" style={{ animation: 'slideIn 0.5s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-emerald-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50 p-4 md:p-6 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 shadow-lg shadow-emerald-500/20 md:p-2">
                      <Package className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6">
                  <ProductSelector items={items} onChange={setItems} />
                </CardContent>
              </Card>
            </div>

            {/* Observations */}
            <div className="group relative" style={{ animation: 'slideIn 0.6s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-amber-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-amber-50/50 p-4 md:p-6 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 md:gap-2.5 md:text-lg">
                    <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 shadow-lg shadow-amber-500/20 md:p-2">
                      <MessageSquare className="h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4 p-4 md:space-y-5 md:p-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 md:text-sm">Observaciones (visible para el cliente)</Label>
                    <Textarea
                      placeholder="Condiciones de venta, detalles de entrega, etc."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={3}
                      className="resize-none border-slate-200 bg-white/50 text-sm transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 md:text-sm">Notas internas (solo visible para vos)</Label>
                    <Textarea
                      placeholder="Notas privadas sobre esta venta..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={2}
                      className="resize-none border-amber-200 bg-amber-50/50 text-sm transition-all focus:border-amber-400 focus:bg-amber-50 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Payment */}
            {type === "RECIBO" && (
              <div className="group relative" style={{ animation: 'slideIn 0.7s ease-out' }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl md:h-40 md:w-40"></div>
                  <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-lg shadow-blue-500/20 md:p-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Forma de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-2 p-3 md:space-y-2.5 md:p-4">
                    {loadingRates ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="relative h-6 w-6">
                          <div className="absolute inset-0 animate-spin rounded-full border-3 border-blue-200"></div>
                          <div className="absolute inset-0 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
                        </div>
                      </div>
                    ) : (
                      PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border-2 p-2.5 text-sm transition-all duration-300 md:p-3",
                            paymentMethod === method.value
                              ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-md shadow-blue-500/10"
                              : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <span className="font-semibold text-slate-900">{method.label}</span>
                          {method.surcharge > 0 && (
                            <Badge variant="secondary" className="text-xs font-bold shadow-sm">
                              +{method.surcharge}%
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Validity */}
            {type === "PRESUPUESTO" && (
              <div className="group relative" style={{ animation: 'slideIn 0.7s ease-out' }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/5 backdrop-blur-sm">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-3xl md:h-40 md:w-40"></div>
                  <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 p-4 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                      <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1 shadow-lg shadow-violet-500/20 md:p-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                      </div>
                      Validez
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-3 md:p-4">
                    <Select
                      value={String(validDays)}
                      onValueChange={(v) => setValidDays(parseInt(v))}
                    >
                      <SelectTrigger className="border-slate-200 bg-white/50 text-sm font-semibold transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 días</SelectItem>
                        <SelectItem value="7">7 días</SelectItem>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Shipping */}
            <div className="group relative" style={{ animation: 'slideIn 0.8s ease-out' }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
              <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-orange-500/5 backdrop-blur-sm">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-600/10 blur-3xl md:h-40 md:w-40"></div>
                <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-orange-50/50 p-4 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                    <div className="rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 p-1 shadow-lg shadow-orange-500/20 md:p-1.5">
                      <Truck className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                    </div>
                    Envío
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3 p-3 md:space-y-4 md:p-4">
                  <Select value={shippingType} onValueChange={setShippingType}>
                    <SelectTrigger className="border-slate-200 bg-white/50 text-sm font-semibold transition-all focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {shippingType.includes("costo") && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 md:text-sm">Costo de envío</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          value={shippingCost || ""}
                          onChange={(e) =>
                            setShippingCost(parseFloat(e.target.value) || 0)
                          }
                          className="border-slate-200 bg-white/50 pl-7 text-sm font-semibold transition-all focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="group relative" style={{ animation: 'slideIn 0.9s ease-out' }}>
              <div className={cn(
                "absolute -inset-0.5 rounded-2xl opacity-30 blur transition duration-500 group-hover:opacity-40",
                type === "REMITO" 
                  ? "bg-gradient-to-r from-orange-500 to-amber-600" 
                  : "bg-gradient-to-r from-emerald-500 to-green-600"
              )}></div>
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-2xl backdrop-blur-sm",
                type === "REMITO" 
                  ? "bg-gradient-to-br from-orange-50/95 to-amber-50/90 shadow-orange-500/20" 
                  : "bg-gradient-to-br from-emerald-50/95 to-green-50/90 shadow-emerald-500/20"
              )}>
                <div className={cn(
                  "absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl md:h-40 md:w-40",
                  type === "REMITO"
                    ? "bg-gradient-to-br from-orange-500/20 to-amber-600/20"
                    : "bg-gradient-to-br from-emerald-500/20 to-green-600/20"
                )}></div>
                <CardHeader className={cn(
                  "relative border-b p-4 md:pb-4",
                  type === "REMITO"
                    ? "border-orange-200/50 bg-gradient-to-r from-orange-100/50 to-amber-100/50"
                    : "border-emerald-200/50 bg-gradient-to-r from-emerald-100/50 to-green-100/50"
                )}>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 md:gap-2.5 md:text-base">
                    <div className={cn(
                      "rounded-lg p-1 shadow-lg md:p-1.5",
                      type === "REMITO"
                        ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30"
                        : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30"
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                    </div>
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3 p-4 md:space-y-4 md:p-6">
                  {type !== "REMITO" && (
                    <>
                      <div className="flex justify-between rounded-lg bg-white/60 px-2.5 py-2 text-xs backdrop-blur-sm md:px-3 md:text-sm">
                        <span className="font-medium text-slate-600">Subtotal</span>
                        <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                      </div>

                      {surcharge > 0 && (
                        <div className="flex justify-between rounded-lg bg-white/60 px-2.5 py-2 text-xs backdrop-blur-sm md:px-3 md:text-sm">
                          <span className="font-medium text-slate-600">
                            Recargo ({surchargeRate}%)
                          </span>
                          <span className="font-bold text-orange-600">{formatCurrency(surcharge)}</span>
                        </div>
                      )}

                      {shippingCost > 0 && (
                        <div className="flex justify-between rounded-lg bg-white/60 px-2.5 py-2 text-xs backdrop-blur-sm md:px-3 md:text-sm">
                          <span className="font-medium text-slate-600">Envío</span>
                          <span className="font-bold text-slate-900">{formatCurrency(shippingCost)}</span>
                        </div>
                      )}

                      <Separator className="bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 p-3 shadow-lg shadow-emerald-500/30 md:p-4">
                        <span className="text-xs font-bold text-white md:text-sm">Total</span>
                        <span className="text-2xl font-bold text-white drop-shadow-lg md:text-3xl">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      {type === "RECIBO" && paymentMethod !== "CONTADO" && installmentAmount > 0 && !loadingRates && (
                        <div className="rounded-xl border-2 border-blue-300/50 bg-gradient-to-br from-blue-100/80 to-indigo-100/60 p-3 shadow-inner md:p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-600 md:h-5 md:w-5" />
                              <span className="text-xs font-semibold text-blue-900 md:text-sm">
                                Plan de cuotas
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-900 md:text-xl">
                                {installmentsNumber} x {formatCurrency(installmentAmount)}
                              </p>
                              <p className="text-[10px] font-medium text-blue-700 md:text-xs">
                                Total: {formatCurrency(total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {type === "REMITO" && (
                    <div className="rounded-xl border-2 border-orange-300/50 bg-gradient-to-br from-orange-100/80 to-amber-100/60 p-4 text-center shadow-inner md:p-6">
                      <Truck className="mx-auto mb-2 h-8 w-8 text-orange-600 drop-shadow-sm md:mb-3 md:h-10 md:w-10" />
                      <p className="mb-1 text-base font-bold text-orange-900 md:text-lg">
                        Remito de entrega
                      </p>
                      <p className="text-xs font-medium text-orange-700 md:text-sm">
                        Se enviará sin precios al repartidor
                      </p>
                    </div>
                  )}

                  {!isValid && (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 p-3 shadow-inner md:gap-2.5 md:p-4">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500 shadow-md md:h-8 md:w-8">
                        <AlertCircle className="h-4 w-4 text-white md:h-5 md:w-5" />
                      </div>
                      <span className="text-xs font-semibold text-amber-900 md:text-sm">
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
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Page Export with Suspense Boundary
// ============================================================================

export default function NuevoDocumentoPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NuevoDocumentoContent />
    </Suspense>
  )
}