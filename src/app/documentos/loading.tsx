import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsSkeleton, TableSkeleton } from "./_components/Skeletons"

export default function DocumentosLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-5 w-96" />
        </div>
        <StatsSkeleton />
        <div className="mt-8">
          <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
