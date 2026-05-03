import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { clientSchema } from "@/lib/validations"
import {
  handleUnknownError,
  isAuthError,
  parseJson,
  requireAdmin,
} from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20),
    )

    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { dni: { contains: search } },
          ],
        }
      : {}

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { documents: true } } },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      items: clients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return handleUnknownError("clients.GET", error)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  const parsed = await parseJson(request, clientSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const client = await prisma.client.create({
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
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cliente con esos datos" },
        { status: 409 },
      )
    }
    return handleUnknownError("clients.POST", error)
  }
}
