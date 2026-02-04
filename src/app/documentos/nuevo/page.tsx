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

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: "PRESUPUESTO", label: "Presupuesto", description: "Cotización para el cliente" },
  { value: "RECIBO", label: "Recibo", description: "Comprobante de pago" },
  { value: "REMITO", label: "Remito", description: "Comprobante de entrega" },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string; surcharge: number }[] = [
  { value: "CONTADO", label: "Contado / Transferencia", surcharge: 0 },
  { value: "CUOTAS_3", label: "3 Cuotas", surcharge: 18 },
  { value: "CUOTAS_6", label: "6 Cuotas", surcharge: 25 },
  { value: "CUOTAS_9", label: "9 Cuotas", surcharge: 35 },
  { value: "CUOTAS_12", label: "12 Cuotas", surcharge: 47 },
]

const SHIPPING_OPTIONS = [
  "Sin cargo en Villa María",
  "Envío a coordinar",
  "Retira en local",
  "Envío interior (+costo)",
]

// Número de WhatsApp del repartidor
const DELIVERY_WHATSAPP = "5493535694658" // +54 9 3535 69-4658

// ============================================================================
// Loading Skeleton
// ============================================================================

function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
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
      <div className="flex items-center justify-between rounded-lg border bg-blue-50/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{value.name}</p>
            <p className="text-sm text-muted-foreground">{value.phone}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
        >
          Cambiar
        </Button>
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
          className="w-full justify-start text-muted-foreground"
        >
          <User className="mr-2 h-4 w-4" />
          Buscar cliente...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nombre o teléfono..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!isLoading && search.length >= 2 && clients.length === 0 && (
              <CommandEmpty>
                <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
                <Link href="/clientes/nuevo">
                  <Button size="sm" variant="link" className="mt-2">
                    + Crear nuevo cliente
                  </Button>
                </Link>
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
                  >
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.phone} · {client.city}
                      </p>
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
// Main Form Content (uses useSearchParams)
// ============================================================================

function NuevoDocumentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form state
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

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const surchargeRate = PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.surcharge || 0
  const surcharge = type === "RECIBO" ? subtotal * (surchargeRate / 100) : 0
  const total = subtotal + surcharge + shippingCost

  // Validation
  const isValid = client && items.length > 0

  // Submit
  const handleSubmit = async (action: "draft" | "send") => {
    if (!client || items.length === 0) {
      toast.error("Completá cliente y productos")
      return
    }

    setIsSubmitting(true)
    setSaveAction(action)

    try {
      // Preparar items para la API
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

      console.log("📤 Enviando documento a la API:", {
        clientId: client.id,
        type,
        itemsCount: apiItems.length,
        total,
      })

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
          shippingType,
          shippingCost,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error("❌ Error de la API:", error)
        throw new Error(error.error || "Error al crear documento")
      }

      const document = await res.json()
      console.log("✅ Documento creado:", document.id)

      // Si es "send", actualizar estado y abrir WhatsApp
      if (action === "send") {
        console.log("📤 Actualizando estado a SENT...")
        
        try {
          await fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "SENT" }),
          })
          console.log("✅ Estado actualizado a SENT")
        } catch (error) {
          console.error("⚠️ Error al actualizar estado:", error)
          // Continuar con el envío de WhatsApp aunque falle la actualización
        }

        // 🚚 LÓGICA PARA REMITO: Enviar al repartidor SIN precios
        if (type === "REMITO") {
          console.log("🚚 Preparando mensaje de REMITO para repartidor...")
          
          // Construir lista de productos sin precios
          const productList = items
            .map((item, index) => {
              return `${index + 1}. ${item.productName}${
                item.productSize ? ` - ${item.productSize}` : ""
              } x${item.quantity}`
            })
            .join("\n")

          const deliveryMessage = `🚚 *REMITO #${String(document.number).padStart(5, "0")}*\n\n` +
            `📦 *Cliente:* ${client.name}\n` +
            `📍 *Dirección:* ${client.address || "No especificada"}\n` +
            `🏙️ *Ciudad:* ${client.city}\n` +
            `📞 *Teléfono:* ${client.phone}\n\n` +
            `*Productos a entregar:*\n${productList}\n\n` +
            `${shippingType ? `📍 *Tipo de envío:* ${shippingType}\n` : ""}` +
            `${observations ? `\n📝 *Observaciones:* ${observations}` : ""}`

          const deliveryWhatsappUrl = `https://wa.me/${DELIVERY_WHATSAPP}?text=${encodeURIComponent(
            deliveryMessage
          )}`
          
          console.log("📱 Abriendo WhatsApp del repartidor:", DELIVERY_WHATSAPP)
          console.log("📝 Mensaje:", deliveryMessage)
          
          const whatsappWindow = window.open(deliveryWhatsappUrl, "_blank")
          
          if (whatsappWindow) {
            console.log("✅ Ventana de WhatsApp abierta")
            toast.success("Remito enviado al repartidor")
          } else {
            console.error("❌ Pop-up bloqueado. Intentando de nuevo...")
            toast.error("Por favor, permite pop-ups para enviar el remito")
            // Intentar abrir en la misma pestaña como fallback
            setTimeout(() => {
              window.location.href = deliveryWhatsappUrl
            }, 1000)
          }
        } 
        // 💰 LÓGICA PARA PRESUPUESTO/RECIBO: Enviar al cliente CON precios
        else {
          console.log("💰 Preparando mensaje para cliente...")
          
          const message = `¡Hola ${client.name}! 👋\n\nTe envío tu *${
            type === "PRESUPUESTO" ? "Presupuesto" : "Recibo"
          } #${String(document.number).padStart(5, "0")}*\n\n💰 Total: *${formatCurrency(
            total
          )}*\n\n¡Gracias por tu confianza!`

          const clientPhone = client.phone.replace(/\D/g, "")
          const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(
            message
          )}`
          
          console.log("📱 Abriendo WhatsApp del cliente:", clientPhone)
          console.log("📝 Mensaje:", message)
          
          const whatsappWindow = window.open(whatsappUrl, "_blank")
          
          if (whatsappWindow) {
            console.log("✅ Ventana de WhatsApp abierta")
            toast.success("Documento enviado al cliente")
          } else {
            console.error("❌ Pop-up bloqueado. Intentando de nuevo...")
            toast.error("Por favor, permite pop-ups para enviar el documento")
            // Intentar abrir en la misma pestaña como fallback
            setTimeout(() => {
              window.location.href = whatsappUrl
            }, 1000)
          }
        }
      } else {
        toast.success("Borrador guardado")
      }

      router.push(`/documentos/${document.id}`)
    } catch (error) {
      console.error("💥 Error al guardar documento:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/documentos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Nuevo Documento</h1>
              <p className="text-sm text-muted-foreground">
                Creá un presupuesto, recibo o remito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && saveAction === "draft" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Guardar Borrador
            </Button>
            <Button
              onClick={() => handleSubmit("send")}
              disabled={!isValid || isSubmitting}
              className={cn(
                type === "REMITO" 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isSubmitting && saveAction === "send" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              {type === "REMITO" ? "Enviar a Reparto" : "Guardar y Enviar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Document Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" />
                  Tipo de Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DOCUMENT_TYPES.map((docType) => (
                    <button
                      key={docType.value}
                      type="button"
                      onClick={() => setType(docType.value)}
                      className={cn(
                        "rounded-lg border-2 p-4 text-left transition-all",
                        type === docType.value
                          ? docType.value === "REMITO"
                            ? "border-orange-600 bg-orange-50"
                            : "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className="font-medium">{docType.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {docType.description}
                      </p>
                      {docType.value === "REMITO" && (
                        <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700">
                          Se envía a reparto
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientSearch value={client} onChange={setClient} />
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSelector items={items} onChange={setItems} />
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Observaciones (visible para el cliente)</Label>
                  <Textarea
                    placeholder="Condiciones de venta, detalles de entrega, etc."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notas internas (solo visible para vos)</Label>
                  <Textarea
                    placeholder="Notas privadas sobre esta venta..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={2}
                    className="bg-amber-50/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment (only for Recibo) */}
            {type === "RECIBO" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5" />
                    Forma de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 transition-all",
                        paymentMethod === method.value
                          ? "border-blue-600 bg-blue-50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <span className="font-medium">{method.label}</span>
                      {method.surcharge > 0 && (
                        <Badge variant="secondary">+{method.surcharge}%</Badge>
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Validity (only for Presupuesto) */}
            {type === "PRESUPUESTO" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5" />
                    Validez
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={String(validDays)}
                    onValueChange={(v) => setValidDays(parseInt(v))}
                  >
                    <SelectTrigger>
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
            )}

            {/* Shipping */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-5 w-5" />
                  Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={shippingType} onValueChange={setShippingType}>
                  <SelectTrigger>
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
                    <Label>Costo de envío</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={shippingCost || ""}
                        onChange={(e) =>
                          setShippingCost(parseFloat(e.target.value) || 0)
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className={cn(
              "border-2",
              type === "REMITO" 
                ? "border-orange-200 bg-orange-50/30" 
                : "border-blue-200 bg-blue-50/30"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {type !== "REMITO" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    {surcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Recargo ({surchargeRate}%)
                        </span>
                        <span>{formatCurrency(surcharge)}</span>
                      </div>
                    )}

                    {shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envío</span>
                        <span>{formatCurrency(shippingCost)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </>
                )}

                {type === "REMITO" && (
                  <div className="rounded-lg bg-orange-100 p-4 text-center">
                    <Truck className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                    <p className="font-semibold text-orange-900">
                      Remito de entrega
                    </p>
                    <p className="text-sm text-orange-700">
                      Se enviará sin precios al repartidor
                    </p>
                  </div>
                )}

                {!isValid && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>Seleccioná cliente y agregá productos</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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