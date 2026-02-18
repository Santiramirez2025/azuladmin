// lib/validations.ts
import { z } from "zod"

// ═══════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════

export const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  phone: z
    .string()
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .regex(/^[\d\s\-+()]+$/, "Formato de teléfono inválido"),
  dni: z.string().optional().nullable(),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().default("Villa María"),
  province: z.string().default("Córdoba"),
  notes: z.string().optional().nullable(),
})

export type ClientFormData = z.infer<typeof clientSchema>

// ═══════════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════════

export const productSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido").trim(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  brand: z.string().default("PIERO"),
  description: z.string().optional().nullable(),
  warranty: z.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
})

export const productVariantSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  size: z.string().min(1, "La medida es requerida").trim(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  costPrice: z.number().positive().optional().nullable(),
  source: z.enum(["STOCK", "CATALOGO"]).default("CATALOGO"),
  stockQty: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export type ProductFormData = z.infer<typeof productSchema>
export type ProductVariantFormData = z.infer<typeof productVariantSchema>

// ═══════════════════════════════════════════════════════════
// DOCUMENTOS - SCHEMAS PARA FRONTEND
// ═══════════════════════════════════════════════════════════

// Schema para items en el formulario (frontend)
export const documentItemSchema = z.object({
  variantId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().int().min(1, "La cantidad mínima es 1"),
  // Estos se calculan automáticamente
  productName: z.string().optional(),
  productSize: z.string().optional(),
  unitPrice: z.number().optional(),
  subtotal: z.number().optional(),
  source: z.enum(["STOCK", "CATALOGO"]).optional(),
})

// Schema para crear documento desde el formulario (frontend)
export const documentSchema = z.object({
  type: z.enum(["PRESUPUESTO", "RECIBO", "REMITO"]),
  clientId: z.string().min(1, "El cliente es requerido"),
  items: z.array(documentItemSchema).min(1, "Debe agregar al menos un producto"),

  // Pago
  paymentMethod: z
    .enum(["CONTADO", "CUOTAS_3", "CUOTAS_6", "CUOTAS_9", "CUOTAS_12"])
    .optional()
    .nullable(),
  installments: z.number().int().min(1).max(12).optional().nullable(),
  amountPaid: z.number().min(0).optional().nullable(),
  paymentType: z.string().optional().nullable(),

  // Envío
  shippingType: z.string().default("Sin cargo en Villa María"),
  shippingCost: z.number().min(0).default(0),

  // Notas
  observations: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),

  // Validez (solo presupuestos)
  validDays: z.number().int().min(1).max(90).default(7),
})

export type DocumentFormData = z.infer<typeof documentSchema>
export type DocumentItemFormData = z.infer<typeof documentItemSchema>

// ═══════════════════════════════════════════════════════════
// DOCUMENTOS - SCHEMAS PARA BACKEND (API)
// ═══════════════════════════════════════════════════════════

// Schema para items custom (productos sueltos sin variante)
export const customDocumentItemSchema = z.object({
  isCustom: z.literal(true),
  productName: z.string().min(1, "El nombre del producto es requerido"),
  productSize: z.string().default("Único"),
  unitPrice: z.number().positive("El precio debe ser mayor a 0"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  source: z.enum(["STOCK", "CATALOGO"]).default("CATALOGO"),
})

// Schema para items del catálogo
export const catalogDocumentItemSchema = z.object({
  variantId: z.string().min(1),
  isCustom: z.literal(false).optional(),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  // Campos opcionales que se llenan automáticamente
  productName: z.string().optional(),
  productSize: z.string().optional(),
  unitPrice: z.number().optional(),
  source: z.enum(["STOCK", "CATALOGO"]).optional(),
})

// Union type para items (puede ser custom o del catálogo)
export const apiDocumentItemSchema = z.discriminatedUnion("isCustom", [
  customDocumentItemSchema,
  catalogDocumentItemSchema,
])

// Schema completo para crear documento via API
export const createDocumentSchema = z.object({
  clientId: z.string().min(1, "El cliente es requerido"),
  userId: z.string().optional(),
  type: z.enum(["PRESUPUESTO", "RECIBO", "REMITO"]),
  items: z
    .array(
      z.union([
        catalogDocumentItemSchema,
        customDocumentItemSchema,
      ])
    )
    .min(1, "Debe incluir al menos un item"),
  observations: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  surchargeRate: z.number().int().min(0).max(100).default(0),
  paymentMethod: z
    .enum(["CONTADO", "CUOTAS_3", "CUOTAS_6", "CUOTAS_9", "CUOTAS_12"])
    .optional()
    .nullable(),
  installments: z.number().int().min(1).max(12).optional().nullable(),
  shippingType: z.string().default("Sin cargo en Villa María"),
  shippingCost: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative().optional().nullable(),
  paymentType: z.string().optional().nullable(),
})

export const updateDocumentSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "APPROVED", "COMPLETED", "CANCELLED", "EXPIRED"])
    .optional(),
  observations: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  amountPaid: z.number().nonnegative().optional(),
  paymentType: z.string().optional().nullable(),
  installments: z.number().int().min(1).max(12).optional(),
  shippingType: z.string().optional(),
  shippingCost: z.number().nonnegative().optional(),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type ApiDocumentItemInput = z.infer<typeof apiDocumentItemSchema>

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  icon: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

export const companyInfoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  whatsapp: z.string().min(1, "El WhatsApp es requerido"),
  email: z.string().email("Email inválido").optional(),
  cuit: z.string().optional(),
  logo: z.string().optional(),
})

export const paymentRatesSchema = z.object({
  "1": z.number().default(0),
  "3": z.number().default(18),
  "6": z.number().default(25),
  "9": z.number().default(35),
  "12": z.number().default(47),
})

export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>
export type PaymentRatesFormData = z.infer<typeof paymentRatesSchema>

// ═══════════════════════════════════════════════════════════
// USUARIOS Y AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════

export const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR"]).default("VENDEDOR"),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type CreateUserFormData = z.infer<typeof createUserSchema>

// ═══════════════════════════════════════════════════════════
// QUERY PARAMS Y FILTROS
// ═══════════════════════════════════════════════════════════

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const documentFilterSchema = paginationSchema.extend({
  type: z.enum(["PRESUPUESTO", "RECIBO", "REMITO", "all"]).optional(),
  status: z
    .enum(["DRAFT", "SENT", "APPROVED", "COMPLETED", "CANCELLED", "EXPIRED", "all"])
    .optional(),
  clientId: z.string().optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>
export type DocumentFilterParams = z.infer<typeof documentFilterSchema>

// ═══════════════════════════════════════════════════════════
// HELPERS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════

/**
 * Valida un schema y retorna resultado tipado
 * @example
 * const result = validateSchema(clientSchema, data)
 * if (!result.success) {
 *   console.error(result.error)
 *   return
 * }
 * // result.data está tipado correctamente
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }
    return {
      success: false,
      error: "Error de validación desconocido",
    }
  }
}

/**
 * Valida un schema de forma asíncrona
 */
export async function validateSchemaAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = await schema.parseAsync(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }
    return {
      success: false,
      error: "Error de validación desconocido",
    }
  }
}

/**
 * Obtiene todos los errores de validación
 */
export function getAllValidationErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): string[] {
  try {
    schema.parse(data)
    return []
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((err) => `${err.path.join(".")}: ${err.message}`)
    }
    return ["Error de validación desconocido"]
  }
}

/**
 * Parsea de forma segura un schema sin lanzar excepciones
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data)
}