// ============================================================================
// useDocumentSubmit
// Extrae toda la lógica de submit del componente:
//  • Llamada a API /documents
//  • Actualización de status a SENT
//  • Apertura de WhatsApp (remito o cliente)
//  • Manejo de errores y toasts
//  • Redirección post-submit
// ─────────────────────────────────────────────────────────────────────────────
// El componente solo llama submit("draft") | submit("send") — sin lógica adentro
// ============================================================================

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils-client"
import type {
  Client,
  DocumentItem,
  DocumentType,
  PaymentMethod,
  DocumentCalculations,
} from "../_lib/types"
import {
  buildRemitoMessage,
  buildClientMessage,
} from "../_lib/whatsapp-messages"
import { DELIVERY_WHATSAPP } from "../_lib/constants"

interface UseDocumentSubmitProps {
  type: DocumentType
  client: Client | null
  items: DocumentItem[]
  calc: DocumentCalculations
  paymentMethod: PaymentMethod
  shippingType: string
  shippingCost: number
  observations: string
  internalNotes: string
  validDays: number
  amountPaid: number
  paymentType: string
}

export function useDocumentSubmit(props: UseDocumentSubmitProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveAction, setSaveAction] = useState<"draft" | "send">("draft")

  const submit = useCallback(
    async (action: "draft" | "send") => {
      const {
        type, client, items, calc, paymentMethod,
        shippingType, shippingCost, observations, internalNotes,
        validDays, amountPaid, paymentType,
      } = props

      if (!client || items.length === 0) {
        toast.error("Completá cliente y productos")
        return
      }

      setIsSubmitting(true)
      setSaveAction(action)

      try {
        // ── 1. Crear documento ───────────────────────────────────────────────
        const validUntil =
          type === "PRESUPUESTO"
            ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId:      client.id,
            type,
            items: items.map((item) => ({
              variantId:   item.variantId ?? undefined,
              isCustom:    item.isCustom,
              isFree:      item.isFree,               // ← incluir flag
              productName: item.productName,
              productSize: item.productSize,
              unitPrice:   item.isFree ? 0 : item.unitPrice, // guardar 0 en DB si es free
              quantity:    item.quantity,
            })),
            observations,
            internalNotes,
            validUntil,
            surchargeRate: type === "RECIBO" ? calc.surchargeRate : 0,
            paymentMethod: type === "RECIBO" ? paymentMethod : undefined,
            installments:  type === "RECIBO" ? calc.installmentsNumber : undefined,
            shippingType,
            shippingCost,
            amountPaid:  type === "RECIBO" && amountPaid > 0 ? amountPaid : undefined,
            paymentType: type === "RECIBO" && amountPaid > 0 ? paymentType : undefined,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? "Error al crear documento")
        }

        const document = await res.json()

        // ── 2. Si es "send": actualizar status + abrir WhatsApp ──────────────
        if (action === "send") {
          // Fire & forget: no bloquear el flujo si falla el status update
          fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "SENT" }),
          }).catch(console.error)

          if (type === "REMITO") {
            const msg = buildRemitoMessage({
              docNumber:    document.number,
              client,
              items,
              shippingType,
              observations,
            })
            window.open(
              `https://wa.me/${DELIVERY_WHATSAPP}?text=${encodeURIComponent(msg)}`,
              "_blank"
            )
            toast.success("Remito enviado al repartidor")
          } else {
            const msg = buildClientMessage({
              docNumber: document.number,
              type,
              client,
              items,
              calc,
              shippingType,
              validDays:   type === "PRESUPUESTO" ? validDays : undefined,
              amountPaid:  type === "RECIBO" ? amountPaid : undefined,
              paymentType: type === "RECIBO" ? paymentType : undefined,
              fmt:         formatCurrency,
            })
            const phone = client.phone.replace(/\D/g, "")
            window.open(
              `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
              "_blank"
            )
            toast.success(
              type === "PRESUPUESTO" ? "Presupuesto enviado" : "Recibo enviado"
            )
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.type, props.client, props.items, props.calc,
      props.paymentMethod, props.shippingType, props.shippingCost,
      props.observations, props.internalNotes, props.validDays,
      props.amountPaid, props.paymentType,
    ]
  )

  return { submit, isSubmitting, saveAction }
}