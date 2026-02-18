"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  MessageCircle,
  Users,
  Sparkles,
  TrendingUp,
  Edit,
  Eye,
  Loader2,
  UserCircle2,
  Building2,
  Hash,
  StickyNote,
  X,
  CheckCircle,
  MoreHorizontal,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, generateWhatsAppLink, cn } from "@/lib/utils-client"
import type { Client } from "@/types"

interface ClientWithStats extends Client {
  _count: { documents: number }
}

// ============================================================================
// Skeleton Components
// ============================================================================

const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    ))}
  </div>
)

const StatsCardSkeleton = () => (
  <Card className="group relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm">
    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/10 blur-2xl"></div>
    <CardContent className="relative p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </CardContent>
  </Card>
)

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-blue-200/50 to-indigo-300/50 blur-2xl"></div>
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-200/50 p-8 shadow-lg shadow-slate-900/5">
          <Users className="h-16 w-16 text-blue-500" />
        </div>
      </div>
      <h3 className="mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold text-transparent">
        No hay clientes aún
      </h3>
      <p className="mb-8 max-w-sm text-sm text-slate-600">
        Comenzá creando tu primer cliente para gestionar tu base de datos de forma profesional.
      </p>
      <Button 
        size="lg" 
        onClick={onCreateNew}
        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
      >
        <Plus className="h-5 w-5" />
        Crear primer cliente
      </Button>
    </div>
  )
}

// ============================================================================
// Stats Cards
// ============================================================================

function StatsCards({ 
  totalClients, 
  activeClients, 
  totalDocuments,
  isLoading 
}: { 
  totalClients: number
  activeClients: number
  totalDocuments: number
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    )
  }

  const stats = [
    {
      label: "Total Clientes",
      value: totalClients,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "from-blue-500/10 to-indigo-600/10",
      change: "+12%",
      changePositive: true,
    },
    {
      label: "Clientes Activos",
      value: activeClients,
      icon: UserCircle2,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "from-emerald-500/10 to-green-600/10",
      change: "Este mes",
      changePositive: null,
    },
    {
      label: "Documentos Totales",
      value: totalDocuments,
      icon: FileText,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "from-violet-500/10 to-purple-600/10",
      change: "+18%",
      changePositive: true,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="group relative"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={cn(
            "absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-40",
            stat.gradient
          )}></div>
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={cn(
              "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-2xl",
              stat.iconBg
            )}></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {stat.label}
                  </p>
                  <p className={cn(
                    "bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent",
                    stat.gradient
                  )}>
                    {stat.value}
                  </p>
                  {stat.change && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      stat.changePositive === true && "text-emerald-600",
                      stat.changePositive === false && "text-red-600",
                      stat.changePositive === null && "text-slate-600"
                    )}>
                      {stat.changePositive === true && <TrendingUp className="h-3.5 w-3.5" />}
                      <span>{stat.change}</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "rounded-2xl bg-gradient-to-br p-4 shadow-lg transition-transform group-hover:scale-110",
                  stat.gradient
                )}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Client Actions Menu
// ============================================================================

