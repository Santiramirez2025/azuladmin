"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Search, 
  Package, 
  Warehouse, 
  Truck, 
  Edit, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  Box,
  Layers,
  ShoppingBag,
  Filter,
  Tag,
  RefreshCw,
  Loader2,
  Award,
  Maximize2,
  BarChart3,
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
import { formatCurrency, cn } from "@/lib/utils"

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
// Skeleton Components
// ============================================================================

const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white/80 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5" />
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
  <Card className="group relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/10 blur-2xl"></div>
    <CardContent className="relative p-6">
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
// Stats Cards Component
// ============================================================================

function StatsCards({ 
  totalProducts,
  totalVariants,
  stockCount,
  catalogCount,
  isLoading 
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
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
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
      change: "+8%",
      changePositive: true,
    },
    {
      label: "Variantes",
      value: totalVariants,
      icon: Layers,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "from-violet-500/10 to-purple-600/10",
      change: "Total",
      changePositive: null,
    },
    {
      label: "En Stock",
      value: stockCount,
      icon: Warehouse,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "from-emerald-500/10 to-green-600/10",
      change: `${Math.round((stockCount / totalVariants) * 100)}%`,
      changePositive: true,
    },
    {
      label: "En Catálogo",
      value: catalogCount,
      icon: Truck,
      gradient: "from-orange-500 to-amber-600",
      iconBg: "from-orange-500/10 to-amber-600/10",
      change: `${Math.round((catalogCount / totalVariants) * 100)}%`,
      changePositive: null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="group relative"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={cn(
            "absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-40",
            stat.gradient
          )}></div>
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={cn(
              "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-2xl",
              stat.iconBg
            )}></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {stat.label}
                  </p>
                  <p className={cn(
                    "bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent",
                    stat.gradient
                  )}>
                    {stat.value}
                  </p>
                  {stat.change && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      stat.changePositive === true && "text-emerald-600",
                      stat.changePositive === false && "text-red-600",
                      stat.changePositive === null && "text-slate-600"
                    )}>
                      {stat.changePositive === true && <TrendingUp className="h-3.5 w-3.5" />}
                      <span>{stat.change}</span>
                    </div>
                  )}
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
// Empty State Component
// ============================================================================

function EmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-blue-200/50 to-purple-300/50 blur-2xl"></div>
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-100 to-purple-200/50 p-8 shadow-lg shadow-slate-900/5">
          <Package className="h-16 w-16 text-blue-500" />
        </div>
      </div>
      <h3 className="mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold text-transparent">
        No hay productos aún
      </h3>
      <p className="mb-8 max-w-sm text-sm text-slate-600">
        Carga los datos de demostración para poblar el catálogo con productos PIERO.
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
// Product Card Component
// ============================================================================

function ProductCard({ 
  product, 
  isExpanded, 
  onToggle 
}: { 
  product: Product
  isExpanded: boolean
  onToggle: () => void
}) {
  const stockVariants = product.variants.filter(v => v.source === "STOCK")
  const minPrice = Math.min(...product.variants.map(v => v.price))
  const maxPrice = Math.max(...product.variants.map(v => v.price))

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
            isExpanded 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
          )}>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold text-slate-900">
                {product.name}
              </span>
              <Badge 
                variant="outline" 
                className="border-slate-300 bg-slate-50 text-xs font-mono font-semibold"
              >
                {product.sku}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Tag className="h-3.5 w-3.5" />
              <span>{product.category.name}</span>
              <span className="text-slate-300">•</span>
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{product.variants.length} medidas</span>
              <span className="text-slate-300">•</span>
              <Award className="h-3.5 w-3.5" />
              <span>Garantía {product.warranty} años</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {stockVariants.length > 0 && (
            <Badge className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:opacity-90">
              <Warehouse className="h-3.5 w-3.5" />
              {stockVariants.length} en stock
            </Badge>
          )}
          <div className="text-right">
            <p className={cn(
              "bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent",
              "from-blue-600 to-indigo-600"
            )}>
              {formatCurrency(minPrice)}
              {minPrice !== maxPrice && (
                <span className="text-sm font-normal text-slate-400">
                  {" "}- {formatCurrency(maxPrice)}
                </span>
              )}
            </p>
          </div>
        </div>
      </button>

      {/* Variants */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 border-t border-slate-100 bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-600" />
            <p className="text-sm font-semibold text-slate-700">
              Variantes Disponibles
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.variants.map((variant, index) => (
              <div
                key={variant.id}
                className="group/variant relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/10"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                        <Maximize2 className="h-4 w-4 text-slate-600" />
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        {variant.size}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "gap-1.5 shadow-sm",
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
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent",
                      variant.source === "STOCK"
                        ? "from-emerald-600 to-green-700"
                        : "from-orange-600 to-amber-700"
                    )}>
                      {formatCurrency(variant.price)}
                    </p>
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
// Main Component
// ============================================================================

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
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
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const toggleExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true)
    try {
      await fetch("/api/seed", { method: "POST" })
      await fetchProducts()
    } catch (error) {
      console.error("Error loading demo data:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
  const stockCount = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.source === "STOCK").length,
    0
  )
  const catalogCount = totalVariants - stockCount

  const hasFilters = search || categoryFilter !== "all" || sourceFilter !== "all"

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-3 shadow-lg shadow-blue-500/30">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-4xl font-bold text-transparent">
                  Productos
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Catálogo completo de colchones PIERO
              </p>
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Cargar Datos Demo
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                Cargar catálogo de ejemplo
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <StatsCards
              totalProducts={products.length}
              totalVariants={totalVariants}
              stockCount={stockCount}
              catalogCount={catalogCount}
              isLoading={isLoading}
            />
          </div>

          {/* Filters */}
          <Card className="mb-6 border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-slate-200 bg-white/50 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full border-slate-200 bg-white/50 sm:w-52">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
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
                  {[...Array(5)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                hasFilters ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-slate-200/50 blur-xl"></div>
                      <Search className="relative h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                      No se encontraron productos
                    </h3>
                    <p className="text-sm text-slate-500">
                      Probá ajustando los filtros de búsqueda
                    </p>
                  </div>
                ) : (
                  <EmptyState onLoadDemo={handleLoadDemo} />
                )
              ) : (
                <div className="space-y-3">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      style={{
                        animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <ProductCard
                        product={product}
                        isExpanded={expandedProducts.has(product.id)}
                        onToggle={() => toggleExpanded(product.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </TooltipProvider>
  )
}