"use client"

import { useEffect, useState } from "react"
import { Loader2, Package } from "lucide-react"
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
        toast.success("Producto creado y listo para agregar")
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.error || error.message || "Error al crear producto")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión al crear producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Producto Rápido
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Creá un producto nuevo y agregalo al documento en un solo paso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-sm font-semibold text-slate-700">
              Nombre del producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="Ej: Colchón Piero Paraíso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-size" className="text-sm font-semibold text-slate-700">
              Medida <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-size"
              placeholder="Ej: 140x190"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={isSubmitting}
              className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price" className="text-sm font-semibold text-slate-700">
                Precio unitario <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border-slate-200 bg-white/50 pl-7 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-quantity" className="text-sm font-semibold text-slate-700">
                Cantidad
              </Label>
              <Input
                id="product-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isSubmitting}
                className="border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}
              className="border-slate-200 hover:bg-slate-50">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !price || !size.trim() || isSubmitting}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creando..." : "Crear y agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
