import Link from "next/link"
import { DollarSign, FileText, Package, Users, type LucideIcon } from "lucide-react"

function ActionTile({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
        <Icon className="h-5 w-5 text-neutral-700" strokeWidth={2} />
      </div>
      <span className="text-sm font-medium text-neutral-900">{label}</span>
    </Link>
  )
}

export function QuickActions() {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold tracking-tight">Acciones rápidas</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActionTile href="/documentos/nuevo?tipo=presupuesto" label="Nuevo presupuesto" icon={FileText} />
        <ActionTile href="/documentos/nuevo?tipo=recibo" label="Nuevo recibo" icon={DollarSign} />
        <ActionTile href="/clientes" label="Clientes" icon={Users} />
        <ActionTile href="/productos" label="Productos" icon={Package} />
      </div>
    </section>
  )
}
