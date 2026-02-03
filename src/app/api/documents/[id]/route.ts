import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================================
// GET - Obtener un documento por ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Next.js 15: params es Promise
) {
  try {
    const { id } = await params // ← Hacer await

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Error al obtener documento" },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Actualizar un documento
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Next.js 15: params es Promise
) {
  try {
    const { id } = await params // ← Hacer await
    const body = await request.json()

    console.log(`📝 PATCH /api/documents/${id}`, body)

    // Verificar que el documento existe
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      console.error(`❌ Documento ${id} no encontrado`)
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // Actualizar documento
    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.observations !== undefined && { observations: body.observations }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
        ...(body.shippingType && { shippingType: body.shippingType }),
        ...(body.shippingCost !== undefined && { shippingCost: body.shippingCost }),
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
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

    console.log(`✅ Documento ${id} actualizado`)

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Error al actualizar documento" },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Eliminar un documento
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Next.js 15: params es Promise
) {
  try {
    const { id } = await params // ← Hacer await

    console.log(`🗑️ DELETE /api/documents/${id}`)

    // Verificar que el documento existe
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      console.error(`❌ Documento ${id} no encontrado`)
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar documento (los items se eliminan automáticamente por onDelete: Cascade)
    await prisma.document.delete({
      where: { id },
    })

    console.log(`✅ Documento ${id} eliminado`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Error al eliminar documento" },
      { status: 500 }
    )
  }
}