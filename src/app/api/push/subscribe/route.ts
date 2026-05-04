import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pushSubscriptionSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, pushSubscriptionSchema)
  if (!parsed.ok) return parsed.response
  const { endpoint, keys, userAgent } = parsed.data

  try {
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        username: auth.sub,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        username: auth.sub,
      },
    })
    return NextResponse.json({ ok: true, id: sub.id }, { status: 201 })
  } catch (error) {
    return handleUnknownError("push.subscribe", error)
  }
}
