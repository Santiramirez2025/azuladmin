import { z } from "zod"

// ═══════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════

export const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z
    .string()
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .regex(/^[\d\s\-+()]+$/, "Formato de teléfono inválido"),
  dni: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
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
  sku: z.string().min(1, "El SKU es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  brand: z.string().default("PIERO"),
  description: z.string().optional().nullable(),
  warranty: z.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
})

export const productVariantSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  size: z.string().min(1, "La medida es requerida"),
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
// DOCUMENTOS
// ═══════════════════════════════════════════════════════════

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

export const documentSchema = z.object({
  type: z.enum(["PRESUPUESTO", "RECIBO", "REMITO"]),
  clientId: z.string().min(1, "El cliente es requerido"),
  items: z.array(documentItemSchema).min(1, "Debe agregar al menos un producto"),
  
  // Pago
  paymentMethod: z.enum(["CONTADO", "CUOTAS_3", "CUOTAS_6", "CUOTAS_9", "CUOTAS_12"]).optional().nullable(),
  installments: z.number().int().min(1).max(12).optional().nullable(),
  amountPaid: z.number().min(0).optional().nullable(),
  paymentType: z.string().optional().nullable(), // "Efectivo", "Transferencia", etc.
  
  // Envío
  shippingType: z.string().default("Sin cargo en Villa María"),
  shippingCost: z.number().min(0).default(0),
  
  // Notas
  observations: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  
  // Validez (solo presupuestos)
  validDays: z.number().int().min(1).max(30).default(7),
})

export type DocumentFormData = z.infer<typeof documentSchema>
export type DocumentItemFormData = z.infer<typeof documentItemSchema>

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  icon: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

export const companyInfoSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  phone: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().email().optional(),
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
