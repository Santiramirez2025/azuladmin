"use client"

import { useEffect, useState } from "react"
import { Building2, Check, CreditCard, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { usePaymentRates } from "@/hooks/use-payment-rates"
import { PageHeader, PageShell, Section } from "@/components/ui/page-shell"
import { PushNotificationsCard } from "./_components/PushNotificationsCard"
import { SendNotificationCard } from "./_components/SendNotificationCard"

interface CompanyInfo {
  name: string
  address: string
  city: string
  province: string
  phone: string
  whatsapp: string
  email: string
  cuit?: string
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: "Azul Colchones",
  address: "Balerdi 855",
  city: "Villa María",
  province: "Córdoba",
  phone: "0353-4XXXXXX",
  whatsapp: "+5493534XXXXXX",
  email: "info@azulcolchones.com",
  cuit: "",
}

export default function ConfiguracionPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const { rates: paymentRates, saveRates } = usePaymentRates()
  const [localRates, setLocalRates] = useState(paymentRates)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/settings/company")
        if (res.ok && !cancelled) {
          const data = await res.json()
          setCompanyInfo(data)

          // Migración silenciosa: si hay datos en localStorage y la DB tiene
          // los defaults, migrar y limpiar localStorage.
          try {
            const legacy = localStorage.getItem("azul_company_info")
            if (legacy && data.name === "Azul Colchones" && !data.cuit) {
              const parsed = JSON.parse(legacy)
              await fetch("/api/settings/company", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed),
              })
              setCompanyInfo(parsed)
              localStorage.removeItem("azul_company_info")
            }
          } catch (migrationErr) {
            console.error("Migration error (non-fatal):", migrationErr)
          }
        }
      } catch (error) {
        console.error("Error loading config:", error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setLocalRates(paymentRates)
  }, [paymentRates])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const [companyRes, ratesOk] = await Promise.all([
        fetch("/api/settings/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companyInfo),
        }),
        saveRates(localRates),
      ])
      if (!companyRes.ok) {
        const error = await companyRes.json().catch(() => ({}))
        toast.error(error.error || "Error al guardar info de empresa")
        return
      }
      if (!ratesOk) {
        toast.error("Error al guardar las tasas de pago")
        return
      }
      toast.success("Configuración guardada")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const updateRate = (key: keyof typeof localRates, value: string) => {
    const num = parseFloat(value) || 0
    setLocalRates({ ...localRates, [key]: num })
  }

  return (
    <PageShell size="lg">
      <PageHeader
        title="Configuración"
        description="Datos de tu empresa, notificaciones y tasas de financiación"
        actions={
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {saved ? (
              <Check className="h-4 w-4" />
            ) : isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Guardado" : isSaving ? "Guardando…" : "Guardar"}
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <PushNotificationsCard />
        <SendNotificationCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Empresa */}
        <Section
          title="Datos de la empresa"
          description="Aparecen en los documentos PDF"
          icon={Building2}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Nombre</Label>
              <Input
                id="company-name"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-cuit">CUIT</Label>
                <Input
                  id="company-cuit"
                  value={companyInfo.cuit ?? ""}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, cuit: e.target.value })}
                  placeholder="20-XXXXXXXX-X"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Teléfono</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-whatsapp">WhatsApp</Label>
                <Input
                  id="company-whatsapp"
                  value={companyInfo.whatsapp}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, whatsapp: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-address">Dirección</Label>
              <Input
                id="company-address"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-city">Ciudad</Label>
                <Input
                  id="company-city"
                  value={companyInfo.city}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-province">Provincia</Label>
                <Input
                  id="company-province"
                  value={companyInfo.province}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, province: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Tasas de pago */}
        <Section
          title="Tasas de financiación"
          description="Recargo por cantidad de cuotas"
          icon={CreditCard}
        >
          <div className="space-y-3">
            {[
              { key: "1" as const, label: "Contado", help: "Sin recargo" },
              { key: "3" as const, label: "3 cuotas", help: "Recargo en %" },
              { key: "6" as const, label: "6 cuotas", help: "Recargo en %" },
              { key: "9" as const, label: "9 cuotas", help: "Recargo en %" },
              { key: "12" as const, label: "12 cuotas", help: "Recargo en %" },
            ].map(({ key, label, help }) => (
              <div key={key} className="grid grid-cols-[1fr_120px] items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-neutral-500">{help}</p>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    value={localRates[key] ?? 0}
                    onChange={(e) => updateRate(key, e.target.value)}
                    className="pr-8 text-right tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </PageShell>
  )
}
