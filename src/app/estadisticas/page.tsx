"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Package,
  Calendar,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"

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
    type: string
    client: string
    total: number
    status: string
    date: string
  }[]
  dailySales: {
    date: string
    total: number
    count: number
  }[]
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("month")

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
  }, [period])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-4 pt-20 md:p-8 md:pt-8">
        <p>No hay datos disponibles. Cargá productos y creá documentos para ver estadísticas.</p>
      </div>
    )
  }

  const maxDailySale = Math.max(...stats.dailySales.map((d) => d.total), 1)

  return (
    <div className="p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500">
            Resumen de ventas y actividad
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="year">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ventas del Mes</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.salesThisMonth.total)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  {stats.salesThisMonth.change >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        +{stats.salesThisMonth.change}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">
                        {stats.salesThisMonth.change}%
                      </span>
                    </>
                  )}
                  <span className="text-gray-400">vs mes anterior</span>
                </div>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Documentos del Mes
                </p>
                <p className="text-2xl font-bold">{stats.documentsThisMonth}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {stats.documentsToday} creados hoy
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pendiente de Cobro
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.pendingPayments.total)}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {stats.pendingPayments.count} documentos
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Operaciones
                </p>
                <p className="text-2xl font-bold">
                  {stats.salesThisMonth.count}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  recibos completados
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Diarias (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dailySales.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No hay datos de ventas
              </p>
            ) : (
              <div className="flex h-48 items-end gap-1">
                {stats.dailySales.map((day, index) => {
                  const height = (day.total / maxDailySale) * 100
                  const date = new Date(day.date)
                  return (
                    <div
                      key={index}
                      className="group relative flex-1"
                      title={`${formatDate(day.date)}: ${formatCurrency(day.total)}`}
                    >
                      <div
                        className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                        {formatDate(day.date)}
                        <br />
                        {formatCurrency(day.total)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No hay datos de productos
              </p>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                    <p className="font-medium text-green-600">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentDocuments.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No hay documentos recientes
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`/documentos/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-gray-100 px-2 py-1 text-sm font-mono">
                      #{String(doc.number).padStart(5, "0")}
                    </div>
                    <div>
                      <p className="font-medium">{doc.client}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge
                          variant={
                            doc.type === "PRESUPUESTO"
                              ? "secondary"
                              : doc.type === "RECIBO"
                              ? "default"
                              : "outline"
                          }
                        >
                          {doc.type}
                        </Badge>
                        <span>{formatDate(doc.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{formatCurrency(doc.total)}</p>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
