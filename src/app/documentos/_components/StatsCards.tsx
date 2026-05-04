import { CheckCircle, FileText, Send, TrendingUp, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils-client"
import { StatsSkeleton } from "./Skeletons"
import type { DocumentStats } from "./types"

type StatItem = {
  label: string
  value: number
  icon: LucideIcon
  gradient: string
  iconBg: string
  change: string
  changePositive: boolean | null
}

export function StatsCards({ stats, isLoading }: { stats: DocumentStats; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />

  const items: StatItem[] = [
    {
      label: "Total Documentos",
      value: stats.total,
      icon: FileText,
      gradient: "from-slate-500 to-slate-600",
      iconBg: "from-slate-500/10 to-slate-600/10",
      change: "+12%",
      changePositive: true,
    },
    {
      label: "Borradores",
      value: stats.borradores,
      icon: FileText,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "from-amber-500/10 to-orange-600/10",
      change: "3 activos",
      changePositive: null,
    },
    {
      label: "Enviados",
      value: stats.enviados,
      icon: Send,
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "from-blue-500/10 to-cyan-600/10",
      change: "+8%",
      changePositive: true,
    },
    {
      label: "Completados",
      value: stats.completados,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "from-emerald-500/10 to-green-600/10",
      change: "+24%",
      changePositive: true,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="group relative">
          <div className={cn("absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-40", item.gradient)} />
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={cn("absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-2xl", item.iconBg)} />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{item.label}</p>
                  <p className={cn("bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent", item.gradient)}>
                    {item.value}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      item.changePositive === true && "text-emerald-600",
                      item.changePositive === false && "text-red-600",
                      item.changePositive === null && "text-slate-600",
                    )}
                  >
                    {item.changePositive === true && <TrendingUp className="h-3.5 w-3.5" />}
                    <span>{item.change}</span>
                  </div>
                </div>
                <div className={cn("rounded-2xl bg-gradient-to-br p-4 shadow-lg transition-transform group-hover:scale-110", item.gradient)}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
