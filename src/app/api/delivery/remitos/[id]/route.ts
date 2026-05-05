import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { errorResponse, handleUnknownError, requireDelivery } from "@/lib/api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const denied = requireDelivery(request)
  if (denied) return denied

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID inválido")

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
        date: true,
        observations: true,
        internalNotes: true,
        shippingType: true,
        signatureImage: true,
        signedAt: true,
        signerName: true,
        signerDni: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
            province: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            productSize: true,
            quantity: true,
            source: true,
          },
        },
      },
    })

    if (!doc) return errorResponse(404, "Remito no encontrado")
    if (doc.type !== "REMITO") return errorResponse(400, "El documento no es un remito")

    return NextResponse.json({
      ...doc,
      date: doc.date.toISOString(),
      signedAt: doc.signedAt?.toISOString() ?? null,
    })
  } catch (error) {
    return handleUnknownError("delivery.remitos.[id].GET", error)
  }
}
