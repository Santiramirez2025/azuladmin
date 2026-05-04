// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { updateDocumentSchema } from "@/lib/validations"
import { calculateBalance, decimalToNumber } from "@/lib/utils"
import {
  errorResponse,
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

type DocStatus = "DRAFT" | "SENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | "EXPIRED"

const ALLOWED_TRANSITIONS: Record<DocStatus, DocStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["APPROVED", "CANCELLED", "EXPIRED"],
  APPROVED: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["CANCELLED"],
  CANCELLED: [],
  EXPIRED: ["CANCELLED"],
}

function isValidTransition(from: DocStatus, to: DocStatus): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

type SerializableDocument = {
  subtotal: Prisma.Decimal
  surcharge: Prisma.Decimal
  total: Prisma.Decimal
  shippingCost: Prisma.Decimal
  amountPaid: Prisma.Decimal | null
  balance: Prisma.Decimal | null
  items?: Array<{ unitPrice: Prisma.Decimal; subtotal: Prisma.Decimal } & Record<string, unknown>>
}

function serializeDocument<T extends SerializableDocument>(doc: T) {
  return {
    ...doc,
    subtotal: decimalToNumber(doc.subtotal),
    surcharge: decimalToNumber(doc.surcharge),
    total: decimalToNumber(doc.total),
    shippingCost: decimalToNumber(doc.shippingCost),
    amountPaid: doc.amountPaid ? decimalToNumber(doc.amountPaid) : null,
    balance: doc.balance ? decimalToNumber(doc.balance) : null,
    items:
      doc.items?.map((item) => ({
        ...item,
        unitPrice: decimalToNumber(item.unitPrice),
        subtotal: decimalToNumber(item.subtotal),
      })) ?? [],
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID de documento inválido")

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            province: true,
            dni: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, brand: true, warranty: true } },
              },
            },
          },
        },
        convertedFrom: { select: { id: true, number: true, type: true } },
        convertedTo: { select: { id: true, number: true, type: true, status: true } },
      },
    })

    if (!document) return errorResponse(404, "Documento no encontrado")
    return NextResponse.json(serializeDocument(document))
  } catch (error) {
    return handleUnknownError("documents.[id].GET", error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, updateDocumentSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID de documento inválido")

    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.document.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  stockQty: true,
                  source: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      })

      if (!existing) throw new Error("Documento no encontrado")
      if (existing.status === "CANCELLED" && data.status !== "CANCELLED") {
        throw new Error("No se puede modificar un documento cancelado")
      }

      const updateData: Prisma.DocumentUpdateInput = {}

      if (data.status) {
        const oldStatus = existing.status as DocStatus
        const newStatus = data.status as DocStatus

        if (!isValidTransition(oldStatus, newStatus)) {
          throw new Error(
            `Transición no permitida: ${oldStatus} → ${newStatus}. ` +
              `Estados válidos desde ${oldStatus}: ${ALLOWED_TRANSITIONS[oldStatus].join(", ") || "ninguno"}`,
          )
        }

        if (
          newStatus === "COMPLETED" &&
          oldStatus !== "COMPLETED" &&
          (existing.type === "RECIBO" || existing.type === "REMITO")
        ) {
          for (const item of existing.items) {
            if (item.source !== "STOCK" || !item.variant) continue
            if (item.variant.stockQty < item.quantity) {
              throw new Error(
                `Stock insuficiente para "${item.productName} ${item.productSize}". ` +
                  `Disponible: ${item.variant.stockQty}, Requerido: ${item.quantity}`,
              )
            }
          }
        }
        updateData.status = newStatus
      }

      if (data.amountPaid !== undefined) {
        const amountPaid = new Decimal(data.amountPaid)
        const total = existing.total
        if (amountPaid.lessThan(0)) throw new Error("El monto pagado no puede ser negativo")
        if (amountPaid.greaterThan(total.plus(0.01))) {
          throw new Error(
            `El monto pagado ($${amountPaid}) no puede ser mayor al total ($${total})`,
          )
        }
        const balance = calculateBalance(decimalToNumber(total), data.amountPaid)
        updateData.amountPaid = amountPaid
        updateData.balance = new Decimal(balance)
        if (balance === 0 && existing.type === "RECIBO" && existing.status !== "COMPLETED") {
          updateData.status = "COMPLETED"
        }
      }

      if (data.paymentType !== undefined) {
        if (existing.type !== "RECIBO") {
          throw new Error("Solo los recibos pueden tener información de pago")
        }
        updateData.paymentType = data.paymentType
      }
      if (data.installments !== undefined) updateData.installments = data.installments
      if (data.observations !== undefined) updateData.observations = data.observations || null
      if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes || null
      if (data.shippingType !== undefined) {
        if (!data.shippingType.trim()) throw new Error("El tipo de envío no puede estar vacío")
        updateData.shippingType = data.shippingType
      }
      if (data.shippingCost !== undefined) {
        const shippingCost = new Decimal(data.shippingCost)
        if (shippingCost.lessThan(0)) throw new Error("El costo de envío no puede ser negativo")
        updateData.shippingCost = shippingCost
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar")
      }
      updateData.updatedAt = new Date()

      const updated = await tx.document.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
              city: true,
              province: true,
            },
          },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              variant: {
                include: { product: { select: { id: true, name: true, brand: true } } },
              },
            },
          },
        },
      })

      const isStockRelevantType = existing.type === "RECIBO" || existing.type === "REMITO"
      if (isStockRelevantType && data.status) {
        const oldStatus = existing.status
        const newStatus = data.status
        const stockItems = updated.items.filter((i) => i.source === "STOCK" && i.variantId)

        const decrement = newStatus === "COMPLETED" && oldStatus !== "COMPLETED"
        const increment =
          (newStatus === "CANCELLED" && oldStatus === "COMPLETED") ||
          (oldStatus === "COMPLETED" && newStatus !== "COMPLETED" && newStatus !== "CANCELLED")

        for (const item of stockItems) {
          if (!item.variantId) continue
          if (decrement) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            })
          } else if (increment) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { increment: item.quantity } },
            })
          }
        }
      }

      return updated
    })

    return NextResponse.json(serializeDocument(document))
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse(404, "Documento no encontrado")
      if (error.code === "P2003") return errorResponse(400, "Error de integridad de datos")
    }
    if (error instanceof Error) return errorResponse(400, error.message)
    return handleUnknownError("documents.[id].PATCH", error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID de documento inválido")

    const existing = await prisma.document.findUnique({
      where: { id },
      select: { id: true, number: true, type: true, status: true },
    })
    if (!existing) return errorResponse(404, "Documento no encontrado")

    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "No se puede eliminar un documento completado",
          suggestion: "Cancelá el documento usando PATCH con status: 'CANCELLED'",
        },
        { status: 400 },
      )
    }

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({
      success: true,
      message: `Documento ${existing.type} #${existing.number} eliminado exitosamente`,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return errorResponse(400, "No se puede eliminar el documento debido a referencias existentes")
      }
      if (error.code === "P2025") return errorResponse(404, "Documento no encontrado")
    }
    return handleUnknownError("documents.[id].DELETE", error)
  }
}
