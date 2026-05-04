import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  errorResponse,
  handleUnknownError,
  isAuthError,
  requireAdmin,
} from "@/lib/api"
import {
  generateDocumentPdf,
  getDocumentFilename,
  type PdfDocumentData,
} from "@/lib/pdf-generator"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    if (!id) return errorResponse(400, "ID de documento inválido")

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { name: true } },
        items: { include: { variant: { include: { product: true } } } },
      },
    })

    if (!document) return errorResponse(404, "Documento no encontrado")

    const pdfBuffer = await generateDocumentPdf(document as unknown as PdfDocumentData)
    const filename = getDocumentFilename(document)

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
    return handleUnknownError("documents.[id].pdf.GET", error)
  }
}
