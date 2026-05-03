// app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { z } from "zod"
import {
  createDocumentSchema,
  documentsBulkDeleteSchema,
} from "@/lib/validations"
import { calculateBalance, decimalToNumber } from "@/lib/utils"
import {
  errorResponse,
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"
type DocumentStatus = "DRAFT" | "SENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | "EXPIRED"
type PaymentMethod = "CONTADO" | "CUOTAS_3" | "CUOTAS_6" | "CUOTAS_9" | "CUOTAS_12"

type ValidationResult = { valid: true } | { valid: false; error: string; details?: unknown }
type DocumentInput = z.infer<typeof createDocumentSchema>
type DocItem = DocumentInput["items"][number]
type CatalogItem = Extract<DocItem, { variantId: string }>
type CustomItem = Extract<DocItem, { isCustom: true }>

const SURCHARGE_RATES: Record<PaymentMethod, number> = {
  CONTADO: 0,
  CUOTAS_3: 18,
  CUOTAS_6: 25,
  CUOTAS_9: 35,
  CUOTAS_12: 47,
}

function getSurchargeRate(paymentMethod: PaymentMethod | null | undefined): number {
  return paymentMethod ? SURCHARGE_RATES[paymentMethod] ?? 0 : 0
}

async function validateStockAvailability(
  items: DocItem[],
  tx: Prisma.TransactionClient,
): Promise<ValidationResult> {
  const catalogItems = items.filter(isCatalogItem)
  if (catalogItems.length === 0) return { valid: true }

  const variantIds = catalogItems.map((i) => i.variantId)
  const variants = await tx.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: { product: { select: { name: true } } },
  })

  if (variants.length !== variantIds.length) {
    const foundIds = new Set(variants.map((v) => v.id))
    return {
      valid: false,
      error: "Algunos productos no están disponibles o fueron desactivados",
      details: { missingVariantIds: variantIds.filter((id) => !foundIds.has(id)) },
    }
  }

  const variantMap = new Map(variants.map((v) => [v.id, v]))
  for (const item of catalogItems) {
    const variant = variantMap.get(item.variantId)
    if (!variant) continue
    if (variant.source === "STOCK" && variant.stockQty < item.quantity) {
      return {
        valid: false,
        error: `Stock insuficiente para "${variant.product.name} ${variant.size}"`,
        details: {
          product: variant.product.name,
          size: variant.size,
          available: variant.stockQty,
          requested: item.quantity,
          missing: item.quantity - variant.stockQty,
        },
      }
    }
  }
  return { valid: true }
}

function isCatalogItem(item: DocItem): item is CatalogItem {
  return "variantId" in item && !!item.variantId && !item.isCustom
}

function isCustomItem(item: DocItem): item is CustomItem {
  return "isCustom" in item && item.isCustom === true
}

function buildSearchFilter(search: string): Prisma.DocumentWhereInput["OR"] {
  const filters: Prisma.DocumentWhereInput[] = [
    { client: { name: { contains: search, mode: "insensitive" } } },
    { client: { phone: { contains: search } } },
    { client: { city: { contains: search, mode: "insensitive" } } },
    { observations: { contains: search, mode: "insensitive" } },
    { internalNotes: { contains: search, mode: "insensitive" } },
  ]
  const numSearch = parseInt(search, 10)
  if (!isNaN(numSearch)) filters.push({ number: { equals: numSearch } })
  return filters
}

