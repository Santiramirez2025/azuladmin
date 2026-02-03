// scripts/debug-db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS\n")

  // 1. Verificar usuarios
  console.log("👥 USUARIOS:")
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log("  ⚠️  NO HAY USUARIOS - Esto causará el error!")
    console.log("  💡 Solución: Crear un usuario primero")
  } else {
    users.forEach(user => {
      console.log(`  ✅ ${user.name} (${user.email}) - ID: ${user.id}`)
    })
  }

  // 2. Verificar clientes
  console.log("\n👤 CLIENTES:")
  const clients = await prisma.client.findMany({
    take: 5
  })
  if (clients.length === 0) {
    console.log("  ⚠️  NO HAY CLIENTES")
  } else {
    clients.forEach(client => {
      console.log(`  ✅ ${client.name} - Tel: ${client.phone} - ID: ${client.id}`)
    })
    console.log(`  📊 Total de clientes: ${await prisma.client.count()}`)
  }

  // 3. Verificar productos
  console.log("\n📦 PRODUCTOS:")
  const products = await prisma.product.findMany({
    include: {
      variants: true
    },
    take: 3
  })
  if (products.length === 0) {
    console.log("  ⚠️  NO HAY PRODUCTOS")
  } else {
    products.forEach(product => {
      console.log(`  ✅ ${product.name} - ${product.variants.length} variantes`)
    })
    console.log(`  📊 Total de productos: ${await prisma.product.count()}`)
  }

  // 4. Verificar documentos
  console.log("\n📄 DOCUMENTOS:")
  const docs = await prisma.document.findMany({
    take: 5,
    include: {
      client: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  if (docs.length === 0) {
    console.log("  ℹ️  No hay documentos todavía")
  } else {
    docs.forEach(doc => {
      console.log(`  📋 #${doc.number} - ${doc.type} - ${doc.client.name} - ${doc._count.items} items`)
    })
    console.log(`  📊 Total de documentos: ${await prisma.document.count()}`)
  }

  console.log("\n✅ Verificación completada")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })