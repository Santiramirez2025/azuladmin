import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import {
  handleUnknownError,
  isAuthError,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

const MAX_LIMIT = 500

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const categoryId = searchParams.get("categoryId")
    const source = searchParams.get("source")
    const limitRaw = parseInt(searchParams.get("limit") || "200", 10)
    const limit = Math.min(MAX_LIMIT, Math.max(1, isNaN(limitRaw) ? 200 : limitRaw))

    const where: Prisma.ProductWhereInput = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId
    }
    if (source === "STOCK" || source === "CATALOGO") {
      where.variants = { some: { source } }
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { isActive: true }, orderBy: { size: "asc" } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ items: products, total: products.length, limit })
  } catch (error) {
    return handleUnknownError("products.GET", error)
  }
}
