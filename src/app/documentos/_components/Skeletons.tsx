function Skel({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-100 ${className ?? ""}`} />
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-neutral-100 px-4 py-3">
          <Skel className="h-5 w-5 rounded" />
          <Skel className="h-4 w-20" />
          <Skel className="h-6 w-14 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skel className="h-4 w-40" />
            <Skel className="h-3 w-28" />
          </div>
          <Skel className="h-4 w-24" />
          <Skel className="h-6 w-24 rounded-full" />
          <Skel className="h-4 w-20" />
          <Skel className="h-9 w-9 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-4" />
          </div>
          <Skel className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
