import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { quickProductSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, quickProductSchema)
  if (!parsed.ok) return parsed.response
  const { name, size, price, categoryId, brand, warranty } = parsed.data

  try {
    let category = categoryId
      ? await prisma.category.findUnique({ where: { id: categoryId } })
      : null

    if (!category) {
      category = await prisma.category.findFirst({ where: { name: "Otros" } })
      if (!category) {
        category = await prisma.category.create({
          data: { name: "Otros", icon: "📦", order: 99 },
        })
      }
    }

    const sku = `QUICK-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId: category.id,
        brand: brand ?? "OTRO",
        description: "Producto creado rápidamente",
        warranty: warranty ?? 1,
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
      include: { variants: true, category: true },
    })

    return NextResponse.json(
      { product, variant: product.variants[0] },
      { status: 201 },
    )
  } catch (error) {
    return handleUnknownError("products.quick.POST", error)
  }
}
