import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProductVariant, Product, Category, Client, DocumentType } from "@/types"

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

export interface CartItem {
  variant: ProductVariant & {
    product: Product & {
      category: Category
    }
  }
  quantity: number
}

interface DocumentDraft {
  type: DocumentType
  client: Client | null
  items: CartItem[]
  paymentMethod: string | null
  installments: number
  amountPaid: number
  shippingType: string
  shippingCost: number
  observations: string
  internalNotes: string
  validDays: number
}

// ═══════════════════════════════════════════════════════════
// CART STORE
// ═══════════════════════════════════════════════════════════

interface CartStore {
  // Estado
  draft: DocumentDraft
  
  // Acciones - Cliente
  setClient: (client: Client | null) => void
  
  // Acciones - Items
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearItems: () => void
  
  // Acciones - Documento
  setType: (type: DocumentType) => void
  setPaymentMethod: (method: string | null) => void
  setInstallments: (installments: number) => void
  setAmountPaid: (amount: number) => void
  setShipping: (type: string, cost: number) => void
  setObservations: (observations: string) => void
  setInternalNotes: (notes: string) => void
  setValidDays: (days: number) => void
  
  // Acciones - General
  reset: () => void
  
  // Computed
  getSubtotal: () => number
  getSurcharge: () => { rate: number; amount: number }
  getTotal: () => number
  getInstallmentAmount: () => number
  getBalance: () => number
  hasStockItems: () => boolean
  hasCatalogoItems: () => boolean
}

const PAYMENT_RATES: Record<number, number> = {
  1: 0,
  3: 18,
  6: 25,
  9: 35,
  12: 47,
}

const initialDraft: DocumentDraft = {
  type: "PRESUPUESTO",
  client: null,
  items: [],
  paymentMethod: null,
  installments: 1,
  amountPaid: 0,
  shippingType: "Sin cargo en Villa María",
  shippingCost: 0,
  observations: "",
  internalNotes: "",
  validDays: 7,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      draft: initialDraft,

      // Cliente
      setClient: (client) =>
        set((state) => ({
          draft: { ...state.draft, client },
        })),

      // Items
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.draft.items.findIndex(
            (i) => i.variant.id === item.variant.id
          )
          if (existingIndex >= 0) {
            const newItems = [...state.draft.items]
            newItems[existingIndex].quantity += item.quantity
            return { draft: { ...state.draft, items: newItems } }
          }
          return {
            draft: { ...state.draft, items: [...state.draft.items, item] },
          }
        }),

      removeItem: (variantId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            items: state.draft.items.filter((i) => i.variant.id !== variantId),
          },
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          draft: {
            ...state.draft,
            items: state.draft.items.map((i) =>
              i.variant.id === variantId ? { ...i, quantity } : i
            ),
          },
        })),

      clearItems: () =>
        set((state) => ({
          draft: { ...state.draft, items: [] },
        })),

      // Documento
      setType: (type) =>
        set((state) => ({
          draft: { ...state.draft, type },
        })),

      setPaymentMethod: (paymentMethod) =>
        set((state) => ({
          draft: { ...state.draft, paymentMethod },
        })),

      setInstallments: (installments) =>
        set((state) => ({
          draft: { ...state.draft, installments },
        })),

      setAmountPaid: (amountPaid) =>
        set((state) => ({
          draft: { ...state.draft, amountPaid },
        })),

      setShipping: (shippingType, shippingCost) =>
        set((state) => ({
          draft: { ...state.draft, shippingType, shippingCost },
        })),

      setObservations: (observations) =>
        set((state) => ({
          draft: { ...state.draft, observations },
        })),

      setInternalNotes: (internalNotes) =>
        set((state) => ({
          draft: { ...state.draft, internalNotes },
        })),

      setValidDays: (validDays) =>
        set((state) => ({
          draft: { ...state.draft, validDays },
        })),

      // General
      reset: () => set({ draft: initialDraft }),

      // Computed
      getSubtotal: () => {
        const { items } = get().draft
        return items.reduce(
          (sum, item) => sum + Number(item.variant.price) * item.quantity,
          0
        )
      },

      getSurcharge: () => {
        const { installments } = get().draft
        const rate = PAYMENT_RATES[installments] || 0
        const subtotal = get().getSubtotal()
        return {
          rate,
          amount: Math.round(subtotal * (rate / 100)),
        }
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const { amount: surcharge } = get().getSurcharge()
        const { shippingCost } = get().draft
        return subtotal + surcharge + shippingCost
      },

      getInstallmentAmount: () => {
        const { installments } = get().draft
        const total = get().getTotal()
        return Math.round(total / installments)
      },

      getBalance: () => {
        const total = get().getTotal()
        const { amountPaid } = get().draft
        return total - amountPaid
      },

      hasStockItems: () => {
        const { items } = get().draft
        return items.some((i) => i.variant.source === "STOCK")
      },

      hasCatalogoItems: () => {
        const { items } = get().draft
        return items.some((i) => i.variant.source === "CATALOGO")
      },
    }),
    {
      name: "azul-cart-storage",
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)

// ═══════════════════════════════════════════════════════════
// UI STORE
// ═══════════════════════════════════════════════════════════

interface UIStore {
  isSidebarOpen: boolean
  isProductSelectorOpen: boolean
  isClientSelectorOpen: boolean
  toggleSidebar: () => void
  setProductSelectorOpen: (open: boolean) => void
  setClientSelectorOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isProductSelectorOpen: false,
  isClientSelectorOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setProductSelectorOpen: (open) => set({ isProductSelectorOpen: open }),
  setClientSelectorOpen: (open) => set({ isClientSelectorOpen: open }),
}))
