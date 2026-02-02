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
      <div className="flex min-h-screen items-center justify-center p-4 pt-20 md:p-8 md:pt-8">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Bienvenido de vuelta. Aquí está el resumen de hoy.
          </p>
        </div>
        <Link href="/documentos/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ventas del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.salesThisMonth.total || 0)}
            </div>
            {stats?.salesThisMonth.change !== 0 && (
              <p className={`flex items-center text-xs ${
                (stats?.salesThisMonth.change || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {(stats?.salesThisMonth.change || 0) >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {stats?.salesThisMonth.change}% vs mes anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Documentos del Mes
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documentsThisMonth || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.documentsToday || 0} hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recibos Cerrados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.salesThisMonth.count || 0}</div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendiente de Cobro
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.pendingPayments.total || 0)}
            </div>
            <p className="text-xs text-gray-500">
              {stats?.pendingPayments.count || 0} documentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Recientes
            </CardTitle>
            <Link href="/documentos">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.recentDocuments?.length ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">No hay documentos aún</p>
                <Link href="/documentos/nuevo">
                  <Button className="mt-4" size="sm">
                    Crear primer documento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documentos/${doc.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          #{String(doc.number).padStart(5, "0")} - {typeLabels[doc.type]}
                        </p>
                        <p className="text-sm text-gray-500">{doc.client}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(doc.total)}</p>
                      <Badge variant={statusColors[doc.status]} className="mt-1">
                        {statusLabels[doc.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.topProducts?.length ? (
              <div className="py-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Sin ventas este mes</p>
                <Link href="/productos">
                  <Button variant="outline" className="mt-4" size="sm">
                    Ver catálogo
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.quantity} vendidos
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/documentos/nuevo?tipo=presupuesto">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Nuevo Presupuesto</span>
              </Button>
            </Link>
            <Link href="/documentos/nuevo?tipo=recibo">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Nuevo Recibo</span>
              </Button>
            </Link>
            <Link href="/clientes">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Users className="h-6 w-6 text-purple-600" />
                <span>Ver Clientes</span>
              </Button>
            </Link>
            <Link href="/productos">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Package className="h-6 w-6 text-orange-600" />
                <span>Ver Productos</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
