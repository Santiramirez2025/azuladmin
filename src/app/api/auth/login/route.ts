import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { z } from "zod"
import {
  getAuthSecret,
  verifyAdminCredentials,
  rateLimit,
  getClientIp,
} from "@/lib/auth"

export const runtime = "nodejs"

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
})

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intentá de nuevo más tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
  }

  let secret: Uint8Array
  try {
    secret = getAuthSecret()
  } catch (err) {
    console.error("Auth config error:", (err as Error).message)
    return NextResponse.json(
      { error: "Configuración de autenticación incompleta" },
      { status: 500 },
    )
  }

  const result = await verifyAdminCredentials(parsed.data)
  if (!result.ok) {
    if (result.reason === "config") {
      return NextResponse.json(
        { error: "Configuración de autenticación incompleta" },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
  }

  const token = await new SignJWT({ sub: parsed.data.username, role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret)

  const response = NextResponse.json(
    { success: true, message: "Inicio de sesión exitoso" },
    { status: 200 },
  )

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return response
}
