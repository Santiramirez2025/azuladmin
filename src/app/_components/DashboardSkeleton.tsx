function Skel({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-100 ${className ?? ""}`} />
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skel className="h-4 w-24" />
        <Skel className="h-4 w-4" />
      </div>
      <Skel className="h-8 w-32" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <div className="mb-6 space-y-2">
        <Skel className="h-7 w-40" />
        <Skel className="h-4 w-64" />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <Skel className="mb-4 h-5 w-40" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skel className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skel className="h-4 w-40" />
                  <Skel className="h-3 w-24" />
                </div>
                <Skel className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <Skel className="mb-4 h-5 w-32" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skel className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skel className="h-4 w-full" />
                  <Skel className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
