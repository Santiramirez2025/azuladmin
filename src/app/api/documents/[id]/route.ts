import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

// ============================================================================
// TIPOS
// ============================================================================

type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"
type DocumentStatus = "DRAFT" | "SENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | "EXPIRED"

// ============================================================================
// HELPER: Serializar documento
// ============================================================================

function serializeDocument(document: any) {
  return {
    ...document,
    subtotal: Number(document.subtotal),
    surcharge: Number(document.surcharge),
    total: Number(document.total),
    shippingCost: Number(document.shippingCost),
    amountPaid: document.amountPaid ? Number(document.amountPaid) : null,
    balance: document.balance ? Number(document.balance) : null,
    items: document.items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }
}

// ============================================================================
// GET - Obtener un documento por ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      )
    }

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
          },
        },
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
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                  },
                },
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

    return NextResponse.json(serializeDocument(document))
  } catch (error) {
    console.error("❌ Error fetching document:", error)
    return NextResponse.json(
      { error: "Error al obtener documento" },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Actualizar un documento (OPTIMIZADO)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`📝 PATCH /api/documents/${id}`, JSON.stringify(body, null, 2))

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      )
    }

    // ✅ Obtener documento completo con items para validaciones
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                stockQty: true,
                source: true,
                product: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!existingDocument) {
      console.error(`❌ Documento ${id} no encontrado`)
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // Validaciones de negocio
    const updateData: any = {}

    // ============================================================================
    // 1. VALIDAR Y PROCESAR CAMBIO DE STATUS
    // ============================================================================
    if (body.status) {
      const validStatuses: DocumentStatus[] = ["DRAFT", "SENT", "APPROVED", "COMPLETED", "CANCELLED", "EXPIRED"]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Status inválido: ${body.status}` },
          { status: 400 }
        )
      }

      // No permitir cambiar status de documentos cancelados
      if (existingDocument.status === "CANCELLED" && body.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "No se puede modificar el estado de un documento cancelado" },
          { status: 400 }
        )
      }

      // ✅ VALIDAR STOCK DISPONIBLE al marcar como COMPLETED
      if (
        body.status === "COMPLETED" && 
        existingDocument.status !== "COMPLETED" &&
        (existingDocument.type === "RECIBO" || existingDocument.type === "REMITO")
      ) {
        const stockItems = existingDocument.items.filter(
          item => item.source === "STOCK" && item.variantId && item.variant
        )

        for (const item of stockItems) {
          if (!item.variant) continue

          const availableStock = item.variant.stockQty
          const requestedQty = item.quantity

          if (availableStock < requestedQty) {
            return NextResponse.json(
              { 
                error: `Stock insuficiente para "${item.productName} ${item.productSize}"`,
                details: {
                  product: item.productName,
                  size: item.productSize,
                  available: availableStock,
                  requested: requestedQty,
                  missing: requestedQty - availableStock
                }
              },
              { status: 400 }
            )
          }
        }

        console.log(`✅ Validación de stock OK para ${stockItems.length} items`)
      }

      updateData.status = body.status
    }

    // ============================================================================
    // 2. VALIDAR Y CALCULAR BALANCE SI HAY CAMBIOS EN PAGO
    // ============================================================================
    if (body.amountPaid !== undefined) {
      const amountPaid = new Decimal(body.amountPaid)
      const total = existingDocument.total

      // Validar que el monto pagado no sea negativo
      if (amountPaid.lessThan(0)) {
        return NextResponse.json(
          { error: "El monto pagado no puede ser negativo" },
          { status: 400 }
        )
      }

      // Validar que el monto pagado no exceda el total (con margen de 0.01 por redondeo)
      if (amountPaid.greaterThan(total.plus(0.01))) {
        return NextResponse.json(
          { 
            error: "El monto pagado no puede ser mayor al total",
            details: {
              amountPaid: amountPaid.toNumber(),
              total: Number(total)
            }
          },
          { status: 400 }
        )
      }

      updateData.amountPaid = amountPaid
      updateData.balance = total.minus(amountPaid)
      
      // Si el balance es muy pequeño (< 1 peso), considerarlo como 0
      if (updateData.balance.lessThan(1) && updateData.balance.greaterThan(-1)) {
        updateData.balance = new Decimal(0)
      }
      
      console.log(`💰 Cálculo de balance:`)
      console.log(`   Total: ${total}`)
      console.log(`   Pagado: ${amountPaid}`)
      console.log(`   Balance: ${updateData.balance}`)
    }

    // ============================================================================
    // 3. VALIDAR PAYMENT TYPE
    // ============================================================================
    if (body.paymentType !== undefined) {
      if (existingDocument.type !== "RECIBO") {
        return NextResponse.json(
          { error: "Solo los recibos pueden tener información de pago" },
          { status: 400 }
        )
      }

      const validPaymentTypes = ["Efectivo", "Transferencia", "Débito", "Crédito", "Cheque", "Mixto"]
      if (body.paymentType && !validPaymentTypes.includes(body.paymentType)) {
        return NextResponse.json(
          { 
            error: "Tipo de pago inválido",
            validOptions: validPaymentTypes
          },
          { status: 400 }
        )
      }

      updateData.paymentType = body.paymentType
    }

    // ============================================================================
    // 4. VALIDAR INSTALLMENTS
    // ============================================================================
    if (body.installments !== undefined) {
      const installments = parseInt(body.installments)
      if (isNaN(installments) || installments < 1 || installments > 12) {
        return NextResponse.json(
          { error: "Las cuotas deben ser un número entre 1 y 12" },
          { status: 400 }
        )
      }
      updateData.installments = installments
    }

    // ============================================================================
    // 5. CAMPOS OPCIONALES
    // ============================================================================
    if (body.observations !== undefined) {
      updateData.observations = body.observations || null
    }

    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes || null
    }

    if (body.shippingType !== undefined) {
      if (!body.shippingType || body.shippingType.trim() === "") {
        return NextResponse.json(
          { error: "El tipo de envío no puede estar vacío" },
          { status: 400 }
        )
      }
      updateData.shippingType = body.shippingType
    }

    if (body.shippingCost !== undefined) {
      const shippingCost = new Decimal(body.shippingCost)
      if (shippingCost.lessThan(0)) {
        return NextResponse.json(
          { error: "El costo de envío no puede ser negativo" },
          { status: 400 }
        )
      }
      updateData.shippingCost = shippingCost
    }

    // Si no hay nada que actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      )
    }

    // ============================================================================
    // 6. ACTUALIZAR DOCUMENTO CON TRANSACCIÓN (INCLUYE GESTIÓN DE STOCK)
    // ============================================================================
    const document = await prisma.$transaction(async (tx) => {
      // ========================================================================
      // A) ACTUALIZAR EL DOCUMENTO
      // ========================================================================
      const updated = await tx.document.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
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
                  product: {
                    select: {
                      id: true,
                      name: true,
                      brand: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // ========================================================================
      // B) GESTIÓN DE STOCK - SOLO PARA RECIBOS Y REMITOS
      // ========================================================================
      const isStockRelevantType = 
        existingDocument.type === "RECIBO" || existingDocument.type === "REMITO"

      // ✅ CASO 1: Marcar como COMPLETED (DESCONTAR STOCK)
      if (
        body.status === "COMPLETED" && 
        existingDocument.status !== "COMPLETED" &&
        isStockRelevantType
      ) {
        const stockItems = updated.items.filter(
          item => item.source === "STOCK" && item.variantId
        )
        
        for (const item of stockItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQty: {
                  decrement: item.quantity
                }
              }
            })
            console.log(`📉 Stock descontado: ${item.productName} ${item.productSize} (-${item.quantity})`)
          }
        }
        
        if (stockItems.length > 0) {
          console.log(`✅ Stock actualizado para ${stockItems.length} items`)
        }
      }

      // ✅ CASO 2: CANCELAR documento COMPLETED (RESTAURAR STOCK)
      if (
        body.status === "CANCELLED" && 
        existingDocument.status === "COMPLETED" &&
        isStockRelevantType
      ) {
        const stockItems = updated.items.filter(
          item => item.source === "STOCK" && item.variantId
        )
        
        for (const item of stockItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQty: {
                  increment: item.quantity
                }
              }
            })
            console.log(`📈 Stock restaurado: ${item.productName} ${item.productSize} (+${item.quantity})`)
          }
        }
        
        if (stockItems.length > 0) {
          console.log(`✅ Stock restaurado para ${stockItems.length} items`)
        }
      }

      return updated
    })

    console.log(`✅ Documento ${id} actualizado exitosamente`)

    return NextResponse.json(serializeDocument(document))
  } catch (error: any) {
    console.error("❌ Error updating document:", error)
    
    // Error de validación de Prisma
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // Error de constraint
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Error de integridad de datos" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: "Error al actualizar documento",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Eliminar un documento (OPTIMIZADO)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🗑️ DELETE /api/documents/${id}`)

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      )
    }

    // ✅ Verificar que el documento existe
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
      },
    })

    if (!existingDocument) {
      console.error(`❌ Documento ${id} no encontrado`)
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // ✅ Validación: no permitir eliminar documentos completados
    if (existingDocument.status === "COMPLETED") {
      return NextResponse.json(
        { 
          error: "No se puede eliminar un documento completado",
          suggestion: "Cancela el documento usando PATCH /api/documents/:id con status: 'CANCELLED'"
        },
        { status: 400 }
      )
    }

    // ✅ Usar transacción para eliminar (los items se borran por CASCADE)
    await prisma.$transaction(async (tx) => {
      await tx.document.delete({
        where: { id },
      })
    })

    console.log(`✅ Documento ${existingDocument.type} #${existingDocument.number} eliminado`)

    return NextResponse.json({ 
      success: true,
      message: `Documento ${existingDocument.type} #${existingDocument.number} eliminado exitosamente`
    })
  } catch (error: any) {
    console.error("❌ Error deleting document:", error)
    
    // Error de constraint de Prisma
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar el documento debido a referencias existentes" },
        { status: 400 }
      )
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: "Error al eliminar documento",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}