function ClientActionsMenu({
  client,
  onEdit,
  onWhatsApp,
}: {
  client: ClientWithStats
  onEdit: () => void
  onWhatsApp: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 rounded-xl p-0 transition-all hover:bg-slate-100 hover:shadow-md"
        >
          <span className="sr-only">Abrir menú de acciones</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />

        <Link href={`/clientes/${client.id}`}>
          <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Ver detalle</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2 rounded-lg">
          <Edit className="h-4 w-4 text-slate-600" />
          <span className="font-medium">Editar cliente</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100" />

        <DropdownMenuItem onClick={onWhatsApp} className="cursor-pointer gap-2 rounded-lg">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span className="font-medium">Enviar WhatsApp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dni: "",
    email: "",
    address: "",
    city: "Villa María",
    province: "Córdoba",
    notes: "",
  })

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = search
        ? `/api/clients?search=${encodeURIComponent(search)}`
        : "/api/clients"
      const res = await fetch(url)
      const data = await res.json()
      setClients(data.items || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchClients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients"
      const method = editingClient ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setEditingClient(null)
        setFormData({
          name: "",
          phone: "",
          dni: "",
          email: "",
          address: "",
          city: "Villa María",
          province: "Córdoba",
          notes: "",
        })
        fetchClients()
      }
    } catch (error) {
      console.error("Error saving client:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone,
      dni: client.dni || "",
      email: client.email || "",
      address: client.address || "",
      city: client.city,
      province: client.province,
      notes: client.notes || "",
    })
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setEditingClient(null)
    setFormData({
      name: "",
      phone: "",
      dni: "",
      email: "",
      address: "",
      city: "Villa María",
      province: "Córdoba",
      notes: "",
    })
    setIsModalOpen(true)
  }

  const handleWhatsApp = (client: ClientWithStats) => {
    const url = generateWhatsAppLink(
      client.phone,
      `Hola ${client.name}!`
    )
    window.open(url, "_blank")
  }

  // Calculate stats
  const totalClients = clients.length
  const activeClients = clients.filter(c => c._count.documents > 0).length
  const totalDocuments = clients.reduce((sum, c) => sum + c._count.documents, 0)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg shadow-blue-500/30">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-4xl font-bold text-transparent">
                  Clientes
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Gestiona tu base de clientes de forma profesional
              </p>
            </div>
            <Button 
              onClick={openNewModal} 
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <StatsCards
              totalClients={totalClients}
              activeClients={activeClients}
              totalDocuments={totalDocuments}
              isLoading={isLoading}
            />
          </div>

          {/* Search */}
          <Card className="mb-6 border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, teléfono o DNI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-slate-200 bg-white/50 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50 py-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Lista de Clientes
                  </span>
                </CardTitle>
                <Badge variant="secondary" className="border border-slate-200 bg-slate-50 font-medium">
                  {clients.length} cliente{clients.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <TableSkeleton />
                </div>
              ) : clients.length === 0 ? (
                search ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-slate-200/50 blur-xl"></div>
                      <Search className="relative h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                      No se encontraron clientes
                    </h3>
                    <p className="text-sm text-slate-500">
                      Probá con otros términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <EmptyState onCreateNew={openNewModal} />
                )
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                        <TableHead className="font-semibold text-slate-700">Contacto</TableHead>
                        <TableHead className="font-semibold text-slate-700">Ubicación</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700">
                          Documentos
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client, index) => (
                        <TableRow
                          key={client.id}
                          className="group cursor-pointer border-slate-100 transition-all hover:bg-blue-50/30"
                          onClick={() => window.location.href = `/clientes/${client.id}`}
                          style={{
                            animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                                <UserCircle2 className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {client.name}
                                </p>
                                {client.dni && (
                                  <p className="flex items-center gap-1 text-xs text-slate-500">
                                    <Hash className="h-3 w-3" />
                                    DNI: {client.dni}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="rounded-md bg-green-100 p-1">
                                  <Phone className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="font-medium text-slate-700">
                                  {client.phone}
                                </span>
                              </div>
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <div className="rounded-md bg-blue-100 p-1">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span>{client.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="rounded-md bg-orange-100 p-1">
                                <MapPin className="h-3 w-3 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {client.city}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {client.province}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={client._count.documents > 0 ? "default" : "secondary"}
                              className={cn(
                                "gap-1.5 shadow-sm",
                                client._count.documents > 0 
                                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90"
                                  : ""
                              )}
                            >
                              <FileText className="h-3 w-3" />
                              {client._count.documents}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleWhatsApp(client)
                                    }}
                                    className="h-9 w-9 rounded-xl p-0 hover:bg-green-100"
                                  >
                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="border-slate-200 bg-white/95 backdrop-blur-xl">
                                  Enviar WhatsApp
                                </TooltipContent>
                              </Tooltip>
                              
                              <ClientActionsMenu
                                client={client}
                                onEdit={() => openEditModal(client)}
                                onWhatsApp={() => handleWhatsApp(client)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
                  {editingClient ? (
                    <Edit className="h-5 w-5 text-white" />
                  ) : (
                    <Plus className="h-5 w-5 text-white" />
                  )}
                </div>
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {editingClient 
                  ? "Actualiza la información del cliente."
                  : "Completa los datos para crear un nuevo cliente."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserCircle2 className="h-4 w-4" />
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Juan Pérez"
                    required
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Phone className="h-4 w-4" />
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+54 9 353 555-1234"
                    required
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* DNI */}
                <div>
                  <Label htmlFor="dni" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Hash className="h-4 w-4" />
                    DNI
                  </Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) =>
                      setFormData({ ...formData, dni: e.target.value })
                    }
                    placeholder="12345678"
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="cliente@ejemplo.com"
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <Label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4" />
                    Ciudad
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Villa María"
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Building2 className="h-4 w-4" />
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Ej: Av. San Martín 123"
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Notas */}
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <StickyNote className="h-4 w-4" />
                    Notas
                  </Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notas internas sobre el cliente..."
                    disabled={isSubmitting}
                    className="mt-2 border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {editingClient ? "Guardar Cambios" : "Crear Cliente"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </TooltipProvider>
  )
}