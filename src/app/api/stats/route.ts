// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay, 
  subMonths, 
  startOfWeek, 
  subWeeks, 
  subDays,
  endOfWeek,
  isValid
} from "date-fns"
import { Decimal } from "@prisma/client/runtime/library"

interface DocumentWithClient {
  id: string
  number: number
  type: string
  status: string
  total: Decimal  // ← Cambio aquí
  date: Date
  createdAt: Date
  client: { name: string }
}

interface TopProductResult {
  productName: string
  productSize: string
  _sum: {
    quantity: number | null
    subtotal: Decimal | null  // ← Cambio aquí
  }
}

interface DailySaleResult {
  date: Date
  _sum: { total: Decimal | null }  // ← Cambio aquí
  _count: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "month"
    const customDateParam = searchParams.get("date")

    // ✅ Si hay fecha personalizada, usarla como referencia
    let referenceDate = new Date()
    if (customDateParam) {
      const parsedDate = new Date(customDateParam)
      if (isValid(parsedDate)) {
        referenceDate = parsedDate
      }
    }

    let periodStart: Date
    let periodEnd: Date
    let previousStart: Date
    let previousEnd: Date
    let daysToShow: number

    // ✅ Configurar rangos según el período
    switch (period) {
      case "day":
        periodStart = startOfDay(referenceDate)
        periodEnd = endOfDay(referenceDate)
        previousStart = startOfDay(subDays(referenceDate, 1))
        previousEnd = endOfDay(subDays(referenceDate, 1))
        daysToShow = 1
        break
      
      case "week":
        periodStart = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Lunes
        periodEnd = endOfWeek(referenceDate, { weekStartsOn: 1 }) // Domingo
        previousStart = startOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 })
        previousEnd = endOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 })
        daysToShow = 7
        break
      
      case "month":
      default:
        periodStart = startOfMonth(referenceDate)
        periodEnd = endOfMonth(referenceDate)
        previousStart = startOfMonth(subMonths(referenceDate, 1))
        previousEnd = endOfMonth(subMonths(referenceDate, 1))
        daysToShow = 30
        break
    }

    // ✅ 1. Ventas del período actual
    const salesThisPeriod = await prisma.document.aggregate({
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: periodStart, lte: periodEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    // ✅ 2. Ventas del período anterior (para comparación)
    const salesLastPeriod = await prisma.document.aggregate({
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: previousStart, lte: previousEnd },
      },
      _sum: { total: true },
    })

    // ✅ 3. Documentos del período
    const documentsThisPeriod = await prisma.document.count({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
    })

    // ✅ 4. Documentos creados "hoy" (en la fecha de referencia)
    const documentsToday = await prisma.document.count({
      where: {
        createdAt: { 
          gte: startOfDay(referenceDate), 
          lte: endOfDay(referenceDate) 
        },
      },
    })

    // ✅ 5. Pendientes de cobro (siempre total, no cambia por período)
    const pendingPayments = await prisma.document.aggregate({
      where: {
        type: "RECIBO",
        status: { in: ["APPROVED", "SENT"] },
        balance: { gt: 0 },
      },
      _sum: { balance: true },
      _count: true,
    })

    // ✅ 6. Top productos del período
    const topProducts = await prisma.documentItem.groupBy({
      by: ["productName", "productSize"],
      where: {
        document: {
          type: { in: ["RECIBO"] },
          status: { in: ["APPROVED", "COMPLETED"] },
          date: { gte: periodStart, lte: periodEnd },
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

    // ✅ 7. Documentos recientes del período
    const recentDocuments = await prisma.document.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        client: {
          select: { name: true },
        },
      },
    })

    // ✅ 8. Ventas diarias del período
    const startDate = period === "day" 
      ? startOfDay(referenceDate) 
      : subDays(periodEnd, daysToShow - 1)
    
    const dailySales = await prisma.document.groupBy({
      by: ["date"],
      where: {
        type: { in: ["RECIBO"] },
        status: { in: ["APPROVED", "COMPLETED"] },
        date: { gte: startDate, lte: periodEnd },
      },
      _sum: { total: true },
      _count: true,
      orderBy: { date: "asc" },
    })

    // ✅ 9. Rellenar días sin ventas con 0
    const dailySalesComplete = []
    
    if (period === "day") {
      // Para vista diaria: mostrar por horas (0-23)
      for (let hour = 0; hour < 24; hour++) {
        dailySalesComplete.push({
          date: hour.toString(),
          total: 0,
          count: 0,
        })
      }
    } else {
      // Para semana/mes: mostrar por días
      for (let i = 0; i < daysToShow; i++) {
        const date = subDays(periodEnd, daysToShow - 1 - i)
        const dateStr = date.toISOString().split("T")[0]
        
        const existing = dailySales.find(
          (d) => d.date.toISOString().split("T")[0] === dateStr
        )

        dailySalesComplete.push({
          date: dateStr,
          total: existing ? Number(existing._sum.total || 0) : 0,
          count: existing ? existing._count : 0,
        })
      }
    }

    // ✅ 10. Calcular cambio porcentual
    const currentSales = Number(salesThisPeriod._sum.total || 0)
    const previousSales = Number(salesLastPeriod._sum.total || 0)
    const salesChange =
      previousSales > 0
        ? Math.round(((currentSales - previousSales) / previousSales) * 100)
        : 0

    // ✅ 11. Respuesta final
    return NextResponse.json({
      salesThisMonth: {
        total: currentSales,
        count: salesThisPeriod._count,
        change: salesChange,
      },
      documentsThisMonth: documentsThisPeriod,
      documentsToday,
      pendingPayments: {
        total: Number(pendingPayments._sum.balance || 0),
        count: pendingPayments._count,
      },
      topProducts: (topProducts as TopProductResult[]).map((p) => ({
        name: `${p.productName} ${p.productSize}`.trim(),
        quantity: p._sum.quantity || 0,
        revenue: Number(p._sum.subtotal || 0),
      })),
      recentDocuments: recentDocuments.map((d) => ({  // ← Removí el cast
        id: d.id,
        number: d.number,
        type: d.type,
        client: d.client.name,
        total: Number(d.total),  // ← Conversión a number
        status: d.status,
        date: d.date.toISOString(),
      })),
      dailySales: dailySalesComplete,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}