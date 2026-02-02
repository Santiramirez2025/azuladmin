"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Package, Warehouse, Truck, Edit, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

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

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
  const stockCount = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.source === "STOCK").length,
    0
  )

  return (
    <div className="p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">
            Catálogo de colchones PIERO
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetch("/api/seed", { method: "POST" }).then(() => fetchProducts())}>
            Cargar Datos Demo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-500">Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVariants}</p>
                <p className="text-sm text-gray-500">Variantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stockCount}</p>
                <p className="text-sm text-gray-500">En Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVariants - stockCount}</p>
                <p className="text-sm text-gray-500">En Catálogo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="STOCK">En Stock</SelectItem>
                <SelectItem value="CATALOGO">Catálogo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-gray-500">Cargando...</p>
          ) : products.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No se encontraron productos</p>
              <p className="text-sm text-gray-400">
                Usá el botón "Cargar Datos Demo" para poblar el catálogo
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => {
                const isExpanded = expandedProducts.has(product.id)
                const stockVariants = product.variants.filter(
                  (v) => v.source === "STOCK"
                )
                const minPrice = Math.min(...product.variants.map((v) => v.price))
                const maxPrice = Math.max(...product.variants.map((v) => v.price))

                return (
                  <div key={product.id} className="rounded-lg border">
                    {/* Product Header */}
                    <button
                      onClick={() => toggleExpanded(product.id)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {product.sku}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {product.category.name} • {product.variants.length}{" "}
                            medidas • Garantía {product.warranty} años
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {stockVariants.length > 0 && (
                          <Badge variant="success" className="gap-1">
                            <Warehouse className="h-3 w-3" />
                            {stockVariants.length} en stock
                          </Badge>
                        )}
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(minPrice)}
                            {minPrice !== maxPrice && (
                              <span className="text-gray-400">
                                {" "}
                                - {formatCurrency(maxPrice)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Variants */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {product.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between rounded-lg border bg-white p-3"
                            >
                              <div>
                                <p className="font-medium">{variant.size}</p>
                                <Badge
                                  variant={
                                    variant.source === "STOCK"
                                      ? "success"
                                      : "secondary"
                                  }
                                  className="mt-1 gap-1"
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
                              <p className="text-lg font-bold">
                                {formatCurrency(variant.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
