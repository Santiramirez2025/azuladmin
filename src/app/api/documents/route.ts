import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get("search") || ""
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Prisma.DocumentWhereInput = {}

    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { phone: { contains: search, mode: "insensitive" } } },
        { observations: { contains: search, mode: "insensitive" } },
        ...(isNaN(Number(search))
          ? []
          : [{ number: { equals: parseInt(search) } }]),
      ]
    }

    if (type && type !== "all") {
      where.type = type as Prisma.EnumDocumentTypeFilter
    }

    if (status && status !== "all") {
      where.status = status as Prisma.EnumDocumentStatusFilter
    }

    const orderBy: Prisma.DocumentOrderByWithRelationInput = {}
    switch (sortBy) {
      case "number":
        orderBy.number = sortOrder
        break
      case "total":
        orderBy.total = sortOrder
        break
      case "date":
      default:
        orderBy.date = sortOrder
        break
    }

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
      }),
    ])

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
      switch (item.status) {
        case "DRAFT":
          stats.draft = count
          break
        case "SENT":
          stats.sent = count
          break
        case "APPROVED":
          stats.approved = count
          break
        case "COMPLETED":
          stats.completed = count
          break
        case "CANCELLED":
          stats.cancelled = count
          break
        case "EXPIRED":
          stats.expired = count
          break
      }
    })

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Error al obtener documentos" },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Crear documento (SOPORTA PRODUCTOS SUELTOS)
// ============================================================================

interface DocumentItemInput {
  variantId?: string
  isCustom?: boolean
  productName?: string
  productSize?: string
  unitPrice?: number
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      userId,
      type,
      items,
      observations,
      internalNotes,
      validUntil,
      surchargeRate = 0,
      paymentMethod,
      installments,
      shippingType = "Sin cargo en Villa María",
      shippingCost = 0,
    } = body

    if (!clientId || !userId || !type || !items?.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Separar items del catálogo de items custom
    const catalogItems = items.filter((item: DocumentItemInput) => item.variantId && !item.isCustom)
    const customItems = items.filter((item: DocumentItemInput) => item.isCustom || !item.variantId)

    // Obtener datos de variantes del catálogo
    const variantIds = catalogItems.map((item: DocumentItemInput) => item.variantId!)
    const variants = variantIds.length > 0 
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: true },
        })
      : []

    const variantMap = new Map(variants.map((v) => [v.id, v]))

    // Procesar todos los items
    let subtotal = 0
    const processedItems: Prisma.DocumentItemCreateWithoutDocumentInput[] = []

    // Items del catálogo - usar connect para la relación
    for (const item of catalogItems as DocumentItemInput[]) {
      const variant = variantMap.get(item.variantId!)
      if (!variant) {
        return NextResponse.json(
          { error: `Variante ${item.variantId} no encontrada` },
          { status: 400 }
        )
      }

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
      })
    }

    // Items custom (productos sueltos) - sin relación a variant
    for (const item of customItems as DocumentItemInput[]) {
      if (!item.productName || !item.unitPrice) {
        return NextResponse.json(
          { error: "Productos sueltos requieren nombre y precio" },
          { status: 400 }
        )
      }

      const itemSubtotal = item.quantity * item.unitPrice
      subtotal += itemSubtotal

      processedItems.push({
        productName: item.productName,
        productSize: item.productSize || "Único",
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        source: "CATALOGO",
      })
    }

    // Calcular totales
    const surcharge = subtotal * (surchargeRate / 100)
    const total = subtotal + surcharge + Number(shippingCost)

    // Crear documento
    const document = await prisma.document.create({
      data: {
        type,
        status: "DRAFT",
        client: { connect: { id: clientId } },
        createdBy: { connect: { id: userId } },
        subtotal,
        surcharge,
        surchargeRate,
        total,
        observations,
        internalNotes,
        date: new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        paymentMethod,
        installments,
        shippingType,
        shippingCost,
        items: {
          create: processedItems,
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

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Error al crear documento" },
      { status: 500 }
    )
  }
}