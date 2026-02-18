"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Package,
  Warehouse,
  Truck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  ShoppingBag,
  RefreshCw,
  Loader2,
  Award,
  Maximize2,
  Tag,
  BedDouble,
  Shield,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency, cn } from "@/lib/utils-client"

// ============================================================================
// TYPES
// ============================================================================

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
  isActive: boolean
}

interface Product {
  id: string
  sku: string
  name: string
  brand: string
  warranty: number
  isActive: boolean
  category: Category
  variants: ProductVariant[]
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  "Colchones Ancla":      BedDouble,
  "Colchones Equilibrio": BedDouble,
  "Colchones Premium":    Sparkles,
  "Sommiers":             Package,
  "Protectores":          Shield,
  "Almohadas":            Layers,
  "Sábanas":              ShoppingBag,
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  "Colchones Ancla":      "from-rose-500 to-red-600",
  "Colchones Equilibrio": "from-blue-500 to-indigo-600",
  "Colchones Premium":    "from-amber-500 to-orange-600",
  "Sommiers":             "from-slate-500 to-slate-700",
  "Protectores":          "from-emerald-500 to-green-600",
  "Almohadas":            "from-violet-500 to-purple-600",
  "Sábanas":              "from-pink-500 to-rose-600",
}

function getCategoryIcon(name: string) {
  return CATEGORY_ICON_MAP[name] ?? Package
}

function getCategoryColor(name: string) {
  return CATEGORY_COLOR_MAP[name] ?? "from-slate-500 to-slate-700"
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white/80 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  </div>
)

const StatsCardSkeleton = () => (
  <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </CardContent>
  </Card>
)

// ============================================================================
// STATS CARDS
// ============================================================================

function StatsCards({
  totalProducts,
  totalVariants,
  stockCount,
  catalogCount,
  isLoading,
}: {
  totalProducts: number
  totalVariants: number
  stockCount: number
  catalogCount: number
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
    )
  }

  const stats = [
    {
      label: "Productos",
      value: totalProducts,
      icon: Package,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "from-blue-500/10 to-indigo-600/10",
      sub: "+8%",
      subPositive: true as boolean | null,
    },
    {
      label: "Variantes",
      value: totalVariants,
      icon: Layers,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "from-violet-500/10 to-purple-600/10",
      sub: "Total",
      subPositive: null as boolean | null,
    },
    {
      label: "En Stock",
      value: stockCount,
      icon: Warehouse,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "from-emerald-500/10 to-green-600/10",
      sub: totalVariants > 0 ? `${Math.round((stockCount / totalVariants) * 100)}%` : "0%",
      subPositive: true as boolean | null,
    },
    {
      label: "En Catálogo",
      value: catalogCount,
      icon: Truck,
      gradient: "from-orange-500 to-amber-600",
      iconBg: "from-orange-500/10 to-amber-600/10",
      sub: totalVariants > 0 ? `${Math.round((catalogCount / totalVariants) * 100)}%` : "0%",
      subPositive: null as boolean | null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className="group relative" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className={cn(
            "absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-40",
            stat.gradient
          )} />
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={cn(
              "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-2xl",
              stat.iconBg
            )} />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                  <p className={cn(
                    "bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent",
                    stat.gradient
                  )}>
                    {stat.value}
                  </p>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-semibold",
                    stat.subPositive === true && "text-emerald-600",
                    stat.subPositive === null && "text-slate-500"
                  )}>
                    {stat.subPositive === true && <TrendingUp className="h-3.5 w-3.5" />}
                    <span>{stat.sub}</span>
                  </div>
                </div>
                <div className={cn(
                  "rounded-2xl bg-gradient-to-br p-4 shadow-lg transition-transform group-hover:scale-110",
                  stat.gradient
                )}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-blue-200/50 to-purple-300/50 blur-2xl" />
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-100 to-purple-200/50 p-8 shadow-lg">
          <Package className="h-16 w-16 text-blue-500" />
        </div>
      </div>
      <h3 className="mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold text-transparent">
        No hay productos aún
      </h3>
      <p className="mb-8 max-w-sm text-sm text-slate-500">
        Cargá los datos de demostración para poblar el catálogo con todos los productos PIERO.
      </p>
      <Button
        size="lg"
        onClick={onLoadDemo}
        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
      >
        <RefreshCw className="h-5 w-5" />
        Cargar Datos Demo
      </Button>
    </div>
  )
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

