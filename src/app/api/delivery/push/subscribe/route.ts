import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pushSubscriptionSchema } from "@/lib/validations"
import {
  assertJson,
  errorResponse,
  handleUnknownError,
  requireDelivery,
} from "@/lib/api"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const denied = requireDelivery(request)
  if (denied) return denied

  const ctErr = assertJson(request)
  if (ctErr) return ctErr

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, "JSON inválido")
  }

  const parsed = pushSubscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    )
  }

  try {
    const { endpoint, keys, userAgent } = parsed.data
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        username: "delivery",
        role: "DELIVERY",
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        username: "delivery",
        role: "DELIVERY",
      },
    })
    return NextResponse.json({ ok: true, id: sub.id }, { status: 201 })
  } catch (error) {
    return handleUnknownError("delivery.push.subscribe", error)
  }
}
