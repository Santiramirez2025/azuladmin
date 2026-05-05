"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronRight,
  DollarSign,
  FileText,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { EmptyState, LoadingState, PageHeader, PageShell } from "@/components/ui/page-shell"
import { formatCurrency, formatDate } from "@/lib/utils-client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Stats {
  salesThisMonth: { total: number; count: number; change: number }
  documentsThisMonth: number
  documentsToday: number
  pendingPayments: { total: number; count: number }
  topProducts: { name: string; quantity: number; revenue: number }[]
  recentDocuments: {
    id: string
    number: number
    type: string
    client: string
    total: number
    status: string
    date: string
  }[]
  dailySales: { date: string; total: number; count: number }[]
}

type Period = "day" | "week" | "month"

const PERIOD_LABEL: Record<Period, { title: string; subtitle: string; chart: string; avg: string }> = {
  day: { title: "Hoy", subtitle: "Rendimiento del día", chart: "Ventas por hora", avg: "Promedio por hora" },
  week: { title: "Esta semana", subtitle: "Últimos 7 días", chart: "Ventas diarias", avg: "Promedio diario" },
  month: { title: "Este mes", subtitle: "Últimos 30 días", chart: "Ventas diarias", avg: "Promedio diario" },
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null
  const positive = change >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <div className={`flex items-center gap-1 ${positive ? "text-emerald-600" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      <span className="text-xs font-medium">{Math.abs(change)}%</span>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: React.ReactNode
  icon: typeof DollarSign
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={2} />
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <div className="mt-2 text-sm">{hint}</div>}
    </div>
  )
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("month")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCustomDate, setIsCustomDate] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const dateParam = isCustomDate && selectedDate ? `&date=${selectedDate.toISOString()}` : ""
        const res = await fetch(`/api/stats?period=${period}${dateParam}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period, selectedDate, isCustomDate])

  if (isLoading) return <LoadingState message="Cargando estadísticas…" />
  if (!stats)
    return (
      <PageShell size="lg">
        <EmptyState
          icon={FileText}
          title="No hay datos disponibles"
          description="Cargá productos y creá documentos para ver estadísticas detalladas."
        />
      </PageShell>
    )

  const labels = PERIOD_LABEL[period]
  const maxDailySale = Math.max(...stats.dailySales.map((d) => d.total), 1)
  const avgSale = stats.dailySales.length > 0
    ? stats.dailySales.reduce((acc, d) => acc + d.total, 0) / stats.dailySales.length
    : 0

  return (
    <PageShell size="lg">
      <PageHeader
        title="Estadísticas"
        description={
          isCustomDate && selectedDate
            ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
            : labels.subtitle
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isCustomDate && selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Fecha"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d)
                    setIsCustomDate(true)
                  }}
                  initialFocus
                  locale={es}
                />
                {isCustomDate && (
                  <div className="border-t border-neutral-200 p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDate(new Date())
                        setIsCustomDate(false)
                      }}
                      className="w-full"
                    >
                      Volver a hoy
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-9">
                <TabsTrigger value="day" className="text-xs">Día</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">7 días</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">30 días</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      />

      {/* Stats */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Ventas · ${labels.title}`}
          value={formatCurrency(stats.salesThisMonth.total)}
          icon={DollarSign}
          hint={<ChangeIndicator change={stats.salesThisMonth.change} />}
        />
        <StatCard
          label="Documentos"
          value={stats.documentsThisMonth}
          icon={FileText}
          hint={
            period === "month" ? (
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-900">{stats.documentsToday}</span> hoy
              </p>
            ) : undefined
          }
        />
        <StatCard
          label="Por cobrar"
          value={formatCurrency(stats.pendingPayments.total)}
          icon={CalendarIcon}
          hint={
            <p className="text-xs text-neutral-500">
              <span className="font-medium text-neutral-900">{stats.pendingPayments.count}</span>{" "}
              {stats.pendingPayments.count === 1 ? "documento" : "documentos"}
            </p>
          }
        />
        <StatCard
          label="Operaciones"
          value={stats.salesThisMonth.count}
          icon={TrendingUp}
          hint={<p className="text-xs text-neutral-500">recibos cerrados</p>}
        />
      </section>

      {/* Chart + Top products */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">{labels.chart}</h2>
            <Badge variant="secondary">{labels.title}</Badge>
          </div>
          <div className="p-5">
            {stats.dailySales.length === 0 ? (
              <EmptyState icon={DollarSign} title="Sin ventas" description="Aún no hay ventas registradas en este período." />
            ) : (
              <>
                <div className="flex h-44 items-end gap-1.5 pb-2">
                  {stats.dailySales.map((day, idx) => {
                    const height = (day.total / maxDailySale) * 100
                    return (
                      <div key={idx} className="group relative flex flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-neutral-900 transition-colors hover:bg-neutral-700"
                          style={{ height: `${Math.max(height, 3)}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white group-hover:block">
                          <div className="text-neutral-300">{period === "day" ? `${day.date}:00` : formatDate(day.date)}</div>
                          <div className="font-semibold">{formatCurrency(day.total)}</div>
                          <div className="text-neutral-400">
                            {day.count} {day.count === 1 ? "operación" : "operaciones"}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-xs text-neutral-500">{labels.avg}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(avgSale)}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Top products */}
        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">Productos más vendidos</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin datos de productos"
              description="Las ventas aparecerán aquí."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.topProducts.map((product, idx) => (
                <li key={idx} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold tabular-nums text-neutral-700">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                    <p className="text-xs text-neutral-500">
                      {product.quantity} {product.quantity === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(product.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent docs */}
      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Documentos recientes</h2>
          <Link href="/documentos">
            <Button variant="ghost" size="sm" className="gap-1 text-neutral-700">
              Ver todos
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {stats.recentDocuments.length === 0 ? (
          <EmptyState icon={FileText} title="Sin documentos" description="Creá tu primer documento para empezar." />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {stats.recentDocuments.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documentos/${doc.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                    <FileText className="h-5 w-5 text-neutral-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900">{doc.client}</p>
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-700">
                        {doc.type} #{String(doc.number).padStart(5, "0")}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{formatDate(doc.date)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(doc.total)}</p>
                  <ChevronRight className="h-4 w-4 text-neutral-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  )
}
