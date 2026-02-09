import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"  // ← Cambio aquí
import { categorySchema } from "@/lib/validations"

// GET /api/categories - Listar categorías
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}

// POST /api/categories - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        icon: validatedData.icon || null,
        order: validatedData.order,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    )
  }
}