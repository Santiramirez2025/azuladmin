import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
import { Decimal } from "@prisma/client/runtime/library"
import path from "path"
import fs from "fs"
import sizeOf from "image-size"

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
  paymentType: string | null
  installments: number | null
  shippingType: string
  shippingCost: Decimal
  amountPaid: Decimal | null
  balance: Decimal | null
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
  RECIBO: "RECIBO",
  REMITO: "REMITO",
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
  primary: "#1e3a5f",
  primaryLight: "#2d5a8e",
  accent: "#3b82f6",
  dark: "#1a1a2e",
  medium: "#4a5568",
  secondary: "#718096",
  lightGray: "#e2e8f0",
  veryLight: "#f7fafc",
  border: "#cbd5e1",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  white: "#ffffff",
  black: "#000000",
}

// ============================================================================
// Business Info
// ============================================================================

const BUSINESS = {
  name: "AZUL COLCHONES",
  tagline: "Descanso de calidad desde 1989",
  address: "Balerdi 855",
  city: "Villa María, Córdoba",
  phone: "3534 096566",
  email: "info@azulcolchones.com",
  cuit: "20-18015808-2",
  iibb: "215-266214",
  inicioActividad: "01/11/2006",
  condicionIVA: "Responsable Inscripto",
}

// ============================================================================
// Logo config
// ============================================================================

