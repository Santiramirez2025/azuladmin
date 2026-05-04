import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, unsubscribeSchema)
  if (!parsed.ok) return parsed.response

  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleUnknownError("push.unsubscribe", error)
  }
}
