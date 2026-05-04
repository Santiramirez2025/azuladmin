import { NextRequest, NextResponse } from "next/server"
import { sendPushToAll } from "@/lib/push"
import {
  handleUnknownError,
  isAuthError,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const result = await sendPushToAll(
      {
        title: "Azul Colchones",
        body: "Notificación de prueba 🎉",
        url: "/",
        tag: "test",
      },
      auth.sub,
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return handleUnknownError("push.test", error)
  }
}
