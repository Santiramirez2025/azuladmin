// app/api/documentos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { updateDocumentSchema } from "@/lib/validations"
import { calculateBalance, decimalToNumber } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/library"
import { Prisma } from "@prisma/client"

// ============================================================================
// TIPOS
// ============================================================================

type DocumentStatus = "DRAFT" | "SENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | "EXPIRED"

// ============================================================================
// HELPER: Serializar documento
// ============================================================================

function serializeDocument(document: any) {
  return {
    ...document,
    subtotal: decimalToNumber(document.subtotal),
    surcharge: decimalToNumber(document.surcharge),
    total: decimalToNumber(document.total),
    shippingCost: decimalToNumber(document.shippingCost),
    amountPaid: document.amountPaid ? decimalToNumber(document.amountPaid) : null,
    balance: document.balance ? decimalToNumber(document.balance) : null,
    items: document.items?.map((item: any) => ({
      ...item,
      unitPrice: decimalToNumber(item.unitPrice),
      subtotal: decimalToNumber(item.subtotal),
    })) || [],
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
            dni: true,
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
                    warranty: true,
                  },
                },
              },
            },
          },
        },
        convertedFrom: {
          select: {
            id: true,
            number: true,
            type: true,
          },
        },
        convertedTo: {
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
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
      { 
        error: "Error al obtener documento",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Actualizar un documento (COMPLETAMENTE REESCRITO)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`📝 PATCH /api/documentos/${id}`)
    console.log("Body recibido:", JSON.stringify(body, null, 2))

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      )
    }

    // ✅ VALIDACIÓN CON ZOD
    const validation = updateDocumentSchema.safeParse(body)
    
    if (!validation.success) {
      // validation.error es ZodError y tiene la propiedad errors
      const firstError = validation.error.issues[0]
      console.error("❌ Validación Zod fallida:", firstError)
      return NextResponse.json(
        { 
          error: firstError.message,
          field: firstError.path.join("."),
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // ============================================================================
    // TRANSACCIÓN ATÓMICA
    // ============================================================================

    const document = await prisma.$transaction(async (tx) => {
      // ========================================================================
      // PASO 1: OBTENER DOCUMENTO ACTUAL
      // ========================================================================
      
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
                  product: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      })

      if (!existing) {
        throw new Error("Documento no encontrado")
      }

      console.log(`📄 Documento actual: ${existing.type} #${existing.number} - Status: ${existing.status}`)

      // ========================================================================
      // PASO 2: VALIDACIONES DE NEGOCIO
      // ========================================================================

      // No permitir modificar documentos cancelados
      if (existing.status === "CANCELLED" && data.status !== "CANCELLED") {
        throw new Error("No se puede modificar un documento cancelado")
      }

      // Preparar objeto de actualización
      const updateData: any = {}

      // ========================================================================
      // PASO 3: PROCESAR CAMBIO DE STATUS
      // ========================================================================
      
      if (data.status) {
        const oldStatus = existing.status
        const newStatus = data.status

        console.log(`🔄 Cambio de status: ${oldStatus} → ${newStatus}`)

        // ✅ VALIDAR STOCK AL MARCAR COMO COMPLETED
        if (
          newStatus === "COMPLETED" && 
          oldStatus !== "COMPLETED" &&
          (existing.type === "RECIBO" || existing.type === "REMITO")
        ) {
          // Validar stock disponible
          const stockItems = existing.items.filter(
            item => item.source === "STOCK" && item.variantId && item.variant
          )

          for (const item of stockItems) {
            if (!item.variant) continue

            const availableStock = item.variant.stockQty
            const requestedQty = item.quantity

            if (availableStock < requestedQty) {
              throw new Error(
                `Stock insuficiente para "${item.productName} ${item.productSize}". ` +
                `Disponible: ${availableStock}, Requerido: ${requestedQty}`
              )
            }
          }

          console.log(`✅ Validación de stock OK para ${stockItems.length} items`)
        }

        updateData.status = newStatus
      }

      // ========================================================================
      // PASO 4: PROCESAR CAMBIOS EN PAGO
      // ========================================================================
      
      if (data.amountPaid !== undefined) {
        const amountPaid = new Decimal(data.amountPaid)
        const total = existing.total

        // Validaciones
        if (amountPaid.lessThan(0)) {
          throw new Error("El monto pagado no puede ser negativo")
        }

        if (amountPaid.greaterThan(total.plus(0.01))) {
          throw new Error(
            `El monto pagado ($${amountPaid}) no puede ser mayor al total ($${total})`
          )
        }

        // ✅ CALCULAR BALANCE CORRECTAMENTE
        const balance = calculateBalance(decimalToNumber(total), data.amountPaid)
        
        updateData.amountPaid = amountPaid
        updateData.balance = new Decimal(balance)
        
        console.log(`💰 Actualización de pago:`)
        console.log(`   Total: $${total}`)
        console.log(`   Pagado: $${amountPaid}`)
        console.log(`   Balance: $${balance}`)

        // Si el balance llega a 0, auto-completar el documento
        if (balance === 0 && existing.type === "RECIBO" && existing.status !== "COMPLETED") {
          updateData.status = "COMPLETED"
          console.log("✅ Balance en 0 → Auto-completando documento")
        }
      }

      // ========================================================================
      // PASO 5: OTROS CAMPOS OPCIONALES
      // ========================================================================
      
      if (data.paymentType !== undefined) {
        if (existing.type !== "RECIBO") {
          throw new Error("Solo los recibos pueden tener información de pago")
        }
        updateData.paymentType = data.paymentType
      }

      if (data.installments !== undefined) {
        updateData.installments = data.installments
      }

      if (data.observations !== undefined) {
        updateData.observations = data.observations || null
      }

      if (data.internalNotes !== undefined) {
        updateData.internalNotes = data.internalNotes || null
      }

      if (data.shippingType !== undefined) {
        if (!data.shippingType || data.shippingType.trim() === "") {
          throw new Error("El tipo de envío no puede estar vacío")
        }
        updateData.shippingType = data.shippingType
      }

      if (data.shippingCost !== undefined) {
        const shippingCost = new Decimal(data.shippingCost)
        if (shippingCost.lessThan(0)) {
          throw new Error("El costo de envío no puede ser negativo")
        }
        updateData.shippingCost = shippingCost
      }

      // Si no hay nada que actualizar
      if (Object.keys(updateData).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar")
      }

      // ========================================================================
      // PASO 6: ACTUALIZAR DOCUMENTO
      // ========================================================================
      
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
      // PASO 7: GESTIÓN DE STOCK (BIDIRECCIONAL)
      // ========================================================================
      
      const isStockRelevantType = 
        existing.type === "RECIBO" || existing.type === "REMITO"

      if (isStockRelevantType && data.status) {
        const oldStatus = existing.status
        const newStatus = data.status

        // ✅ CASO 1: Marcar como COMPLETED (DESCONTAR STOCK)
        if (newStatus === "COMPLETED" && oldStatus !== "COMPLETED") {
          const stockItems = updated.items.filter(
            item => item.source === "STOCK" && item.variantId
          )
          
          for (const item of stockItems) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stockQty: { decrement: item.quantity }
                }
              })
              console.log(`📉 Stock descontado: ${item.productName} ${item.productSize} (-${item.quantity})`)
            }
          }
          
          if (stockItems.length > 0) {
            console.log(`✅ Stock descontado para ${stockItems.length} items`)
          }
        }

        // ✅ CASO 2: CANCELAR documento COMPLETED (RESTAURAR STOCK)
        if (newStatus === "CANCELLED" && oldStatus === "COMPLETED") {
          const stockItems = updated.items.filter(
            item => item.source === "STOCK" && item.variantId
          )
          
          for (const item of stockItems) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stockQty: { increment: item.quantity }
                }
              })
              console.log(`📈 Stock restaurado: ${item.productName} ${item.productSize} (+${item.quantity})`)
            }
          }
          
          if (stockItems.length > 0) {
            console.log(`✅ Stock restaurado para ${stockItems.length} items`)
          }
        }

        // ✅ CASO 3: Cambiar de COMPLETED a otro status (RESTAURAR STOCK)
        if (oldStatus === "COMPLETED" && newStatus !== "COMPLETED" && newStatus !== "CANCELLED") {
          const stockItems = updated.items.filter(
            item => item.source === "STOCK" && item.variantId
          )
          
          for (const item of stockItems) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stockQty: { increment: item.quantity }
                }
              })
              console.log(`📈 Stock restaurado: ${item.productName} ${item.productSize} (+${item.quantity})`)
            }
          }
          
          if (stockItems.length > 0) {
            console.log(`✅ Stock restaurado para ${stockItems.length} items`)
          }
        }
      }

      return updated
    })

    console.log(`✅ Documento ${id} actualizado exitosamente`)

    return NextResponse.json(serializeDocument(document))

  } catch (error: any) {
    console.error("❌ Error updating document:", error)
    
    // Error de Prisma - registro no encontrado
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

    // Error de negocio
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
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
// DELETE - Eliminar un documento
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🗑️ DELETE /api/documentos/${id}`)

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      )
    }

    // ✅ Verificar que el documento existe
    const existing = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    // ✅ Validación: no permitir eliminar documentos completados
    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        { 
          error: "No se puede eliminar un documento completado",
          suggestion: "Cancela el documento usando PATCH con status: 'CANCELLED'"
        },
        { status: 400 }
      )
    }

    // ✅ Eliminar (los items se borran automáticamente por CASCADE)
    await prisma.document.delete({
      where: { id },
    })

    console.log(`✅ Documento ${existing.type} #${existing.number} eliminado`)

    return NextResponse.json({ 
      success: true,
      message: `Documento ${existing.type} #${existing.number} eliminado exitosamente`
    })

  } catch (error: any) {
    console.error("❌ Error deleting document:", error)
    
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