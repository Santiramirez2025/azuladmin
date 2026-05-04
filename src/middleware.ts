import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET
  if (
    !secret ||
    secret.length < 32 ||
    secret.startsWith("genera_un_secret") ||
    secret === "default-secret-change-this" ||
    secret === "nuevo-default-2026"
  ) {
    return null
  }
  return new TextEncoder().encode(secret)
}

function unauthorizedApi(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

function redirectToLogin(request: NextRequest, deleteCookie: boolean): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url))
  if (deleteCookie) response.cookies.delete("auth-token")
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPath = pathname.startsWith("/login")
  const isApi = pathname.startsWith("/api/")
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    if (isLoginPath) return NextResponse.next()
    if (isApi) return unauthorizedApi("No autenticado")
    return redirectToLogin(request, false)
  }

  const secret = getSecret()
  if (!secret) {
    console.error("AUTH_SECRET no configurado o inseguro")
    if (isLoginPath) return NextResponse.next()
    if (isApi) {
      const res = unauthorizedApi("Configuración de autenticación incompleta")
      res.cookies.delete("auth-token")
      return res
    }
    return redirectToLogin(request, true)
  }

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      throw new Error("Token expirado")
    }

    if (isLoginPath) return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  } catch {
    if (isLoginPath) {
      const res = NextResponse.next()
      res.cookies.delete("auth-token")
      return res
    }
    if (isApi) {
      const res = unauthorizedApi("Token inválido o expirado")
      res.cookies.delete("auth-token")
      return res
    }
    return redirectToLogin(request, true)
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
