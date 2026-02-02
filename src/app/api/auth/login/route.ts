import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validar credenciales
    const validUsername = process.env.AUTH_USERNAME
    const validPassword = process.env.AUTH_PASSWORD

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: "Configuración de autenticación incompleta" },
        { status: 500 }
      )
    }

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      )
    }

    // Crear token JWT
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "default-secret-change-this"
    )

    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret)

    // Crear respuesta con cookie
    const response = NextResponse.json(
      { success: true, message: "Inicio de sesión exitoso" },
      { status: 200 }
    )

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    )
  }
}