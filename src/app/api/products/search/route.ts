import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  handleUnknownError,
  isAuthError,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const searchParams = request.nextUrl.searchParams
    const query = (searchParams.get("q") || "").trim()
    const limitRaw = parseInt(searchParams.get("limit") || "20", 10)
    const limit = Math.min(MAX_LIMIT, Math.max(1, isNaN(limitRaw) ? 20 : limitRaw))

    if (query.length < 2) return NextResponse.json({ variants: [] })

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { brand: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
      },
      include: {
        product: { select: { id: true, name: true, brand: true, sku: true } },
      },
      take: limit,
      orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
    })

    const formattedVariants = variants.map((v) => ({
      id: v.id,
      size: v.size,
      price: Number(v.price),
      source: v.source,
      stockQty: v.stockQty,
      product: {
        id: v.product.id,
        name: v.product.name,
        brand: v.product.brand,
        sku: v.product.sku,
      },
    }))

    return NextResponse.json({ variants: formattedVariants })
  } catch (error) {
    return handleUnknownError("products.search.GET", error)
  }
}
