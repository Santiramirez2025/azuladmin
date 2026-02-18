// app/api/documentos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { createDocumentSchema, documentFilterSchema } from "@/lib/validations"
import { calculateBalance, decimalToNumber } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/library"

// ============================================================================
// TIPOS
// ============================================================================

type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"
type DocumentStatus = "DRAFT" | "SENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | "EXPIRED"
type PaymentMethod = "CONTADO" | "CUOTAS_3" | "CUOTAS_6" | "CUOTAS_9" | "CUOTAS_12"

interface ValidationResult {
  valid: boolean
  error?: string
  details?: any
}

// ============================================================================
// HELPERS - VALIDACIONES
// ============================================================================

/**
 * Obtiene la tasa de recargo según el método de pago
 */
function getSurchargeRate(paymentMethod: PaymentMethod | null | undefined): number {
  if (!paymentMethod) return 0
  
  const rates: Record<PaymentMethod, number> = {
    CONTADO: 0,
    CUOTAS_3: 18,
    CUOTAS_6: 25,
    CUOTAS_9: 35,
    CUOTAS_12: 47,
  }
  
  return rates[paymentMethod] || 0
}

/**
 * Valida que haya stock disponible para los items solicitados
 */
async function validateStockAvailability(
  items: Array<{ variantId?: string; quantity: number; isCustom?: boolean }>,
  tx: Prisma.TransactionClient
): Promise<ValidationResult> {
  // Filtrar solo items del catálogo que requieren validación de stock
  const catalogItems = items.filter(item => item.variantId && !item.isCustom)
  
  if (catalogItems.length === 0) {
    return { valid: true }
  }

  // Obtener variantes con stock actual
  const variantIds = catalogItems.map(item => item.variantId!)
  const variants = await tx.productVariant.findMany({
    where: { 
      id: { in: variantIds },
      isActive: true,
    },
    include: {
      product: {
        select: { name: true }
      }
    }
  })

  // Verificar que todas las variantes existan
  if (variants.length !== variantIds.length) {
    const foundIds = new Set(variants.map(v => v.id))
    const missingIds = variantIds.filter(id => !foundIds.has(id))
    return {
      valid: false,
      error: "Algunos productos no están disponibles o fueron desactivados",
      details: { missingVariantIds: missingIds }
    }
  }

  // Crear mapa de variantes
  const variantMap = new Map(variants.map(v => [v.id, v]))

  // Validar stock disponible para items de STOCK
  for (const item of catalogItems) {
    const variant = variantMap.get(item.variantId!)!
    
    // Solo validar stock para items de showroom (STOCK)
    if (variant.source === "STOCK") {
      const availableStock = variant.stockQty
      const requestedQty = item.quantity

      if (availableStock < requestedQty) {
        return {
          valid: false,
          error: `Stock insuficiente para "${variant.product.name} ${variant.size}"`,
          details: {
            product: variant.product.name,
            size: variant.size,
            available: availableStock,
            requested: requestedQty,
            missing: requestedQty - availableStock
          }
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Construir filtros de búsqueda
 */
function buildSearchFilter(search: string): Prisma.DocumentWhereInput["OR"] {
  const filters: Prisma.DocumentWhereInput[] = [
    { client: { name: { contains: search, mode: "insensitive" } } },
    { client: { phone: { contains: search } } },
    { client: { city: { contains: search, mode: "insensitive" } } },
    { observations: { contains: search, mode: "insensitive" } },
    { internalNotes: { contains: search, mode: "insensitive" } },
  ]

  // Si es un número, buscar por número de documento
  const numSearch = parseInt(search)
  if (!isNaN(numSearch)) {
    filters.push({ number: { equals: numSearch } })
  }

  return filters
}

/**
 * Obtener orden de clasificación
 */
function getSortOrder(
  sortBy: string, 
  sortOrder: "asc" | "desc"
): Prisma.DocumentOrderByWithRelationInput {
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

// ============================================================================
// GET - Listar documentos con filtros y paginación
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parsear parámetros
    const rawParams = {
      search: searchParams.get("search")?.trim() || "",
      type: searchParams.get("type") || "all",
      status: searchParams.get("status") || "all",
      clientId: searchParams.get("clientId") || undefined,
      sortBy: searchParams.get("sortBy") || "date",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
      page: Math.max(1, parseInt(searchParams.get("page") || "1")),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20"))),
    }

    const skip = (rawParams.page - 1) * rawParams.limit

    // Construir filtros WHERE
    const where: Prisma.DocumentWhereInput = {}

    if (rawParams.search) {
      where.OR = buildSearchFilter(rawParams.search)
    }

    if (rawParams.type && rawParams.type !== "all") {
      where.type = rawParams.type as DocumentType
    }

    if (rawParams.status && rawParams.status !== "all") {
      where.status = rawParams.status as DocumentStatus
    }

    if (rawParams.clientId) {
      where.clientId = rawParams.clientId
    }

    const orderBy = getSortOrder(rawParams.sortBy, rawParams.sortOrder)

    // ✅ Ejecutar queries en paralelo para mejor performance
    const [items, total, statsData] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: rawParams.limit,
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
        _count: { _all: true },
        where: rawParams.type && rawParams.type !== "all" 
          ? { type: rawParams.type as DocumentType } 
          : undefined,
      }),
    ])

    // Procesar estadísticas por status
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

    // Serializar Decimals a números
    const serializedItems = items.map(item => ({
      ...item,
      subtotal: decimalToNumber(item.subtotal),
      surcharge: decimalToNumber(item.surcharge),
      total: decimalToNumber(item.total),
      shippingCost: decimalToNumber(item.shippingCost),
      amountPaid: item.amountPaid ? decimalToNumber(item.amountPaid) : null,
      balance: item.balance ? decimalToNumber(item.balance) : null,
    }))

    return NextResponse.json({
      items: serializedItems,
      total,
      page: rawParams.page,
      limit: rawParams.limit,
      totalPages: Math.ceil(total / rawParams.limit),
      stats,
      hasMore: rawParams.page < Math.ceil(total / rawParams.limit),
    })

  } catch (error) {
    console.error("❌ Error fetching documents:", error)
    return NextResponse.json(
      { 
        error: "Error al obtener documentos",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Crear documento (TOTALMENTE REESCRITO Y OPTIMIZADO)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("📥 POST /api/documentos - Recibiendo:", {
      type: body.type,
      clientId: body.clientId,
      itemsCount: body.items?.length
    })

    // ✅ VALIDACIÓN CON ZOD
    const validation = createDocumentSchema.safeParse(body)
    
    if (!validation.success) {
      // validation.error.issues contiene los errores (no .errors)
      const firstError = validation.error.issues[0]
      console.error("❌ Validación Zod fallida:", firstError)
      return NextResponse.json(
        { 
          error: firstError.message,
          field: firstError.path.join("."),
          details: process.env.NODE_ENV === "development" ? validation.error.issues : undefined
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // ============================================================================
    // PREPARACIÓN DE DATOS
    // ============================================================================

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true },
    })

    if (!client) {
      console.error("❌ Cliente no encontrado:", data.clientId)
      return NextResponse.json(
        { error: "El cliente especificado no existe" },
        { status: 404 }
      )
    }

    console.log("✅ Cliente encontrado:", client.name)

    // Obtener o asignar usuario
    let userId = data.userId
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

    // ============================================================================
    // TRANSACCIÓN ATÓMICA - TODO O NADA
    // ============================================================================

    const document = await prisma.$transaction(async (tx) => {
      // ========================================================================
      // PASO 1: VALIDAR STOCK DISPONIBLE (SI ES NECESARIO)
      // ========================================================================
      
      const needsStockValidation = 
        (data.type === "RECIBO" || data.type === "REMITO") &&
        data.items.some(item => !item.isCustom && item.variantId)

      if (needsStockValidation) {
        const stockValidation = await validateStockAvailability(data.items, tx)
        
        if (!stockValidation.valid) {
          throw new Error(stockValidation.error || "Error de validación de stock")
        }
        
        console.log("✅ Validación de stock OK")
      }

      // ========================================================================
      // PASO 2: SEPARAR ITEMS - Type Guards para TypeScript
      // ========================================================================
      
      // Type guard para items del catálogo
      const isCatalogItem = (item: any): item is { variantId: string; quantity: number; isCustom?: false } => {
        return 'variantId' in item && item.variantId && !item.isCustom
      }
      
      // Type guard para items custom
      const isCustomItem = (item: any): item is { isCustom: true; productName: string; productSize: string; unitPrice: number; quantity: number; source: "STOCK" | "CATALOGO" } => {
        return item.isCustom === true
      }
      
      const catalogItems = data.items.filter(isCatalogItem)
      const customItems = data.items.filter(isCustomItem)

      console.log(`📦 Items del catálogo: ${catalogItems.length}, Items custom: ${customItems.length}`)

      // Obtener datos de variantes del catálogo
      type VariantWithProduct = Prisma.ProductVariantGetPayload<{
        include: { 
          product: {
            select: {
              name: true
              brand: true
            }
          }
        }
      }>

      let variants: VariantWithProduct[] = []
      if (catalogItems.length > 0) {
        const variantIds = catalogItems.map(item => item.variantId)
        variants = await tx.productVariant.findMany({
          where: { 
            id: { in: variantIds },
            isActive: true,
          },
          include: { 
            product: {
              select: {
                name: true,
                brand: true,
              }
            }
          },
        })
      }

      const variantMap = new Map(variants.map(v => [v.id, v]))

      // ========================================================================
      // PASO 3: CALCULAR TOTALES
      // ========================================================================
      
      let subtotal = 0
      const processedItems: Prisma.DocumentItemCreateWithoutDocumentInput[] = []

      // Procesar items del catálogo
      for (const item of catalogItems) {
        const variant = variantMap.get(item.variantId!)
        
        if (!variant) {
          throw new Error(`Variante ${item.variantId} no encontrada`)
        }

        const itemSubtotal = item.quantity * decimalToNumber(variant.price)
        subtotal += itemSubtotal

        processedItems.push({
          variant: { connect: { id: item.variantId! } },
          productName: variant.product.name,
          productSize: variant.size,
          unitPrice: variant.price,
          quantity: item.quantity,
          subtotal: new Decimal(itemSubtotal),
          source: variant.source,
          isCustom: false,
        })
      }

      // Procesar items custom
      for (const item of customItems) {
        const itemSubtotal = item.quantity * item.unitPrice
        subtotal += itemSubtotal

        processedItems.push({
          productName: item.productName,
          productSize: item.productSize || "Único",
          unitPrice: new Decimal(item.unitPrice),
          quantity: item.quantity,
          subtotal: new Decimal(itemSubtotal),
          source: item.source || "CATALOGO",
          isCustom: true,
        })
      }

      console.log(`💰 Subtotal calculado: $${subtotal}`)

      // ✅ CÁLCULO CORRECTO DE TOTALES
      const surchargeRate = data.paymentMethod 
        ? getSurchargeRate(data.paymentMethod as PaymentMethod)
        : data.surchargeRate || 0

      const surcharge = Math.round(subtotal * (surchargeRate / 100))
      const shippingCost = data.shippingCost || 0
      const total = subtotal + surcharge + shippingCost

      console.log(`💰 Recargo (${surchargeRate}%): $${surcharge}`)
      console.log(`💰 Envío: $${shippingCost}`)
      console.log(`💰 TOTAL FINAL: $${total}`)

      // ✅ CÁLCULO CORRECTO DE BALANCE (SIEMPRE EN BACKEND)
      const amountPaid = data.amountPaid || 0
      const balance = calculateBalance(total, amountPaid)

      if (amountPaid > total) {
        throw new Error(`El monto pagado ($${amountPaid}) no puede ser mayor al total ($${total})`)
      }

      console.log(`💰 Pagado: $${amountPaid} | Balance: $${balance}`)

      // ========================================================================
      // PASO 4: DETERMINAR STATUS INICIAL
      // ========================================================================
      
      let initialStatus: DocumentStatus = "DRAFT"
      
      // Si es RECIBO con pago completo, marcar como COMPLETED
      if (data.type === "RECIBO" && balance === 0 && amountPaid > 0) {
        initialStatus = "COMPLETED"
        console.log("✅ RECIBO con pago completo → Status COMPLETED")
      }

      // ========================================================================
      // PASO 5: CREAR DOCUMENTO
      // ========================================================================
      
      const validUntilDate = data.validUntil ? new Date(data.validUntil) : null
      
      const newDocument = await tx.document.create({
        data: {
          type: data.type,
          status: initialStatus,
          client: { connect: { id: data.clientId } },
          createdBy: { connect: { id: userId } },
          
          // Totales calculados
          subtotal: new Decimal(subtotal),
          surcharge: new Decimal(surcharge),
          surchargeRate,
          shippingCost: new Decimal(shippingCost),
          total: new Decimal(total),
          
          // Balance calculado correctamente
          amountPaid: amountPaid > 0 ? new Decimal(amountPaid) : null,
          balance: balance > 0 ? new Decimal(balance) : null,
          
          // Información de pago
          paymentMethod: data.paymentMethod as PaymentMethod || null,
          installments: data.installments || null,
          paymentType: data.paymentType || null,
          
          // Envío
          shippingType: data.shippingType,
          
          // Metadata
          observations: data.observations?.trim() || null,
          internalNotes: data.internalNotes?.trim() || null,
          
          // Fechas
          date: new Date(),
          validUntil: validUntilDate,
          
          // Items
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

      // ========================================================================
      // PASO 6: ACTUALIZAR STOCK (SI ES NECESARIO)
      // ========================================================================
      
      if (initialStatus === "COMPLETED" && (data.type === "RECIBO" || data.type === "REMITO")) {
        const stockItems = processedItems.filter(
          item => item.source === "STOCK" && !item.isCustom
        )

        for (const item of stockItems) {
          // Buscar el item original para obtener el variantId
          const originalItem = catalogItems.find(
            ci => variantMap.get(ci.variantId)?.product.name === item.productName
          )

          if (originalItem && originalItem.variantId) {
            await tx.productVariant.update({
              where: { id: originalItem.variantId },
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

      return newDocument
    })

    console.log(`✅ Documento creado: ${document.type} #${document.number}`)

    // Serializar respuesta
    const response = {
      ...document,
      subtotal: decimalToNumber(document.subtotal),
      surcharge: decimalToNumber(document.surcharge),
      total: decimalToNumber(document.total),
      shippingCost: decimalToNumber(document.shippingCost),
      amountPaid: document.amountPaid ? decimalToNumber(document.amountPaid) : null,
      balance: document.balance ? decimalToNumber(document.balance) : null,
      items: document.items.map(item => ({
        ...item,
        unitPrice: decimalToNumber(item.unitPrice),
        subtotal: decimalToNumber(item.subtotal),
      })),
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating document:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack")
    
    // Manejo específico de errores de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

    // Error genérico
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error al crear documento",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined
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

    console.log(`🗑️ DELETE batch - ${ids.length} documentos`)

    // Verificar documentos y validar que se puedan eliminar
    const documents = await prisma.document.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, type: true, number: true },
    })

    if (documents.length !== ids.length) {
      return NextResponse.json(
        { error: "Algunos documentos no fueron encontrados" },
        { status: 404 }
      )
    }

    // Prevenir eliminación de documentos completados
    const completedDocs = documents.filter(d => d.status === "COMPLETED")
    if (completedDocs.length > 0) {
      return NextResponse.json(
        { 
          error: "No se pueden eliminar documentos completados. Cancélalos primero.",
          completedIds: completedDocs.map(d => d.id),
          completedNumbers: completedDocs.map(d => `${d.type} #${d.number}`)
        },
        { status: 400 }
      )
    }

    // Eliminar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Items se eliminan automáticamente por CASCADE
      const deleted = await tx.document.deleteMany({
        where: { id: { in: ids } },
      })

      return deleted
    })

    console.log(`✅ ${result.count} documentos eliminados`)

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} documento${result.count !== 1 ? "s" : ""} eliminado${result.count !== 1 ? "s" : ""}`,
    })

  } catch (error) {
    console.error("❌ Error deleting documents:", error)
    return NextResponse.json(
      { 
        error: "Error al eliminar documentos",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    )
  }
}