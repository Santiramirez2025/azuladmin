import "server-only"
import { NextResponse } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"
import { ZodError, type ZodTypeAny, type z } from "zod"
import { getAuthSecret } from "@/lib/auth"

export type AuthUser = { sub: string; role: string }

export async function requireAdmin(request: Request): Promise<AuthUser | NextResponse> {
  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)auth-token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return errorResponse(401, "No autenticado")

  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), { algorithms: ["HS256"] })
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      return errorResponse(401, "Token expirado")
    }
    const user = payloadToUser(payload)
    if (user.role !== "ADMIN") return errorResponse(403, "Acceso denegado")
    return user
  } catch {
    return errorResponse(401, "Token inválido")
  }
}

/**
 * Verifica que el request tenga la cookie delivery-token con el valor correcto.
 * Esta cookie se setea cuando el primo abre la URL secreta /reparto/acceso/<token>.
 */
export function requireDelivery(request: Request): NextResponse | null {
  const expected = process.env.DELIVERY_ACCESS_TOKEN
  if (!expected || expected.length < 16) {
    return errorResponse(500, "DELIVERY_ACCESS_TOKEN no configurado")
  }
  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)delivery-token=([^;]+)/)
  const provided = match ? decodeURIComponent(match[1]) : null
  if (!provided) return errorResponse(401, "Acceso no autorizado")
  // Comparison constant-time
  const a = Buffer.from(provided, "utf8")
  const b = Buffer.from(expected, "utf8")
  if (a.length !== b.length) return errorResponse(401, "Token inválido")
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  if (diff !== 0) return errorResponse(401, "Token inválido")
  return null
}

function payloadToUser(payload: JWTPayload): AuthUser {
  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    role: typeof payload.role === "string" ? payload.role : "",
  }
}

export function isAuthError(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}

export function errorResponse(status: number, message: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status })
}

export function assertJson(request: Request): NextResponse | null {
  const ct = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (!ct.includes("application/json")) {
    return errorResponse(415, "Content-Type debe ser application/json")
  }
  return null
}

export async function parseJson<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.output<S> } | { ok: false; response: NextResponse }> {
  const ctError = assertJson(request)
  if (ctError) return { ok: false, response: ctError }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ok: false, response: errorResponse(400, "JSON inválido") }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, response: zodErrorResponse(parsed.error) }
  }
  return { ok: true, data: parsed.data }
}

export function parseQuery<S extends ZodTypeAny>(
  url: URL,
  schema: S,
): { ok: true; data: z.output<S> } | { ok: false; response: NextResponse } {
  const obj: Record<string, string> = {}
  for (const [k, v] of url.searchParams.entries()) obj[k] = v
  const parsed = schema.safeParse(obj)
  if (!parsed.success) return { ok: false, response: zodErrorResponse(parsed.error) }
  return { ok: true, data: parsed.data }
}

export function zodErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: "Datos inválidos", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
    { status: 400 },
  )
}

export function handleUnknownError(scope: string, error: unknown): NextResponse {
  console.error(`[${scope}]`, error)
  return errorResponse(500, "Error interno del servidor")
}

const CUID_RE = /^c[a-z0-9]{24}$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidId(id: string): boolean {
  return CUID_RE.test(id) || UUID_RE.test(id)
}
