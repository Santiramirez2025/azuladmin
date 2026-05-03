import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { categorySchema } from "@/lib/validations"
import { handleUnknownError, isAuthError, parseJson, requireAdmin } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return handleUnknownError("categories.GET", error)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, categorySchema)
  if (!parsed.ok) return parsed.response

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon ?? null,
        order: parsed.data.order,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return handleUnknownError("categories.POST", error)
  }
}
