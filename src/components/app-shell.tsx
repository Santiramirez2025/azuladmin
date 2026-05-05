"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils-client"
import { AppNav } from "./app-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  const isDelivery = pathname.startsWith("/reparto")
  const useAdminLayout = !isLogin && !isDelivery

  return (
    <>
      <AppNav />
      <main
        className={cn(
          "min-h-screen",
          useAdminLayout && "pt-14 pb-20 md:pb-0 md:pl-60",
        )}
      >
        {children}
      </main>
    </>
  )
}
