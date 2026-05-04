"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Home,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils-client"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { name: "Inicio", href: "/", icon: Home, match: (p) => p === "/" },
  { name: "Documentos", href: "/documentos", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Stats", href: "/estadisticas", icon: BarChart3 },
  { name: "Ajustes", href: "/configuracion", icon: Settings },
]

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5)

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match) return item.match(pathname)
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function AppNav() {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  if (isLogin) return null

  return (
    <>
      <TopBar />
      <DesktopSidebar pathname={pathname} />
      <BottomNav pathname={pathname} />
    </>
  )
}

function TopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center border-b border-neutral-200 bg-white/95 px-4 backdrop-blur md:left-60 md:px-6">
      <Link href="/" className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Azul</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/configuracion"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 md:flex"
          aria-label="Ajustes"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
          S
        </div>
      </div>
    </header>
  )
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-neutral-200 bg-white md:block">
      <div className="flex h-14 items-center gap-2.5 border-b border-neutral-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900">
          <span className="text-base font-bold text-white">A</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-none tracking-tight">Azul Colchones</p>
          <p className="mt-1 text-xs text-neutral-500">Gestión</p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-white" : "text-neutral-500 group-hover:text-neutral-900")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-neutral-900" : "text-neutral-400",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors",
                  active ? "text-neutral-900" : "text-neutral-500",
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
