import { Card, CardContent, CardHeader } from "@/components/ui/card"

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-slate-100 blur-2xl" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
      </CardHeader>
      <CardContent className="relative">
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/60" />
            <div className="h-5 w-48 animate-pulse rounded bg-white/40" />
          </div>
          <div className="h-12 w-48 animate-pulse rounded-xl bg-white/60" />
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200/50 p-4">
                      <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="h-6 w-20 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
