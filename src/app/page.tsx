"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  DollarSign,
  FileText,
  Plus,
  ArrowRight,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowUpRight,
  Calendar,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils-client"
import type { DocumentStatus, DocumentType } from "@/types"

interface Stats {
  salesThisMonth: {
    total: number
    count: number
    change: number
  }
  documentsThisMonth: number
  documentsToday: number
  pendingPayments: {
    total: number
    count: number
  }
  topProducts: {
    name: string
    quantity: number
    revenue: number
  }[]
  recentDocuments: {
    id: string
    number: number
    type: DocumentType
    client: string
    total: number
    status: DocumentStatus
    date: string
  }[]
}

const statusConfig = {
  DRAFT: { variant: "secondary" as const, label: "Borrador", color: "slate" },
  SENT: { variant: "default" as const, label: "Enviado", color: "blue" },
  APPROVED: { variant: "default" as const, label: "Aprobado", color: "indigo" },
  COMPLETED: { variant: "default" as const, label: "Completado", color: "emerald" },
  CANCELLED: { variant: "destructive" as const, label: "Cancelado", color: "red" },
  EXPIRED: { variant: "secondary" as const, label: "Vencido", color: "orange" },
}

const typeLabels: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}

// Skeleton Loader Components
function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-slate-100 blur-2xl"></div>
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200"></div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200"></div>
      </CardHeader>
      <CardContent className="relative">
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-slate-200"></div>
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100"></div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats")
        if (!res.ok) throw new Error("Error al cargar estadísticas")
        const data = await res.json()
        setStats(data)
        setError(null)
      } catch (error) {
        console.error("Error fetching stats:", error)
        setError("No se pudieron cargar las estadísticas. Intenta recargar la página.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Skeleton */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="h-10 w-64 animate-pulse rounded-lg bg-white/60"></div>
              <div className="h-5 w-48 animate-pulse rounded bg-white/40"></div>
            </div>
            <div className="h-12 w-48 animate-pulse rounded-xl bg-white/60"></div>
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="h-6 w-48 animate-pulse rounded bg-slate-200"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200/50 p-4">
                        <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-200"></div>
                          <div className="h-3 w-24 animate-pulse rounded bg-slate-100"></div>
                        </div>
                        <div className="h-6 w-20 animate-pulse rounded bg-slate-200"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="h-6 w-32 animate-pulse rounded bg-slate-200"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                          <div className="h-3 w-20 animate-pulse rounded bg-slate-100"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
        <Card className="max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="relative mx-auto mb-4 w-fit">
              <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-xl"></div>
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Error al cargar datos</h3>
            <p className="mb-6 text-sm text-slate-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg hover:shadow-xl"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Mejorado */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1.5 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-lg"></div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  Dashboard
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={currentDate.toISOString()}>
                    {formattedDate}
                  </time>
                </div>
              </div>
            </div>
          </div>
          <Link href="/documentos/nuevo">
            <Button 
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-transform duration-300 group-hover:translate-x-0"></div>
              <span className="relative flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nuevo Documento
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Button>
          </Link>
        </header>

        {/* Stats Grid Mejorado */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Estadísticas principales">
          {/* Ventas del Mes */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/90 shadow-lg shadow-green-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-600/10 blur-2xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  Ventas del Mes
                </CardTitle>
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 shadow-lg shadow-green-500/20">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-2 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-3xl font-bold text-transparent">
                  {formatCurrency(stats?.salesThisMonth.total || 0)}
                </div>
                {stats?.salesThisMonth.change !== 0 && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                    (stats?.salesThisMonth.change || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {(stats?.salesThisMonth.change || 0) >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span>{Math.abs(stats?.salesThisMonth.change || 0)}% vs mes anterior</span>
                  </div>
                )}
                {(stats?.salesThisMonth?.count ?? 0) > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
{stats?.salesThisMonth?.count} {stats?.salesThisMonth?.count === 1 ? 'venta' : 'ventas'}
</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documentos del Mes */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/90 shadow-lg shadow-blue-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-2xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  Documentos del Mes
                </CardTitle>
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-3xl font-bold text-transparent">
                  {stats?.documentsThisMonth || 0}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  <span className="font-bold text-blue-600">{stats?.documentsToday || 0}</span> creados hoy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recibos Completados */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/90 shadow-lg shadow-violet-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-2xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  Recibos Completados
                </CardTitle>
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 shadow-lg shadow-violet-500/20">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-2 bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-3xl font-bold text-transparent">
                  {stats?.salesThisMonth.count || 0}
                </div>
                <p className="text-xs font-medium text-slate-500">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Pendiente de Cobro */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/90 shadow-lg shadow-amber-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 blur-2xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  Pendiente de Cobro
                </CardTitle>
                <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-lg shadow-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-2 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-3xl font-bold text-transparent">
                  {formatCurrency(stats?.pendingPayments.total || 0)}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  <span className="font-bold text-amber-600">{stats?.pendingPayments.count || 0}</span>{" "}
                  {stats?.pendingPayments.count === 1 ? 'documento' : 'documentos'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Documents - Mejorado */}
          <section className="lg:col-span-2" aria-labelledby="recent-documents-title">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/80">
                <div className="flex items-center justify-between">
                  <CardTitle id="recent-documents-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-md">
                      <Activity className="h-4.5 w-4.5 text-white" />
                    </div>
                    Actividad Reciente
                  </CardTitle>
                  <Link href="/documentos">
                    <Button variant="ghost" size="sm" className="group gap-1.5 font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                      Ver todos
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!stats?.recentDocuments?.length ? (
                  <div className="py-16 text-center">
                    <div className="relative mx-auto mb-4 w-fit">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
                      <div className="relative rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
                        <FileText className="h-16 w-16 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">Aún no hay documentos</h3>
                    <p className="mb-6 text-sm text-slate-500">Comienza creando tu primer presupuesto, recibo o remito</p>
                    <Link href="/documentos/nuevo">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear primer documento
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentDocuments.map((doc, index) => {
                      const statusInfo = statusConfig[doc.status] || statusConfig.DRAFT
                      return (
                        <Link
                          key={doc.id}
                          href={`/documentos/${doc.id}`}
                          className="group relative flex items-center justify-between rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-transparent p-4 transition-all duration-300 hover:border-blue-300/60 hover:bg-blue-50/60 hover:shadow-lg hover:shadow-blue-500/5"
                          style={{
                            animation: `slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative flex h-13 w-13 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/30">
                              <FileText className="h-6 w-6 text-white" />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                <span className="text-blue-600">#{String(doc.number).padStart(5, "0")}</span> · {typeLabels[doc.type]}
                              </p>
                              <p className="text-sm text-slate-500">{doc.client}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="mb-1.5 text-lg font-bold text-slate-900">{formatCurrency(doc.total)}</p>
                            <Badge 
                              variant={statusInfo.variant}
                              className="shadow-sm font-medium"
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Top Products - Mejorado */}
          <section aria-labelledby="top-products-title">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-emerald-50/80">
                <CardTitle id="top-products-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 shadow-md">
                    <TrendingUp className="h-4.5 w-4.5 text-white" />
                  </div>
                  Top Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!stats?.topProducts?.length ? (
                  <div className="py-12 text-center">
                    <div className="relative mx-auto mb-4 w-fit">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl"></div>
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
                    {stats.topProducts.map((product, index) => (
                      <div
                        key={product.name}
                        className="group flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-slate-50"
                        style={{
                          animation: `slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                        }}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-transform group-hover:scale-110 ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30"
                              : index === 1
                              ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30"
                              : index === 2
                              ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-orange-500/30"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {product.quantity} {product.quantity === 1 ? 'vendido' : 'vendidos'}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Quick Actions Mejorado */}
        <section aria-labelledby="quick-actions-title">
          <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-violet-50/80">
              <CardTitle id="quick-actions-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-md">
                  <Zap className="h-4.5 w-4.5 text-white" />
                </div>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/documentos/nuevo?tipo=presupuesto">
                  <Button
                    variant="outline"
                    className="group relative h-auto w-full overflow-hidden border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 py-8 transition-all duration-300 hover:scale-105 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="absolute inset-0 -translate-y-full bg-gradient-to-br from-blue-500 to-indigo-600 transition-transform duration-300 group-hover:translate-y-0"></div>
                    <div className="relative flex flex-col items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600 transition-colors group-hover:text-white" />
                      <span className="font-semibold text-slate-700 transition-colors group-hover:text-white">
                        Nuevo Presupuesto
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link href="/documentos/nuevo?tipo=recibo">
                  <Button
                    variant="outline"
                    className="group relative h-auto w-full overflow-hidden border-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-green-50/80 py-8 transition-all duration-300 hover:scale-105 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <div className="absolute inset-0 -translate-y-full bg-gradient-to-br from-emerald-500 to-green-600 transition-transform duration-300 group-hover:translate-y-0"></div>
                    <div className="relative flex flex-col items-center gap-3">
                      <DollarSign className="h-8 w-8 text-emerald-600 transition-colors group-hover:text-white" />
                      <span className="font-semibold text-slate-700 transition-colors group-hover:text-white">
                        Nuevo Recibo
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link href="/clientes">
                  <Button
                    variant="outline"
                    className="group relative h-auto w-full overflow-hidden border-2 border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-purple-50/80 py-8 transition-all duration-300 hover:scale-105 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    <div className="absolute inset-0 -translate-y-full bg-gradient-to-br from-violet-500 to-purple-600 transition-transform duration-300 group-hover:translate-y-0"></div>
                    <div className="relative flex flex-col items-center gap-3">
                      <Users className="h-8 w-8 text-violet-600 transition-colors group-hover:text-white" />
                      <span className="font-semibold text-slate-700 transition-colors group-hover:text-white">
                        Ver Clientes
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link href="/productos">
                  <Button
                    variant="outline"
                    className="group relative h-auto w-full overflow-hidden border-2 border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-amber-50/80 py-8 transition-all duration-300 hover:scale-105 hover:border-orange-400/60 hover:shadow-lg hover:shadow-orange-500/10"
                  >
                    <div className="absolute inset-0 -translate-y-full bg-gradient-to-br from-orange-500 to-amber-600 transition-transform duration-300 group-hover:translate-y-0"></div>
                    <div className="relative flex flex-col items-center gap-3">
                      <Package className="h-8 w-8 text-orange-600 transition-colors group-hover:text-white" />
                      <span className="font-semibold text-slate-700 transition-colors group-hover:text-white">
                        Ver Productos
                      </span>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}