"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState, PageHeader, PageShell, Skel } from "@/components/ui/page-shell"
import { generateWhatsAppLink } from "@/lib/utils-client"
import type { Client } from "@/types"

interface ClientWithStats extends Client {
  _count: { documents: number }
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skel className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skel className="h-4 w-40" />
            <Skel className="h-3 w-28" />
          </div>
          <Skel className="h-5 w-24" />
          <Skel className="h-9 w-9 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("")
}

export default function ClientesPage() {
  const router = useRouter()
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
      const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : "/api/clients"
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
    const timer = setTimeout(() => fetchClients(), 300)
    return () => clearTimeout(timer)
  }, [fetchClients])

  const resetForm = () =>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients"
      const method = editingClient ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setIsModalOpen(false)
        setEditingClient(null)
        resetForm()
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
    resetForm()
    setIsModalOpen(true)
  }

  const handleWhatsApp = (client: ClientWithStats) => {
    const url = generateWhatsAppLink(client.phone, `Hola ${client.name}!`)
    window.open(url, "_blank")
  }

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c._count.documents > 0).length
  const totalDocuments = clients.reduce((sum, c) => sum + c._count.documents, 0)

  return (
    <PageShell size="lg">
      <PageHeader
        title="Clientes"
        description="Gestioná tu base de clientes"
        actions={
          <Button onClick={openNewModal} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatPill label="Total" value={totalClients} />
        <StatPill label="Activos" value={activeClients} />
        <StatPill label="Documentos" value={totalDocuments} />
      </section>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar por nombre, teléfono o DNI…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {isLoading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          search ? (
            <EmptyState
              icon={Search}
              title="No se encontraron clientes"
              description="Probá con otros términos de búsqueda."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No hay clientes"
              description="Empezá agregando tu primer cliente."
              action={
                <Button onClick={openNewModal} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Nuevo cliente
                </Button>
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-neutral-50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Contacto
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Ubicación
                  </TableHead>
                  <TableHead className="w-28 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Docs
                  </TableHead>
                  <TableHead className="w-16 pr-5 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Accs.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer border-neutral-100 hover:bg-neutral-50"
                    onClick={() => router.push(`/clientes/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                          {initials(client.name)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{client.name}</p>
                          {client.dni && (
                            <p className="text-xs text-neutral-500">DNI: {client.dni}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm text-neutral-900">{client.phone}</p>
                        {client.email && (
                          <p className="text-xs text-neutral-500">{client.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-900">{client.city}</p>
                      <p className="text-xs text-neutral-500">{client.province}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={client._count.documents > 0 ? "default" : "secondary"}>
                        {client._count.documents}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => router.push(`/clientes/${client.id}`)}
                            className="cursor-pointer gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(client)} className="cursor-pointer gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleWhatsApp(client)} className="cursor-pointer gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Actualizá la información del cliente."
                : "Completá los datos para crear un cliente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="name">
                  Nombre <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Teléfono <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 9 353 555-1234"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="12345678"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. San Martín 123"
                  disabled={isSubmitting}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas internas…"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {editingClient ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
