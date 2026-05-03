// src/app/api/products/clear/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { timingSafeEqualStrings } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_OPS !== "true") {
    return NextResponse.json({ error: "Endpoint deshabilitado en producción" }, { status: 403 })
  }
  const expected = process.env.ADMIN_SETUP_SECRET
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET no configurado" }, { status: 500 })
  }
  const provided = request.headers.get("x-admin-secret") ?? ""
  if (!timingSafeEqualStrings(provided, expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    await prisma.productVariant.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.category.deleteMany({})

    return NextResponse.json({
      success: true,
      message: "Todos los productos, variantes y categorías eliminados",
    })
  } catch (error) {
    console.error("Error limpiando base de datos:", error)
    return NextResponse.json(
      { error: "Error al limpiar base de datos" },
      { status: 500 },
    )
  }
}
