// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

// ============================================================================
// SINGLETON PATTERN PARA PRISMA CLIENT
// ============================================================================
// Evita crear múltiples instancias en development (hot reload)
// y optimiza conexiones en producción

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === "production") {
  // ✅ PRODUCCIÓN: Crear una sola instancia
  prisma = new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "minimal",
  })
} else {
  // ✅ DESARROLLO: Reutilizar instancia en hot reload
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: ["query", "error", "warn"],
      errorFormat: "pretty",
    })
  }
  prisma = global.cachedPrisma
}

// ============================================================================
// EXTENSIONES DE PRISMA (OPCIONAL - CAMPOS CALCULADOS)
// ============================================================================
// Puedes descomentar esto si quieres agregar campos calculados

/*
export const prismaExtended = prisma.$extends({
  result: {
    document: {
      isPaid: {
        needs: { balance: true },
        compute(doc) {
          return !doc.balance || Number(doc.balance) <= 0
        }
      },
      totalAmount: {
        needs: { subtotal: true, surcharge: true, shippingCost: true },
        compute(doc) {
          return Number(doc.subtotal) + Number(doc.surcharge) + Number(doc.shippingCost)
        }
      }
    }
  }
})
*/

// ============================================================================
// HEALTH CHECK FUNCTION
// ============================================================================
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Manejar señales de terminación
if (process.env.NODE_ENV === "production") {
  process.on("SIGINT", async () => {
    await disconnectDatabase()
    process.exit(0)
  })
  
  process.on("SIGTERM", async () => {
    await disconnectDatabase()
    process.exit(0)
  })
}

// ============================================================================
// EXPORTS
// ============================================================================
export { prisma }
export default prisma