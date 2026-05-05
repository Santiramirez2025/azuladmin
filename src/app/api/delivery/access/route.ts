import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * GET /api/delivery/access?token=<DELIVERY_ACCESS_TOKEN>
 *
 * Valida el token, setea cookie httpOnly de 1 año, y redirige a /reparto.
 * Si el token es inválido, redirige a /login (más simple que mostrar error
 * y evita filtrar info).
 *
 * Esta es la URL que se le manda al primo por WhatsApp:
 * https://azuladmin.vercel.app/api/delivery/access?token=XXX
 */
export async function GET(request: NextRequest) {
  const expected = process.env.DELIVERY_ACCESS_TOKEN
  if (!expected || expected.length < 16) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const provided = request.nextUrl.searchParams.get("token") ?? ""
  if (!constantTimeEqual(provided, expected)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const response = NextResponse.redirect(new URL("/reparto", request.url))
  response.cookies.set("delivery-token", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 año
    path: "/",
  })
  return response
}
