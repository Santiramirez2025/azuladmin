import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns"

// Tipos para resultados de Prisma (antes de tener Prisma generado)
interface DocumentWithClient {
  id: string
  number: number
  type: string
  status: string
  total: number | bigint
  date: Date
  createdAt: Date
  client: { name: string }
}

interface TopProductResult {
  productName: string
  productSize: string
  _sum: {
    quantity: number | null
    subtotal: number | bigint | null
  }
}

interface DailySaleResult {
  date: Date
  _sum: { total: number | bigint | null }
  _count: number
}

// GET /api/stats - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Ventas del mes actual
    const salesThisMonth = await prisma.document.aggregate({
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    // Ventas del mes anterior (para comparación)
    const salesLastMonth = await prisma.document.aggregate({
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { total: true },
    })

    // Documentos del mes
    const documentsThisMonth = await prisma.document.count({
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
    })

    // Documentos creados hoy
    const documentsToday = await prisma.document.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    })

    // Pendientes de cobro
    const pendingPayments = await prisma.document.aggregate({
      where: {
        type: "RECIBO",
        status: { in: ["APPROVED", "SENT"] },
        balance: { gt: 0 },
      },
      _sum: { balance: true },
      _count: true,
    })

    // Top productos del mes
    const topProducts = await prisma.documentItem.groupBy({
      by: ["productName", "productSize"],
      where: {
        document: {
          type: { in: ["RECIBO"] },
          status: { in: ["APPROVED", "COMPLETED"] },
          date: { gte: monthStart, lte: monthEnd },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          subtotal: "desc",
        },
      },
      take: 5,
    })

    // Documentos recientes
    const recentDocuments = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: {
          select: { name: true },
        },
      },
    })

    // Ventas por día (últimos 30 días)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailySales = await prisma.document.groupBy({
      by: ["date"],
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: thirtyDaysAgo },
      },
      _sum: { total: true },
      _count: true,
      orderBy: { date: "asc" },
    })

    // Calcular cambio porcentual
    const currentSales = Number(salesThisMonth._sum.total || 0)
    const previousSales = Number(salesLastMonth._sum.total || 0)
    const salesChange =
      previousSales > 0
        ? Math.round(((currentSales - previousSales) / previousSales) * 100)
        : 0

    return NextResponse.json({
      salesThisMonth: {
        total: currentSales,
        count: salesThisMonth._count,
        change: salesChange,
      },
      documentsThisMonth,
      documentsToday,
      pendingPayments: {
        total: Number(pendingPayments._sum.balance || 0),
        count: pendingPayments._count,
      },
      topProducts: (topProducts as TopProductResult[]).map((p) => ({
        name: `${p.productName} ${p.productSize}`,
        quantity: p._sum.quantity || 0,
        revenue: Number(p._sum.subtotal || 0),
      })),
      recentDocuments: (recentDocuments as DocumentWithClient[]).map((d) => ({
        id: d.id,
        number: d.number,
        type: d.type,
        client: d.client.name,
        total: Number(d.total),
        status: d.status,
        date: d.date,
      })),
      dailySales: (dailySales as DailySaleResult[]).map((d) => ({
        date: d.date,
        total: Number(d._sum.total || 0),
        count: d._count,
      })),
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
