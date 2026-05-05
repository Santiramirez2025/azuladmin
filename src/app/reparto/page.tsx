"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, ChevronRight, MapPin, Package, Phone, RefreshCw, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils-client"
import { DeliveryPushBanner } from "./_components/DeliveryPushBanner"

interface RemitoListItem {
  id: string
  number: number
  status: string
  date: string
  signedAt: string | null
  shippingType: string
  observations?: string | null
  client: {
    id: string
    name: string
    phone: string
    address?: string | null
    city: string
    province: string
  }
  items: Array<{ id: string; productName: string; productSize: string; quantity: number }>
}

type Filter = "pending" | "signed"

export default function RepartoPage() {
  const [items, setItems] = useState<RemitoListItem[]>([])
  const [filter, setFilter] = useState<Filter>("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRemitos = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      try {
        const res = await fetch(`/api/delivery/remitos?filter=${filter}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.items ?? [])
        }
      } catch (err) {
        console.error("Error fetching remitos:", err)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [filter],
  )

  useEffect(() => {
    fetchRemitos()
  }, [fetchRemitos])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5">
      <div className="mb-4">
        <DeliveryPushBanner />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex rounded-full bg-neutral-100 p-1">
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === "pending" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter("signed")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === "signed" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
            }`}
          >
            Firmadas
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fetchRemitos(true)}
          disabled={isRefreshing}
          aria-label="Actualizar"
        >
          <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            {filter === "pending" ? (
              <Truck className="h-6 w-6 text-neutral-500" />
            ) : (
              <CheckCircle className="h-6 w-6 text-neutral-500" />
            )}
          </div>
          <p className="text-base font-semibold tracking-tight">
            {filter === "pending" ? "Sin entregas pendientes" : "Aún no hay firmadas"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {filter === "pending"
              ? "Cuando Santiago cargue un remito vas a recibir un aviso."
              : "Las firmadas aparecerán acá."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((rem) => {
            const totalItems = rem.items.reduce((s, i) => s + i.quantity, 0)
            return (
              <li key={rem.id}>
                <Link
                  href={`/reparto/${rem.id}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 active:bg-neutral-50"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs font-medium text-neutral-700">
                      #{String(rem.number).padStart(5, "0")}
                    </span>
                    {rem.signedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <CheckCircle className="h-3 w-3" />
                        Firmado
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">{formatDate(new Date(rem.date))}</span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-neutral-900">{rem.client.name}</p>

                  <div className="mt-2 space-y-1 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span className="truncate">
                        {rem.client.address ? `${rem.client.address}, ${rem.client.city}` : rem.client.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span>{rem.client.phone}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Package className="h-3.5 w-3.5" />
                      <span>
                        {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="truncate">{rem.shippingType}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-300" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
