"use client"

import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function PushNotificationsCard() {
  const { status, busy, subscribe, unsubscribe, sendTest } = usePushNotifications()

  const handleEnable = async () => {
    const ok = await subscribe()
    if (ok) toast.success("Notificaciones activadas")
    else if (status === "denied") toast.error("Permiso denegado. Habilitalas desde los ajustes del navegador.")
    else toast.error("No se pudieron activar")
  }

  const handleDisable = async () => {
    const ok = await unsubscribe()
    if (ok) toast.success("Notificaciones desactivadas")
    else toast.error("No se pudieron desactivar")
  }

  const handleTest = async () => {
    const ok = await sendTest()
    if (ok) toast.success("Notificación de prueba enviada")
    else toast.error("Error al enviar la prueba")
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Bell className="h-5 w-5 text-neutral-700" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Notificaciones push</h3>
            <p className="mt-0.5 text-sm text-neutral-500">
              Recibí avisos al crear documentos, en este dispositivo
            </p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {status === "unsupported" && (
        <p className="text-sm text-neutral-500">
          Este navegador no soporta notificaciones push. En iPhone, instalá la app desde Compartir → Agregar a pantalla de inicio.
        </p>
      )}

      {status === "denied" && (
        <p className="text-sm text-amber-700">
          El navegador bloqueó las notificaciones. Habilitalas manualmente desde los ajustes del sitio.
        </p>
      )}

      {(status === "default" || status === "granted-not-subscribed") && (
        <Button onClick={handleEnable} disabled={busy} className="w-full gap-2 sm:w-auto">
          <Bell className="h-4 w-4" />
          {busy ? "Activando…" : "Activar notificaciones"}
        </Button>
      )}

      {status === "subscribed" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleTest} disabled={busy} variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Enviar prueba
          </Button>
          <Button onClick={handleDisable} disabled={busy} variant="ghost" className="gap-2 text-neutral-600">
            <BellOff className="h-4 w-4" />
            Desactivar
          </Button>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: ReturnType<typeof usePushNotifications>["status"] }) {
  const config = {
    unsupported: { text: "No soportado", cls: "bg-neutral-100 text-neutral-600" },
    default: { text: "Inactivo", cls: "bg-neutral-100 text-neutral-600" },
    "granted-not-subscribed": { text: "Pendiente", cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
    subscribed: { text: "Activo", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
    denied: { text: "Bloqueado", cls: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" },
  }
  const c = config[status]
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>{c.text}</span>
}
