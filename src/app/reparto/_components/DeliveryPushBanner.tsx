"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64Url)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

type Status = "loading" | "unsupported" | "default" | "subscribed" | "denied" | "dismissed"

export function DeliveryPushBanner() {
  const [status, setStatus] = useState<Status>("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported")
      return
    }
    if (localStorage.getItem("delivery-push-dismissed") === "true") {
      setStatus("dismissed")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    ;(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) setStatus("subscribed")
      else setStatus("default")
    })()
  }, [])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default")
        return
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"))
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      const res = await fetch("/api/delivery/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          userAgent: navigator.userAgent,
        }),
      })
      if (!res.ok) {
        await sub.unsubscribe().catch(() => null)
        toast.error("No se pudo activar")
        return
      }
      setStatus("subscribed")
      toast.success("Notificaciones activadas")
    } catch (err) {
      console.error("[push] subscribe error:", err)
      toast.error("Error al activar")
    } finally {
      setBusy(false)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem("delivery-push-dismissed", "true")
    setStatus("dismissed")
  }

  if (status === "loading" || status === "subscribed" || status === "dismissed" || status === "unsupported") {
    return null
  }

  if (status === "denied") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <BellOff className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-900">Notificaciones bloqueadas</p>
            <p className="text-amber-700">
              Activalas desde los ajustes del navegador para recibir avisos de nuevas entregas.
            </p>
          </div>
          <button onClick={dismiss} className="rounded-md p-1 text-amber-700 hover:bg-amber-100" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-4 text-white">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Activá las notificaciones</p>
          <p className="mt-0.5 text-neutral-300">
            Recibí un aviso al toque cada vez que haya una nueva entrega.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={subscribe}
              disabled={busy}
              className="bg-white text-neutral-900 hover:bg-neutral-100"
            >
              {busy ? "Activando…" : "Activar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
