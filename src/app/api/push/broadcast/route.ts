import { NextRequest, NextResponse } from "next/server"
import { sendPushToAll } from "@/lib/push"
import { pushBroadcastSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

/**
 * POST /api/push/broadcast
 * Body: { title, body, url?, target: "ADMIN" | "DELIVERY" | "ALL" }
 *
 * Permite al admin enviar una notificación push a su propio rol,
 * al primo (DELIVERY), o a todos los dispositivos suscriptos.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, pushBroadcastSchema)
  if (!parsed.ok) return parsed.response
  const { title, body, url, target } = parsed.data

  try {
    const result = await sendPushToAll(
      {
        title,
        body,
        url: url || "/",
        tag: `broadcast-${Date.now()}`,
      },
      target === "ALL" ? undefined : { role: target },
    )
    return NextResponse.json({ ok: true, target, ...result })
  } catch (error) {
    return handleUnknownError("push.broadcast", error)
  }
}
