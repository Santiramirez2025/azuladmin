"use client"

// ============================================================================
// ProductSelector — Con soporte de Producto BONIFICADO/SIN CARGO
// ─────────────────────────────────────────────────────────────────────────────
// Lógica de producto gratis:
//  • Toggle "Bonificado" activa isFree=true en el item
//  • Cuando isFree=true: unitPrice sigue guardado pero subtotal=0
//  • Se muestra badge "BONIFICADO" de color verde en la fila del item
//  • No se muestra precio ni subtotal en items bonificados
//  • No rompe ningún cálculo: calculateItemSubtotal() maneja el caso isFree
// ============================================================================

import { useState, useCallback, memo } from "react"
import { Plus, Trash2, Search, Gift, ChevronDown, ChevronUp, Edit2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils-client"
import { calculateItemSubtotal } from "../_hooks/useDocumentCalculations"
import type { DocumentItem, StockSource } from "../_lib/types"
import { nanoid } from "nanoid" // npm install nanoid — para IDs locales estables

// ─── Tipos internos ────────────────────────────────────────────────────────

interface ProductVariantResult {
  variantId: string
  productName: string
  productSize: string
  price: number
  source: StockSource
  sku: string
}

interface ProductSelectorProps {
  items: DocumentItem[]
  onChange: (items: DocumentItem[]) => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeNewItem(overrides: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: nanoid(),
    variantId: undefined,
    isCustom: false,
    isFree: false,
    productName: "",
    productSize: "",
    unitPrice: 0,
    quantity: 1,
    subtotal: 0,
    source: "CATALOGO",
    ...overrides,
  }
}

// ─── Sub-componente: Fila de item ────────────────────────────────────────────

interface ItemRowProps {
  item: DocumentItem
  index: number
  onUpdate: (id: string, changes: Partial<DocumentItem>) => void
  onRemove: (id: string) => void
}

const ItemRow = memo(function ItemRow({ item, index, onUpdate, onRemove }: ItemRowProps) {
  const [editingPrice, setEditingPrice] = useState(false)

  const handleToggleFree = () => {
    const isFree = !item.isFree
    onUpdate(item.id, {
      isFree,
      subtotal: calculateItemSubtotal({ ...item, isFree }),
    })
  }

  const handleQuantityChange = (qty: number) => {
    const quantity = Math.max(1, qty)
    onUpdate(item.id, {
      quantity,
      subtotal: calculateItemSubtotal({ ...item, quantity }),
    })
  }

  const handlePriceChange = (price: number) => {
    const unitPrice = Math.max(0, price)
    onUpdate(item.id, {
      unitPrice,
      subtotal: calculateItemSubtotal({ ...item, unitPrice }),
    })
  }

  return (
    <div className={cn(
      "group relative rounded-xl border-2 p-3 transition-all md:p-4",
      item.isFree
        ? "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-green-50/50"
        : "border-slate-200 bg-white/60 hover:border-slate-300"
    )}>
      {/* Header de la fila */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
            <span className="text-sm font-semibold text-slate-900 md:text-base">
              {item.productName}
            </span>
            {item.productSize && (
              <span className="text-xs text-slate-500">{item.productSize}</span>
            )}

            {/* Badge STOCK/CATÁLOGO */}
            <Badge variant="secondary" className={cn(
              "text-[10px] font-bold",
              item.source === "STOCK"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            )}>
              {item.source === "STOCK" ? "STOCK" : "CATÁLOGO"}
            </Badge>

            {/* Badge BONIFICADO */}
            {item.isFree && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-[10px] font-bold text-white shadow-sm">
                🎁 BONIFICADO
              </Badge>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Toggle bonificado */}
          <Button
            type="button" variant="ghost" size="sm"
            onClick={handleToggleFree}
            title={item.isFree ? "Quitar bonificación" : "Marcar como bonificado"}
            className={cn(
              "h-7 w-7 p-0 transition-all",
              item.isFree
                ? "text-emerald-600 hover:bg-emerald-100"
                : "text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
            )}
          >
            <Gift className="h-3.5 w-3.5" />
          </Button>
          {/* Eliminar */}
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => onRemove(item.id)}
            className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Controles de precio y cantidad */}
      <div className="mt-2.5 flex items-center gap-2 md:gap-3">
        {/* Cantidad */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="h-7 w-7 p-0 text-slate-600"
            disabled={item.quantity <= 1}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-bold text-slate-900">
            {item.quantity}
          </span>
          <Button type="button" variant="outline" size="sm"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="h-7 w-7 p-0 text-slate-600">
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>

        {/* Precio unitario (solo si no es bonificado) */}
        {!item.isFree ? (
          <div className="flex flex-1 items-center gap-1">
            {editingPrice ? (
              <div className="flex flex-1 items-center gap-1">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={item.unitPrice || ""}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                    onBlur={() => setEditingPrice(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingPrice(false)}
                    className="h-7 pl-5 text-xs font-semibold"
                    autoFocus
                  />
                </div>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => setEditingPrice(false)}
                  className="h-7 w-7 p-0 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => setEditingPrice(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 transition-all hover:bg-slate-100">
                <Edit2 className="h-3 w-3" />
                <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
              </button>
            )}
            <span className="text-xs text-slate-400">×{item.quantity}</span>
            <span className="ml-auto text-sm font-bold text-slate-900">
              = {formatCurrency(item.subtotal)}
            </span>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-xs text-emerald-600">
              Precio original: {formatCurrency(item.unitPrice)}
            </span>
            <span className="text-sm font-bold text-emerald-600">SIN CARGO</span>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Sub-componente: Agregar producto personalizado ──────────────────────────

interface CustomProductFormProps {
  onAdd: (item: DocumentItem) => void
  onCancel: () => void
}

const CustomProductForm = memo(function CustomProductForm({
  onAdd,
  onCancel,
}: CustomProductFormProps) {
  const [name, setName]         = useState("")
  const [size, setSize]         = useState("")
  const [price, setPrice]       = useState<number>(0)
  const [qty, setQty]           = useState(1)
  const [isFree, setIsFree]     = useState(false)
  const [source, setSource]     = useState<StockSource>("CATALOGO")

  const isValid = name.trim().length > 0 && (isFree || price > 0)

  const handleAdd = () => {
    if (!isValid) return
    onAdd(makeNewItem({
      isCustom:    true,
      isFree,
      productName: name.trim(),
      productSize: size.trim() || "-",
      unitPrice:   isFree ? 0 : price,
      quantity:    qty,
      subtotal:    calculateItemSubtotal({ unitPrice: isFree ? 0 : price, quantity: qty, isFree }),
      source,
    }))
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-blue-900">Producto Personalizado</p>
        <Button type="button" variant="ghost" size="sm"
          onClick={onCancel} className="h-auto p-1 text-slate-400">✕</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Nombre *</Label>
          <Input placeholder="Ej: Almohada viscoelástica" value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-slate-200 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Medida / Descripción</Label>
          <Input placeholder="Ej: 140x190 / Premium" value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border-slate-200 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Cantidad</Label>
          <Input type="number" min="1" value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="border-slate-200 text-sm" />
        </div>
      </div>

      {/* Toggle bonificado */}
      <button
        type="button"
        onClick={() => setIsFree(!isFree)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all",
          isFree
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
        )}
      >
        <Gift className={cn("h-4 w-4", isFree ? "text-emerald-600" : "text-slate-400")} />
        {isFree ? "✓ Producto BONIFICADO (sin cargo)" : "Marcar como bonificado / sin cargo"}
      </button>

      {/* Precio (solo si no es bonificado) */}
      {!isFree && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Precio unitario *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
            <Input type="number" min="0" step="0.01"
              value={price || ""}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="border-slate-200 pl-7 text-sm"
              placeholder="0.00" />
          </div>
        </div>
      )}

      {/* Stock/Catálogo */}
      <div className="flex gap-2">
        {(["CATALOGO", "STOCK"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSource(s)}
            className={cn(
              "flex-1 rounded-lg border-2 py-1.5 text-xs font-bold transition-all",
              source === s
                ? s === "STOCK"
                  ? "border-blue-400 bg-blue-50 text-blue-800"
                  : "border-slate-400 bg-slate-100 text-slate-800"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}>
            {s === "STOCK" ? "📦 STOCK" : "📋 CATÁLOGO"}
          </button>
        ))}
      </div>

      {/* Preview */}
      {isValid && (
        <div className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold">{name}</span>
          {size && ` · ${size}`}
          {" — "}
          {isFree
            ? <span className="font-bold text-emerald-600">BONIFICADO 🎁</span>
            : <span className="font-bold">{formatCurrency(calculateItemSubtotal({ unitPrice: price, quantity: qty, isFree }))}</span>
          }
        </div>
      )}

      <Button type="button" onClick={handleAdd} disabled={!isValid}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50">
        <Plus className="mr-1.5 h-4 w-4" /> Agregar producto
      </Button>
    </div>
  )
})

// ─── Componente principal ────────────────────────────────────────────────────

export const ProductSelector = memo(function ProductSelector({
  items,
  onChange,
}: ProductSelectorProps) {
  const [searchOpen, setSearchOpen]       = useState(false)
  const [searchQuery, setSearchQuery]     = useState("")
  const [searchResults, setSearchResults] = useState<ProductVariantResult[]>([])
  const [isSearching, setIsSearching]     = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Búsqueda de productos en catálogo/stock
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=15`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.items ?? [])
      }
    } catch (err) {
      console.error("Error buscando productos:", err)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Agregar desde buscador
  const handleAddFromSearch = useCallback((variant: ProductVariantResult) => {
    const newItem = makeNewItem({
      variantId:   variant.variantId,
      isCustom:    false,
      productName: variant.productName,
      productSize: variant.productSize,
      unitPrice:   variant.price,
      subtotal:    calculateItemSubtotal({ unitPrice: variant.price, quantity: 1, isFree: false }),
      source:      variant.source,
    })
    onChange([...items, newItem])
    setSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }, [items, onChange])

  // Agregar producto custom
  const handleAddCustom = useCallback((item: DocumentItem) => {
    onChange([...items, item])
    setShowCustomForm(false)
  }, [items, onChange])

  // Actualizar item existente
  const handleUpdateItem = useCallback((id: string, changes: Partial<DocumentItem>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...changes } : item))
  }, [items, onChange])

  // Eliminar item
  const handleRemoveItem = useCallback((id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }, [items, onChange])

  const freeCount = items.filter((i) => i.isFree).length

  return (
    <div className="space-y-3">
      {/* Lista de items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />
          ))}

          {/* Resumen de bonificados */}
          {freeCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <Gift className="h-3.5 w-3.5" />
              <span className="font-semibold">
                {freeCount} producto{freeCount > 1 ? "s" : ""} bonificado{freeCount > 1 ? "s" : ""} (sin cargo)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showCustomForm && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Sin productos</p>
          <p className="text-xs text-slate-500">Buscá en el catálogo o agregá uno personalizado</p>
        </div>
      )}

      {/* Formulario producto custom */}
      {showCustomForm && (
        <CustomProductForm
          onAdd={handleAddCustom}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      {/* Botones de acción */}
      {!showCustomForm && (
        <div className="flex gap-2">
          {/* Buscador de catálogo */}
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm"
                className="flex-1 border-slate-200 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50">
                <Search className="mr-1.5 h-4 w-4" /> Buscar en catálogo
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] p-0 shadow-2xl sm:w-[420px]" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Nombre, medida, SKU..."
                  value={searchQuery}
                  onValueChange={handleSearch}
                />
                <CommandList className="max-h-64">
                  {isSearching && (
                    <div className="flex justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    </div>
                  )}
                  {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <CommandEmpty>
                      <p className="py-6 text-center text-sm text-slate-500">
                        No se encontraron productos
                      </p>
                    </CommandEmpty>
                  )}
                  {!isSearching && searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((v) => (
                        <CommandItem key={v.variantId} value={v.variantId}
                          onSelect={() => handleAddFromSearch(v)}
                          className="cursor-pointer px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {v.productName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {v.productSize} · {v.sku}
                              </p>
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                              <span className="text-sm font-bold text-slate-900">
                                {formatCurrency(v.price)}
                              </span>
                              <Badge variant="secondary" className={cn(
                                "text-[10px] font-bold",
                                v.source === "STOCK"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {v.source}
                              </Badge>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Agregar personalizado */}
          <Button type="button" variant="outline" size="sm"
            onClick={() => setShowCustomForm(true)}
            className="flex-shrink-0 border-slate-200 text-sm font-semibold hover:border-purple-300 hover:bg-purple-50">
            <Plus className="mr-1.5 h-4 w-4" /> Personalizado
          </Button>
        </div>
      )}
    </div>
  )
})