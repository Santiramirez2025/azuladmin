import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Tone = "emerald" | "blue" | "violet" | "amber"

const toneStyles: Record<Tone, { glow: string; iconBg: string; valueText: string; bgGlow: string }> = {
  emerald: {
    glow: "from-emerald-500 to-green-600",
    iconBg: "from-emerald-500 to-green-600 shadow-green-500/20",
    valueText: "from-emerald-600 to-green-700",
    bgGlow: "from-emerald-500/10 to-green-600/10",
  },
  blue: {
    glow: "from-blue-500 to-indigo-600",
    iconBg: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    valueText: "from-blue-600 to-indigo-700",
    bgGlow: "from-blue-500/10 to-indigo-600/10",
  },
  violet: {
    glow: "from-violet-500 to-purple-600",
    iconBg: "from-violet-500 to-purple-600 shadow-violet-500/20",
    valueText: "from-violet-600 to-purple-700",
    bgGlow: "from-violet-500/10 to-purple-600/10",
  },
  amber: {
    glow: "from-amber-500 to-orange-600",
    iconBg: "from-amber-500 to-orange-600 shadow-amber-500/20",
    valueText: "from-amber-600 to-orange-700",
    bgGlow: "from-amber-500/10 to-orange-600/10",
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  children,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  tone: Tone
  children?: React.ReactNode
}) {
  const t = toneStyles[tone]
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${t.glow} opacity-20 blur transition duration-500 group-hover:opacity-40`} />
      <Card className="relative overflow-hidden border-0 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
        <div className={`absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${t.bgGlow} blur-2xl`} />
        <CardHeader className="relative flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-slate-600">{title}</CardTitle>
          <div className={`rounded-xl bg-gradient-to-br ${t.iconBg} p-2.5 shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className={`mb-2 bg-gradient-to-r ${t.valueText} bg-clip-text text-3xl font-bold text-transparent`}>
            {value}
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
