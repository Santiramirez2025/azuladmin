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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
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

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "warning",
  APPROVED: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  EXPIRED: "secondary",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  APPROVED: "Aprobado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
}

const typeLabels: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-lg font-semibold text-transparent">
            Cargando dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        {/* Header con glassmorphism */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur"></div>
                <Sparkles className="relative h-8 w-8 text-blue-600" />
              </div>
              <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-600 md:text-base">
              Bienvenido de vuelta • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link href="/documentos/nuevo">
            <Button className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-transform group-hover:translate-x-0"></div>
              <span className="relative flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nuevo Documento
              </span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid con efectos modernos */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ventas del Mes */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg shadow-green-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
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
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
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
              </CardContent>
            </Card>
          </div>

          {/* Documentos del Mes */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg shadow-blue-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
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
                  <span className="text-blue-600">{stats?.documentsToday || 0}</span> creados hoy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recibos Cerrados */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg shadow-violet-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-2xl"></div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  Recibos Cerrados
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
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg shadow-amber-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
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
                  <span className="text-amber-600">{stats?.pendingPayments.count || 0}</span> documentos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Documents */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Documentos Recientes
                  </CardTitle>
                  <Link href="/documentos">
                    <Button variant="ghost" size="sm" className="group gap-1 font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                      Ver todos
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!stats?.recentDocuments?.length ? (
                  <div className="py-12 text-center">
                    <div className="relative mx-auto mb-4 w-fit">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
                      <FileText className="relative h-16 w-16 text-slate-300" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-slate-700">No hay documentos aún</p>
                    <p className="mb-6 text-sm text-slate-500">Comienza creando tu primer documento</p>
                    <Link href="/documentos/nuevo">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear primer documento
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentDocuments.map((doc, index) => (
                      <Link
                        key={doc.id}
                        href={`/documentos/${doc.id}`}
                        className="group relative flex items-center justify-between rounded-xl border border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-transparent p-4 transition-all duration-300 hover:border-blue-300/50 hover:bg-blue-50/50 hover:shadow-md"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                            <FileText className="h-6 w-6 text-white" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              #{String(doc.number).padStart(5, "0")} • {typeLabels[doc.type]}
                            </p>
                            <p className="text-sm text-slate-500">{doc.client}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-1 text-lg font-bold text-slate-900">{formatCurrency(doc.total)}</p>
                          <Badge variant={statusColors[doc.status]} className="shadow-sm">
                            {statusLabels[doc.status]}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-1.5">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Top Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!stats?.topProducts?.length ? (
                <div className="py-12 text-center">
                  <div className="relative mx-auto mb-4 w-fit">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl"></div>
                    <Package className="relative h-16 w-16 text-slate-300" />
                  </div>
                  <p className="mb-2 text-lg font-semibold text-slate-700">Sin ventas este mes</p>
                  <p className="mb-6 text-sm text-slate-500">Explora el catálogo de productos</p>
                  <Link href="/productos">
                    <Button variant="outline" className="border-emerald-200 font-semibold text-emerald-600 hover:bg-emerald-50">
                      <Package className="mr-2 h-4 w-4" />
                      Ver catálogo
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50"
                      style={{
                        animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                      }}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-transform group-hover:scale-110 ${
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
                          {product.quantity} vendidos
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
        </div>

        {/* Quick Actions con animaciones */}
        <Card className="mt-6 overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/documentos/nuevo?tipo=presupuesto">
                <Button
                  variant="outline"
                  className="group relative h-auto w-full overflow-hidden border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 py-8 transition-all duration-300 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10"
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
                  className="group relative h-auto w-full overflow-hidden border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-green-50/50 py-8 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
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
                  className="group relative h-auto w-full overflow-hidden border-2 border-violet-200/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50 py-8 transition-all duration-300 hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/10"
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
                  className="group relative h-auto w-full overflow-hidden border-2 border-orange-200/50 bg-gradient-to-br from-orange-50/50 to-amber-50/50 py-8 transition-all duration-300 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/10"
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
    </div>
  )
}