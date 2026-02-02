import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { clientSchema } from "@/lib/validations"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/clients/[id] - Obtener cliente
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
            total: true,
            date: true,
          },
        },
        _count: {
          select: { documents: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Calcular totales del cliente
    const stats = await prisma.document.aggregate({
      where: {
        clientId: id,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      _sum: {
        total: true,
        amountPaid: true,
      },
    })

    return NextResponse.json({
      ...client,
      totalPurchased: stats._sum.total || 0,
      totalPaid: stats._sum.amountPaid || 0,
      balance: (stats._sum.total || 0) - (stats._sum.amountPaid || 0),
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Actualizar cliente
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = clientSchema.parse(body)

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        dni: validatedData.dni || null,
        email: validatedData.email || null,
        address: validatedData.address || null,
        city: validatedData.city,
        province: validatedData.province,
        notes: validatedData.notes || null,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error updating client:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Eliminar cliente
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Verificar que no tenga documentos
    const documentsCount = await prisma.document.count({
      where: { clientId: id },
    })

    if (documentsCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con documentos asociados" },
        { status: 400 }
      )
    }

    await prisma.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    )
  }
}
