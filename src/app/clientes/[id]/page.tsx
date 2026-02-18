"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  FileText,
  Plus,
  MessageCircle,
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
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils-client"
import type { DocumentStatus, DocumentType } from "@/types"

interface Client {
  id: string
  name: string
  dni?: string
  phone: string
  email?: string
  address?: string
  city: string
  province: string
  notes?: string
  createdAt: string
  documents: {
    id: string
    number: number
    type: DocumentType
    status: DocumentStatus
    total: number
    date: string
  }[]
}

const typeLabels: Record<DocumentType, string> = {
  PRESUPUESTO: "Presupuesto",
  RECIBO: "Recibo",
  REMITO: "Remito",
}

const statusColors: Record<DocumentStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "warning",
  APPROVED: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  EXPIRED: "secondary",
}

export default function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    dni: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  })

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${resolvedParams.id}`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
          setEditForm({
            name: data.name,
            phone: data.phone,
            dni: data.dni || "",
            email: data.email || "",
            address: data.address || "",
            city: data.city,
            notes: data.notes || "",
          })
        }
      } catch (error) {
        console.error("Error fetching client:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClient()
  }, [resolvedParams.id])

  const handleEdit = async () => {
    if (!client) return
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setClient({ ...client, ...updated })
        setIsEditModalOpen(false)
      }
    } catch (error) {
      console.error("Error updating client:", error)
    }
  }

  const handleDelete = async () => {
    if (!client) return
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/clientes")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  const openWhatsApp = () => {
    if (!client) return
    const url = generateWhatsAppLink(client.phone, `Hola ${client.name}!`)
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Cliente no encontrado</p>
        <Link href="/clientes">
          <Button>Volver a Clientes</Button>
        </Link>
      </div>
    )
  }

  const totalCompras = client.documents
    .filter(d => d.status === "COMPLETED")
    .reduce((sum, d) => sum + Number(d.total), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20 md:p-8 md:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500">
              Cliente desde {formatDate(client.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info del cliente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{client.address}, {client.city}</span>
                </div>
              )}
              {client.dni && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-medium">{client.dni}</p>
                </div>
              )}
              {client.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Documentos</p>
                <p className="text-2xl font-bold">{client.documents.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Compras</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCompras)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos</CardTitle>
              <Link href={`/documentos/nuevo?clientId=${client.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Documento
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.documents.length > 0 ? (
                <div className="space-y-3">
                  {client.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documentos/${doc.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {typeLabels[doc.type]} #{String(doc.number).padStart(5, "0")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(doc.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusColors[doc.status]}>
                          {doc.status}
                        </Badge>
                        <span className="font-medium">
                          {formatCurrency(Number(doc.total))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sin documentos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>DNI</Label>
                <Input
                  value={editForm.dni}
                  onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dirección</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Esta acción no se puede deshacer. Se eliminarán todos los datos del cliente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
