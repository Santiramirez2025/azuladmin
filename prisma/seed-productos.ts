/**
 * SEED PARA PRODUCTOS PIERO - Azul Admin
 * 
 * Este script puebla la base de datos con todos los productos
 * del catálogo optimizado del e-commerce
 * 
 * Ejecutar con: npx ts-node prisma/seed-productos.ts
 */

import { PrismaClient, StockSource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando seed de productos PIERO...')

  // ========================================================================
  // 1. CREAR CATEGORÍAS
  // ========================================================================
  
  console.log('📦 Creando categorías...')
  
  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Colchones Ancla' },
      update: {},
      create: {
        name: 'Colchones Ancla',
        icon: '🎯',
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Colchones Equilibrio' },
      update: {},
      create: {
        name: 'Colchones Equilibrio',
        icon: '⭐',
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Colchones Premium' },
      update: {},
      create: {
        name: 'Colchones Premium',
        icon: '👑',
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Accesorios' },
      update: {},
      create: {
        name: 'Accesorios',
        icon: '💎',
        order: 4,
      },
    }),
  ])

  const [catAncla, catEquilibrio, catPremium, catAccesorios] = categorias
  
  console.log(`✅ ${categorias.length} categorías creadas`)

  // ========================================================================
  // 2. PRODUCTOS ANCLA - Meditare EuroPillow & Nirvana
  // ========================================================================
  
  console.log('🛏️  Creando productos ANCLA...')
  
  // --- MEDITARE EUROPILLOW ---
  const meditareEP = await prisma.product.create({
    data: {
      sku: 'PIERO-MEDITARE-EP',
      name: 'Colchón Piero Meditare EuroPillow',
      categoryId: catAncla.id,
      brand: 'PIERO',
      description: 'Colchón de resortes con pillow incorporado. Excelente relación calidad-precio.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x80', price: 189900, costPrice: 150000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x90', price: 234900, costPrice: 185000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x100', price: 259900, costPrice: 205000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x130', price: 329900, costPrice: 260000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '190x140', price: 354900, costPrice: 280000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
        ],
      },
    },
  })

  // --- NIRVANA ---
  const nirvana = await prisma.product.create({
    data: {
      sku: 'PIERO-NIRVANA',
      name: 'Colchón Piero Nirvana',
      categoryId: catAncla.id,
      brand: 'PIERO',
      description: 'Alta densidad con espuma viscoelástica. Uno de los más vendidos.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x80', price: 324900, costPrice: 255000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x90', price: 359900, costPrice: 285000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
          { size: '190x100', price: 409900, costPrice: 325000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x130', price: 514900, costPrice: 410000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x140', price: 549900, costPrice: 435000, source: StockSource.CATALOGO, stockQty: 0, minStock: 4 },
          { size: '190x160', price: 699900, costPrice: 555000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
          { size: '200x180', price: 769900, costPrice: 610000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x200', price: 829900, costPrice: 660000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
        ],
      },
    },
  })

  console.log(`✅ ${2} productos ANCLA creados`)

  // ========================================================================
  // 3. PRODUCTOS EQUILIBRIO - Sonno, Regno, Gravita, Namaste
  // ========================================================================
  
  console.log('⭐ Creando productos EQUILIBRIO...')

  // --- SONNO EUROPILLOW ---
  const sonnoEP = await prisma.product.create({
    data: {
      sku: 'PIERO-SONNO-EP',
      name: 'Colchón Piero Sonno EuroPillow',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Gama media con pillow incorporado. Excelente confort.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x80', price: 289900, costPrice: 230000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x90', price: 314900, costPrice: 250000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x100', price: 344900, costPrice: 275000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x130', price: 434900, costPrice: 345000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x140', price: 469900, costPrice: 375000, source: StockSource.CATALOGO, stockQty: 0, minStock: 5 },
          { size: '190x160', price: 514900, costPrice: 410000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
        ],
      },
    },
  })

  // --- REGNO ---
  const regno = await prisma.product.create({
    data: {
      sku: 'PIERO-REGNO',
      name: 'Colchón Piero Regno',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Resortes pocket con alta adaptabilidad.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x80', price: 299900, costPrice: 240000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x90', price: 324900, costPrice: 260000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '190x140', price: 459900, costPrice: 365000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
          { size: '200x160', price: 544900, costPrice: 435000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
          { size: '200x200', price: 669900, costPrice: 535000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
        ],
      },
    },
  })

  // --- REGNO PILLOW TOP ---
  const regnoPT = await prisma.product.create({
    data: {
      sku: 'PIERO-REGNO-PT',
      name: 'Colchón Piero Regno Pillow Top',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Regno con capa Pillow Top extra confort.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 574900, costPrice: 460000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x160', price: 659900, costPrice: 525000, source: StockSource.CATALOGO, stockQty: 0, minStock: 3 },
          { size: '200x180', price: 729900, costPrice: 580000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x200', price: 799900, costPrice: 640000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
        ],
      },
    },
  })

  // --- GRAVITA ---
  const gravita = await prisma.product.create({
    data: {
      sku: 'PIERO-GRAVITA',
      name: 'Colchón Piero Gravita',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Sistema anti-gravedad con máximo soporte.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 749900, costPrice: 600000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x160', price: 924900, costPrice: 740000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x180', price: 989900, costPrice: 790000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '200x200', price: 1049900, costPrice: 840000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
        ],
      },
    },
  })

  // --- NAMASTE ---
  const namaste = await prisma.product.create({
    data: {
      sku: 'PIERO-NAMASTE',
      name: 'Colchón Piero Namaste',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Diseño ergonómico con tecnología de última generación.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 424900, costPrice: 340000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x160', price: 539900, costPrice: 430000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x200', price: 649900, costPrice: 520000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
        ],
      },
    },
  })

  // --- NAMASTE PILLOW TOP ---
  const namastePT = await prisma.product.create({
    data: {
      sku: 'PIERO-NAMASTE-PT',
      name: 'Colchón Piero Namaste Pillow Top',
      categoryId: catEquilibrio.id,
      brand: 'PIERO',
      description: 'Namaste con Pillow Top premium.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 539900, costPrice: 430000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x160', price: 619900, costPrice: 495000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
        ],
      },
    },
  })

  console.log(`✅ ${6} productos EQUILIBRIO creados`)

  // ========================================================================
  // 4. PRODUCTOS PREMIUM - Montreaux & Dream Fit
  // ========================================================================
  
  console.log('👑 Creando productos PREMIUM...')

  // --- MONTREAUX ---
  const montreaux = await prisma.product.create({
    data: {
      sku: 'PIERO-MONTREAUX',
      name: 'Colchón Piero Montreaux',
      categoryId: catPremium.id,
      brand: 'PIERO',
      description: 'Línea premium con tecnología europea de punta.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 789900, costPrice: 630000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '200x160', price: 989900, costPrice: 790000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x200', price: 1119900, costPrice: 895000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
        ],
      },
    },
  })

  // --- MONTREAUX PILLOW TOP ---
  const montreauxPT = await prisma.product.create({
    data: {
      sku: 'PIERO-MONTREAUX-PT',
      name: 'Colchón Piero Montreaux Pillow Top',
      categoryId: catPremium.id,
      brand: 'PIERO',
      description: 'Flagship premium con Pillow Top de lujo.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 989900, costPrice: 790000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '200x160', price: 1199900, costPrice: 960000, source: StockSource.CATALOGO, stockQty: 0, minStock: 2 },
          { size: '200x180', price: 1289900, costPrice: 1030000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '200x200', price: 1369900, costPrice: 1095000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
        ],
      },
    },
  })

  // --- DREAM FIT POCKET ---
  const dreamFit = await prisma.product.create({
    data: {
      sku: 'PIERO-DREAMFIT-POCKET',
      name: 'Colchón Piero Dream Fit Pocket',
      categoryId: catPremium.id,
      brand: 'PIERO',
      description: 'Ultra premium con resortes pocket individuales.',
      warranty: 5,
      isActive: true,
      variants: {
        create: [
          { size: '190x140', price: 1949900, costPrice: 1560000, source: StockSource.CATALOGO, stockQty: 0, minStock: 0 },
          { size: '200x160', price: 2249900, costPrice: 1800000, source: StockSource.CATALOGO, stockQty: 0, minStock: 1 },
          { size: '200x200', price: 2549900, costPrice: 2040000, source: StockSource.CATALOGO, stockQty: 0, minStock: 0 },
        ],
      },
    },
  })

  console.log(`✅ ${3} productos PREMIUM creados`)

  // ========================================================================
  // 5. ACCESORIOS - Protectores, Almohadas, Sábanas
  // ========================================================================
  
  console.log('💎 Creando ACCESORIOS...')

  // --- PROTECTORES ---
  const protector = await prisma.product.create({
    data: {
      sku: 'PIERO-PROTECTOR',
      name: 'Protector Impermeable Piero',
      categoryId: catAccesorios.id,
      brand: 'PIERO',
      description: 'Protector impermeable ajustable con elástico.',
      warranty: 1,
      isActive: true,
      variants: {
        create: [
          { size: '140x190', price: 37900, costPrice: 25000, source: StockSource.STOCK, stockQty: 10, minStock: 5 },
          { size: '160x200', price: 42900, costPrice: 28000, source: StockSource.STOCK, stockQty: 8, minStock: 5 },
          { size: '200x200', price: 47900, costPrice: 32000, source: StockSource.STOCK, stockQty: 6, minStock: 3 },
        ],
      },
    },
  })

  // --- ALMOHADAS ---
  const almohadaFibra = await prisma.product.create({
    data: {
      sku: 'PIERO-ALMOHADA-FIBRA',
      name: 'Almohada Piero Fibra Smart Tech Plus',
      categoryId: catAccesorios.id,
      brand: 'PIERO',
      description: 'Almohada de fibra con tecnología anti-ácaros.',
      warranty: 1,
      isActive: true,
      variants: {
        create: [
          { size: '70x50', price: 42900, costPrice: 28000, source: StockSource.STOCK, stockQty: 15, minStock: 10 },
        ],
      },
    },
  })

  const almohadaMicro = await prisma.product.create({
    data: {
      sku: 'PIERO-ALMOHADA-MICRO',
      name: 'Almohada Piero Micro Max Premium',
      categoryId: catAccesorios.id,
      brand: 'PIERO',
      description: 'Almohada de microfibra premium con mayor densidad.',
      warranty: 1,
      isActive: true,
      variants: {
        create: [
          { size: '70x50', price: 74900, costPrice: 50000, source: StockSource.STOCK, stockQty: 10, minStock: 5 },
        ],
      },
    },
  })

  // --- SÁBANAS ---
  const sabanas = await prisma.product.create({
    data: {
      sku: 'PIERO-SABANAS-BAMBOO',
      name: 'Sábanas Bamboo Piero 600 Hilos',
      categoryId: catAccesorios.id,
      brand: 'PIERO',
      description: 'Juego de sábanas de bambú 600 hilos premium.',
      warranty: 1,
      isActive: true,
      variants: {
        create: [
          { size: '140x190', price: 94900, costPrice: 65000, source: StockSource.STOCK, stockQty: 12, minStock: 6 },
          { size: '160x200', price: 124900, costPrice: 85000, source: StockSource.STOCK, stockQty: 10, minStock: 5 },
          { size: '200x200', price: 149900, costPrice: 105000, source: StockSource.STOCK, stockQty: 8, minStock: 4 },
        ],
      },
    },
  })

  console.log(`✅ ${4} productos de ACCESORIOS creados`)

  // ========================================================================
  // RESUMEN FINAL
  // ========================================================================
  
  const totalProductos = await prisma.product.count()
  const totalVariantes = await prisma.productVariant.count()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ SEED COMPLETADO CON ÉXITO')
  console.log('='.repeat(60))
  console.log(`📦 Total Productos: ${totalProductos}`)
  console.log(`📐 Total Variantes: ${totalVariantes}`)
  console.log(`🏷️  Total Categorías: ${categorias.length}`)
  console.log('='.repeat(60))
  console.log('\n🎉 La base de datos está lista para generar documentos!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })