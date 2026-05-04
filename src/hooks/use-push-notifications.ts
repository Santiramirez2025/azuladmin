"use client"

import { useCallback, useEffect, useState } from "react"

export type PushStatus =
  | "unsupported"
  | "default"
  | "granted-not-subscribed"
  | "subscribed"
  | "denied"

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

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("unsupported")
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) {
      setStatus(Notification.permission === "granted" ? "granted-not-subscribed" : "default")
      return
    }
    const sub = await reg.pushManager.getSubscription()
    if (sub) setStatus("subscribed")
    else if (Notification.permission === "granted") setStatus("granted-not-subscribed")
    else setStatus("default")
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key no configurada")
      return false
    }
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default")
        return false
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"))
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      const res = await fetch("/api/push/subscribe", {
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
        return false
      }
      setStatus("subscribed")
      return true
    } catch (err) {
      console.error("[push] subscribe error:", err)
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null)
        await sub.unsubscribe()
      }
      setStatus(Notification.permission === "granted" ? "granted-not-subscribed" : "default")
      return true
    } catch (err) {
      console.error("[push] unsubscribe error:", err)
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const sendTest = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      return res.ok
    } finally {
      setBusy(false)
    }
  }, [])

  return { status, busy, subscribe, unsubscribe, sendTest, refresh }
}
