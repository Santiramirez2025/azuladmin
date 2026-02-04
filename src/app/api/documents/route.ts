import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma, PaymentMethod } from "@prisma/client"

// ============================================================================
// TIPOS Y VALIDACIONES
// ============================================================================

interface DocumentItemInput {
  variantId?: string
  isCustom?: boolean
  productName?: string
  productSize?: string
  unitPrice?: number
  quantity: number
  source?: "STOCK" | "CATALOGO"
}

interface CreateDocumentInput {
  clientId: string
  userId?: string
  type: "PRESUPUESTO" | "RECIBO" | "REMITO"
  items: DocumentItemInput[]
  observations?: string
  internalNotes?: string
  validUntil?: string
  surchargeRate?: number
  paymentMethod?: PaymentMethod | string
  installments?: number
  shippingType?: string
  shippingCost?: number
  amountPaid?: number
  balance?: number
  paymentType?: string
}

// ============================================================================
// UTILIDADES
// ============================================================================

function validateDocumentInput(data: Partial<CreateDocumentInput>): {
  valid: boolean
  error?: string
} {
  if (!data.clientId) {
    return { valid: false, error: "El ID del cliente es requerido" }
  }

  if (!data.type || !["PRESUPUESTO", "RECIBO", "REMITO"].includes(data.type)) {
    return { valid: false, error: "El tipo de documento es inválido" }
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: "Debe incluir al menos un item" }
  }

  // Validar cada item
  for (const [index, item] of data.items.entries()) {
    if (!item.quantity || item.quantity <= 0) {
      return { 
        valid: false, 
        error: `Item ${index + 1}: La cantidad debe ser mayor a 0` 
      }
    }

    if (item.isCustom || !item.variantId) {
      // Item custom necesita nombre y precio
      if (!item.productName?.trim()) {
        return { 
          valid: false, 
          error: `Item ${index + 1}: El producto custom requiere nombre` 
        }
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return { 
          valid: false, 
          error: `Item ${index + 1}: El producto custom requiere precio válido` 
        }
      }
    }
  }

  return { valid: true }
}

function buildSearchFilter(search: string): Prisma.DocumentWhereInput["OR"] {
  const filters: Prisma.DocumentWhereInput[] = [
    { client: { name: { contains: search, mode: "insensitive" } } },
    { client: { phone: { contains: search, mode: "insensitive" } } },
    { client: { city: { contains: search, mode: "insensitive" } } },
    { observations: { contains: search, mode: "insensitive" } },
    { internalNotes: { contains: search, mode: "insensitive" } },
  ]

  // Si es un número, buscar por número de documento
  if (!isNaN(Number(search))) {
    filters.push({ number: { equals: parseInt(search) } })
  }

  return filters
}

function getSortOrder(sortBy: string, sortOrder: "asc" | "desc"): Prisma.DocumentOrderByWithRelationInput {
  switch (sortBy) {
    case "number":
      return { number: sortOrder }
    case "total":
      return { total: sortOrder }
    case "client":
      return { client: { name: sortOrder } }
    case "date":
    default:
      return { date: sortOrder }
  }
}

// Validar y convertir paymentMethod al enum de Prisma
function parsePaymentMethod(method: string | PaymentMethod | undefined): PaymentMethod | null {
  if (!method) return null
  
  // Si ya es del tipo correcto, devolverlo
  if (typeof method === "object") return method as PaymentMethod
  
  // Convertir string a enum
  const validMethods: PaymentMethod[] = ["CONTADO", "CUOTAS_3", "CUOTAS_6", "CUOTAS_9", "CUOTAS_12"]
  const upperMethod = method.toUpperCase()
  
  if (validMethods.includes(upperMethod as PaymentMethod)) {
    return upperMethod as PaymentMethod
  }
  
  return null
}

