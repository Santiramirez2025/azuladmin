import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import {
  assertJson,
  errorResponse,
  handleUnknownError,
  requireDelivery,
} from "@/lib/api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

// PNG base64 — base64 puede ser hasta ~750 KB para canvas razonable
const signSchema = z.object({
  signatureImage: z
    .string()
    .min(100, "Firma requerida")
    .max(2_000_000, "Firma demasiado grande")
    .refine((v) => v.startsWith("data:image/png;base64,"), "Formato inválido"),
  signerName: z.string().max(120).optional(),
  signerDni: z.string().max(20).optional(),
})

export async function POST(request: NextRequest, { params }: RouteContext) {
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
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    )
  }

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID inválido")

    const existing = await prisma.document.findUnique({
      where: { id },
      select: { id: true, type: true, signedAt: true },
    })
    if (!existing) return errorResponse(404, "Remito no encontrado")
    if (existing.type !== "REMITO") return errorResponse(400, "Solo se firman remitos")
    if (existing.signedAt) return errorResponse(409, "El remito ya fue firmado")

    const updated = await prisma.document.update({
      where: { id },
      data: {
        signatureImage: parsed.data.signatureImage,
        signedAt: new Date(),
        signerName: parsed.data.signerName ?? null,
        signerDni: parsed.data.signerDni ?? null,
        status: "COMPLETED",
      },
      select: {
        id: true,
        number: true,
        signedAt: true,
        signerName: true,
      },
    })

    return NextResponse.json({
      ok: true,
      id: updated.id,
      number: updated.number,
      signedAt: updated.signedAt?.toISOString() ?? null,
      signerName: updated.signerName,
    })
  } catch (error) {
    return handleUnknownError("delivery.sign", error)
  }
}
