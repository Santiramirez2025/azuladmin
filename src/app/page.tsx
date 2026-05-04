"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
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
    <div className={`flex items-center gap-1 ${positive ? "text-emerald-600" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      <span className="text-xs font-medium">{Math.abs(change)}%</span>
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
          setError("No se pudieron cargar las estadísticas.")
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

  const formattedDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, Santiago</h1>
          <p className="mt-1 text-sm capitalize text-neutral-500">{formattedDate}</p>
        </div>
        <Link href="/documentos/nuevo">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo documento
          </Button>
        </Link>
      </header>

      {/* Stats */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Estadísticas">
        <StatCard title="Ventas del mes" value={formatCurrency(stats.salesThisMonth.total)} icon={DollarSign}>
          <ChangeIndicator change={stats.salesThisMonth.change} />
          {stats.salesThisMonth.count > 0 && (
            <p className="text-xs text-neutral-500">
              {stats.salesThisMonth.count} {stats.salesThisMonth.count === 1 ? "venta" : "ventas"}
            </p>
          )}
        </StatCard>
        <StatCard title="Documentos" value={stats.documentsThisMonth} icon={FileText}>
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-900">{stats.documentsToday}</span> creados hoy
          </p>
        </StatCard>
        <StatCard title="Recibos completados" value={stats.salesThisMonth.count} icon={CheckCircle}>
          <p className="text-xs text-neutral-500">Este mes</p>
        </StatCard>
        <StatCard title="Por cobrar" value={formatCurrency(stats.pendingPayments.total)} icon={AlertTriangle}>
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-900">{stats.pendingPayments.count}</span>{" "}
            {stats.pendingPayments.count === 1 ? "documento" : "documentos"}
          </p>
        </StatCard>
      </section>

      {/* Main grid */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentDocuments documents={stats.recentDocuments} />
        </div>
        <TopProducts products={stats.topProducts} />
      </div>

      {/* Quick actions */}
      <QuickActions />
    </div>
  )
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Algo salió mal</h2>
      <p className="mb-6 text-sm text-neutral-500">{message}</p>
      <Button onClick={() => window.location.reload()}>Reintentar</Button>
    </div>
  )
}
