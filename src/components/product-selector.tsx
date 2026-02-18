"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  Package,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatCurrency } from "@/lib/utils-client"

// ============================================================================
// Types
// ============================================================================

interface ProductVariant {
  id: string
  size: string
  price: number
  source: "STOCK" | "CATALOGO"
  stockQty: number
  product: {
    id: string
    name: string
    brand: string
    sku: string
  }
}

export interface DocumentItem {
  id: string // ID temporal para el frontend
  variantId?: string
  isCustom: boolean
  productName: string
  productSize: string
  unitPrice: number
  quantity: number
  subtotal: number
  source: "STOCK" | "CATALOGO"
}

interface ProductSelectorProps {
  items: DocumentItem[]
  onChange: (items: DocumentItem[]) => void
  disabled?: boolean
}

// ============================================================================
// Helper para generar IDs temporales
// ============================================================================

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// Producto Suelto Modal
// ============================================================================

interface CustomProductModalProps {
  open: boolean
  onClose: () => void
  onAdd: (item: DocumentItem) => void
}

function CustomProductModal({ open, onClose, onAdd }: CustomProductModalProps) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("1")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return

    const unitPrice = parseFloat(price)
    const qty = parseInt(quantity) || 1

    onAdd({
      id: generateTempId(),
      isCustom: true,
      variantId: undefined,
      productName: name,
      productSize: size || "Único",
      unitPrice,
      quantity: qty,
      subtotal: unitPrice * qty,
      source: "CATALOGO",
    })

    // Reset form
    setName("")
    setSize("")
    setPrice("")
    setQuantity("1")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Agregar Producto Suelto
          </DialogTitle>
          <DialogDescription>
            Agregá un producto que no está en el catálogo. No se guardará en la base de datos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-name">Nombre del producto *</Label>
            <Input
              id="custom-name"
              placeholder="Ej: Sommier base usado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-size">Medida / Descripción</Label>
            <Input
              id="custom-size"
              placeholder="Ej: 140x190, Color azul, etc."
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-price">Precio *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-quantity">Cantidad</Label>
              <Input
                id="custom-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name || !price}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Product Search Combobox
// ============================================================================

interface ProductSearchProps {
  onSelect: (variant: ProductVariant) => void
}

function ProductSearch({ onSelect }: ProductSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVariants([])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setVariants(data.variants || [])
      }
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchProducts])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            Buscar producto del catálogo...
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Escribí para buscar..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && search.length >= 2 && variants.length === 0 && (
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No se encontraron productos</p>
                  <p className="text-xs text-muted-foreground/70">
                    Podés agregar un producto suelto
                  </p>
                </div>
              </CommandEmpty>
            )}
            {!isLoading && variants.length > 0 && (
              <CommandGroup heading="Productos">
                {variants.map((variant) => (
                  <CommandItem
                    key={variant.id}
                    value={variant.id}
                    onSelect={() => {
                      onSelect(variant)
                      setOpen(false)
                      setSearch("")
                      setVariants([])
                    }}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {variant.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {variant.size} · {variant.product.brand}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        variant={variant.source === "STOCK" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {variant.source === "STOCK" ? "Stock" : "Pedido"}
                      </Badge>
                      <span className="font-semibold text-sm">
                        {formatCurrency(variant.price)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Item Row
// ============================================================================

interface ItemRowProps {
  item: DocumentItem
  onUpdate: (id: string, updates: Partial<DocumentItem>) => void
  onRemove: (id: string) => void
}

function ItemRow({ item, onUpdate, onRemove }: ItemRowProps) {
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return
    onUpdate(item.id, {
      quantity: newQty,
      subtotal: item.unitPrice * newQty,
    })
  }

  const handlePriceChange = (newPrice: number) => {
    if (newPrice < 0) return
    onUpdate(item.id, {
      unitPrice: newPrice,
      subtotal: newPrice * item.quantity,
    })
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-white p-3 transition-all hover:shadow-sm">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{item.productName}</p>
          {item.isCustom && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              Suelto
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {item.productSize}
          {!item.isCustom && (
            <span className="ml-2">
              · {item.source === "STOCK" ? "En stock" : "A pedido"}
            </span>
          )}
        </p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          -
        </Button>
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="h-8 w-14 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity + 1)}
        >
          +
        </Button>
      </div>

      {/* Unit Price (editable for custom) */}
      <div className="w-28">
        {item.isCustom ? (
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              min="0"
              value={item.unitPrice}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
              className="h-8 pl-5 text-right text-sm"
            />
          </div>
        ) : (
          <p className="text-right text-sm text-muted-foreground">
            {formatCurrency(item.unitPrice)}
          </p>
        )}
      </div>

      {/* Subtotal */}
      <div className="w-28 text-right">
        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
      </div>

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-600"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ProductSelector({ items, onChange, disabled }: ProductSelectorProps) {
  const [customModalOpen, setCustomModalOpen] = useState(false)

  const handleSelectVariant = (variant: ProductVariant) => {
    // Check if already added
    const existing = items.find((item) => item.variantId === variant.id)
    if (existing) {
      // Increment quantity
      onChange(
        items.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: item.unitPrice * (item.quantity + 1),
              }
            : item
        )
      )
      return
    }

    // Add new item
    const newItem: DocumentItem = {
      id: generateTempId(),
      variantId: variant.id,
      isCustom: false,
      productName: variant.product.name,
      productSize: variant.size,
      unitPrice: Number(variant.price),
      quantity: 1,
      subtotal: Number(variant.price),
      source: variant.source,
    }

    onChange([...items, newItem])
  }

  const handleAddCustom = (item: DocumentItem) => {
    onChange([...items, item])
  }

  const handleUpdateItem = (id: string, updates: Partial<DocumentItem>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <ProductSearch onSelect={handleSelectVariant} />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCustomModalOpen(true)}
          disabled={disabled}
          className="gap-2 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
        >
          <Plus className="h-4 w-4" />
          Producto Suelto
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No hay productos agregados
            </p>
            <p className="text-xs text-muted-foreground/70">
              Buscá en el catálogo o agregá un producto suelto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Column Headers */}
          <div className="flex items-center gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="flex-1">Producto</div>
            <div className="w-[116px] text-center">Cantidad</div>
            <div className="w-28 text-right">P. Unit.</div>
            <div className="w-28 text-right">Subtotal</div>
            <div className="w-8" />
          </div>

          {/* Items */}
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />
          ))}

          {/* Total */}
          <div className="flex items-center justify-end gap-4 rounded-lg bg-gray-50 p-4 mt-4">
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </span>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Subtotal</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Product Modal */}
      <CustomProductModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onAdd={handleAddCustom}
      />
    </div>
  )
}

export default ProductSelector