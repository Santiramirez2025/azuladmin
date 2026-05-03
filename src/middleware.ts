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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPath = pathname.startsWith("/login")
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    if (isLoginPath) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const secret = getSecret()
  if (!secret) {
    console.error("AUTH_SECRET no configurado o inseguro")
    const response = isLoginPath
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth-token")
    return response
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })

    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      throw new Error("Token expirado")
    }

    if (isLoginPath) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch {
    const response = isLoginPath
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth-token")
    return response
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
