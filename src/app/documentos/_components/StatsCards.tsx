import { CheckCircle, FileText, Send, type LucideIcon } from "lucide-react"
import { StatsSkeleton } from "./Skeletons"
import type { DocumentStats } from "./types"

type StatItem = { label: string; value: number; icon: LucideIcon }

export function StatsCards({ stats, isLoading }: { stats: DocumentStats; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />

  const items: StatItem[] = [
    { label: "Total", value: stats.total, icon: FileText },
    { label: "Borradores", value: stats.borradores, icon: FileText },
    { label: "Enviados", value: stats.enviados, icon: Send },
    { label: "Completados", value: stats.completados, icon: CheckCircle },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-neutral-500">{item.label}</p>
            <item.icon className="h-4 w-4 text-neutral-400" strokeWidth={2} />
          </div>
          <p className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
