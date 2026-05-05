import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleUnknownError, isAuthError, requireAdmin } from "@/lib/api"

export const runtime = "nodejs"

/**
 * GET /api/push/stats
 * Devuelve cuántos dispositivos están suscriptos por rol.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const groups = await prisma.pushSubscription.groupBy({
      by: ["role"],
      _count: { _all: true },
    })

    const total = groups.reduce((s, g) => s + g._count._all, 0)
    const byRole: Record<string, number> = { ADMIN: 0, DELIVERY: 0, OTHER: 0 }
    for (const g of groups) {
      const role = g.role ?? "OTHER"
      byRole[role] = (byRole[role] ?? 0) + g._count._all
    }

    return NextResponse.json({ total, byRole })
  } catch (error) {
    return handleUnknownError("push.stats", error)
  }
}
