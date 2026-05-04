import Link from "next/link"
import { Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils-client"
import type { Stats } from "./types"

const rankStyles = [
  "from-yellow-400 to-amber-500 text-white shadow-yellow-500/30",
  "from-slate-300 to-slate-400 text-white shadow-slate-400/30",
  "from-orange-400 to-red-500 text-white shadow-orange-500/30",
  "from-blue-500 to-indigo-600 text-white shadow-blue-500/30",
]

export function TopProducts({ products }: { products: Stats["topProducts"] }) {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-emerald-50/80">
        <CardTitle id="top-products-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 shadow-md">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Top Productos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <div className="relative mx-auto mb-4 w-fit">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 p-6">
                <Package className="h-16 w-16 text-emerald-500" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Sin ventas este mes</h3>
            <p className="mb-6 text-sm text-slate-500">Explora el catálogo de productos disponibles</p>
            <Link href="/productos">
              <Button variant="outline" className="border-2 border-emerald-200 font-semibold text-emerald-600 hover:bg-emerald-50">
                <Package className="mr-2 h-4 w-4" />
                Ver catálogo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.name}
                className="group flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-slate-50"
                style={{ animation: `slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both` }}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold shadow-lg transition-transform group-hover:scale-110 ${
                    rankStyles[index] ?? rankStyles[3]
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {product.quantity} {product.quantity === 1 ? "vendido" : "vendidos"}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
