import Link from "next/link"
import { Toaster } from "sonner"

export default function RepartoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-neutral-200 bg-white/95 px-4 backdrop-blur">
        <Link href="/reparto" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Reparto</span>
        </Link>
      </header>
      <main>{children}</main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
