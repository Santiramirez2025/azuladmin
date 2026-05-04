"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils-client"
import { DashboardSkeleton } from "./_components/DashboardSkeleton"
import { QuickActions } from "./_components/QuickActions"
import { RecentDocuments } from "./_components/RecentDocuments"
import { StatCard } from "./_components/StatCard"
import { TopProducts } from "./_components/TopProducts"
import type { Stats } from "./_components/types"

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null
  const positive = change >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{Math.abs(change)}% vs mes anterior</span>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/stats")
        if (!res.ok) throw new Error("Error al cargar estadísticas")
        const data = (await res.json()) as Stats
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching stats:", err)
          setError("No se pudieron cargar las estadísticas. Intenta recargar la página.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) return <DashboardSkeleton />
  if (error) return <DashboardError message={error} />
  if (!stats) return null

  const formattedDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardHeader formattedDate={formattedDate} />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Estadísticas principales">
          <StatCard title="Ventas del Mes" value={formatCurrency(stats.salesThisMonth.total)} icon={DollarSign} tone="emerald">
            <ChangeIndicator change={stats.salesThisMonth.change} />
            {stats.salesThisMonth.count > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                {stats.salesThisMonth.count} {stats.salesThisMonth.count === 1 ? "venta" : "ventas"}
              </p>
            )}
          </StatCard>
          <StatCard title="Documentos del Mes" value={stats.documentsThisMonth} icon={FileText} tone="blue">
            <p className="text-xs font-medium text-slate-500">
              <span className="font-bold text-blue-600">{stats.documentsToday}</span> creados hoy
            </p>
          </StatCard>
          <StatCard title="Recibos Completados" value={stats.salesThisMonth.count} icon={CheckCircle} tone="violet">
            <p className="text-xs font-medium text-slate-500">Este mes</p>
          </StatCard>
          <StatCard title="Pendiente de Cobro" value={formatCurrency(stats.pendingPayments.total)} icon={AlertCircle} tone="amber">
            <p className="text-xs font-medium text-slate-500">
              <span className="font-bold text-amber-600">{stats.pendingPayments.count}</span>{" "}
              {stats.pendingPayments.count === 1 ? "documento" : "documentos"}
            </p>
          </StatCard>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2" aria-labelledby="recent-documents-title">
            <RecentDocuments documents={stats.recentDocuments} />
          </section>
          <section aria-labelledby="top-products-title">
            <TopProducts products={stats.topProducts} />
          </section>
        </div>

        <section aria-labelledby="quick-actions-title">
          <QuickActions />
        </section>
      </div>
    </div>
  )
}

function DashboardHeader({ formattedDate }: { formattedDate: string }) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1.5 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-lg" />
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
            <time>{formattedDate}</time>
          </div>
        </div>
      </div>
      <Link href="/documentos/nuevo">
        <Button
          size="lg"
          className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <span className="relative flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Documento
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Button>
      </Link>
    </header>
  )
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
      <Card className="max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-xl" />
            <AlertCircle className="relative h-16 w-16 text-red-500" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900">Error al cargar datos</h3>
          <p className="mb-6 text-sm text-slate-600">{message}</p>
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
