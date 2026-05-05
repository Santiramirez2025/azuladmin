import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils-client"

/**
 * Layout estándar de página: max-width centrado, padding consistente.
 * Usar como wrapper de cualquier pantalla.
 */
export function PageShell({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode
  className?: string
  size?: "default" | "lg" | "narrow"
}) {
  const maxW = size === "narrow" ? "max-w-3xl" : size === "lg" ? "max-w-6xl" : "max-w-5xl"
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-8", maxW, className)}>{children}</div>
  )
}

/**
 * Header de página estándar: título grande + subtítulo + slot de acciones a la derecha.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/**
 * Card sección con título y contenido.
 */
export function Section({
  title,
  description,
  icon: Icon,
  children,
  actions,
  className,
}: {
  title?: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-2xl border border-neutral-200 bg-white", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                <Icon className="h-4 w-4 text-neutral-700" />
              </div>
            )}
            <div>
              {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
              {description && <p className="text-xs text-neutral-500">{description}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/**
 * Empty state estandarizado.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <Icon className="h-6 w-6 text-neutral-500" />
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold tracking-tight">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action}
    </div>
  )
}

/**
 * Loading state estandarizado.
 */
export function LoadingState({ message = "Cargando…" }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        <p className="text-sm text-neutral-500">{message}</p>
      </div>
    </div>
  )
}

/**
 * Skeleton primitivo.
 */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-100", className)} />
}
