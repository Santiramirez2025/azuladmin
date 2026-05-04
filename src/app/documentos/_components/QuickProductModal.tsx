"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { QuickProduct } from "./types"

interface QuickProductModalProps {
  open: boolean
  onClose: () => void
  onAdd: (product: QuickProduct) => void
}

export function QuickProductModal({ open, onClose, onAdd }: QuickProductModalProps) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setName("")
      setSize("")
      setPrice("")
      setQuantity("1")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price || !size.trim()) {
      toast.error("Completá todos los campos requeridos")
      return
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresá un precio válido")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/products/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, size, price: priceNum }),
      })
      if (res.ok) {
        onAdd({ name: `${name} - ${size}`, price: priceNum, quantity: parseInt(quantity, 10) })
        toast.success("Producto creado")
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.error || error.message || "Error al crear producto")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Producto rápido</DialogTitle>
          <DialogDescription>Creá un producto nuevo y agregalo al documento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">
              Nombre <span className="text-red-600">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="Ej: Colchón Piero Paraíso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-size">
              Medida <span className="text-red-600">*</span>
            </Label>
            <Input
              id="product-size"
              placeholder="Ej: 140x190"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-price">
                Precio <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-quantity">Cantidad</Label>
              <Input
                id="product-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || !price || !size.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
