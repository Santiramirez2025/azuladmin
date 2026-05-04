import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils-client"
import type { Stats } from "./types"

export function TopProducts({ products }: { products: Stats["topProducts"] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight">Top productos</h2>
      </div>
      {products.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Package className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mb-1 text-base font-semibold tracking-tight">Sin ventas este mes</h3>
          <p className="mb-5 text-sm text-neutral-500">Explorá el catálogo de productos.</p>
          <Link href="/productos">
            <Button variant="outline">
              <Package className="h-4 w-4" />
              Ver catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {products.map((product, index) => (
            <li key={product.name} className="flex items-center gap-4 px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold tabular-nums text-neutral-700">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                <p className="text-xs text-neutral-500">
                  {product.quantity} {product.quantity === 1 ? "vendido" : "vendidos"}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(product.revenue)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
