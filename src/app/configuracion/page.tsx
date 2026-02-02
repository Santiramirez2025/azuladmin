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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface PaymentRates {
  [key: string]: number
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

  const [paymentRates, setPaymentRates] = useState<PaymentRates>({
    "1": 0,
    "3": 18,
    "6": 25,
    "9": 35,
    "12": 47,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  useEffect(() => {
    // Cargar configuración guardada
    const loadConfig = async () => {
      try {
        // En producción, esto vendría de la API
        const savedCompany = localStorage.getItem("azul_company_info")
        const savedRates = localStorage.getItem("azul_payment_rates")
        
        if (savedCompany) {
          setCompanyInfo(JSON.parse(savedCompany))
        }
        if (savedRates) {
          setPaymentRates(JSON.parse(savedRates))
        }
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Guardar en localStorage (en producción, esto iría a la API)
      localStorage.setItem("azul_company_info", JSON.stringify(companyInfo))
      localStorage.setItem("azul_payment_rates", JSON.stringify(paymentRates))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving config:", error)
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
        setTimeout(() => setSeedStatus("idle"), 3000)
      } else {
        setSeedStatus("error")
      }
    } catch (error) {
      console.error("Error seeding database:", error)
      setSeedStatus("error")
    }
  }

  return (
    <div className="p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500">
          Configurá los datos de tu empresa y opciones del sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos de la Empresa
            </CardTitle>
            <CardDescription>
              Esta información aparecerá en los documentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre de la Empresa</Label>
              <Input
                value={companyInfo.name}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Dirección</Label>
                <Input
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={companyInfo.city}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, city: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Teléfono Fijo
                </Label>
                <Input
                  value={companyInfo.phone}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  value={companyInfo.whatsapp}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, whatsapp: e.target.value })
                  }
                  placeholder="+54 9 353 555-1234"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CUIT (opcional)</Label>
                <Input
                  value={companyInfo.cuit || ""}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, cuit: e.target.value })
                  }
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasas de Financiación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Recargos por Cuotas
            </CardTitle>
            <CardDescription>
              Porcentaje de recargo para cada plan de cuotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Contado (1 pago)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={paymentRates["1"]}
                    onChange={(e) =>
                      setPaymentRates({
                        ...paymentRates,
                        "1": Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>3 Cuotas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={paymentRates["3"]}
                    onChange={(e) =>
                      setPaymentRates({
                        ...paymentRates,
                        "3": Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>6 Cuotas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={paymentRates["6"]}
                    onChange={(e) =>
                      setPaymentRates({
                        ...paymentRates,
                        "6": Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>9 Cuotas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={paymentRates["9"]}
                    onChange={(e) =>
                      setPaymentRates({
                        ...paymentRates,
                        "9": Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>12 Cuotas</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={paymentRates["12"]}
                    onChange={(e) =>
                      setPaymentRates({
                        ...paymentRates,
                        "12": Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Preview de cuotas */}
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Vista previa (producto de $100.000):
              </p>
              <div className="space-y-1 text-sm">
                {Object.entries(paymentRates).map(([cuotas, rate]) => {
                  const total = 100000 * (1 + rate / 100)
                  const cuota = total / Number(cuotas)
                  return (
                    <div key={cuotas} className="flex justify-between">
                      <span className="text-gray-600">
                        {cuotas === "1" ? "Contado" : `${cuotas} cuotas`}
                        {rate > 0 && (
                          <span className="text-orange-600"> (+{rate}%)</span>
                        )}
                      </span>
                      <span className="font-medium">
                        {cuotas === "1"
                          ? `$${total.toLocaleString("es-AR")}`
                          : `${cuotas} x $${Math.round(cuota).toLocaleString("es-AR")}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
            <CardDescription>
              Gestión de datos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Cargar Datos de Ejemplo</h4>
              <p className="mb-4 text-sm text-gray-500">
                Carga productos PIERO de ejemplo para empezar a usar el sistema.
                Esto no afecta datos existentes.
              </p>
              <Button
                onClick={handleSeedDatabase}
                disabled={seedStatus === "loading"}
                variant={seedStatus === "success" ? "outline" : "default"}
              >
                {seedStatus === "loading" && "Cargando..."}
                {seedStatus === "success" && (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    ¡Datos cargados!
                  </>
                )}
                {seedStatus === "error" && "Error - Reintentar"}
                {seedStatus === "idle" && (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Cargar Productos Demo
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="mb-2 font-medium text-red-800">Zona de Peligro</h4>
              <p className="mb-4 text-sm text-red-600">
                Estas acciones son irreversibles. Asegurate de tener un backup.
              </p>
              <Button variant="destructive" size="sm" disabled>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar Base de Datos (Próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Versión</span>
                <Badge>1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Framework</span>
                <Badge variant="outline">Next.js 16</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Base de Datos</span>
                <Badge variant="outline">PostgreSQL + Prisma</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Hospedaje</span>
                <Badge variant="outline">Vercel</Badge>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Azul Colchones</strong> - Sistema de Gestión Comercial
                <br />
                Desarrollado para {companyInfo.name}
                <br />
                {companyInfo.city}, {companyInfo.province}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón Guardar Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="shadow-lg"
        >
          {isSaving ? (
            "Guardando..."
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
