// app/api/seed/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // Limpiar datos existentes
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()

    // ============================================================================
    // CATEGORÍAS
    // ============================================================================

    const categories = await prisma.category.createMany({
      data: [
        { name: "Colchones Ancla" },
        { name: "Colchones Equilibrio" },
        { name: "Colchones Premium" },
        { name: "Sommiers" },
        { name: "Protectores" },
        { name: "Almohadas" },
        { name: "Sábanas" },
      ],
    })

    const cats = await prisma.category.findMany()
    const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]))

    // ============================================================================
    // HELPER
    // ============================================================================

    type VariantInput = {
      size: string
      price: number
      source: "STOCK" | "CATALOGO"
      stockQty: number
      isActive: boolean
    }

    async function createProduct(data: {
      sku: string
      name: string
      brand: string
      warranty: number
      categoryId: string
      variants: VariantInput[]
    }) {
      const product = await prisma.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          brand: data.brand,
          warranty: data.warranty,
          isActive: true,
          categoryId: data.categoryId,
        },
      })
      await prisma.productVariant.createMany({
        data: data.variants.map((v) => ({ ...v, productId: product.id })),
      })
      return product
    }

    // ============================================================================
    // COLCHONES ANCLA
    // ============================================================================

    // MEDITARE EUROPILLOW
    await createProduct({
      sku: "MED-EP",
      name: "Meditare EuroPillow",
      brand: "PIERO",
      warranty: 5,
      categoryId: catMap["Colchones Ancla"],
      variants: [
        { size: "190x80 (1 plaza)",    price: 189900, source: "STOCK", stockQty: 5, isActive: true },
        { size: "190x90 (1 plaza)",    price: 234900, source: "STOCK", stockQty: 5, isActive: true },
        { size: "190x100 (1 plaza)",   price: 259900, source: "STOCK", stockQty: 5, isActive: true },
        { size: "190x130 (1½ plaza)",  price: 329900, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x140 (2 plazas)",  price: 354900, source: "STOCK", stockQty: 4, isActive: true },
      ],
    })

    // NIRVANA
    await createProduct({
      sku: "NIRV",
      name: "Nirvana",
      brand: "PIERO",
      warranty: 5,
      categoryId: catMap["Colchones Ancla"],
      variants: [
        { size: "190x80 (1 plaza)",    price: 324900,  source: "STOCK",    stockQty: 4, isActive: true },
        { size: "190x90 (1 plaza)",    price: 359900,  source: "STOCK",    stockQty: 4, isActive: true },
        { size: "190x100 (1 plaza)",   price: 409900,  source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x130 (1½ plaza)",  price: 514900,  source: "STOCK",    stockQty: 2, isActive: true },
        { size: "190x140 (2 plazas)",  price: 549900,  source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x160 (2 plazas)",  price: 699900,  source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x180 (Queen)",     price: 769900,  source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 829900,  source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // ============================================================================
    // COLCHONES EQUILIBRIO
    // ============================================================================

    // SONNO EUROPILLOW
    await createProduct({
      sku: "SONN-EP",
      name: "Sonno EuroPillow",
      brand: "PIERO",
      warranty: 5,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x80 (1 plaza)",    price: 289900, source: "STOCK",    stockQty: 4, isActive: true },
        { size: "190x90 (1 plaza)",    price: 314900, source: "STOCK",    stockQty: 4, isActive: true },
        { size: "190x100 (1 plaza)",   price: 344900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x130 (1½ plaza)",  price: 434900, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "190x140 (2 plazas)",  price: 469900, source: "STOCK",    stockQty: 5, isActive: true },
        { size: "190x160 (2 plazas)",  price: 514900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // REGNO
    await createProduct({
      sku: "REGN",
      name: "Regno",
      brand: "PIERO",
      warranty: 7,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x80 (1 plaza)",    price: 299900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x90 (1 plaza)",    price: 324900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x100 (1 plaza)",   price: 360000, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "190x140 (2 plazas)",  price: 459900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "200x160 (Queen)",     price: 544900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 669900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // REGNO PILLOW TOP
    await createProduct({
      sku: "REGN-PT",
      name: "Regno Pillow Top",
      brand: "PIERO",
      warranty: 7,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 574900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "200x160 (Queen)",     price: 659900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x180 (Queen XL)",  price: 729900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 799900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // GRAVITA
    await createProduct({
      sku: "GRAV",
      name: "Gravita",
      brand: "PIERO",
      warranty: 7,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 749900,  source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x160 (Queen)",     price: 924900,  source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x180 (Queen XL)",  price: 989900,  source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 1049900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // NAMASTE
    await createProduct({
      sku: "NAMA",
      name: "Namaste",
      brand: "PIERO",
      warranty: 5,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x80 (1 plaza)",    price: 260000, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x90 (1 plaza)",    price: 290000, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "190x100 (1 plaza)",   price: 320000, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "190x140 (2 plazas)",  price: 424900, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "200x160 (Queen)",     price: 539900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 649900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // NAMASTE PILLOW TOP
    await createProduct({
      sku: "NAMA-PT",
      name: "Namaste Pillow Top",
      brand: "PIERO",
      warranty: 5,
      categoryId: catMap["Colchones Equilibrio"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 539900, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x160 (Queen)",     price: 619900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // ============================================================================
    // COLCHONES PREMIUM
    // ============================================================================

    // MONTREAUX
    await createProduct({
      sku: "MONT",
      name: "Montreaux",
      brand: "PIERO",
      warranty: 10,
      categoryId: catMap["Colchones Premium"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 789900,  source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x160 (Queen)",     price: 989900,  source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x180 (Queen XL)",  price: 1100000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 1119900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // MONTREAUX PILLOW TOP
    await createProduct({
      sku: "MONT-PT",
      name: "Montreaux Pillow Top",
      brand: "PIERO",
      warranty: 10,
      categoryId: catMap["Colchones Premium"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 989900,  source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x160 (Queen)",     price: 1199900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x180 (Queen XL)",  price: 1289900, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 1369900, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // DREAM FIT POCKET
    await createProduct({
      sku: "DF-POCKET",
      name: "Dream Fit Pocket",
      brand: "PIERO",
      warranty: 10,
      categoryId: catMap["Colchones Premium"],
      variants: [
        { size: "190x140 (2 plazas)",  price: 1600000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x160 (Queen)",     price: 1900000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200 (King)",      price: 2100000, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // DREAM FIT FOAM
    await createProduct({
      sku: "DF-FOAM",
      name: "Dream Fit Foam",
      brand: "PIERO",
      warranty: 10,
      categoryId: catMap["Colchones Premium"],
      variants: [
        { size: "190x140x32 (2 plazas)", price: 1500000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x160x32 (Queen)",    price: 1750000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200x32 (King)",     price: 1950000, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // ============================================================================
    // SOMMIERS
    // ============================================================================

    // DREAM FIT
    await createProduct({
      sku: "SOM-DF",
      name: "Sommier Dream Fit",
      brand: "PIERO",
      warranty: 3,
      categoryId: catMap["Sommiers"],
      variants: [
        { size: "190x140", price: 500000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x160", price: 800000, source: "CATALOGO", stockQty: 0, isActive: true },
        { size: "200x200", price: 850000, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // BROWN
    await createProduct({
      sku: "SOM-BROWN",
      name: "Sommier Brown",
      brand: "PIERO",
      warranty: 3,
      categoryId: catMap["Sommiers"],
      variants: [
        { size: "190x80",  price: 170000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "190x90",  price: 180000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "190x100", price: 190000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x130", price: 210000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "190x140", price: 220000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "190x160", price: 380000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "200x180", price: 380000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "200x200", price: 390000, source: "STOCK", stockQty: 2, isActive: true },
      ],
    })

    // GREY
    await createProduct({
      sku: "SOM-GREY",
      name: "Sommier Grey",
      brand: "PIERO",
      warranty: 3,
      categoryId: catMap["Sommiers"],
      variants: [
        { size: "190x80",  price: 150000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "190x90",  price: 160000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "190x100", price: 180000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x140", price: 200000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "200x160", price: 320000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "200x180", price: 330000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "200x200", price: 350000, source: "STOCK", stockQty: 2, isActive: true },
      ],
    })

    // SOGNARE
    await createProduct({
      sku: "SOM-SOGN",
      name: "Sommier Sognare",
      brand: "PIERO",
      warranty: 3,
      categoryId: catMap["Sommiers"],
      variants: [
        { size: "190x80",  price: 160000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x90",  price: 170000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x100", price: 180000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "190x130", price: 200000, source: "STOCK", stockQty: 2, isActive: true },
        { size: "190x140", price: 220000, source: "STOCK", stockQty: 3, isActive: true },
        { size: "190x160", price: 320000, source: "STOCK", stockQty: 2, isActive: true },
      ],
    })

    // EXCLUSIVO
    await createProduct({
      sku: "SOM-EXCL",
      name: "Sommier Exclusivo",
      brand: "PIERO",
      warranty: 3,
      categoryId: catMap["Sommiers"],
      variants: [
        { size: "190x140", price: 200000, source: "STOCK",    stockQty: 3, isActive: true },
        { size: "200x160", price: 350000, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x180", price: 350000, source: "STOCK",    stockQty: 2, isActive: true },
        { size: "200x200", price: 390000, source: "CATALOGO", stockQty: 0, isActive: true },
      ],
    })

    // ============================================================================
    // PROTECTORES
    // ============================================================================

    // PROCOL 4 ELÁSTICOS
    await createProduct({
      sku: "PROT-PROCOL",
      name: "Cubre Colchón Procol (4 elásticos)",
      brand: "PROCOL",
      warranty: 1,
      categoryId: catMap["Protectores"],
      variants: [
        { size: "190x80 cm",       price: 16000, source: "STOCK", stockQty: 10, isActive: true },
        { size: "190x90 cm",       price: 17000, source: "STOCK", stockQty: 10, isActive: true },
        { size: "190x100 cm",      price: 18000, source: "STOCK", stockQty: 8,  isActive: true },
        { size: "190x140 cm",      price: 22000, source: "STOCK", stockQty: 8,  isActive: true },
        { size: "200x160 cm (Queen)", price: 27000, source: "STOCK", stockQty: 6, isActive: true },
        { size: "200x180 cm",      price: 29000, source: "STOCK", stockQty: 5,  isActive: true },
        { size: "200x200 cm (King)", price: 32000, source: "STOCK", stockQty: 5, isActive: true },
      ],
    })

    // LATERAL
    await createProduct({
      sku: "PROT-LAT",
      name: "Cubre Colchón Lateral",
      brand: "PROCOL",
      warranty: 1,
      categoryId: catMap["Protectores"],
      variants: [
        { size: "190x80 cm",       price: 30000, source: "STOCK", stockQty: 8,  isActive: true },
        { size: "190x90 cm",       price: 31000, source: "STOCK", stockQty: 8,  isActive: true },
        { size: "190x100 cm",      price: 32000, source: "STOCK", stockQty: 6,  isActive: true },
        { size: "190x140 cm",      price: 37000, source: "STOCK", stockQty: 6,  isActive: true },
        { size: "200x160 cm (Queen)", price: 58000, source: "STOCK", stockQty: 4, isActive: true },
        { size: "200x180 cm",      price: 63000, source: "STOCK", stockQty: 3,  isActive: true },
        { size: "200x200 cm (King)", price: 75000, source: "STOCK", stockQty: 3, isActive: true },
      ],
    })

    // ============================================================================
    // ALMOHADAS
    // ============================================================================

    // VISCO DREAM FIT CLÁSICA
    await createProduct({
      sku: "ALM-VDF-CLAS",
      name: "Almohada Visco Dream Fit Clásica",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "62x40 cm", price: 120000, source: "STOCK",    stockQty: 8, isActive: true },
        { size: "90x40 cm", price: 0,      source: "CATALOGO", stockQty: 0, isActive: false },
      ],
    })

    // VISCO DREAM FIT CERVICAL
    await createProduct({
      sku: "ALM-VDF-CERV",
      name: "Almohada Visco Dream Fit Cervical",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "57x37 cm", price: 120000, source: "STOCK", stockQty: 8, isActive: true },
      ],
    })

    // VISCO DREAM TECH
    await createProduct({
      sku: "ALM-VDT",
      name: "Almohada Visco Dream Tech",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "70x40 cm", price: 115000, source: "STOCK", stockQty: 6, isActive: true },
      ],
    })

    // MICRO MAX TECH ROLLO
    await createProduct({
      sku: "ALM-MMT-ROLLO",
      name: "Almohada Micro Max Tech Rollo",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "70x50 cm", price: 85000, source: "STOCK", stockQty: 8,  isActive: true },
        { size: "80x50 cm", price: 90000, source: "STOCK", stockQty: 6,  isActive: true },
        { size: "90x50 cm", price: 95000, source: "STOCK", stockQty: 4,  isActive: true },
      ],
    })

    // FIBRA SMART TECH PLUS
    await createProduct({
      sku: "ALM-FST-PLUS",
      name: "Almohada Fibra Smart Tech Plus",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "70x50 cm", price: 65000, source: "STOCK", stockQty: 10, isActive: true },
        { size: "80x50 cm", price: 67000, source: "STOCK", stockQty: 8,  isActive: true },
      ],
    })

    // MICRO MAX TECH NÚCLEO
    await createProduct({
      sku: "ALM-MMT-NUC",
      name: "Almohada Micro Max Tech Núcleo",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "70x40 cm", price: 105000, source: "STOCK", stockQty: 6, isActive: true },
      ],
    })

    // FIBRA SMART TECH CONFORT
    await createProduct({
      sku: "ALM-FST-CONF",
      name: "Almohada Fibra Smart Tech Confort",
      brand: "PIERO",
      warranty: 2,
      categoryId: catMap["Almohadas"],
      variants: [
        { size: "70x40 cm", price: 60000, source: "STOCK", stockQty: 10, isActive: true },
        { size: "80x40 cm", price: 60000, source: "STOCK", stockQty: 8,  isActive: true },
      ],
    })

    // ============================================================================
    // SÁBANAS
    // ============================================================================

    await createProduct({
      sku: "SAB-BAMBOO-600",
      name: "Sábanas Bamboo 600 Hilos",
      brand: "PIERO",
      warranty: 1,
      categoryId: catMap["Sábanas"],
      variants: [
        { size: "140x190 cm",      price: 94900,  source: "STOCK", stockQty: 6, isActive: true },
        { size: "160x200 cm (Queen)", price: 124900, source: "STOCK", stockQty: 4, isActive: true },
        { size: "200x200 cm (King)", price: 149900, source: "STOCK", stockQty: 3, isActive: true },
      ],
    })

    return NextResponse.json({ 
      success: true, 
      message: "Datos cargados correctamente" 
    })

  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: "Error al cargar los datos" },
      { status: 500 }
    )
  }
}