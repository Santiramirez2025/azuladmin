import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { companyInfoSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

const KEY = "company_info"

const DEFAULT_COMPANY = {
  name: "Azul Colchones",
  address: "Balerdi 855",
  city: "Villa María",
  province: "Córdoba",
  phone: "0353-4XXXXXX",
  whatsapp: "+5493534XXXXXX",
  email: "info@azulcolchones.com",
  cuit: "",
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const setting = await prisma.setting.findUnique({ where: { key: KEY } })
    return NextResponse.json(setting?.value ?? DEFAULT_COMPANY, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=900" },
    })
  } catch (error) {
    console.error("[settings.company.GET]", error)
    return NextResponse.json(DEFAULT_COMPANY)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, companyInfoSchema)
  if (!parsed.ok) return parsed.response

  try {
    const setting = await prisma.setting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: parsed.data },
      update: { value: parsed.data },
    })
    return NextResponse.json(setting.value)
  } catch (error) {
    return handleUnknownError("settings.company.POST", error)
  }
}
