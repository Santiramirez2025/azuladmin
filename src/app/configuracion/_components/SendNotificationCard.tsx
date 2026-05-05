"use client"

import { useEffect, useState } from "react"
import { Loader2, Send, Smartphone, Truck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils-client"

type Target = "ADMIN" | "DELIVERY" | "ALL"

interface Stats {
  total: number
  byRole: { ADMIN?: number; DELIVERY?: number; OTHER?: number }
}

export function SendNotificationCard() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [url, setUrl] = useState("")
  const [target, setTarget] = useState<Target>("DELIVERY")
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  const loadStats = async () => {
    try {
      const res = await fetch("/api/push/stats")
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error("stats error:", err)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Completá título y mensaje")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
          target,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al enviar")
        return
      }
      const sent = data.sent ?? 0
      const failed = data.failed ?? 0
      if (sent === 0) {
        toast.warning("No hay dispositivos suscriptos para ese destinatario")
      } else {
        toast.success(
          `Notificación enviada a ${sent} ${sent === 1 ? "dispositivo" : "dispositivos"}` +
            (failed > 0 ? ` (${failed} fallaron)` : ""),
        )
        setTitle("")
        setBody("")
        setUrl("")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  const adminCount = stats?.byRole.ADMIN ?? 0
  const deliveryCount = stats?.byRole.DELIVERY ?? 0
  const targetCount =
    target === "ADMIN" ? adminCount : target === "DELIVERY" ? deliveryCount : (stats?.total ?? 0)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
          <Send className="h-5 w-5 text-neutral-700" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight">Enviar notificación</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            Mandá un aviso al toque a vos o al primo
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Destinatario */}
        <div className="space-y-2">
          <Label>Destinatario</Label>
          <div className="grid grid-cols-3 gap-2">
            <TargetButton
              active={target === "DELIVERY"}
              onClick={() => setTarget("DELIVERY")}
              icon={Truck}
              label="Primo"
              count={deliveryCount}
            />
            <TargetButton
              active={target === "ADMIN"}
              onClick={() => setTarget("ADMIN")}
              icon={Smartphone}
              label="Yo"
              count={adminCount}
            />
            <TargetButton
              active={target === "ALL"}
              onClick={() => setTarget("ALL")}
              icon={Users}
              label="Todos"
              count={stats?.total ?? 0}
            />
          </div>
          {targetCount === 0 && (
            <p className="text-xs text-amber-700">
              ⚠ {target === "DELIVERY"
                ? "El primo todavía no activó las notificaciones."
                : target === "ADMIN"
                ? "No tenés ningún dispositivo activado."
                : "Aún no hay dispositivos suscriptos."}
            </p>
          )}
        </div>

        {/* Título */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-title">
            Título <span className="text-red-600">*</span>
          </Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Cambio de horario"
            maxLength={200}
            disabled={sending}
          />
        </div>

        {/* Mensaje */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-body">
            Mensaje <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ej: Mañana no se reparte por feriado."
            rows={3}
            maxLength={500}
            className="resize-none"
            disabled={sending}
          />
          <p className="text-xs text-neutral-500">{body.length} / 500</p>
        </div>

        {/* URL (opcional) */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-url">URL al tocar (opcional)</Label>
          <Input
            id="notif-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/documentos"
            disabled={sending}
          />
        </div>

        {/* Send */}
        <Button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim() || targetCount === 0}
          size="lg"
          className="w-full gap-2"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending
            ? "Enviando…"
            : `Enviar a ${targetCount} ${targetCount === 1 ? "dispositivo" : "dispositivos"}`}
        </Button>
      </div>
    </div>
  )
}

function TargetButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Send
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span className={cn("text-xs", active ? "text-neutral-300" : "text-neutral-500")}>
        {count} {count === 1 ? "device" : "devices"}
      </span>
    </button>
  )
}
