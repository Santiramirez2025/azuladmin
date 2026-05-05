import "server-only"
import webpush from "web-push"
import { prisma } from "@/lib/prisma"

let configured = false

function ensureVapidConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) {
    console.error("[push] VAPID keys no configuradas")
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

type SendOptions = { username?: string; role?: string }

/**
 * Envía la misma notificación a todas las suscripciones que matcheen.
 * - Sin filtros: a todas
 * - { username }: solo al usuario
 * - { role: "DELIVERY" }: solo a las del primo
 * - { role: "ADMIN" }: solo a vos (excluye DELIVERY)
 * Limpia automáticamente subscriptions con 404/410 (gone).
 */
export async function sendPushToAll(
  payload: PushPayload,
  options?: SendOptions | string,
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) return { sent: 0, failed: 0 }

  // Compat: si se pasa string, tratar como username
  const opts: SendOptions = typeof options === "string" ? { username: options } : options ?? {}
  const where: { username?: string; role?: string } = {}
  if (opts.username) where.username = opts.username
  if (opts.role) where.role = opts.role

  const subscriptions = await prisma.pushSubscription.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
  })

  let sent = 0
  let failed = 0
  const goneEndpoints: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        )
        sent++
      } catch (err) {
        failed++
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          // Subscription expired/gone — limpiar
          goneEndpoints.push(sub.endpoint)
        } else {
          console.error("[push] send error", { endpoint: sub.endpoint.slice(0, 60), status })
        }
      }
    }),
  )

  if (goneEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: goneEndpoints } } })
  }

  return { sent, failed }
}

/**
 * Envío fire-and-forget: no bloquea la respuesta del request principal.
 * Para usar dentro de endpoints sin await.
 */
export function notifyAsync(payload: PushPayload, options?: SendOptions | string): void {
  sendPushToAll(payload, options).catch((err) => {
    console.error("[push] notifyAsync error:", err)
  })
}
