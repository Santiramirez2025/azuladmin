// src/app/api/products/clear/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
    // 1. Eliminar todas las variantes
    await prisma.productVariant.deleteMany({})
    
    // 2. Eliminar todos los productos
    await prisma.product.deleteMany({})
    
    // 3. Eliminar todas las categorías
    await prisma.category.deleteMany({})
    
    console.log("✅ Base de datos limpiada completamente")
    
    return NextResponse.json({ 
      success: true,
      message: "Todos los productos, variantes y categorías eliminados"
    })
  } catch (error) {
    console.error("❌ Error limpiando base de datos:", error)
    return NextResponse.json(
      { error: "Error al limpiar base de datos" },
      { status: 500 }
    )
  }
}