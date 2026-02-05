"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Documentos", href: "/documentos", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
  { name: "Configuración", href: "/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle - modernizado */}
      <Button
        variant="ghost"
        size="icon"
        className="group fixed left-4 top-4 z-50 h-11 w-11 rounded-xl border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all hover:border-blue-300/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-slate-700 transition-colors group-hover:text-blue-600" />
        ) : (
          <Menu className="h-5 w-5 text-slate-700 transition-colors group-hover:text-blue-600" />
        )}
      </Button>

      {/* Overlay mejorado */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Diseño 2026 */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200/50 bg-gradient-to-b from-white via-slate-50/30 to-blue-50/20 shadow-2xl shadow-slate-900/5 backdrop-blur-xl transition-transform md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - Rediseñado con efectos glassmorphism */}
          <div className="relative flex h-20 items-center gap-3 border-b border-slate-200/50 bg-gradient-to-r from-white/80 to-blue-50/50 px-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
            <div className="relative">
              <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur"></div>
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30">
                <span className="text-xl font-bold text-white">A</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
            </div>
            <div className="relative">
              <span className="block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-lg font-bold text-transparent">
                Azul Colchones
              </span>
              <span className="block text-xs font-medium text-slate-500">Gestión Empresarial</span>
            </div>
          </div>

          {/* Navigation - Diseño mejorado */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
            <div className="mb-3 flex items-center gap-2 px-3">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menú Principal</span>
            </div>
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-700 hover:bg-white/80 hover:shadow-md hover:shadow-slate-900/5"
                  )}
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute -left-4 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/50"></div>
                  )}
                  
                  {/* Icono con efecto hover */}
                  <div className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-white/20 shadow-inner"
                      : "bg-slate-100/80 group-hover:bg-blue-50 group-hover:scale-110"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-slate-600 group-hover:text-blue-600"
                    )} />
                  </div>
                  
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Chevron para items activos */}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-white/80" />
                  )}
                  
                  {/* Efecto de brillo en hover */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer - Usuario mejorado */}
          <div className="border-t border-slate-200/50 bg-gradient-to-r from-white/50 to-slate-50/50 p-4 backdrop-blur-xl">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-50/80 p-3.5 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-0.5 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 blur transition-opacity group-hover:opacity-40"></div>
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-blue-500/30 ring-2 ring-white/50">
                    S
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  {/* Indicador online */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-green-500/50"></div>
                </div>
                <div className="flex-1 truncate">
                  <p className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-sm font-bold text-transparent">
                    Santiago
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-medium text-slate-500">Administrador</p>
                  </div>
                </div>
                <Settings className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}