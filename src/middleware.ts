import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  // Si no hay token y no está en /login, redirigir a login
  if (!token && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si hay token, verificarlo
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.AUTH_SECRET || "default-secret-change-this"
      )
      await jwtVerify(token, secret)
      
      // Si está en /login y tiene token válido, redirigir al inicio
      if (request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/", request.url))
      }
    } catch (error) {
      // Token inválido, eliminar cookie y redirigir a login
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth-token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - api/auth (rutas de autenticación)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}