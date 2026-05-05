import { NextRequest, NextResponse } from "next/server"
import { sendPushToAll } from "@/lib/push"
import { handleUnknownError, isAuthError, requireAdmin } from "@/lib/api"

export const runtime = "nodejs"

/**
 * POST /api/push/test
 * POST /api/push/test?role=DELIVERY
 *
 * Por defecto envía al usuario admin actual.
 * Con ?role=DELIVERY envía a todas las subs del primo (útil para
 * verificar que las notificaciones del rol delivery funcionan).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const role = request.nextUrl.searchParams.get("role")
    const isDelivery = role === "DELIVERY"

    const result = await sendPushToAll(
      {
        title: isDelivery ? "🚚 Reparto" : "Azul Colchones",
        body: isDelivery
          ? "Notificación de prueba para el primo 🎉"
          : "Notificación de prueba 🎉",
        url: isDelivery ? "/reparto" : "/",
        tag: "test",
      },
      isDelivery ? { role: "DELIVERY" } : { username: auth.sub },
    )
    return NextResponse.json({ ok: true, target: isDelivery ? "DELIVERY" : auth.sub, ...result })
  } catch (error) {
    return handleUnknownError("push.test", error)
  }
}