function getSortOrder(
  sortBy: string,
  sortOrder: "asc" | "desc",
): Prisma.DocumentOrderByWithRelationInput {
  switch (sortBy) {
    case "number": return { number: sortOrder }
    case "total": return { total: sortOrder }
    case "client": return { client: { name: sortOrder } }
    case "date":
    default: return { date: sortOrder }
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const sp = request.nextUrl.searchParams
    const search = sp.get("search")?.trim() || ""
    const type = sp.get("type") || "all"
    const status = sp.get("status") || "all"
    const clientId = sp.get("clientId") || undefined
    const sortBy = sp.get("sortBy") || "date"
    const sortOrder = (sp.get("sortOrder") || "desc") as "asc" | "desc"
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20))
    const skip = (page - 1) * limit

    const where: Prisma.DocumentWhereInput = {}
    if (search) where.OR = buildSearchFilter(search)
    if (type && type !== "all") where.type = type as DocumentType
    if (status && status !== "all") where.status = status as DocumentStatus
    if (clientId) where.clientId = clientId

    const orderBy = getSortOrder(sortBy, sortOrder)

    const [items, total, statsData] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, phone: true, address: true, city: true, province: true },
          },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.document.count({ where }),
      prisma.document.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: type && type !== "all" ? { type: type as DocumentType } : undefined,
      }),
    ])

    const stats = { total: 0, draft: 0, sent: 0, approved: 0, completed: 0, cancelled: 0, expired: 0 }
    for (const item of statsData) {
      const count = item._count._all
      stats.total += count
      const k = item.status.toLowerCase() as keyof typeof stats
      if (k in stats) stats[k] = count
    }

    const serializedItems = items.map((item) => ({
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
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
      hasMore: page < Math.ceil(total / limit),
    })
  } catch (error) {
    return handleUnknownError("documents.GET", error)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, createDocumentSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true },
    })
    if (!client) return errorResponse(404, "El cliente especificado no existe")

    let userId = data.userId
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
      if (!defaultUser) {
        return errorResponse(400, "No hay usuarios en el sistema. Crea un usuario primero.")
      }
      userId = defaultUser.id
    }

    const document = await prisma.$transaction(async (tx) => {
      const needsStockValidation =
        (data.type === "RECIBO" || data.type === "REMITO") &&
        data.items.some((item) => isCatalogItem(item))

      if (needsStockValidation) {
        const stockValidation = await validateStockAvailability(data.items, tx)
        if (!stockValidation.valid) throw new Error(stockValidation.error)
      }

      const catalogItems = data.items.filter(isCatalogItem)
      const customItems = data.items.filter(isCustomItem)

      let variants: Array<
        Prisma.ProductVariantGetPayload<{
          include: { product: { select: { name: true; brand: true } } }
        }>
      > = []
      if (catalogItems.length > 0) {
        variants = await tx.productVariant.findMany({
          where: { id: { in: catalogItems.map((i) => i.variantId) }, isActive: true },
          include: { product: { select: { name: true, brand: true } } },
        })
      }
      const variantMap = new Map(variants.map((v) => [v.id, v]))

      let subtotal = 0
      const processedItems: Prisma.DocumentItemCreateWithoutDocumentInput[] = []

      for (const item of catalogItems) {
        const variant = variantMap.get(item.variantId)
        if (!variant) throw new Error(`Variante ${item.variantId} no encontrada`)
        const itemSubtotal = item.quantity * decimalToNumber(variant.price)
        subtotal += itemSubtotal
        processedItems.push({
          variant: { connect: { id: item.variantId } },
          productName: variant.product.name,
          productSize: variant.size,
          unitPrice: variant.price,
          quantity: item.quantity,
          subtotal: new Decimal(itemSubtotal),
          source: variant.source,
          isCustom: false,
        })
      }

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

      const surchargeRate = data.paymentMethod
        ? getSurchargeRate(data.paymentMethod as PaymentMethod)
        : data.surchargeRate || 0
      const surcharge = Math.round(subtotal * (surchargeRate / 100))
      const shippingCost = data.shippingCost || 0
      const total = subtotal + surcharge + shippingCost
      const amountPaid = data.amountPaid || 0

      if (amountPaid > total) {
        throw new Error(`El monto pagado ($${amountPaid}) no puede ser mayor al total ($${total})`)
      }
      const balance = calculateBalance(total, amountPaid)

      let initialStatus: DocumentStatus = "DRAFT"
      if (data.type === "RECIBO" && balance === 0 && amountPaid > 0) {
        initialStatus = "COMPLETED"
      }

      const validUntilDate = data.validUntil ? new Date(data.validUntil) : null

      const newDocument = await tx.document.create({
        data: {
          type: data.type,
          status: initialStatus,
          client: { connect: { id: data.clientId } },
          createdBy: { connect: { id: userId } },
          subtotal: new Decimal(subtotal),
          surcharge: new Decimal(surcharge),
          surchargeRate,
          shippingCost: new Decimal(shippingCost),
          total: new Decimal(total),
          amountPaid: amountPaid > 0 ? new Decimal(amountPaid) : null,
          balance: balance > 0 ? new Decimal(balance) : null,
          paymentMethod: (data.paymentMethod as PaymentMethod) || null,
          installments: data.installments || null,
          paymentType: data.paymentType || null,
          shippingType: data.shippingType,
          observations: data.observations?.trim() || null,
          internalNotes: data.internalNotes?.trim() || null,
          date: new Date(),
          validUntil: validUntilDate,
          items: { create: processedItems },
        },
        include: {
          client: true,
          createdBy: { select: { id: true, name: true } },
          items: { include: { variant: { include: { product: true } } } },
        },
      })

      if (initialStatus === "COMPLETED" && (data.type === "RECIBO" || data.type === "REMITO")) {
        for (const item of catalogItems) {
          const variant = variantMap.get(item.variantId)
          if (variant?.source === "STOCK") {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            })
          }
        }
      }

      return newDocument
    })

    const response = {
      ...document,
      subtotal: decimalToNumber(document.subtotal),
      surcharge: decimalToNumber(document.surcharge),
      total: decimalToNumber(document.total),
      shippingCost: decimalToNumber(document.shippingCost),
      amountPaid: document.amountPaid ? decimalToNumber(document.amountPaid) : null,
      balance: document.balance ? decimalToNumber(document.balance) : null,
      items: document.items.map((item) => ({
        ...item,
        unitPrice: decimalToNumber(item.unitPrice),
        subtotal: decimalToNumber(item.subtotal),
      })),
    }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return errorResponse(409, "Ya existe un documento con ese número")
      if (error.code === "P2025") return errorResponse(404, "Registro no encontrado")
      if (error.code === "P2003") return errorResponse(400, "Relación inválida — verificá cliente y usuario")
    }
    if (error instanceof Error) {
      return errorResponse(400, error.message)
    }
    return handleUnknownError("documents.POST", error)
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, documentsBulkDeleteSchema)
  if (!parsed.ok) return parsed.response
  const { ids } = parsed.data

  try {
    const documents = await prisma.document.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, type: true, number: true },
    })
    if (documents.length !== ids.length) {
      return errorResponse(404, "Algunos documentos no fueron encontrados")
    }

    const completedDocs = documents.filter((d) => d.status === "COMPLETED")
    if (completedDocs.length > 0) {
      return NextResponse.json(
        {
          error: "No se pueden eliminar documentos completados. Cancélalos primero.",
          completedIds: completedDocs.map((d) => d.id),
          completedNumbers: completedDocs.map((d) => `${d.type} #${d.number}`),
        },
        { status: 400 },
      )
    }

    const result = await prisma.document.deleteMany({ where: { id: { in: ids } } })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} documento${result.count !== 1 ? "s" : ""} eliminado${result.count !== 1 ? "s" : ""}`,
    })
  } catch (error) {
    return handleUnknownError("documents.DELETE", error)
  }
}
