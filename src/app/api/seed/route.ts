import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// Datos de ejemplo - Productos PIERO
const CATEGORIES = [
  { name: "Colchones", icon: "🛏️", order: 1 },
  { name: "Sommiers", icon: "🛋️", order: 2 },
  { name: "Almohadas", icon: "💤", order: 3 },
  { name: "Accesorios", icon: "🎁", order: 4 },
]

const SIZES = ["080x190", "090x190", "100x190", "140x190", "150x190", "160x200", "180x200", "200x200"]

const PRODUCTS = [
  // Colchones Premium
  { name: "Nirvana", sku: "NIRV", category: "Colchones", warranty: 10, basePrice: 450000 },
  { name: "Meditare EP", sku: "MEDT", category: "Colchones", warranty: 10, basePrice: 380000 },
  { name: "Paraíso Real", sku: "PARA", category: "Colchones", warranty: 10, basePrice: 420000 },
  { name: "Montreaux", sku: "MONT", category: "Colchones", warranty: 10, basePrice: 520000 },
  
  // Colchones Línea Media
  { name: "Duplex", sku: "DPLX", category: "Colchones", warranty: 5, basePrice: 280000 },
  { name: "Foam", sku: "FOAM", category: "Colchones", warranty: 5, basePrice: 220000 },
  { name: "Belmo", sku: "BELM", category: "Colchones", warranty: 5, basePrice: 250000 },
  { name: "Continental", sku: "CONT", category: "Colchones", warranty: 5, basePrice: 320000 },
  
  // Colchones Económicos
  { name: "Espuma 18", sku: "ESP18", category: "Colchones", warranty: 3, basePrice: 120000 },
  { name: "Espuma 20", sku: "ESP20", category: "Colchones", warranty: 3, basePrice: 140000 },
  { name: "Espuma 23", sku: "ESP23", category: "Colchones", warranty: 3, basePrice: 160000 },
  
  // Sommiers
  { name: "Sommier Grey", sku: "SOMG", category: "Sommiers", warranty: 5, basePrice: 180000 },
  { name: "Sommier Premium", sku: "SOMP", category: "Sommiers", warranty: 5, basePrice: 250000 },
  { name: "Base Box", sku: "BBOX", category: "Sommiers", warranty: 5, basePrice: 150000 },
  
  // Almohadas
  { name: "Almohada Viscoelástica", sku: "ALVI", category: "Almohadas", warranty: 2, basePrice: 35000 },
  { name: "Almohada Fibra", sku: "ALFI", category: "Almohadas", warranty: 1, basePrice: 18000 },
  { name: "Almohada Cervical", sku: "ALCE", category: "Almohadas", warranty: 2, basePrice: 45000 },
  
  // Accesorios
  { name: "Cubrecolchón Impermeable", sku: "CCIM", category: "Accesorios", warranty: 1, basePrice: 25000 },
  { name: "Protector de Almohada", sku: "PRAL", category: "Accesorios", warranty: 1, basePrice: 8000 },
  { name: "Sábanas 200 Hilos", sku: "SAB2", category: "Accesorios", warranty: 1, basePrice: 35000 },
]

// Multiplicadores de precio por medida
const SIZE_MULTIPLIERS: Record<string, number> = {
  "080x190": 0.75,
  "090x190": 0.85,
  "100x190": 0.9,
  "140x190": 1.0,
  "150x190": 1.1,
  "160x200": 1.25,
  "180x200": 1.4,
  "200x200": 1.55,
}

// POST /api/seed - Poblar base de datos con datos iniciales
export async function POST() {
  try {
    // Verificar si ya hay datos
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      return NextResponse.json(
        { message: "La base de datos ya tiene productos", count: existingProducts },
        { status: 200 }
      )
    }

    // Crear usuario admin
    const user = await prisma.user.upsert({
      where: { email: "admin@azulcolchones.com" },
      update: {},
      create: {
        email: "admin@azulcolchones.com",
        name: "Santiago",
        role: "ADMIN",
      },
    })

    // Crear categorías
    const categoryMap = new Map<string, string>()
    for (const cat of CATEGORIES) {
      const created = await prisma.category.upsert({
        where: { name: cat.name },
        update: { icon: cat.icon, order: cat.order },
        create: cat,
      })
      categoryMap.set(cat.name, created.id)
    }

    // Crear productos con variantes
    let productCount = 0
    let variantCount = 0

    for (const product of PRODUCTS) {
      const categoryId = categoryMap.get(product.category)
      if (!categoryId) continue

      const created = await prisma.product.create({
        data: {
          sku: product.sku,
          name: product.name,
          categoryId,
          brand: "PIERO",
          warranty: product.warranty,
          isActive: true,
        },
      })

      productCount++

      // Crear variantes por medida
      // Almohadas y accesorios solo tienen una variante
      if (product.category === "Almohadas" || product.category === "Accesorios") {
        await prisma.productVariant.create({
          data: {
            productId: created.id,
            size: "Único",
            price: product.basePrice,
            source: Math.random() > 0.7 ? "STOCK" : "CATALOGO",
            stockQty: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
            isActive: true,
          },
        })
        variantCount++
      } else {
        // Colchones y sommiers tienen variantes por medida
        for (const size of SIZES) {
          const multiplier = SIZE_MULTIPLIERS[size] || 1
          const price = Math.round(product.basePrice * multiplier)
          
          // Algunos productos en stock, la mayoría en catálogo
          const isStock = Math.random() > 0.8
          
          await prisma.productVariant.create({
            data: {
              productId: created.id,
              size,
              price,
              source: isStock ? "STOCK" : "CATALOGO",
              stockQty: isStock ? Math.floor(Math.random() * 3) + 1 : 0,
              isActive: true,
            },
          })
          variantCount++
        }
      }
    }

    // Crear configuración inicial
    await prisma.setting.upsert({
      where: { key: "company_info" },
      update: {},
      create: {
        key: "company_info",
        value: {
          name: "Azul Colchones",
          address: "Balerdi 855",
          city: "Villa María",
          province: "Córdoba",
          phone: "0353-4XXXXXX",
          whatsapp: "+5493534XXXXXX",
          email: "info@azulcolchones.com",
        },
      },
    })

    await prisma.setting.upsert({
      where: { key: "payment_rates" },
      update: {},
      create: {
        key: "payment_rates",
        value: {
          "1": 0,
          "3": 18,
          "6": 25,
          "9": 35,
          "12": 47,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Base de datos poblada exitosamente",
      data: {
        user: user.email,
        categories: CATEGORIES.length,
        products: productCount,
        variants: variantCount,
      },
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { error: "Error al poblar base de datos", details: String(error) },
      { status: 500 }
    )
  }
}
