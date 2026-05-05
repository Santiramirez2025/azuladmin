import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function AccesoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const expected = process.env.DELIVERY_ACCESS_TOKEN

  if (!expected || expected.length < 16) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Configuración incompleta</h1>
          <p className="mt-2 text-sm text-neutral-500">
            La app de reparto no está configurada. Pedile a Santiago que la habilite.
          </p>
        </div>
      </div>
    )
  }

  if (!constantTimeEqual(token, expected)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Enlace inválido</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Este enlace no es válido o expiró. Pedile a Santiago el enlace nuevo.
          </p>
        </div>
      </div>
    )
  }

  // Token válido — setear cookie de larga duración
  const jar = await cookies()
  jar.set("delivery-token", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 año
    path: "/",
  })

  redirect("/reparto")
}