function ProductCard({
  product,
  isExpanded,
  onToggle,
}: {
  product: Product
  isExpanded: boolean
  onToggle: () => void
}) {
  const stockVariants = product.variants.filter(v => v.source === "STOCK" && v.isActive)
  const activeVariants = product.variants.filter(v => v.isActive && v.price > 0)
  const minPrice = activeVariants.length > 0 ? Math.min(...activeVariants.map(v => v.price)) : 0
  const maxPrice = activeVariants.length > 0 ? Math.max(...activeVariants.map(v => v.price)) : 0
  const CategoryIcon = getCategoryIcon(product.category.name)
  const categoryColor = getCategoryColor(product.category.name)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Colored left border accent */}
      <div className={cn(
        "absolute left-0 top-0 h-full w-1 bg-gradient-to-b opacity-60 transition-opacity group-hover:opacity-100",
        categoryColor
      )} />

      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-4">
          {/* Expand icon */}
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all shrink-0",
            isExpanded
              ? `bg-gradient-to-br ${categoryColor} text-white shadow-lg`
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
          )}>
            {isExpanded
              ? <ChevronDown className="h-5 w-5" />
              : <ChevronRight className="h-5 w-5" />}
          </div>

          {/* Info */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base font-semibold text-slate-900 truncate">
                {product.name}
              </span>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 font-mono text-xs font-semibold shrink-0"
              >
                {product.sku}
              </Badge>
              {!product.isActive && (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">
                  Inactivo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <div className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-white text-xs font-medium bg-gradient-to-r",
                categoryColor
              )}>
                <CategoryIcon className="h-3 w-3" />
                {product.category.name}
              </div>
              <span className="text-slate-300">•</span>
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{product.variants.length} medidas</span>
              <span className="text-slate-300">•</span>
              <Award className="h-3.5 w-3.5" />
              <span>Garantía {product.warranty} {product.warranty === 1 ? "año" : "años"}</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0 ml-4">
          {stockVariants.length > 0 && (
            <Badge className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:opacity-90 hidden sm:flex">
              <Warehouse className="h-3.5 w-3.5" />
              {stockVariants.length} en stock
            </Badge>
          )}
          <div className="text-right">
            {minPrice > 0 ? (
              <p className={cn(
                "bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent",
                categoryColor
              )}>
                {formatCurrency(minPrice)}
                {minPrice !== maxPrice && (
                  <span className="text-sm font-normal text-slate-400">
                    {" "}- {formatCurrency(maxPrice)}
                  </span>
                )}
              </p>
            ) : (
              <span className="text-sm font-medium text-slate-400">Próximamente</span>
            )}
          </div>
        </div>
      </button>

      {/* Variants */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 border-t border-slate-100 bg-gradient-to-br from-slate-50/50 to-blue-50/20 px-6 py-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">
              Variantes Disponibles
              <span className="ml-2 text-xs font-normal text-slate-400">
                ({product.variants.length} medidas)
              </span>
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {product.variants.map((variant, index) => (
              <div
                key={variant.id}
                className={cn(
                  "group/variant relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
                  !variant.isActive || variant.price === 0
                    ? "border-slate-100 opacity-60"
                    : variant.source === "STOCK"
                    ? "border-emerald-100 hover:shadow-emerald-500/10"
                    : "border-orange-100 hover:shadow-orange-500/10"
                )}
                style={{ animation: `slideIn 0.3s ease-out ${index * 0.04}s both` }}
              >
                {/* Status indicator */}
                <div className={cn(
                  "absolute top-0 right-0 h-1 w-full rounded-t-xl bg-gradient-to-r",
                  !variant.isActive || variant.price === 0
                    ? "from-slate-300 to-slate-400"
                    : variant.source === "STOCK"
                    ? "from-emerald-400 to-green-500"
                    : "from-orange-400 to-amber-500"
                )} />

                <div className="flex items-start justify-between pt-1">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-900">
                      {variant.size}
                    </p>
                    {variant.isActive && variant.price > 0 ? (
                      <Badge
                        className={cn(
                          "gap-1 text-xs shadow-sm",
                          variant.source === "STOCK"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90"
                            : "bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:opacity-90"
                        )}
                      >
                        {variant.source === "STOCK" ? (
                          <>
                            <Warehouse className="h-3 w-3" />
                            Stock ({variant.stockQty})
                          </>
                        ) : (
                          <>
                            <Truck className="h-3 w-3" />
                            Catálogo
                          </>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-400 text-xs">
                        Próximamente
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {variant.price > 0 ? (
                      <p className={cn(
                        "bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent",
                        variant.source === "STOCK"
                          ? "from-emerald-600 to-green-700"
                          : "from-orange-600 to-amber-700"
                      )}>
                        {formatCurrency(variant.price)}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-slate-400">—</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

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

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const toggleExpanded = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true)
    try {
      await fetch("/api/seed", { method: "POST" })
      await fetchProducts()
      await fetchCategories()
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
  const stockCount = products.reduce((s, p) => s + p.variants.filter(v => v.source === "STOCK").length, 0)
  const catalogCount = totalVariants - stockCount
  const hasFilters = search || categoryFilter !== "all" || sourceFilter !== "all"

  // Group products by category for display
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.category.name
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur" />
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-3 shadow-lg shadow-blue-500/30">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-4xl font-bold text-transparent">
                    Productos
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Catálogo completo PIERO
                  </p>
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleLoadDemo}
                  disabled={isLoadingDemo}
                  className="gap-2 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white"
                >
                  {isLoadingDemo ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Cargando...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" />Recargar Demo</>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recargar catálogo completo de PIERO</TooltipContent>
            </Tooltip>
          </div>

          {/* Stats */}
          <StatsCards
            totalProducts={products.length}
            totalVariants={totalVariants}
            stockCount={stockCount}
            catalogCount={catalogCount}
            isLoading={isLoading}
          />

          {/* Filters */}
          <Card className="border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nombre, SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-slate-200 bg-white/50 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full border-slate-200 bg-white/50 sm:w-56">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full border-slate-200 bg-white/50 sm:w-44">
                    <SelectValue placeholder="Disponibilidad" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="STOCK">En Stock</SelectItem>
                    <SelectItem value="CATALOGO">Catálogo</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1.5 text-slate-500 hover:text-slate-900 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 py-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-1.5">
                    <ShoppingBag className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Catálogo de Productos
                  </span>
                </CardTitle>
                <Badge variant="secondary" className="border border-slate-200 bg-slate-50 font-medium">
                  {products.length} producto{products.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                hasFilters ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="mb-4 h-12 w-12 text-slate-300" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                      No se encontraron productos
                    </h3>
                    <p className="mb-4 text-sm text-slate-500">
                      Probá ajustando los filtros de búsqueda
                    </p>
                    <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </Button>
                  </div>
                ) : (
                  <EmptyState onLoadDemo={handleLoadDemo} />
                )
              ) : (
                // Grouped by category
                <div className="space-y-8">
                  {Object.entries(grouped).map(([categoryName, categoryProducts]) => {
                    const CatIcon = getCategoryIcon(categoryName)
                    const catColor = getCategoryColor(categoryName)
                    return (
                      <div key={categoryName}>
                        {/* Category header */}
                        <div className="mb-3 flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                            catColor
                          )}>
                            <CatIcon className="h-4 w-4 text-white" />
                          </div>
                          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                            {categoryName}
                          </h2>
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="text-xs text-slate-400 font-medium">
                            {categoryProducts.length} producto{categoryProducts.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Products in category */}
                        <div className="space-y-3">
                          {categoryProducts.map((product, index) => (
                            <div
                              key={product.id}
                              style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}
                            >
                              <ProductCard
                                product={product}
                                isExpanded={expandedProducts.has(product.id)}
                                onToggle={() => toggleExpanded(product.id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </TooltipProvider>
  )
}