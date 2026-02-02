import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
import { Decimal } from "@prisma/client/runtime/library"

// ============================================================================
// Types
// ============================================================================

interface DocumentItem {
  id: string
  productName: string
  productSize: string
  unitPrice: Decimal
  quantity: number
  subtotal: Decimal
  source: "STOCK" | "CATALOGO"
}

interface DocumentData {
  id: string
  number: number
  type: "PRESUPUESTO" | "RECIBO" | "REMITO"
  status: string
  total: Decimal
  subtotal: Decimal
  surcharge: Decimal
  surchargeRate: number
  date: Date
  validUntil: Date | null
  observations: string | null
  internalNotes: string | null
  paymentMethod: string | null
  installments: number | null
  shippingType: string
  shippingCost: Decimal
  client: {
    name: string
    phone: string
    email: string | null
    address: string | null
    city: string
    province: string
    dni: string | null
  }
  createdBy: {
    name: string
  }
  items: DocumentItem[]
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_LABELS = {
  PRESUPUESTO: "PRESUPUESTO",
  RECIBO: "RECIBO DE PAGO",
  REMITO: "REMITO DE ENTREGA",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  APPROVED: "Aprobado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
}

const PAYMENT_LABELS: Record<string, string> = {
  CONTADO: "Contado",
  CUOTAS_3: "3 Cuotas",
  CUOTAS_6: "6 Cuotas",
  CUOTAS_9: "9 Cuotas",
  CUOTAS_12: "12 Cuotas",
}

const COLORS = {
  primary: "#1e40af",
  secondary: "#6b7280",
  dark: "#111827",
  light: "#f3f4f6",
  border: "#e5e7eb",
  success: "#059669",
  warning: "#d97706",
  white: "#ffffff",
}

// ============================================================================
// Business Info
// ============================================================================

const BUSINESS = {
  name: "AZUL COLCHONES",
  tagline: "Descanso de calidad para tu hogar",
  address: "Av. España 1234, Villa María",
  city: "Villa María, Córdoba",
  phone: "+54 9 353 123-4567",
  email: "ventas@azulcolchones.com",
  cuit: "20-12345678-9",
  website: "www.azulcolchones.com",
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number | Decimal): string {
  const num = typeof amount === "number" ? amount : Number(amount)
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

// ============================================================================
// PDF Generator - Retorna Buffer (NO Blob - Node.js no soporta Blob nativo)
// ============================================================================

async function generatePDF(doc: DocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const pdf = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `${TYPE_LABELS[doc.type]} #${String(doc.number).padStart(5, "0")}`,
        Author: BUSINESS.name,
        Subject: `Documento para ${doc.client.name}`,
        Creator: "Azul Colchones - Sistema de Gestión",
      },
    })

    // 🔥 IMPORTANTE: Escuchar eventos correctamente
    pdf.on("data", (chunk) => chunks.push(chunk))
    
    pdf.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      } catch (error) {
        reject(error)
      }
    })
    
    pdf.on("error", (error) => {
      console.error("PDF Generation Error:", error)
      reject(error)
    })

    try {
      const pageWidth = pdf.page.width - 80
      const leftMargin = 40

      // ========================================================================
      // Header
      // ========================================================================

      pdf.rect(leftMargin, 40, pageWidth, 85).fill(COLORS.primary)
      pdf.rect(leftMargin, 125, pageWidth, 4).fill(COLORS.warning)

      pdf
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor(COLORS.white)
        .text(BUSINESS.name, leftMargin + 20, 55)

      pdf
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.white)
        .opacity(0.9)
        .text(BUSINESS.tagline, leftMargin + 20, 88)
        .opacity(1)

      const docNumber = `#${String(doc.number).padStart(5, "0")}`

      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(COLORS.white)
        .opacity(0.9)
        .text(TYPE_LABELS[doc.type], pageWidth - 80, 55, { width: 120, align: "right" })
        .opacity(1)

      pdf
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(COLORS.white)
        .text(docNumber, pageWidth - 80, 75, { width: 120, align: "right" })

      // ========================================================================
      // Info Bar
      // ========================================================================

      const infoY = 145
      pdf.rect(leftMargin, infoY, pageWidth, 35).fill(COLORS.light)

      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text("FECHA", leftMargin + 15, infoY + 8)

      pdf
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.dark)
        .text(formatDate(doc.date), leftMargin + 15, infoY + 19)

      if (doc.type === "PRESUPUESTO" && doc.validUntil) {
        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.secondary)
          .text("VÁLIDO HASTA", leftMargin + 120, infoY + 8)

        pdf
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COLORS.dark)
          .text(formatDate(doc.validUntil), leftMargin + 120, infoY + 19)
      }

      if (doc.type === "RECIBO" && doc.paymentMethod) {
        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.secondary)
          .text("FORMA DE PAGO", leftMargin + 240, infoY + 8)

        pdf
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COLORS.dark)
          .text(
            PAYMENT_LABELS[doc.paymentMethod] || doc.paymentMethod,
            leftMargin + 240,
            infoY + 19
          )
      }

      const statusX = pageWidth - 40
      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text("ESTADO", statusX, infoY + 8, { width: 80, align: "right" })

      const statusColor =
        doc.status === "COMPLETED"
          ? COLORS.success
          : doc.status === "CANCELLED" || doc.status === "EXPIRED"
          ? "#dc2626"
          : COLORS.primary

      pdf
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(statusColor)
        .text(STATUS_LABELS[doc.status] || doc.status, statusX, infoY + 19, {
          width: 80,
          align: "right",
        })

      // ========================================================================
      // Client & Business Info
      // ========================================================================

      const clientY = 200

      pdf
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.secondary)
        .text("CLIENTE", leftMargin, clientY)

      pdf
        .moveTo(leftMargin, clientY + 14)
        .lineTo(leftMargin + 180, clientY + 14)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke()

      pdf
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(COLORS.dark)
        .text(doc.client.name, leftMargin, clientY + 22)

      let clientInfoY = clientY + 40
      pdf.font("Helvetica").fontSize(9).fillColor(COLORS.secondary)

      if (doc.client.dni) {
        pdf.text(`DNI: ${doc.client.dni}`, leftMargin, clientInfoY)
        clientInfoY += 13
      }
      if (doc.client.phone) {
        pdf.text(`Tel: ${doc.client.phone}`, leftMargin, clientInfoY)
        clientInfoY += 13
      }
      if (doc.client.email) {
        pdf.text(`Email: ${doc.client.email}`, leftMargin, clientInfoY)
        clientInfoY += 13
      }
      if (doc.client.address) {
        pdf.text(`${doc.client.address}`, leftMargin, clientInfoY)
        clientInfoY += 13
      }
      pdf.text(`${doc.client.city}, ${doc.client.province}`, leftMargin, clientInfoY)

      const emitterX = pageWidth - 140
      pdf
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.secondary)
        .text("EMISOR", emitterX, clientY, { width: 180, align: "right" })

      pdf
        .moveTo(emitterX, clientY + 14)
        .lineTo(pageWidth + 40, clientY + 14)
        .strokeColor(COLORS.border)
        .stroke()

      pdf.font("Helvetica").fontSize(9).fillColor(COLORS.secondary)
      let emitterY = clientY + 22
      pdf.text(BUSINESS.address, emitterX, emitterY, { width: 180, align: "right" })
      emitterY += 13
      pdf.text(BUSINESS.city, emitterX, emitterY, { width: 180, align: "right" })
      emitterY += 13
      pdf.text(BUSINESS.phone, emitterX, emitterY, { width: 180, align: "right" })
      emitterY += 13
      pdf.text(BUSINESS.email, emitterX, emitterY, { width: 180, align: "right" })
      emitterY += 13
      pdf.text(`CUIT: ${BUSINESS.cuit}`, emitterX, emitterY, { width: 180, align: "right" })

      // ========================================================================
      // Items Table
      // ========================================================================

      const tableY = 310
      const colWidths = {
        item: pageWidth * 0.40,
        size: pageWidth * 0.15,
        qty: pageWidth * 0.10,
        price: pageWidth * 0.15,
        subtotal: pageWidth * 0.20,
      }

      pdf.rect(leftMargin, tableY, pageWidth, 26).fill(COLORS.dark)

      pdf.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.white)

      let colX = leftMargin + 10
      pdf.text("PRODUCTO", colX, tableY + 9)
      colX += colWidths.item
      pdf.text("MEDIDA", colX, tableY + 9)
      colX += colWidths.size
      pdf.text("CANT.", colX, tableY + 9, { width: colWidths.qty, align: "center" })
      colX += colWidths.qty
      pdf.text("P. UNIT.", colX, tableY + 9, { width: colWidths.price, align: "right" })
      colX += colWidths.price
      pdf.text("SUBTOTAL", colX, tableY + 9, { width: colWidths.subtotal - 10, align: "right" })

      let rowY = tableY + 26
      const rowHeight = 32

      doc.items.forEach((item, index) => {
        if (rowY + rowHeight > pdf.page.height - 150) {
          pdf.addPage()
          rowY = 60
        }

        const isEven = index % 2 === 0
        if (isEven) {
          pdf.rect(leftMargin, rowY, pageWidth, rowHeight).fill(COLORS.light)
        }

        colX = leftMargin + 10

        pdf
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(COLORS.dark)
          .text(item.productName, colX, rowY + 8, { width: colWidths.item - 15 })

        const sourceLabel = item.source === "STOCK" ? "En stock" : "A pedido"
        const sourceColor = item.source === "STOCK" ? COLORS.success : COLORS.warning
        pdf
          .font("Helvetica")
          .fontSize(7)
          .fillColor(sourceColor)
          .text(sourceLabel, colX, rowY + 21)

        colX += colWidths.item

        pdf
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLORS.dark)
          .text(item.productSize, colX, rowY + 12)

        colX += colWidths.size

        pdf.text(String(item.quantity), colX, rowY + 12, {
          width: colWidths.qty,
          align: "center",
        })

        colX += colWidths.qty

        pdf.text(formatCurrency(item.unitPrice), colX, rowY + 12, {
          width: colWidths.price,
          align: "right",
        })

        colX += colWidths.price

        pdf
          .font("Helvetica-Bold")
          .text(formatCurrency(item.subtotal), colX, rowY + 12, {
            width: colWidths.subtotal - 10,
            align: "right",
          })

        rowY += rowHeight
      })

      pdf
        .moveTo(leftMargin, rowY)
        .lineTo(leftMargin + pageWidth, rowY)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke()

      // ========================================================================
      // Totals
      // ========================================================================

      const totalsY = rowY + 20
      const totalsX = pageWidth - 100

      pdf.font("Helvetica").fontSize(10).fillColor(COLORS.secondary)

      let currentY = totalsY

      pdf.text("Subtotal:", totalsX, currentY, { width: 70, align: "right" })
      pdf
        .font("Helvetica")
        .fillColor(COLORS.dark)
        .text(formatCurrency(doc.subtotal), totalsX + 75, currentY, {
          width: 85,
          align: "right",
        })
      currentY += 18

      if (Number(doc.surcharge) > 0) {
        pdf
          .font("Helvetica")
          .fillColor(COLORS.secondary)
          .text(`Recargo (${doc.surchargeRate}%):`, totalsX, currentY, {
            width: 70,
            align: "right",
          })
        pdf
          .fillColor(COLORS.dark)
          .text(formatCurrency(doc.surcharge), totalsX + 75, currentY, {
            width: 85,
            align: "right",
          })
        currentY += 18
      }

      if (Number(doc.shippingCost) > 0) {
        pdf
          .font("Helvetica")
          .fillColor(COLORS.secondary)
          .text("Envío:", totalsX, currentY, { width: 70, align: "right" })
        pdf
          .fillColor(COLORS.dark)
          .text(formatCurrency(doc.shippingCost), totalsX + 75, currentY, {
            width: 85,
            align: "right",
          })
        currentY += 18
      }

      currentY += 5
      pdf.rect(totalsX - 15, currentY, 175, 38).fill(COLORS.primary)

      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(COLORS.white)
        .text("TOTAL:", totalsX, currentY + 12, { width: 70, align: "right" })

      pdf
        .fontSize(18)
        .text(formatCurrency(doc.total), totalsX + 75, currentY + 9, {
          width: 85,
          align: "right",
        })

      // ========================================================================
      // Shipping Info
      // ========================================================================

      if (doc.shippingType) {
        const shippingY = currentY + 55

        pdf
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLORS.secondary)
          .text("ENVÍO:", leftMargin, shippingY)

        pdf
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLORS.dark)
          .text(doc.shippingType, leftMargin + 45, shippingY)
      }

      // ========================================================================
      // Observations
      // ========================================================================

      if (doc.observations) {
        const obsY = currentY + 80

        pdf
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLORS.secondary)
          .text("OBSERVACIONES:", leftMargin, obsY)

        pdf
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COLORS.dark)
          .text(doc.observations, leftMargin, obsY + 14, {
            width: pageWidth * 0.6,
            lineGap: 3,
          })
      }

      // ========================================================================
      // Footer
      // ========================================================================

      const footerY = pdf.page.height - 70

      pdf
        .moveTo(leftMargin, footerY)
        .lineTo(leftMargin + pageWidth, footerY)
        .strokeColor(COLORS.border)
        .stroke()

      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.dark)
        .text("¡Gracias por confiar en nosotros!", leftMargin, footerY + 12, {
          width: pageWidth,
          align: "center",
        })

      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(`${BUSINESS.website} · ${BUSINESS.phone}`, leftMargin, footerY + 26, {
          width: pageWidth,
          align: "center",
        })

      pdf
        .fontSize(7)
        .text(
          `Atendido por: ${doc.createdBy.name} · Doc ID: ${doc.id.slice(0, 8)}...`,
          leftMargin,
          footerY + 42,
          { width: pageWidth, align: "center" }
        )

      // 🔥 IMPORTANTE: Finalizar el PDF
      pdf.end()
      
    } catch (error) {
      console.error("Error durante la generación del PDF:", error)
      pdf.end() // Asegurar que se cierre el stream
      reject(error)
    }
  })
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 Iniciando generación de PDF...")
    
    const { id } = await params
    console.log("📄 Document ID:", id)

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })

    if (!document) {
      console.error("❌ Documento no encontrado:", id)
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    console.log("✅ Documento encontrado:", document.number)
    console.log("📦 Items:", document.items.length)

    // Generar el PDF
    const pdfBuffer = await generatePDF(document as unknown as DocumentData)
    
    console.log("✅ PDF generado correctamente. Size:", pdfBuffer.length, "bytes")

    const filename = `${TYPE_LABELS[document.type as keyof typeof TYPE_LABELS]
      .replace(/ /g, "-")}-${String(document.number).padStart(5, "0")}.pdf`

    console.log("📥 Enviando archivo:", filename)

    // 🔥 FIX: Convertir Buffer a Uint8Array para compatibilidad con Response
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-cache",
      },
    })
    
  } catch (error) {
    console.error("💥 Error generating PDF:", error)
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: "Error al generar PDF",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}