// src/app/api/seed/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST() {
  try {
    console.log("🧹 Limpiando base de datos...")
    
    // Limpiar todo
    await prisma.productVariant.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.category.deleteMany({})

    console.log("📦 Creando categorías...")

    // =========================================================================
    // CATEGORÍAS REALES
    // =========================================================================
    const categorias = {
      ancla: await prisma.category.create({
        data: { name: "Mejor Precio", description: "Productos de entrada con mejor relación precio-calidad" }
      }),
      equilibrio: await prisma.category.create({
        data: { name: "Más Vendido", description: "Productos de equilibrio entre precio y calidad" }
      }),
      premium: await prisma.category.create({
        data: { name: "Premium", description: "Línea premium de alta gama" }
      }),
      accesorios: await prisma.category.create({
        data: { name: "Accesorios", description: "Protectores, almohadas y sábanas" }
      }),
    }

    console.log("🛏️ Creando productos PIERO reales...")

    // =========================================================================
    // PRODUCTOS REALES DEL PRODUCTGRID
    // =========================================================================

    // ========== MEDITARE EUROPILLOW - Ancla ==========
    const meditareEP = await prisma.product.create({
      data: {
        sku: "MEDITARE-EP",
        name: "Colchón Piero Meditare EuroPillow",
        brand: "PIERO",
        warranty: 5,
        categoryId: categorias.ancla.id,
        isActive: true,
      }
    })

    const meditareEPVariants = [
      { size: "190x80", price: 189900, stockQty: 5 },
      { size: "190x90", price: 234900, stockQty: 8 },
      { size: "190x100", price: 259900, stockQty: 6 },
      { size: "190x130", price: 329900, stockQty: 4 },
      { size: "190x140", price: 354900, stockQty: 7 },
    ]

    for (const v of meditareEPVariants) {
      await prisma.productVariant.create({
        data: {
          productId: meditareEP.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== NIRVANA - Ancla ==========
    const nirvana = await prisma.product.create({
      data: {
        sku: "NIRVANA",
        name: "Colchón Piero Nirvana",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.ancla.id,
        isActive: true,
      }
    })

    const nirvanaVariants = [
      { size: "190x80", price: 324900, stockQty: 3 },
      { size: "190x90", price: 359900, stockQty: 5 },
      { size: "190x100", price: 409900, stockQty: 4 },
      { size: "190x130", price: 514900, stockQty: 3 },
      { size: "190x140", price: 549900, stockQty: 6 },
      { size: "190x160", price: 699900, stockQty: 4 },
      { size: "200x180", price: 769900, stockQty: 2 },
      { size: "200x200", price: 829900, stockQty: 3 },
    ]

    for (const v of nirvanaVariants) {
      await prisma.productVariant.create({
        data: {
          productId: nirvana.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== SONNO EUROPILLOW - Equilibrio ==========
    const sonnoEP = await prisma.product.create({
      data: {
        sku: "SONNO-EP",
        name: "Colchón Piero Sonno EuroPillow",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const sonnoEPVariants = [
      { size: "190x80", price: 289900, stockQty: 4 },
      { size: "190x90", price: 314900, stockQty: 6 },
      { size: "190x100", price: 344900, stockQty: 5 },
      { size: "190x130", price: 434900, stockQty: 3 },
      { size: "190x140", price: 469900, stockQty: 8 },
      { size: "190x160", price: 514900, stockQty: 5 },
    ]

    for (const v of sonnoEPVariants) {
      await prisma.productVariant.create({
        data: {
          productId: sonnoEP.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== REGNO - Equilibrio ==========
    const regno = await prisma.product.create({
      data: {
        sku: "REGNO",
        name: "Colchón Piero Regno",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const regnoVariants = [
      { size: "190x80", price: 299900, stockQty: 3 },
      { size: "190x90", price: 324900, stockQty: 4 },
      { size: "190x140", price: 459900, stockQty: 6 },
      { size: "200x160", price: 544900, stockQty: 4 },
      { size: "200x200", price: 669900, stockQty: 3 },
    ]

    for (const v of regnoVariants) {
      await prisma.productVariant.create({
        data: {
          productId: regno.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== REGNO PILLOW TOP - Equilibrio ==========
    const regnoPT = await prisma.product.create({
      data: {
        sku: "REGNO-PT",
        name: "Colchón Piero Regno Pillow Top",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const regnoPTVariants = [
      { size: "190x140", price: 574900, stockQty: 5 },
      { size: "200x160", price: 659900, stockQty: 4 },
      { size: "200x180", price: 729900, stockQty: 3 },
      { size: "200x200", price: 799900, stockQty: 3 },
    ]

    for (const v of regnoPTVariants) {
      await prisma.productVariant.create({
        data: {
          productId: regnoPT.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== GRAVITA - Equilibrio ==========
    const gravita = await prisma.product.create({
      data: {
        sku: "GRAVITA",
        name: "Colchón Piero Gravita",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const gravitaVariants = [
      { size: "190x140", price: 749900, stockQty: 4 },
      { size: "200x160", price: 924900, stockQty: 3 },
      { size: "200x180", price: 989900, stockQty: 2 },
      { size: "200x200", price: 1049900, stockQty: 2 },
    ]

    for (const v of gravitaVariants) {
      await prisma.productVariant.create({
        data: {
          productId: gravita.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== NAMASTE - Equilibrio ==========
    const namaste = await prisma.product.create({
      data: {
        sku: "NAMASTE",
        name: "Colchón Piero Namaste",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const namasteVariants = [
      { size: "190x140", price: 424900, stockQty: 5 },
      { size: "200x160", price: 539900, stockQty: 4 },
      { size: "200x200", price: 649900, stockQty: 3 },
    ]

    for (const v of namasteVariants) {
      await prisma.productVariant.create({
        data: {
          productId: namaste.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== NAMASTE PILLOW TOP - Equilibrio ==========
    const namastePT = await prisma.product.create({
      data: {
        sku: "NAMASTE-PT",
        name: "Colchón Piero Namaste Pillow Top",
        brand: "PIERO",
        warranty: 10,
        categoryId: categorias.equilibrio.id,
        isActive: true,
      }
    })

    const namastePTVariants = [
      { size: "190x140", price: 539900, stockQty: 4 },
      { size: "200x160", price: 619900, stockQty: 3 },
    ]

    for (const v of namastePTVariants) {
      await prisma.productVariant.create({
        data: {
          productId: namastePT.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== MONTREAUX - Premium ==========
    const montreaux = await prisma.product.create({
      data: {
        sku: "MONTREAUX",
        name: "Colchón Piero Montreaux",
        brand: "PIERO",
        warranty: 15,
        categoryId: categorias.premium.id,
        isActive: true,
      }
    })

    const montreauxVariants = [
      { size: "190x140", price: 789900, stockQty: 3 },
      { size: "200x160", price: 989900, stockQty: 2 },
      { size: "200x200", price: 1119900, stockQty: 2 },
    ]

    for (const v of montreauxVariants) {
      await prisma.productVariant.create({
        data: {
          productId: montreaux.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== MONTREAUX PILLOW TOP - Premium ==========
    const montreauxPT = await prisma.product.create({
      data: {
        sku: "MONTREAUX-PT",
        name: "Colchón Piero Montreaux Pillow Top",
        brand: "PIERO",
        warranty: 15,
        categoryId: categorias.premium.id,
        isActive: true,
      }
    })

    const montreauxPTVariants = [
      { size: "190x140", price: 989900, stockQty: 2 },
      { size: "200x160", price: 1199900, stockQty: 2 },
      { size: "200x180", price: 1289900, stockQty: 1 },
      { size: "200x200", price: 1369900, stockQty: 1 },
    ]

    for (const v of montreauxPTVariants) {
      await prisma.productVariant.create({
        data: {
          productId: montreauxPT.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== DREAM FIT POCKET - Premium ==========
    const dreamfit = await prisma.product.create({
      data: {
        sku: "DREAMFIT-POCKET",
        name: "Colchón Piero Dream Fit Pocket",
        brand: "PIERO",
        warranty: 20,
        categoryId: categorias.premium.id,
        isActive: true,
      }
    })

    const dreamfitVariants = [
      { size: "190x140", price: 1949900, stockQty: 0 },
      { size: "200x160", price: 2249900, stockQty: 0 },
      { size: "200x200", price: 2549900, stockQty: 0 },
    ]

    for (const v of dreamfitVariants) {
      await prisma.productVariant.create({
        data: {
          productId: dreamfit.id,
          size: v.size,
          price: v.price,
          source: "CATALOGO",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // ========== ACCESORIOS ==========
    
    // Protectores
    const protector = await prisma.product.create({
      data: {
        sku: "PROTECTOR-IMP",
        name: "Protector Impermeable Piero",
        brand: "PIERO",
        warranty: 2,
        categoryId: categorias.accesorios.id,
        isActive: true,
      }
    })

    const protectorVariants = [
      { size: "140x190", price: 37900, stockQty: 10 },
      { size: "160x200", price: 42900, stockQty: 8 },
      { size: "200x200", price: 47900, stockQty: 6 },
    ]

    for (const v of protectorVariants) {
      await prisma.productVariant.create({
        data: {
          productId: protector.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    // Almohadas
    const almohadaFibra = await prisma.product.create({
      data: {
        sku: "ALMOHADA-FIBRA",
        name: "Almohada Piero Fibra Smart Tech Plus",
        brand: "PIERO",
        warranty: 1,
        categoryId: categorias.accesorios.id,
        isActive: true,
      }
    })

    await prisma.productVariant.create({
      data: {
        productId: almohadaFibra.id,
        size: "70x50",
        price: 42900,
        source: "STOCK",
        stockQty: 15,
        isActive: true,
      }
    })

    const almohadaMicro = await prisma.product.create({
      data: {
        sku: "ALMOHADA-MICRO",
        name: "Almohada Piero Micro Max Premium",
        brand: "PIERO",
        warranty: 1,
        categoryId: categorias.accesorios.id,
        isActive: true,
      }
    })

    await prisma.productVariant.create({
      data: {
        productId: almohadaMicro.id,
        size: "70x50",
        price: 74900,
        source: "STOCK",
        stockQty: 10,
        isActive: true,
      }
    })

    // Sábanas
    const sabanas = await prisma.product.create({
      data: {
        sku: "SABANAS-BAMBOO",
        name: "Sábanas Bamboo Piero 600 Hilos",
        brand: "PIERO",
        warranty: 1,
        categoryId: categorias.accesorios.id,
        isActive: true,
      }
    })

    const sabanasVariants = [
      { size: "140x190", price: 94900, stockQty: 8 },
      { size: "160x200", price: 124900, stockQty: 6 },
      { size: "200x200", price: 149900, stockQty: 5 },
    ]

    for (const v of sabanasVariants) {
      await prisma.productVariant.create({
        data: {
          productId: sabanas.id,
          size: v.size,
          price: v.price,
          source: "STOCK",
          stockQty: v.stockQty,
          isActive: true,
        }
      })
    }

    console.log("✅ Catálogo PIERO real cargado exitosamente!")

    return NextResponse.json({
      success: true,
      message: "Catálogo completo de ProductGrid cargado",
      stats: {
        categorias: 4,
        productos: 14,
        variantes: 70,
      }
    })

  } catch (error) {
    console.error("❌ Error en seed:", error)
    return NextResponse.json(
      { error: "Error cargando catálogo" },
      { status: 500 }
    )
  }
}