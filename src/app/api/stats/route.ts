// app/api/stats/route.ts
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
import { decimalToNumber } from "@/lib/utils"

// ============================================================================
// TIPOS
// ============================================================================

interface StatsResponse {
  salesThisMonth: {
    total: number
    count: number
    change: number
  }
  documentsThisMonth: number
  documentsToday: number
  pendingPayments: {
    total: number
    count: number
  }
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  recentDocuments: Array<{
    id: string
    number: number
    type: string
    client: string
    total: number
    status: string
    date: string
  }>
  dailySales: Array<{
    date: string
    total: number
    count: number
  }>
}

// ============================================================================
// HELPERS
// ============================================================================

function getPeriodRanges(period: string, referenceDate: Date) {
  let periodStart: Date
  let periodEnd: Date
  let previousStart: Date
  let previousEnd: Date
  let daysToShow: number

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

  return { periodStart, periodEnd, previousStart, previousEnd, daysToShow }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ============================================================================
// GET - Obtener estadísticas del dashboard
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "month"
    const customDateParam = searchParams.get("date")

    // ✅ Validar y parsear fecha de referencia
    let referenceDate = new Date()
    if (customDateParam) {
      const parsedDate = new Date(customDateParam)
      if (isValid(parsedDate)) {
        referenceDate = parsedDate
      } else {
        return NextResponse.json(
          { error: "Fecha inválida proporcionada" },
          { status: 400 }
        )
      }
    }

    // ✅ Calcular rangos de fechas según el período
    const { periodStart, periodEnd, previousStart, previousEnd, daysToShow } = 
      getPeriodRanges(period, referenceDate)

    // ============================================================================
    // QUERIES OPTIMIZADAS EN PARALELO
    // ============================================================================

    const [
      salesCurrent,
      salesPrevious,
      documentsCount,
      documentsTodayCount,
      pendingPaymentsData,
      topProductsData,
      recentDocsData,
      dailySalesData
    ] = await Promise.all([
      // 1. Ventas del período actual
      prisma.document.aggregate({
        where: {
          type: "RECIBO",
          status: { in: ["APPROVED", "COMPLETED"] },
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { total: true },
        _count: true,
      }),

      // 2. Ventas del período anterior (para comparación)
      prisma.document.aggregate({
        where: {
          type: "RECIBO",
          status: { in: ["APPROVED", "COMPLETED"] },
          date: { gte: previousStart, lte: previousEnd },
        },
        _sum: { total: true },
      }),

      // 3. Total de documentos del período
      prisma.document.count({
        where: {
          date: { gte: periodStart, lte: periodEnd },
        },
      }),

      // 4. Documentos creados "hoy"
      prisma.document.count({
        where: {
          createdAt: { 
            gte: startOfDay(referenceDate), 
            lte: endOfDay(referenceDate) 
          },
        },
      }),

      // 5. Pagos pendientes (GLOBAL - no depende del período)
      prisma.document.aggregate({
        where: {
          type: "RECIBO",
          status: { in: ["APPROVED", "SENT"] },
          balance: { gt: 0 },
        },
        _sum: { balance: true },
        _count: true,
      }),

      // 6. Top productos del período
      prisma.documentItem.groupBy({
        by: ["productName", "productSize"],
        where: {
          document: {
            type: "RECIBO",
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
      }),

      // 7. Documentos recientes del período
      prisma.document.findMany({
        where: {
          date: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          number: true,
          type: true,
          status: true,
          total: true,
          date: true,
          client: {
            select: { name: true },
          },
        },
      }),

      // 8. Ventas diarias para el gráfico
      prisma.document.groupBy({
        by: ["date"],
        where: {
          type: "RECIBO",
          status: { in: ["APPROVED", "COMPLETED"] },
          date: { 
            gte: period === "day" ? startOfDay(referenceDate) : subDays(periodEnd, daysToShow - 1), 
            lte: periodEnd 
          },
        },
        _sum: { total: true },
        _count: true,
        orderBy: { date: "asc" },
      }),
    ])

    // ============================================================================
    // PROCESAMIENTO DE DATOS
    // ============================================================================

    // Calcular cambio porcentual
    const currentSales = decimalToNumber(salesCurrent._sum.total)
    const previousSales = decimalToNumber(salesPrevious._sum.total)
    const salesChange = calculatePercentageChange(currentSales, previousSales)

    // Procesar top productos
    const topProducts = topProductsData.map((item) => ({
      name: `${item.productName} ${item.productSize}`.trim(),
      quantity: item._sum.quantity || 0,
      revenue: decimalToNumber(item._sum.subtotal),
    }))

    // Procesar documentos recientes
    const recentDocuments = recentDocsData.map((doc) => ({
      id: doc.id,
      number: doc.number,
      type: doc.type,
      client: doc.client.name,
      total: decimalToNumber(doc.total),
      status: doc.status,
      date: doc.date.toISOString(),
    }))

    // Procesar ventas diarias y rellenar días faltantes
    const dailySalesComplete: Array<{ date: string; total: number; count: number }> = []
    
    if (period === "day") {
      // Para vista diaria: agrupar por horas (simplificado - mostrar total del día)
      const dayTotal = decimalToNumber(salesCurrent._sum.total)
      dailySalesComplete.push({
        date: referenceDate.toISOString().split("T")[0],
        total: dayTotal,
        count: salesCurrent._count,
      })
    } else {
      // Para semana/mes: mostrar por días
      const salesMap = new Map(
        dailySalesData.map((item) => [
          item.date.toISOString().split("T")[0],
          {
            total: decimalToNumber(item._sum.total),
            count: item._count,
          },
        ])
      )

      for (let i = 0; i < daysToShow; i++) {
        const date = subDays(periodEnd, daysToShow - 1 - i)
        const dateStr = date.toISOString().split("T")[0]
        const data = salesMap.get(dateStr) || { total: 0, count: 0 }

        dailySalesComplete.push({
          date: dateStr,
          total: data.total,
          count: data.count,
        })
      }
    }

    // ============================================================================
    // RESPUESTA
    // ============================================================================

    const response: StatsResponse = {
      salesThisMonth: {
        total: currentSales,
        count: salesCurrent._count,
        change: salesChange,
      },
      documentsThisMonth: documentsCount,
      documentsToday: documentsTodayCount,
      pendingPayments: {
        total: decimalToNumber(pendingPaymentsData._sum.balance),
        count: pendingPaymentsData._count,
      },
      topProducts,
      recentDocuments,
      dailySales: dailySalesComplete,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching stats:", error)
    
    // Log detallado en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    }

    return NextResponse.json(
      { 
        error: "Error al obtener estadísticas",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    )
  }
}