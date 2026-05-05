"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Warehouse,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, PageHeader, PageShell, Skel } from "@/components/ui/page-shell"
import { cn, formatCurrency } from "@/lib/utils-client"

interface Category {
  id: string
  name: string
  _count?: { products: number }
}

interface ProductVariant {
  id: string
  size: string
  price: number
  source: "STOCK" | "CATALOGO"
  stockQty: number
  minStock: number
  isActive: boolean
}

interface Product {
  id: string
  sku: string
  name: string
  brand: string
  description?: string | null
  warranty: number
  isActive: boolean
  category: { id: string; name: string }
  variants: ProductVariant[]
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skel className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skel className="h-4 w-48" />
            <Skel className="h-3 w-32" />
          </div>
        </div>
        <Skel className="h-5 w-24" />
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

function ProductRow({
  product,
  isExpanded,
  onToggle,
}: {
  product: Product
  isExpanded: boolean
  onToggle: () => void
}) {
  const stockVariants = product.variants.filter((v) => v.source === "STOCK" && v.isActive)
  const activeVariants = product.variants.filter((v) => v.isActive && v.price > 0)
  const minPrice = activeVariants.length > 0 ? Math.min(...activeVariants.map((v) => v.price)) : 0
  const maxPrice = activeVariants.length > 0 ? Math.max(...activeVariants.map((v) => v.price)) : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              isExpanded ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700",
            )}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-700">
                {product.sku}
              </span>
              {!product.isActive && (
                <Badge variant="destructive" className="text-[10px]">
                  Inactivo
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {product.variants.length} medidas · Garantía {product.warranty}{" "}
              {product.warranty === 1 ? "año" : "años"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {stockVariants.length > 0 && (
            <Badge variant="success" className="hidden gap-1 sm:inline-flex">
              <Warehouse className="h-3 w-3" />
              {stockVariants.length} stock
            </Badge>
          )}
          <div className="text-right">
            {minPrice > 0 ? (
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(minPrice)}
                {minPrice !== maxPrice && (
                  <span className="text-xs font-normal text-neutral-400">
                    {" – "}
                    {formatCurrency(maxPrice)}
                  </span>
                )}
              </p>
            ) : (
              <span className="text-sm text-neutral-400">Próximamente</span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {product.variants.map((variant) => {
              const inactive = !variant.isActive || variant.price === 0
              return (
                <div
                  key={variant.id}
                  className={cn(
                    "rounded-xl border bg-white p-3 transition-colors",
                    inactive
                      ? "border-neutral-100 opacity-60"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{variant.size}</p>
                      {!inactive ? (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {variant.source === "STOCK"
                            ? `${variant.stockQty} en stock`
                            : "Catálogo"}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-neutral-400">Próximamente</p>
                      )}
                    </div>
                    {variant.price > 0 ? (
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatCurrency(variant.price)}
                      </p>
                    ) : (
                      <span className="text-sm text-neutral-400">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = "/api/products?"
      if (search) url += `search=${encodeURIComponent(search)}&`
      if (categoryFilter !== "all") url += `categoryId=${categoryFilter}&`
      if (sourceFilter !== "all") url += `source=${sourceFilter}&`
      const res = await fetch(url)
      const data = await res.json()
      setProducts(data.items || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [search, categoryFilter, sourceFilter])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const toggleExpanded = (id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true)
    try {
      await fetch("/api/seed", { method: "POST" })
      await Promise.all([fetchProducts(), fetchCategories()])
    } catch (error) {
      console.error("Error loading demo:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setSourceFilter("all")
  }

  const totalVariants = products.reduce((s, p) => s + p.variants.length, 0)
  const stockCount = products.reduce(
    (s, p) => s + p.variants.filter((v) => v.source === "STOCK").length,
    0,
  )
  const catalogCount = totalVariants - stockCount
  const hasFilters = Boolean(search || categoryFilter !== "all" || sourceFilter !== "all")

  // Group by category
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.category.name
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <PageShell size="lg">
      <PageHeader
        title="Productos"
        description="Catálogo PIERO"
        actions={
          <Button variant="outline" onClick={handleLoadDemo} disabled={isLoadingDemo} className="gap-2">
            {isLoadingDemo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recargar demo
          </Button>
        }
      />

      {/* Stats */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Productos" value={products.length} />
        <StatPill label="Variantes" value={totalVariants} />
        <StatPill label="En stock" value={stockCount} />
        <StatPill label="Catálogo" value={catalogCount} />
      </section>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="STOCK">En stock</SelectItem>
            <SelectItem value="CATALOGO">Catálogo</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="No se encontraron productos"
            description="Probá ajustar los filtros de búsqueda."
            action={
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No hay productos"
            description="Cargá el catálogo demo de PIERO para empezar."
            action={
              <Button onClick={handleLoadDemo} disabled={isLoadingDemo} className="gap-2">
                {isLoadingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Cargar demo
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([categoryName, categoryProducts]) => (
            <div key={categoryName}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {categoryName}
                </h2>
                <div className="h-px flex-1 bg-neutral-100" />
                <span className="text-xs text-neutral-400 tabular-nums">
                  {categoryProducts.length}
                </span>
              </div>
              <div className="space-y-2">
                {categoryProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    isExpanded={expandedProducts.has(product.id)}
                    onToggle={() => toggleExpanded(product.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
