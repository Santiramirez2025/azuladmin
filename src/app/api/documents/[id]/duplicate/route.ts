import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  errorResponse,
  handleUnknownError,
  isAuthError,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID de documento inválido")

    const original = await prisma.document.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!original) return errorResponse(404, "Documento no encontrado")

    const newDocument = await prisma.document.create({
      data: {
        type: original.type,
        status: "DRAFT",
        clientId: original.clientId,
        userId: original.userId,
        subtotal: original.subtotal,
        surcharge: original.surcharge,
        surchargeRate: original.surchargeRate,
        total: original.total,
        date: new Date(),
        validUntil:
          original.type === "PRESUPUESTO"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : null,
        paymentType: original.paymentType,
        installments: original.installments,
        shippingType: original.shippingType,
        shippingCost: original.shippingCost,
        observations: original.observations
          ? `(Copia) ${original.observations}`
          : "(Copia de documento anterior)",
        internalNotes: original.internalNotes,
        convertedFromId: original.id,
        items: {
          create: original.items.map((item) => ({
            variantId: item.variantId,
            productName: item.productName,
            productSize: item.productSize,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            source: item.source,
            isCustom: item.isCustom,
          })),
        },
      },
      include: {
        client: true,
        createdBy: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    })

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse(404, "Documento no encontrado")
    }
    return handleUnknownError("documents.[id].duplicate.POST", error)
  }
}