const LOGO = {
  path: path.join(process.cwd(), "public", "logo.png"),
  maxWidth: 120,
  maxHeight: 45,
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

function toNum(val: Decimal | number | null | undefined): number {
  if (val === null || val === undefined) return 0
  return typeof val === "number" ? val : Number(val)
}

/** Devuelve true si el archivo existe y es legible */
function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// PDF Generator
// ============================================================================

async function generatePDF(doc: DocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const pdf = new PDFDocument({
      size: "A4",
      margin: 35,
      bufferPages: true,
      info: {
        Title: `${TYPE_LABELS[doc.type]} #${String(doc.number).padStart(5, "0")} - ${doc.client.name}`,
        Author: BUSINESS.name,
        Subject: `Documento para ${doc.client.name}`,
        Creator: "Azul Colchones - Sistema de Gestión",
      },
    })

    pdf.on("data", (chunk) => chunks.push(chunk))
    pdf.on("end", () => {
      try {
        resolve(Buffer.concat(chunks))
      } catch (error) {
        reject(error)
      }
    })
    pdf.on("error", reject)

    try {
      const pageWidth = pdf.page.width - 70 // 35 margin cada lado
      const leftMargin = 35
      const rightEdge = leftMargin + pageWidth
      const isRemito = doc.type === "REMITO"

      // ====================================================================
      // HEADER - MEMBRETE FISCAL PROFESIONAL
      // ====================================================================

      // Línea superior azul
      pdf.rect(leftMargin, 35, pageWidth, 3).fill(COLORS.primary)

      // ── LOGO ────────────────────────────────────────────────────────────
      let logoActualWidth = 0

      if (fileExists(LOGO.path)) {
        try {
          const logoBuffer = fs.readFileSync(LOGO.path)
          const dims = sizeOf(logoBuffer)
          const srcW = dims.width ?? LOGO.maxWidth
          const srcH = dims.height ?? LOGO.maxHeight

          const ratio = Math.min(LOGO.maxWidth / srcW, LOGO.maxHeight / srcH)
          const logoW = Math.round(srcW * ratio)
          const logoH = Math.round(srcH * ratio)
          // Centrado vertical dentro de la banda del header (Y 48–93)
          const logoY = 48 + (LOGO.maxHeight - logoH) / 2

          pdf.image(logoBuffer, leftMargin, logoY, { width: logoW, height: logoH })
          logoActualWidth = logoW
        } catch (err) {
          // Logo corrupto o formato no soportado — fallback a solo texto
          console.warn("⚠️  No se pudo renderizar el logo:", err)
          logoActualWidth = 0
        }
      } else {
        console.warn("⚠️  Logo no encontrado en:", LOGO.path)
      }

      // ── NOMBRE Y DATOS DE EMPRESA ────────────────────────────────────────
      // Si hay logo se desplaza a la derecha; si no, arranca en leftMargin
      const GAP = 10
      const textStartX = logoActualWidth > 0 ? leftMargin + logoActualWidth + GAP : leftMargin

      // Nombre empresa
      pdf
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(COLORS.primary)
        .text(BUSINESS.name, textStartX, 48)

      // Tagline
      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(BUSINESS.tagline, textStartX, 70)

      // Datos fiscales
      const fiscalY = 84
      pdf.font("Helvetica").fontSize(7.5).fillColor(COLORS.medium)
      pdf.text(`CUIT: ${BUSINESS.cuit}`, textStartX, fiscalY)
      pdf.text(`Ing. Brutos: ${BUSINESS.iibb}`, textStartX, fiscalY + 10)
      pdf.text(`Inicio Act.: ${BUSINESS.inicioActividad}`, textStartX, fiscalY + 20)

      // Datos de contacto — segunda columna
      const contactColX = textStartX + 160
      pdf.text(`${BUSINESS.address}, ${BUSINESS.city}`, contactColX, fiscalY)
      pdf.text(`Tel: ${BUSINESS.phone}`, contactColX, fiscalY + 10)
      pdf.text(`${BUSINESS.email}`, contactColX, fiscalY + 20)

      // ── RECUADRO TIPO DE DOCUMENTO ───────────────────────────────────────
      const docTypeX = rightEdge - 140

      pdf.rect(docTypeX, 44, 140, 55).lineWidth(1.5).strokeColor(COLORS.primary).stroke()

      pdf
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(COLORS.primary)
        .text("X", docTypeX + 60, 46, { width: 20, align: "center" })

      pdf
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.primary)
        .text(TYPE_LABELS[doc.type], docTypeX, 68, { width: 140, align: "center" })

      pdf
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(COLORS.dark)
        .text(
          `N° 0001-${String(doc.number).padStart(8, "0")}`,
          docTypeX,
          82,
          { width: 140, align: "center" }
        )

      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(`Fecha: ${formatDate(doc.date)}`, docTypeX, 100, {
          width: 140,
          align: "center",
        })

      // Línea separadora debajo del header
      const headerEndY = 115
      pdf
        .moveTo(leftMargin, headerEndY)
        .lineTo(rightEdge, headerEndY)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke()

      // ====================================================================
      // DATOS DEL CLIENTE
      // ====================================================================

      const clientY = 125

      pdf
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.primary)
        .text("DATOS DEL CLIENTE", leftMargin, clientY)

      pdf
        .moveTo(leftMargin, clientY + 12)
        .lineTo(rightEdge, clientY + 12)
        .lineWidth(0.3)
        .strokeColor(COLORS.border)
        .stroke()

      pdf
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.dark)
        .text(doc.client.name, leftMargin, clientY + 18)

      const clientInfoParts: string[] = []
      if (doc.client.dni) clientInfoParts.push(`DNI: ${doc.client.dni}`)
      if (doc.client.phone) clientInfoParts.push(`Tel: ${doc.client.phone}`)
      if (doc.client.address) clientInfoParts.push(`${doc.client.address}, ${doc.client.city}`)
      else clientInfoParts.push(doc.client.city)

      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.medium)
        .text(clientInfoParts.join("  |  "), leftMargin, clientY + 33)

      let extraInfoY = clientY + 33
      const extraInfoParts: string[] = []

      if (doc.type === "PRESUPUESTO" && doc.validUntil) {
        extraInfoParts.push(`Válido hasta: ${formatDate(doc.validUntil)}`)
      }
      if (doc.type === "RECIBO" && doc.paymentMethod) {
        extraInfoParts.push(`Forma de pago: ${PAYMENT_LABELS[doc.paymentMethod] || doc.paymentMethod}`)
      }
      if (doc.shippingType) {
        extraInfoParts.push(`Envío: ${doc.shippingType}`)
      }

      if (extraInfoParts.length > 0) {
        extraInfoY += 12
        pdf
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(COLORS.secondary)
          .text(extraInfoParts.join("  |  "), leftMargin, extraInfoY)
      }

      // ====================================================================
      // TABLA DE PRODUCTOS
      // ====================================================================

      const tableStartY = extraInfoY + 22

      const cols = isRemito
        ? {
            producto: { x: leftMargin, w: pageWidth * 0.50 },
            medida: { x: leftMargin + pageWidth * 0.50, w: pageWidth * 0.25 },
            cant: { x: leftMargin + pageWidth * 0.75, w: pageWidth * 0.25 },
          }
        : {
            producto: { x: leftMargin, w: pageWidth * 0.38 },
            medida: { x: leftMargin + pageWidth * 0.38, w: pageWidth * 0.14 },
            cant: { x: leftMargin + pageWidth * 0.52, w: pageWidth * 0.10 },
            precio: { x: leftMargin + pageWidth * 0.62, w: pageWidth * 0.18 },
            subtotal: { x: leftMargin + pageWidth * 0.80, w: pageWidth * 0.20 },
          }

      pdf.rect(leftMargin, tableStartY, pageWidth, 20).fill(COLORS.primary)
      pdf.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.white)

      pdf.text("PRODUCTO", cols.producto.x + 6, tableStartY + 6, { width: cols.producto.w })
      pdf.text("MEDIDA", cols.medida.x + 4, tableStartY + 6, { width: cols.medida.w })
      pdf.text("CANT.", cols.cant.x, tableStartY + 6, { width: cols.cant.w, align: "center" })

      if (!isRemito) {
        const c = cols as any
        pdf.text("P. UNITARIO", c.precio.x, tableStartY + 6, { width: c.precio.w, align: "right" })
        pdf.text("SUBTOTAL", c.subtotal.x, tableStartY + 6, { width: c.subtotal.w - 6, align: "right" })
      }

      let rowY = tableStartY + 20
      const rowHeight = 26

      doc.items.forEach((item, index) => {
        if (rowY + rowHeight > pdf.page.height - 200) {
          pdf.addPage()
          rowY = 50
          pdf.rect(leftMargin, rowY, pageWidth, 20).fill(COLORS.primary)
          pdf.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.white)
          pdf.text("PRODUCTO", cols.producto.x + 6, rowY + 6, { width: cols.producto.w })
          pdf.text("MEDIDA", cols.medida.x + 4, rowY + 6, { width: cols.medida.w })
          pdf.text("CANT.", cols.cant.x, rowY + 6, { width: cols.cant.w, align: "center" })
          if (!isRemito) {
            const c = cols as any
            pdf.text("P. UNITARIO", c.precio.x, rowY + 6, { width: c.precio.w, align: "right" })
            pdf.text("SUBTOTAL", c.subtotal.x, rowY + 6, { width: c.subtotal.w - 6, align: "right" })
          }
          rowY += 20
        }

        if (index % 2 === 0) {
          pdf.rect(leftMargin, rowY, pageWidth, rowHeight).fill(COLORS.veryLight)
        }

        pdf
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLORS.dark)
          .text(item.productName, cols.producto.x + 6, rowY + 5, { width: cols.producto.w - 10 })

        const sourceLabel = item.source === "STOCK" ? "Stock" : "Catálogo"
        const sourceColor = item.source === "STOCK" ? COLORS.success : COLORS.accent
        pdf
          .font("Helvetica")
          .fontSize(6)
          .fillColor(sourceColor)
          .text(sourceLabel, cols.producto.x + 6, rowY + 17)

        pdf
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COLORS.dark)
          .text(item.productSize, cols.medida.x + 4, rowY + 9)

        pdf
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(COLORS.dark)
          .text(String(item.quantity), cols.cant.x, rowY + 8, { width: cols.cant.w, align: "center" })

        if (!isRemito) {
          const c = cols as any

          pdf
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.medium)
            .text(formatCurrency(item.unitPrice), c.precio.x, rowY + 9, { width: c.precio.w, align: "right" })

          pdf
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor(COLORS.dark)
            .text(formatCurrency(item.subtotal), c.subtotal.x, rowY + 9, { width: c.subtotal.w - 6, align: "right" })
        }

        rowY += rowHeight
      })

      pdf
        .moveTo(leftMargin, rowY)
        .lineTo(rightEdge, rowY)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke()

      // ====================================================================
      // TOTALES (solo PRESUPUESTO y RECIBO)
      // ====================================================================

      if (!isRemito) {
        const totalsWidth = 220
        const totalsX = rightEdge - totalsWidth
        let totY = rowY + 12

        pdf.font("Helvetica").fontSize(9).fillColor(COLORS.medium)
        pdf.text("Subtotal", totalsX, totY, { width: 100, align: "right" })
        pdf
          .font("Helvetica")
          .fillColor(COLORS.dark)
          .text(formatCurrency(doc.subtotal), totalsX + 105, totY, {
            width: totalsWidth - 110,
            align: "right",
          })
        totY += 16

        if (toNum(doc.surcharge) > 0) {
          pdf
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.medium)
            .text(`Recargo (${doc.surchargeRate}%)`, totalsX, totY, { width: 100, align: "right" })
          pdf
            .fillColor(COLORS.warning)
            .text(formatCurrency(doc.surcharge), totalsX + 105, totY, {
              width: totalsWidth - 110,
              align: "right",
            })
          totY += 16
        }

        if (toNum(doc.shippingCost) > 0) {
          pdf
            .font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.medium)
            .text("Envío", totalsX, totY, { width: 100, align: "right" })
          pdf
            .fillColor(COLORS.dark)
            .text(formatCurrency(doc.shippingCost), totalsX + 105, totY, {
              width: totalsWidth - 110,
              align: "right",
            })
          totY += 16
        }

        totY += 3
        pdf
          .moveTo(totalsX, totY)
          .lineTo(rightEdge, totY)
          .lineWidth(0.5)
          .strokeColor(COLORS.border)
          .stroke()
        totY += 8

        pdf.rect(totalsX, totY, totalsWidth, 32).fill(COLORS.primary)

        pdf
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COLORS.white)
          .text("TOTAL", totalsX + 10, totY + 10, { width: 80 })

        pdf
          .font("Helvetica-Bold")
          .fontSize(16)
          .fillColor(COLORS.white)
          .text(formatCurrency(doc.total), totalsX + 95, totY + 7, {
            width: totalsWidth - 105,
            align: "right",
          })

        totY += 40

        if (doc.type === "RECIBO") {
          const amountPaid = toNum(doc.amountPaid)
          const balance = toNum(doc.balance)

          if (amountPaid > 0) {
            pdf
              .font("Helvetica")
              .fontSize(9)
              .fillColor(COLORS.success)
              .text(
                `✓ Entregó (${doc.paymentType || "Efectivo"}): ${formatCurrency(amountPaid)}`,
                totalsX,
                totY,
                { width: totalsWidth, align: "right" }
              )
            totY += 16
          }

          if (balance > 0) {
            pdf
              .font("Helvetica-Bold")
              .fontSize(10)
              .fillColor(COLORS.danger)
              .text(`Saldo pendiente: ${formatCurrency(balance)}`, totalsX, totY, {
                width: totalsWidth,
                align: "right",
              })
            totY += 16
          } else if (amountPaid > 0 && balance === 0) {
            pdf
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor(COLORS.success)
              .text("PAGO COMPLETO", totalsX, totY, { width: totalsWidth, align: "right" })
            totY += 16
          }

          if (doc.installments && doc.installments > 1) {
            const installmentAmount = toNum(doc.total) / doc.installments
            pdf
              .font("Helvetica")
              .fontSize(8)
              .fillColor(COLORS.medium)
              .text(
                `${doc.installments} cuotas de ${formatCurrency(installmentAmount)}`,
                totalsX,
                totY,
                { width: totalsWidth, align: "right" }
              )
            totY += 14
          }
        }

        rowY = Math.max(rowY, totY)
      }

      // ====================================================================
      // OBSERVACIONES
      // ====================================================================

      if (doc.observations) {
        const obsY = rowY + 16
        pdf
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(COLORS.primary)
          .text("OBSERVACIONES", leftMargin, obsY)

        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.medium)
          .text(doc.observations, leftMargin, obsY + 12, {
            width: pageWidth * 0.65,
            lineGap: 2,
          })
      }

      // ====================================================================
      // FIRMAS
      // ====================================================================

      const footerHeight = 40
      const signatureBlockHeight = 85
      const pageBottom = pdf.page.height - 35
      const signatureY = pageBottom - footerHeight - signatureBlockHeight

      if (rowY + 50 > signatureY) {
        pdf.addPage()
      }

      const sigY = Math.max(signatureY, rowY + 30)

      pdf
        .moveTo(leftMargin, sigY - 8)
        .lineTo(rightEdge, sigY - 8)
        .lineWidth(0.3)
        .strokeColor(COLORS.border)
        .stroke()

      const sigColWidth = pageWidth / 2 - 30
      const sigLeftX = leftMargin + 20
      const sigRightX = leftMargin + pageWidth / 2 + 30
      const lineY = sigY + 50

      // Firma Vendedor
      pdf
        .moveTo(sigLeftX, lineY)
        .lineTo(sigLeftX + sigColWidth, lineY)
        .lineWidth(0.8)
        .strokeColor(COLORS.dark)
        .stroke()

      pdf
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.dark)
        .text("Firma Vendedor", sigLeftX, lineY + 5, { width: sigColWidth, align: "center" })

      pdf
        .font("Helvetica")
        .fontSize(7)
        .fillColor(COLORS.secondary)
        .text("Aclaración: ________________________________", sigLeftX, lineY + 18, {
          width: sigColWidth,
          align: "center",
        })

      // Firma Cliente (RECIBO y REMITO)
      if (doc.type !== "PRESUPUESTO") {
        pdf
          .moveTo(sigRightX, lineY)
          .lineTo(sigRightX + sigColWidth, lineY)
          .lineWidth(0.8)
          .strokeColor(COLORS.dark)
          .stroke()

        pdf
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COLORS.dark)
          .text(
            doc.type === "REMITO" ? "Recibí conforme" : "Firma Cliente",
            sigRightX,
            lineY + 5,
            { width: sigColWidth, align: "center" }
          )

        pdf
          .font("Helvetica")
          .fontSize(7)
          .fillColor(COLORS.secondary)
          .text("Aclaración: ________________________________", sigRightX, lineY + 18, {
            width: sigColWidth,
            align: "center",
          })

        if (doc.type === "REMITO") {
          pdf.text("DNI: _______________________", sigRightX, lineY + 28, {
            width: sigColWidth,
            align: "center",
          })
        }
      }

      // ====================================================================
      // FOOTER
      // ====================================================================

      const footY = pageBottom - 25

      pdf
        .moveTo(leftMargin, footY)
        .lineTo(rightEdge, footY)
        .lineWidth(0.3)
        .strokeColor(COLORS.border)
        .stroke()

      pdf
        .font("Helvetica")
        .fontSize(7)
        .fillColor(COLORS.secondary)
        .text(
          `${BUSINESS.name}  ·  ${BUSINESS.address}, ${BUSINESS.city}  ·  Tel: ${BUSINESS.phone}`,
          leftMargin,
          footY + 6,
          { width: pageWidth, align: "center" }
        )

      pdf
        .fontSize(6)
        .fillColor(COLORS.border)
        .text("Documento no válido como factura", leftMargin, footY + 18, {
          width: pageWidth,
          align: "center",
        })

      pdf.end()
    } catch (error) {
      console.error("Error durante la generación del PDF:", error)
      pdf.end()
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
    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: { name: true },
        },
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      )
    }

    const pdfBuffer = await generatePDF(document as unknown as DocumentData)

    const filename = `${TYPE_LABELS[document.type as keyof typeof TYPE_LABELS]}-${String(document.number).padStart(5, "0")}.pdf`

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
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Error al generar PDF",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}