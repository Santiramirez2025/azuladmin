// app/(dashboard)/configuracion/page.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
  Percent,
  Save,
  Check,
  Database,
  Trash2,
  Settings,
  Sparkles,
  Shield,
  Info,
  AlertTriangle,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { usePaymentRates } from "@/hooks/use-payment-rates"

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

export default function ConfiguracionPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "Azul Colchones",
    address: "Balerdi 855",
    city: "Villa María",
    province: "Córdoba",
    phone: "0353-4XXXXXX",
    whatsapp: "+5493534XXXXXX",
    email: "info@azulcolchones.com",
    cuit: "",
  })

  const { rates: paymentRates, isLoading: loadingRates, saveRates } = usePaymentRates()
  const [localRates, setLocalRates] = useState(paymentRates)

  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedCompany = localStorage.getItem("azul_company_info")
        if (savedCompany) {
          setCompanyInfo(JSON.parse(savedCompany))
        }
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    setLocalRates(paymentRates)
  }, [paymentRates])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Guardar company info en localStorage
      localStorage.setItem("azul_company_info", JSON.stringify(companyInfo))
      
      // Guardar payment rates en la base de datos
      const success = await saveRates(localRates)
      
      if (success) {
        toast.success("Configuración guardada correctamente")
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        toast.error("Error al guardar las tasas de pago")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSeedDatabase = async () => {
    setSeedStatus("loading")
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      if (res.ok) {
        setSeedStatus("success")
        toast.success("Datos de ejemplo cargados correctamente")
        setTimeout(() => setSeedStatus("idle"), 3000)
      } else {
        setSeedStatus("error")
        toast.error("Error al cargar datos de ejemplo")
      }
    } catch (error) {
      console.error("Error seeding database:", error)
      setSeedStatus("error")
      toast.error("Error al cargar datos de ejemplo")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-7xl">
        {/* Premium Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/25">
                  <Settings className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  Configuración
                </h1>
                <p className="mt-1 text-sm text-slate-600 md:text-base">
                  Personaliza tu sistema y datos empresariales
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Datos de la Empresa */}
          <div className="group relative" style={{ animation: 'slideIn 0.4s ease-out' }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-3xl"></div>
              <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/20">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Datos de la Empresa
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Esta información aparecerá en los documentos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5 p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Nombre de la Empresa</Label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                    className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      Dirección
                    </Label>
                    <Input
                      value={companyInfo.address}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, address: e.target.value })
                      }
                      className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      Ciudad
                    </Label>
                    <Input
                      value={companyInfo.city}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, city: e.target.value })
                      }
                      className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      Teléfono Fijo
                    </Label>
                    <Input
                      value={companyInfo.phone}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, phone: e.target.value })
                      }
                      className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp
                    </Label>
                    <Input
                      value={companyInfo.whatsapp}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, whatsapp: e.target.value })
                      }
                      placeholder="+54 9 353 555-1234"
                      className="border-slate-200 bg-white/50 transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, email: e.target.value })
                      }
                      className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Shield className="h-3.5 w-3.5 text-slate-500" />
                      CUIT (opcional)
                    </Label>
                    <Input
                      value={companyInfo.cuit || ""}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, cuit: e.target.value })
                      }
                      placeholder="XX-XXXXXXXX-X"
                      className="border-slate-200 bg-white/50 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasas de Financiación */}
          <div className="group relative" style={{ animation: 'slideIn 0.5s ease-out' }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-emerald-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-600/10 blur-3xl"></div>
              <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-emerald-50/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 shadow-lg shadow-emerald-500/20">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Recargos por Cuotas
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Porcentaje de recargo para cada plan de cuotas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5 p-6">
                {loadingRates ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative h-8 w-8">
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-200"></div>
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { key: "1", label: "Contado (1 pago)" },
                        { key: "3", label: "3 Cuotas" },
                        { key: "6", label: "6 Cuotas" },
                        { key: "9", label: "9 Cuotas" },
                        { key: "12", label: "12 Cuotas" },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">{label}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={localRates[key] || 0}
                              onChange={(e) =>
                                setLocalRates({
                                  ...localRates,
                                  [key]: Number(e.target.value),
                                })
                              }
                              className="border-slate-200 bg-white/50 transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                            />
                            <span className="text-sm font-semibold text-slate-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Preview */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-emerald-50/30 p-5 shadow-inner">
                      <div className="mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-bold text-slate-700">
                          Vista previa (producto de $100.000)
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {Object.entries(localRates).map(([cuotas, rate]) => {
                          const total = 100000 * (1 + rate / 100)
                          const cuota = total / Number(cuotas)
                          return (
                            <div
                              key={cuotas}
                              className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-2.5 backdrop-blur-sm transition-all hover:bg-white/80"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {cuotas === "1" ? "Contado" : `${cuotas} cuotas`}
                                {rate > 0 && (
                                  <span className="ml-1.5 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                                    +{rate}%
                                  </span>
                                )}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {cuotas === "1"
                                  ? `$${total.toLocaleString("es-AR")}`
                                  : `${cuotas} x $${Math.round(cuota).toLocaleString("es-AR")}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Base de Datos */}
          <div className="group relative" style={{ animation: 'slideIn 0.6s ease-out' }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-violet-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 blur-3xl"></div>
              <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-violet-50/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 shadow-lg shadow-violet-500/20">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Base de Datos
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Gestión de datos del sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4 p-6">
                <div className="overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white/60 to-violet-50/30 p-5 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                    <h4 className="font-bold text-slate-900">Cargar Datos de Ejemplo</h4>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">
                    Carga productos PIERO de ejemplo para empezar a usar el sistema.
                    Esto no afecta datos existentes.
                  </p>
                  <Button
                    onClick={handleSeedDatabase}
                    disabled={seedStatus === "loading"}
                    variant={seedStatus === "success" ? "outline" : "default"}
                    className={`relative overflow-hidden font-semibold shadow-lg transition-all ${
                      seedStatus === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40"
                    }`}
                  >
                    {seedStatus === "loading" && (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Cargando...
                      </>
                    )}
                    {seedStatus === "success" && (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        ¡Datos cargados!
                      </>
                    )}
                    {seedStatus === "error" && (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Error - Reintentar
                      </>
                    )}
                    {seedStatus === "idle" && (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Cargar Productos Demo
                      </>
                    )}
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-red-200/60 bg-gradient-to-br from-red-50 to-orange-50/50 p-5 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-bold text-red-800">Zona de Peligro</h4>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-red-700">
                    Estas acciones son irreversibles. Asegurate de tener un backup.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled
                    className="font-semibold opacity-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Base de Datos (Próximamente)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Sistema */}
          <div className="group relative" style={{ animation: 'slideIn 0.7s ease-out' }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 opacity-20 blur transition duration-500 group-hover:opacity-30"></div>
            <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-600/10 blur-3xl"></div>
              <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-2.5 shadow-lg shadow-blue-500/20">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Información del Sistema
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                <div className="space-y-3">
                  {[
                    { label: "Versión", value: "1.0.0", variant: "default" as const },
                    { label: "Framework", value: "Next.js 16", variant: "outline" as const },
                    { label: "Base de Datos", value: "PostgreSQL + Prisma", variant: "outline" as const },
                    { label: "Hospedaje", value: "Vercel", variant: "outline" as const },
                  ].map(({ label, value, variant }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg bg-gradient-to-r from-slate-50/50 to-transparent px-4 py-3 transition-all hover:bg-slate-100/50"
                    >
                      <span className="text-sm font-medium text-slate-600">{label}</span>
                      <Badge
                        variant={variant}
                        className="shadow-sm font-semibold"
                      >
                        {value}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 shadow-inner">
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-bold text-blue-900">
                      Azul Colchones
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-blue-800">
                    Sistema de Gestión Comercial
                    <br />
                    <span className="font-semibold">Desarrollado para {companyInfo.name}</span>
                    <br />
                    {companyInfo.city}, {companyInfo.province}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Floating Save Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            {!saved && (
              <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-30 blur-lg"></div>
            )}
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving || loadingRates}
              className={`relative overflow-hidden px-8 py-6 text-base font-bold shadow-2xl transition-all ${
                saved
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/40"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/40 hover:shadow-blue-500/60"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : saved ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <Check className="relative mr-2 h-5 w-5" />
                  <span className="relative">¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}