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

/**
 * Envía la misma notificación a todas las suscripciones (o las del usuario indicado).
 * Limpia automáticamente subscriptions con 404/410 (gone).
 */
export async function sendPushToAll(payload: PushPayload, username?: string): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) return { sent: 0, failed: 0 }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: username ? { username } : undefined,
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
export function notifyAsync(payload: PushPayload, username?: string): void {
  sendPushToAll(payload, username).catch((err) => {
    console.error("[push] notifyAsync error:", err)
  })
}
