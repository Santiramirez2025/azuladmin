import Link from "next/link"
import { DollarSign, FileText, Package, Users, Zap, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Tone = "blue" | "emerald" | "violet" | "orange"

const toneClasses: Record<Tone, { border: string; bg: string; hoverGrad: string; text: string }> = {
  blue: {
    border: "border-blue-200/60 hover:border-blue-400/60 hover:shadow-blue-500/10",
    bg: "from-blue-50/80 to-indigo-50/80",
    hoverGrad: "from-blue-500 to-indigo-600",
    text: "text-blue-600",
  },
  emerald: {
    border: "border-emerald-200/60 hover:border-emerald-400/60 hover:shadow-emerald-500/10",
    bg: "from-emerald-50/80 to-green-50/80",
    hoverGrad: "from-emerald-500 to-green-600",
    text: "text-emerald-600",
  },
  violet: {
    border: "border-violet-200/60 hover:border-violet-400/60 hover:shadow-violet-500/10",
    bg: "from-violet-50/80 to-purple-50/80",
    hoverGrad: "from-violet-500 to-purple-600",
    text: "text-violet-600",
  },
  orange: {
    border: "border-orange-200/60 hover:border-orange-400/60 hover:shadow-orange-500/10",
    bg: "from-orange-50/80 to-amber-50/80",
    hoverGrad: "from-orange-500 to-amber-600",
    text: "text-orange-600",
  },
}

function ActionCard({
  href,
  label,
  icon: Icon,
  tone,
}: {
  href: string
  label: string
  icon: LucideIcon
  tone: Tone
}) {
  const t = toneClasses[tone]
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className={`group relative h-auto w-full overflow-hidden border-2 ${t.border} bg-gradient-to-br ${t.bg} py-8 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
      >
        <div className={`absolute inset-0 -translate-y-full bg-gradient-to-br ${t.hoverGrad} transition-transform duration-300 group-hover:translate-y-0`} />
        <div className="relative flex flex-col items-center gap-3">
          <Icon className={`h-8 w-8 ${t.text} transition-colors group-hover:text-white`} />
          <span className="font-semibold text-slate-700 transition-colors group-hover:text-white">{label}</span>
        </div>
      </Button>
    </Link>
  )
}

export function QuickActions() {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-violet-50/80">
        <CardTitle id="quick-actions-title" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard href="/documentos/nuevo?tipo=presupuesto" label="Nuevo Presupuesto" icon={FileText} tone="blue" />
          <ActionCard href="/documentos/nuevo?tipo=recibo" label="Nuevo Recibo" icon={DollarSign} tone="emerald" />
          <ActionCard href="/clientes" label="Ver Clientes" icon={Users} tone="violet" />
          <ActionCard href="/productos" label="Ver Productos" icon={Package} tone="orange" />
        </div>
      </CardContent>
    </Card>
  )
}
