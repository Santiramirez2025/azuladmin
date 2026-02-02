import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/products/quick
 * Crea un producto rápido con una variante
 * Usado para agregar productos al vuelo durante la creación de documentos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, size, price, categoryId } = body

    // Validate required fields
    if (!name || !size || !price) {
      return NextResponse.json(
        { error: "Nombre, medida y precio son requeridos" },
        { status: 400 }
      )
    }

    // Buscar o crear categoría "Otros" para productos rápidos
    let category = await prisma.category.findFirst({
      where: { name: "Otros" },
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Otros",
          icon: "📦",
          order: 99,
        },
      })
    }

    // Generar SKU único
    const timestamp = Date.now().toString(36).toUpperCase()
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase()
    const sku = `QUICK-${timestamp}-${randomPart}`

    // Crear producto con variante
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId: categoryId || category.id,
        brand: "OTRO",
        description: "Producto creado rápidamente",
        warranty: 1,
        isActive: true,
        variants: {
          create: {
            size,
            price,
            source: "CATALOGO",
            stockQty: 0,
            minStock: 0,
            isActive: true,
          },
        },
      },
      include: {
        variants: true,
        category: true,
      },
    })

    return NextResponse.json({
      product,
      variant: product.variants[0],
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating quick product:", error)
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    )
  }
}