// ============================================================================
// GET - Obtener documentos con filtros y paginación
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parámetros de búsqueda y filtrado
    const search = searchParams.get("search")?.trim() || ""
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
    
    // Paginación
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    // Construir filtros
    const where: Prisma.DocumentWhereInput = {}

    if (search) {
      where.OR = buildSearchFilter(search)
    }

    if (type && type !== "all") {
      where.type = type as "PRESUPUESTO" | "RECIBO" | "REMITO"
    }

    if (status && status !== "all") {
      where.status = status as Prisma.EnumDocumentStatusFilter
    }

    if (clientId) {
      where.clientId = clientId
    }

    const orderBy = getSortOrder(sortBy, sortOrder)

    // Ejecutar queries en paralelo para mejor performance
    const [items, total, statsData] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
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
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.document.count({ where }),
      prisma.document.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
        where: type && type !== "all" ? { type: type as any } : undefined,
      }),
    ])

    // Procesar estadísticas
    const stats = {
      total: 0,
      draft: 0,
      sent: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      expired: 0,
    }

    statsData.forEach((item) => {
      const count = item._count._all
      stats.total += count
      
      const statusKey = item.status.toLowerCase() as keyof typeof stats
      if (statusKey in stats) {
        stats[statusKey] = count
      }
    })

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
      hasMore: page < Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("❌ Error fetching documents:", error)
    return NextResponse.json(
      { 
        error: "Error al obtener documentos",
        message: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Crear documento (OPTIMIZADO)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentInput = await request.json()
    
    console.log("📥 Recibiendo documento:", {
      type: body.type,
      clientId: body.clientId,
      itemsCount: body.items?.length
    })

    // Validar entrada
    const validation = validateDocumentInput(body)
    if (!validation.valid) {
      console.error("❌ Validación fallida:", validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      clientId,
      userId: providedUserId,
      type,
      items,
      observations,
      internalNotes,
      validUntil,
      surchargeRate = 0,
      paymentMethod: rawPaymentMethod,
      installments,
      shippingType = "Sin cargo en Villa María",
      shippingCost = 0,
      amountPaid,
      balance,
      paymentType,
    } = body

    // Parsear paymentMethod
    const paymentMethod = parsePaymentMethod(rawPaymentMethod)

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true },
    })

    if (!client) {
      console.error("❌ Cliente no encontrado:", clientId)
      return NextResponse.json(
        { error: "El cliente especificado no existe" },
        { status: 404 }
      )
    }

    console.log("✅ Cliente encontrado:", client.name)

    // Obtener o asignar usuario
    let userId = providedUserId
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      })
      if (!defaultUser) {
        console.error("❌ No hay usuarios en el sistema")
        return NextResponse.json(
          { error: "No hay usuarios en el sistema. Crea un usuario primero." },
          { status: 400 }
        )
      }
      userId = defaultUser.id
      console.log("ℹ️ Usando usuario por defecto:", defaultUser.name)
    }

    // Separar items del catálogo de items custom
    const catalogItems = items.filter(
      (item) => item.variantId && !item.isCustom
    )
    const customItems = items.filter(
      (item) => item.isCustom || !item.variantId
    )

    console.log(`📦 Items del catálogo: ${catalogItems.length}, Items custom: ${customItems.length}`)

    // Obtener datos de variantes del catálogo
    const variantIds = catalogItems.map((item) => item.variantId!)
    const variants = variantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { 
            id: { in: variantIds },
            isActive: true,
          },
          include: { product: true },
        })
      : []

    // Verificar que todas las variantes existan
    if (variants.length !== variantIds.length) {
      const foundIds = new Set(variants.map(v => v.id))
      const missingIds = variantIds.filter(id => !foundIds.has(id))
      console.error("❌ Variantes no encontradas:", missingIds)
      return NextResponse.json(
        { error: `Variantes no encontradas o inactivas: ${missingIds.join(", ")}` },
        { status: 404 }
      )
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]))

    // Procesar todos los items
    let subtotal = 0
    const processedItems: Prisma.DocumentItemCreateWithoutDocumentInput[] = []

    // Items del catálogo
    for (const item of catalogItems) {
      const variant = variantMap.get(item.variantId!)!
      const itemSubtotal = item.quantity * Number(variant.price)
      subtotal += itemSubtotal

      processedItems.push({
        variant: { connect: { id: item.variantId! } },
        productName: variant.product.name,
        productSize: variant.size,
        unitPrice: variant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        source: variant.source,
        isCustom: false,
      })
    }

    // Items custom (productos sueltos)
    for (const item of customItems) {
      const itemSubtotal = item.quantity * item.unitPrice!
      subtotal += itemSubtotal

      processedItems.push({
        productName: item.productName!,
        productSize: item.productSize || "Único",
        unitPrice: item.unitPrice!,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        source: item.source || "CATALOGO",
        isCustom: true,
      })
    }

    console.log(`💰 Subtotal calculado: $${subtotal}`)

    // Calcular totales
    const surcharge = subtotal * (surchargeRate / 100)
    const finalShippingCost = Number(shippingCost) || 0
    const total = subtotal + surcharge + finalShippingCost

    console.log(`💰 Total final: $${total}`)

    // Validar fechas
    const now = new Date()
    let validUntilDate = null
    
    if (validUntil) {
      validUntilDate = new Date(validUntil)
      if (isNaN(validUntilDate.getTime())) {
        console.error("❌ Fecha de validez inválida:", validUntil)
        return NextResponse.json(
          { error: "Fecha de validez inválida" },
          { status: 400 }
        )
      }
    }

    // Determinar status inicial
    let initialStatus: "DRAFT" | "SENT" | "COMPLETED" = "DRAFT"
    
    // Si es un RECIBO con pago completo, marcar como completado
    if (type === "RECIBO" && amountPaid && amountPaid >= total) {
      initialStatus = "COMPLETED"
    }

    console.log(`📄 Creando documento: ${type} - Status inicial: ${initialStatus}`)

    // Crear documento (sin transacción compleja)
    const document = await prisma.document.create({
      data: {
        type,
        status: initialStatus,
        client: { connect: { id: clientId } },
        createdBy: { connect: { id: userId } },
        subtotal,
        surcharge,
        surchargeRate,
        total,
        observations: observations?.trim() || null,
        internalNotes: internalNotes?.trim() || null,
        date: now,
        validUntil: validUntilDate,
        paymentMethod: paymentMethod,
        installments: installments || null,
        amountPaid: amountPaid || null,
        balance: balance || null,
        paymentType: paymentType || null,
        shippingType,
        shippingCost: finalShippingCost,
        items: {
          create: processedItems,
        },
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

    // Actualizar stock DESPUÉS de crear el documento (si es necesario)
    if ((type === "RECIBO" || type === "REMITO") && initialStatus === "COMPLETED") {
      console.log("📦 Actualizando stock para items del catálogo...")
      for (const item of catalogItems) {
        const variant = variantMap.get(item.variantId!)!
        if (variant.source === "STOCK") {
          try {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                stockQty: {
                  decrement: item.quantity,
                },
              },
            })
            console.log(`  ✅ Stock actualizado: ${variant.product.name} - ${variant.size} (-${item.quantity})`)
          } catch (error) {
            console.warn(`⚠️ No se pudo actualizar stock para ${variant.product.name}:`, error)
            // No fallar todo el proceso por un error de stock
          }
        }
      }
    }

    console.log(`✅ Documento creado exitosamente: ${document.type} #${document.number}`)

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("❌ Error creating document:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    
    // Manejo específico de errores de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code)
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Ya existe un documento con ese número" },
          { status: 409 }
        )
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Registro no encontrado" },
          { status: 404 }
        )
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Relación inválida - verifica que cliente y usuario existan" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: "Error al crear documento",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Eliminar múltiples documentos (batch)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar un array de IDs" },
        { status: 400 }
      )
    }

    // Verificar que los documentos existen
    const documents = await prisma.document.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    })

    if (documents.length !== ids.length) {
      return NextResponse.json(
        { error: "Algunos documentos no fueron encontrados" },
        { status: 404 }
      )
    }

    // Prevenir eliminación de documentos completados (opcional)
    const completedDocs = documents.filter(d => d.status === "COMPLETED")
    if (completedDocs.length > 0) {
      return NextResponse.json(
        { 
          error: "No se pueden eliminar documentos completados",
          completedIds: completedDocs.map(d => d.id)
        },
        { status: 400 }
      )
    }

    // Eliminar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Primero eliminar items
      await tx.documentItem.deleteMany({
        where: { documentId: { in: ids } },
      })

      // Luego eliminar documentos
      const deleted = await tx.document.deleteMany({
        where: { id: { in: ids } },
      })

      return deleted
    })

    console.log(`✅ ${result.count} documentos eliminados`)

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} documento${result.count !== 1 ? "s" : ""} eliminado${result.count !== 1 ? "s" : ""} correctamente`,
    })
  } catch (error) {
    console.error("❌ Error deleting documents:", error)
    return NextResponse.json(
      { 
        error: "Error al eliminar documentos",
        message: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}