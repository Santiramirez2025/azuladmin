import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId")
    const source = searchParams.get("source")

    const where: any = {
      isActive: true,
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filtro por categoría
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId
    }

    // Filtro por source (STOCK o CATALOGO)
    if (source && source !== "all") {
      where.variants = {
        some: {
          source: source,
        },
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            size: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      items: products,
      total: products.length,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500 }
    )
  }
}