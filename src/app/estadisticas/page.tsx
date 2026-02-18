// src/app/estadisticas/page.tsx
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
  BarChart3,
  Activity,
  Sparkles,
  Clock,
  CalendarDays,
  CalendarRange,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { formatCurrency, formatDate } from "@/lib/utils-client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

type Period = "day" | "week" | "month"

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("month")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCustomDate, setIsCustomDate] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const dateParam = isCustomDate && selectedDate 
          ? `&date=${selectedDate.toISOString()}`
          : ""
        
        const res = await fetch(`/api/stats?period=${period}${dateParam}`)
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
  }, [period, selectedDate, isCustomDate])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setIsCustomDate(true)
  }

  const handleResetDate = () => {
    setSelectedDate(new Date())
    setIsCustomDate(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-20 w-20">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-lg font-semibold text-transparent">
            Cargando estadísticas...
          </p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          <Card className="overflow-hidden border-0 bg-white/80 shadow-2xl shadow-slate-900/10 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="relative mx-auto mb-6 w-fit">
                <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-2xl"></div>
                <Activity className="relative h-20 w-20 text-slate-300" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">No hay datos disponibles</h3>
              <p className="text-slate-600">
                Cargá productos y creá documentos para ver estadísticas detalladas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const maxDailySale = Math.max(...stats.dailySales.map((d) => d.total), 1)

  const periodLabels = {
    day: {
      title: "Hoy",
      subtitle: "Rendimiento del día",
      chartTitle: "Ventas por Hora",
      chartBadge: "Últimas 24 horas",
      avgLabel: "Promedio por hora",
    },
    week: {
      title: "Esta Semana",
      subtitle: "Últimos 7 días",
      chartTitle: "Ventas Diarias",
      chartBadge: "Últimos 7 días",
      avgLabel: "Promedio diario",
    },
    month: {
      title: "Este Mes",
      subtitle: "Últimos 30 días",
      chartTitle: "Ventas Diarias",
      chartBadge: "Últimos 30 días",
      avgLabel: "Promedio diario",
    },
  }

  const currentLabels = periodLabels[period]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-20 blur"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 shadow-lg shadow-violet-500/25">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 via-violet-900 to-purple-900 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  Estadísticas
                </h1>
                <p className="mt-1 text-sm text-slate-600 md:text-base">
                  {isCustomDate && selectedDate 
                    ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                    : currentLabels.subtitle
                  }
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative h-auto rounded-xl border-0 bg-white/80 px-4 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-sm transition-all hover:shadow-emerald-500/20"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold">
                        {isCustomDate && selectedDate
                          ? format(selectedDate, "dd/MM/yyyy")
                          : "Seleccionar fecha"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-xl" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={es}
                      className="rounded-xl"
                    />
                    {isCustomDate && (
                      <div className="border-t border-slate-200 p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleResetDate}
                          className="w-full font-semibold"
                        >
                          Volver a hoy
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
                <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="relative">
                  <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border-0 bg-white/80 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-sm">
                    <TabsTrigger value="day" className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30">
                      <Clock className="h-4 w-4" />
                      <span className="hidden sm:inline">Día</span>
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30">
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">7d</span>
                    </TabsTrigger>
                    <TabsTrigger value="month" className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30">
                      <CalendarRange className="h-4 w-4" />
                      <span className="hidden sm:inline">30d</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {isCustomDate && selectedDate
                  ? `Datos desde ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                  : `Mostrando datos de ${currentLabels.title.toLowerCase()}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative h-full overflow-hidden border-0 bg-white/80 shadow-xl shadow-emerald-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-600/10 blur-3xl"></div>
              <CardContent className="relative p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-600">Ventas - {currentLabels.title}</p>
                    <div className="mb-2 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-3xl font-bold text-transparent">
                      {formatCurrency(stats.salesThisMonth.total)}
                    </div>
                    {stats.salesThisMonth.change !== 0 && (
                      <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${stats.salesThisMonth.change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {stats.salesThisMonth.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span>{Math.abs(stats.salesThisMonth.change)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-3 shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative h-full overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl"></div>
              <CardContent className="relative p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-600">Documentos</p>
                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-3xl font-bold text-transparent">
                      {stats.documentsThisMonth}
                    </div>
                    {period === "month" && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        <Activity className="h-3.5 w-3.5" />
                        <span>{stats.documentsToday} hoy</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium">creados en {currentLabels.title.toLowerCase()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative h-full overflow-hidden border-0 bg-white/80 shadow-xl shadow-amber-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 blur-3xl"></div>
              <CardContent className="relative p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-600">Pendiente de Cobro</p>
                    <div className="mb-2 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-3xl font-bold text-transparent">
                      {formatCurrency(stats.pendingPayments.total)}
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{stats.pendingPayments.count} docs</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-110">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium">por cobrar</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
            <Card className="relative h-full overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-3xl"></div>
              <CardContent className="relative p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-600">Operaciones</p>
                    <div className="mb-2 bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-3xl font-bold text-transparent">
                      {stats.salesThisMonth.count}
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                      <Users className="h-3.5 w-3.5" />
                      <span>completados</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-110">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium">recibos cerrados</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-lg shadow-blue-500/20">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  {currentLabels.chartTitle}
                </CardTitle>
                <Badge variant="secondary" className="font-semibold">{currentLabels.chartBadge}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats.dailySales.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative mx-auto mb-4 w-fit">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
                    <BarChart3 className="relative h-16 w-16 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-semibold">No hay datos de ventas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-52 items-end gap-1.5 rounded-xl bg-gradient-to-b from-slate-50/50 to-transparent p-4">
                    {stats.dailySales.map((day, index) => {
                      const height = (day.total / maxDailySale) * 100
                      return (
                        <div key={index} className="group relative flex flex-1 items-end">
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40" style={{ height: `${Math.max(height, 3)}%` }} />
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xl group-hover:block">
                            <div className="text-center">
                              <div className="mb-0.5 text-slate-300">{period === "day" ? `${day.date}:00` : formatDate(day.date)}</div>
                              <div className="text-emerald-400">{formatCurrency(day.total)}</div>
                              <div className="text-blue-400">{day.count} ops</div>
                            </div>
                            <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50/50 px-4 py-2">
                    <span className="text-xs font-medium text-slate-600">{currentLabels.avgLabel}</span>
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(stats.dailySales.length > 0 ? stats.dailySales.reduce((acc, d) => acc + d.total, 0) / stats.dailySales.length : 0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-2 shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.topProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative mx-auto mb-4 w-fit">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl"></div>
                    <Package className="relative h-16 w-16 text-slate-300" />
                  </div>
                  <p className="mb-1 font-semibold text-slate-700">No hay datos de productos</p>
                  <p className="text-sm text-slate-500">Las ventas aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((product, index) => (
                    <div key={index} className="group flex items-center gap-4 rounded-xl border border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-transparent p-4 transition-all duration-300 hover:border-emerald-300/50 hover:bg-emerald-50/30 hover:shadow-md">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold shadow-lg transition-transform group-hover:scale-110 ${
                        index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30" :
                        index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30" :
                        index === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-orange-500/30" :
                        "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/30"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{product.name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Package className="h-3.5 w-3.5" />
                          <span>{product.quantity} unidades</span>
                        </div>
                      </div>
                      <p className="text-base font-bold text-emerald-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 shadow-lg shadow-violet-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Documentos Recientes
              </CardTitle>
              <Badge variant="outline" className="font-semibold">Última actividad</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {stats.recentDocuments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="relative mx-auto mb-4 w-fit">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/20 blur-xl"></div>
                  <FileText className="relative h-16 w-16 text-slate-300" />
                </div>
                <p className="mb-1 font-semibold text-slate-700">No hay documentos recientes</p>
                <p className="text-sm text-slate-500">Crea tu primer documento para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDocuments.map((doc, index) => (
                  <a key={doc.id} href={`/documentos/${doc.id}`} className="group flex items-center justify-between rounded-xl border border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-transparent p-4 transition-all duration-300 hover:border-violet-300/50 hover:bg-violet-50/30 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 font-mono text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-110">
                        #{String(doc.number).padStart(5, "0").slice(-3)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{doc.client}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={doc.type === "PRESUPUESTO" ? "secondary" : doc.type === "RECIBO" ? "default" : "outline"} className="shadow-sm">
                            {doc.type}
                          </Badge>
                          <span className="text-slate-500">{formatDate(doc.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(doc.total)}</p>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}