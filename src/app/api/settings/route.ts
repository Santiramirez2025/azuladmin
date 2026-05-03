import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { paymentRatesSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

const DEFAULT_RATES = { "1": 0, "3": 18, "6": 25, "9": 35, "12": 47 }

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const settings = await prisma.setting.findUnique({
      where: { key: "payment_rates" },
    })
    return NextResponse.json(settings?.value ?? DEFAULT_RATES)
  } catch (error) {
    console.error("[settings.GET]", error)
    return NextResponse.json(DEFAULT_RATES)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, paymentRatesSchema)
  if (!parsed.ok) return parsed.response

  try {
    const setting = await prisma.setting.upsert({
      where: { key: "payment_rates" },
      create: { key: "payment_rates", value: parsed.data },
      update: { value: parsed.data },
    })
    return NextResponse.json(setting.value)
  } catch (error) {
    return handleUnknownError("settings.POST", error)
  }
}
