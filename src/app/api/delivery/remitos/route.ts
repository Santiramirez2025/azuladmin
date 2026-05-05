import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { handleUnknownError, requireDelivery } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const denied = requireDelivery(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") ?? "pending" // pending | signed | all

    const where: Prisma.DocumentWhereInput =
      filter === "signed"
        ? { type: "REMITO", signedAt: { not: null } }
        : filter === "all"
        ? { type: "REMITO" }
        : {
            type: "REMITO",
            signedAt: null,
            status: { in: ["APPROVED", "SENT", "COMPLETED"] },
          }

    const items = await prisma.document.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
        date: true,
        observations: true,
        shippingType: true,
        signatureImage: true,
        signedAt: true,
        signerName: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
            province: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            productSize: true,
            quantity: true,
            source: true,
          },
        },
      },
    })

    const serialized = items.map((doc) => ({
      ...doc,
      date: doc.date.toISOString(),
      signedAt: doc.signedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({ items: serialized, total: serialized.length })
  } catch (error) {
    return handleUnknownError("delivery.remitos.GET", error)
  }
}
