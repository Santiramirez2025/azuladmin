import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent p-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="group relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/10 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
