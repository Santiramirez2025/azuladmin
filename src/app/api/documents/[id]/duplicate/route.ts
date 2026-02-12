import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener documento original con items
    const original = await prisma.document.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!original) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // Crear nuevo documento como borrador
    const newDocument = await prisma.document.create({
      data: {
        type: original.type,
        status: "DRAFT",
        clientId: original.clientId,
        userId: original.userId,
        
        // Totales
        subtotal: original.subtotal,
        surcharge: original.surcharge,
        surchargeRate: original.surchargeRate,
        total: original.total,
        
        // Fechas
        date: new Date(),
        validUntil:
          original.type === "PRESUPUESTO"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 días
            : null,
        
        // Pago - CORREGIDO: paymentType en lugar de paymentMethod
        paymentType: original.paymentType,
        installments: original.installments,
        
        // Envío
        shippingType: original.shippingType,
        shippingCost: original.shippingCost,
        
        // Notas
        observations: original.observations
          ? `(Copia) ${original.observations}`
          : "(Copia de documento anterior)",
        internalNotes: original.internalNotes,
        
        // Items
        items: {
          create: original.items.map((item) => ({
            variantId: item.variantId,
            productName: item.productName,
            productSize: item.productSize,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            source: item.source,
          })),
        },
      },
      include: {
        client: true,
        createdBy: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(newDocument)
  } catch (error) {
    console.error("Error duplicating document:", error)
    return NextResponse.json(
      { error: "Error al duplicar documento" },
      { status: 500 }
    )
  }
}