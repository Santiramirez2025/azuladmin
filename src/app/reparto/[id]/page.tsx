"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  PenLine,
  Phone,
  RotateCcw,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatDate, generateWhatsAppLink } from "@/lib/utils-client"
import { SignaturePad, type SignaturePadHandle } from "../_components/SignaturePad"

interface RemitoDetail {
  id: string
  number: number
  status: string
  date: string
  observations?: string | null
  internalNotes?: string | null
  shippingType: string
  signatureImage: string | null
  signedAt: string | null
  signerName: string | null
  signerDni: string | null
  client: {
    id: string
    name: string
    phone: string
    address?: string | null
    city: string
    province: string
  }
  items: Array<{ id: string; productName: string; productSize: string; quantity: number; source: string }>
}

export default function RemitoDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [rem, setRem] = useState<RemitoDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signOpen, setSignOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/delivery/remitos/${id}`)
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? "not_found" : "server_error")
          return
        }
        const data = (await res.json()) as RemitoDetail
        if (!cancelled) setRem(data)
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setError("network_error")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error || !rem) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-base font-semibold">Remito no encontrado</p>
        <p className="mt-1 text-sm text-neutral-500">Volvé a la lista y elegí otro.</p>
        <Link href="/reparto" className="mt-4 inline-block">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    )
  }

  const totalItems = rem.items.reduce((s, i) => s + i.quantity, 0)
  const isSigned = !!rem.signedAt
  const addressLine = rem.client.address
    ? `${rem.client.address}, ${rem.client.city}`
    : rem.client.city

  const openMaps = () => {
    if (!rem.client.address) return
    const q = encodeURIComponent(`${rem.client.address}, ${rem.client.city}, ${rem.client.province}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank")
  }

  const callClient = () => {
    window.location.href = `tel:${rem.client.phone.replace(/\D/g, "")}`
  }

  const whatsappClient = () => {
    const url = generateWhatsAppLink(
      rem.client.phone,
      `Hola ${rem.client.name}! Estoy llegando con tu pedido de Azul Colchones.`,
    )
    window.open(url, "_blank")
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/reparto">
          <Button variant="ghost" size="icon-sm" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-neutral-500">
            REMITO #{String(rem.number).padStart(5, "0")}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">{rem.client.name}</h1>
        </div>
        {isSigned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle className="h-3 w-3" />
            Firmado
          </span>
        ) : null}
      </div>

      {/* Cliente */}
      <section className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{addressLine}</p>
              {rem.client.address && (
                <button
                  onClick={openMaps}
                  className="mt-1 text-xs font-medium text-neutral-700 underline-offset-2 hover:underline"
                >
                  Abrir en Google Maps
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 pt-2.5">
            <Phone className="h-5 w-5 shrink-0 text-neutral-400" />
            <p className="flex-1 text-sm font-medium">{rem.client.phone}</p>
            <Button size="sm" variant="outline" onClick={callClient} className="gap-1.5">
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
            <Button size="sm" variant="outline" onClick={whatsappClient} className="gap-1.5">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-neutral-700" />
            <h2 className="text-sm font-semibold tracking-tight">Productos</h2>
          </div>
          <span className="text-xs text-neutral-500">
            {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
          </span>
        </header>
        <ul className="divide-y divide-neutral-100">
          {rem.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 min-w-9 items-center justify-center rounded-md bg-neutral-100 px-2 text-sm font-semibold tabular-nums">
                {item.quantity}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.productName}</p>
                <p className="text-xs text-neutral-500">{item.productSize}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Envío + obs */}
      <section className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Envío</p>
        <p className="mt-1 text-sm font-medium">{rem.shippingType}</p>
        {rem.observations && (
          <>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{rem.observations}</p>
          </>
        )}
      </section>

      {/* Firma */}
      {isSigned && rem.signatureImage ? (
        <section className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Firma del cliente</p>
          <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rem.signatureImage}
              alt="Firma del cliente"
              className="mx-auto block max-h-40"
            />
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Firmado el {formatDate(new Date(rem.signedAt!))}
            {rem.signerName && ` · ${rem.signerName}`}
            {rem.signerDni && ` · DNI ${rem.signerDni}`}
          </div>
        </section>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-2xl">
            <Button onClick={() => setSignOpen(true)} size="lg" className="w-full gap-2">
              <PenLine className="h-5 w-5" />
              Cliente firma
            </Button>
          </div>
        </div>
      )}

      {signOpen && (
        <SignatureModal
          remitoId={rem.id}
          clientName={rem.client.name}
          onClose={() => setSignOpen(false)}
          onSigned={() => router.refresh()}
        />
      )}
    </div>
  )
}

function SignatureModal({
  remitoId,
  clientName,
  onClose,
  onSigned,
}: {
  remitoId: string
  clientName: string
  onClose: () => void
  onSigned: () => void
}) {
  const padRef = useRef<SignaturePadHandle>(null)
  const [hasSig, setHasSig] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [dni, setDni] = useState("")

  const submit = async () => {
    const pad = padRef.current
    if (!pad || pad.isEmpty()) {
      toast.error("Falta la firma")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/delivery/remitos/${remitoId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureImage: pad.toDataURL(),
          signerName: name.trim() || undefined,
          signerDni: dni.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Error al guardar firma")
        return
      }
      toast.success("Remito firmado ✓")
      onSigned()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </Button>
        <p className="text-sm font-medium">Firma del cliente</p>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-auto p-4">
        <p className="mb-1 text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{clientName}</span>, firmá abajo:
        </p>
        <p className="mb-3 text-xs text-neutral-500">
          Al firmar confirmás que recibiste el pedido conforme.
        </p>
        <div className="h-64 sm:h-80">
          <SignaturePad ref={padRef} onChange={setHasSig} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => padRef.current?.clear()}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Borrar
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="signer-name">Nombre (opcional)</Label>
            <Input
              id="signer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aclaración"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signer-dni">DNI (opcional)</Label>
            <Input
              id="signer-dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="12345678"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <footer className="border-t border-neutral-200 bg-white p-4">
        <Button onClick={submit} disabled={!hasSig || submitting} size="lg" className="w-full gap-2">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
          {submitting ? "Guardando…" : "Confirmar firma"}
        </Button>
      </footer>
    </div>
  )
}
