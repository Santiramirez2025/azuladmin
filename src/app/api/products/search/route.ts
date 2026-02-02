import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/products/search?q=colchon
 * Busca productos y variantes para el selector
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "20")

    if (query.length < 2) {
      return NextResponse.json({ variants: [] })
    }

    // Buscar variantes con sus productos
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
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            sku: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { product: { name: "asc" } },
        { size: "asc" },
      ],
    })

    // Formatear respuesta
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
    console.error("Error searching products:", error)
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    )
  }
}
