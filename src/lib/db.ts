/* eslint-disable @typescript-eslint/no-explicit-any */
// Prisma client - Mock hasta que se configure la DB
// Una vez que configures Supabase:
// 1. Copia las credenciales al archivo .env
// 2. Ejecuta: npx prisma generate && npx prisma db push

// Interface genérica para operaciones de modelo
interface ModelOperations {
  findMany: (args?: any) => Promise<any[]>
  findUnique: (args: any) => Promise<any | null>
  findFirst: (args?: any) => Promise<any | null>
  create: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
  delete: (args: any) => Promise<any>
  upsert: (args: any) => Promise<any>
  count: (args?: any) => Promise<number>
  aggregate: (args?: any) => Promise<any>
  groupBy: (args?: any) => Promise<any[]>
  updateMany: (args?: any) => Promise<any>
  deleteMany: (args?: any) => Promise<any>
}

// Interface del cliente Prisma
interface PrismaClientMock {
  user: ModelOperations
  client: ModelOperations
  category: ModelOperations
  product: ModelOperations
  productVariant: ModelOperations
  document: ModelOperations
  documentItem: ModelOperations
  setting: ModelOperations
  $connect: () => Promise<void>
  $disconnect: () => Promise<void>
  $transaction: (fn: any) => Promise<any>
}

// Mensaje de error cuando la DB no está configurada
const DB_NOT_CONFIGURED_MSG = 
  "Base de datos no configurada. Configura las credenciales de Supabase en .env y ejecuta 'npx prisma generate && npx prisma db push'"

// Función que lanza error
const notConfigured = async (): Promise<never> => {
  throw new Error(DB_NOT_CONFIGURED_MSG)
}

// Mock de operaciones de modelo
const createMockModelOperations = (): ModelOperations => ({
  findMany: notConfigured,
  findUnique: notConfigured,
  findFirst: notConfigured,
  create: notConfigured,
  update: notConfigured,
  delete: notConfigured,
  upsert: notConfigured,
  count: notConfigured,
  aggregate: notConfigured,
  groupBy: notConfigured,
  updateMany: notConfigured,
  deleteMany: notConfigured,
})

// Intentar cargar Prisma real si está disponible
let realPrisma: PrismaClientMock | null = null

try {
  if (typeof window === "undefined" && process.env.DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client")
    
    const globalForPrisma = globalThis as unknown as { prisma: any }
    
    realPrisma = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = realPrisma
    }
  }
} catch {
  // Prisma no disponible
}

// Mock client
const mockPrisma: PrismaClientMock = {
  user: createMockModelOperations(),
  client: createMockModelOperations(),
  category: createMockModelOperations(),
  product: createMockModelOperations(),
  productVariant: createMockModelOperations(),
  document: createMockModelOperations(),
  documentItem: createMockModelOperations(),
  setting: createMockModelOperations(),
  $connect: notConfigured,
  $disconnect: notConfigured,
  $transaction: notConfigured,
}

export const prisma: PrismaClientMock = realPrisma || mockPrisma
export default prisma
