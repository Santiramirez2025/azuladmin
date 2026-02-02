// Tipos definidos manualmente (basados en el schema de Prisma)
// Cuando Prisma esté configurado, se pueden importar directamente

export type Role = "ADMIN" | "VENDEDOR"

export type StockSource = "STOCK" | "CATALOGO"

export type DocumentType = "PRESUPUESTO" | "RECIBO" | "REMITO"

export type DocumentStatus = 
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"

export type PaymentMethod =
  | "CONTADO"
  | "CUOTAS_3"
  | "CUOTAS_6"
  | "CUOTAS_9"
  | "CUOTAS_12"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  dni?: string | null
  phone: string
  email?: string | null
  address?: string | null
  city: string
  province: string
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon?: string | null
  order: number
}

export interface Product {
  id: string
  sku: string
  name: string
  categoryId: string
  brand: string
  description?: string | null
  warranty: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  size: string
  price: number
  costPrice?: number | null
  source: StockSource
  stockQty: number
  minStock: number
  isActive: boolean
}

export interface Document {
  id: string
  number: number
  type: DocumentType
  status: DocumentStatus
  clientId: string
  userId: string
  date: Date
  validUntil?: Date | null
  subtotal: number
  surcharge: number
  surchargeRate: number
  total: number
  paymentMethod?: PaymentMethod | null
  installments?: number | null
  amountPaid?: number | null
  balance?: number | null
  paymentType?: string | null
  shippingType: string
  shippingCost: number
  observations?: string | null
  internalNotes?: string | null
  convertedFromId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DocumentItem {
  id: string
  documentId: string
  variantId: string
  productName: string
  productSize: string
  unitPrice: number
  quantity: number
  subtotal: number
  source: StockSource
}

// Extended types with relations
export type ProductWithVariants = Product & {
  category: Category
  variants: ProductVariant[]
}

export type VariantWithProduct = ProductVariant & {
  product: Product & {
    category: Category
  }
}

export type DocumentWithRelations = Document & {
  client: Client
  createdBy: User
  items: (DocumentItem & {
    variant: VariantWithProduct
  })[]
}

export type ClientWithDocuments = Client & {
  documents: Document[]
}

// Form types
export type CreateClientInput = {
  name: string
  phone: string
  dni?: string
  email?: string
  address?: string
  city?: string
  province?: string
  notes?: string
}

export type CreateDocumentInput = {
  type: DocumentType
  clientId: string
  items: {
    variantId: string
    quantity: number
  }[]
  paymentMethod?: PaymentMethod
  installments?: number
  amountPaid?: number
  shippingType?: string
  shippingCost?: number
  observations?: string
  internalNotes?: string
  validUntil?: Date
}

// Dashboard stats
export type DashboardStats = {
  salesThisMonth: number
  documentsThisMonth: number
  pendingPayments: number
  documentsToday: number
}

// Cart item for document creation
export type CartItem = {
  variant: VariantWithProduct
  quantity: number
}

// Payment calculation
export type PaymentCalculation = {
  subtotal: number
  surchargeRate: number
  surcharge: number
  total: number
  installmentAmount?: number
}

// WhatsApp message types
export type WhatsAppTemplate = "presupuesto" | "recibo" | "remito"

// API response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Pagination
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter types
export type DocumentFilters = {
  type?: DocumentType
  status?: DocumentStatus
  clientId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export type ProductFilters = {
  categoryId?: string
  source?: StockSource
  search?: string
  isActive?: boolean
}
