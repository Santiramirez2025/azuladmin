import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { clientSchema } from "@/lib/validations"
import {
  errorResponse,
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
            total: true,
            date: true,
          },
        },
        _count: { select: { documents: true } },
      },
    })

    if (!client) return errorResponse(404, "Cliente no encontrado")

    const stats = await prisma.document.aggregate({
      where: { clientId: id, status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { total: true, amountPaid: true },
    })

    const total = Number(stats._sum.total || 0)
    const paid = Number(stats._sum.amountPaid || 0)

    return NextResponse.json({
      ...client,
      totalPurchased: total,
      totalPaid: paid,
      balance: total - paid,
    })
  } catch (error) {
    return handleUnknownError("clients.[id].GET", error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, clientSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const { id } = await params
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        dni: data.dni || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city,
        province: data.province,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse(404, "Cliente no encontrado")
      if (error.code === "P2002") return errorResponse(409, "Datos duplicados")
    }
    return handleUnknownError("clients.[id].PUT", error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    const documentsCount = await prisma.document.count({ where: { clientId: id } })
    if (documentsCount > 0) {
      return errorResponse(400, "No se puede eliminar un cliente con documentos asociados")
    }

    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse(404, "Cliente no encontrado")
    }
    return handleUnknownError("clients.[id].DELETE", error)
  }
}
