import { StatsSkeleton, TableSkeleton } from "./_components/Skeletons"

export default function DocumentosLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="mb-5">
        <StatsSkeleton />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <TableSkeleton />
      </div>
    </div>
  )
}
