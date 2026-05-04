import type { LucideIcon } from "lucide-react"

export function StatCard({
  title,
  value,
  icon: Icon,
  children,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{title}</p>
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={2} />
      </div>
      <p className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">{value}</p>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  )
}
