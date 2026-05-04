"use client"

import { useEffect, useState } from "react"
import { Check, Copy, ExternalLink, Loader2, MessageCircle, Truck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils-client"
import { CONFIG, type DocumentListItem } from "./types"
import { generateClientMessage, generateDeliveryMessage, generateWhatsAppLink } from "./whatsapp"

interface ClientModalProps {
  open: boolean
  onClose: () => void
  document: DocumentListItem | null
}

export function WhatsAppClientModal({ open, onClose, document: doc }: ClientModalProps) {
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (doc && open) {
      setMessage(generateClientMessage(doc))
      setPhone(doc.client.phone)
    }
  }, [doc, open])

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Ingresá un número de teléfono")
      return
    }
    setIsSending(true)
    try {
      if (doc && doc.status === "DRAFT") {
        await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        })
      }
      const url = generateWhatsAppLink(phone, message)
      window.open(url, "_blank")
      toast.success("WhatsApp abierto correctamente")
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Error al abrir WhatsApp")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 shadow-lg shadow-green-500/30">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enviar a Cliente
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Personalizá el mensaje antes de enviar por WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client-phone" className="text-sm font-semibold text-slate-700">
              Teléfono del cliente
            </Label>
            <Input
              id="client-phone"
              placeholder="+54 9 351 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSending}
              className="border-slate-200 bg-white/50 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-message" className="text-sm font-semibold text-slate-700">
              Mensaje
            </Label>
            <Textarea
              id="client-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="resize-none border-slate-200 bg-white/50 font-mono text-sm focus:border-green-500 focus:ring-green-500/20"
              disabled={isSending}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending} className="border-slate-200 hover:bg-slate-50">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40"
            disabled={isSending || !phone.trim()}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {isSending ? "Enviando..." : "Enviar por WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeliveryModalProps {
  open: boolean
  onClose: () => void
  document: DocumentListItem | null
}

export function WhatsAppDeliveryModal({ open, onClose, document: doc }: DeliveryModalProps) {
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (doc && open) {
      setMessage(generateDeliveryMessage(doc))
      setCopied(false)
    }
  }, [doc, open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Mensaje copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
      toast.error("Error al copiar mensaje")
    }
  }

  const handleOpenGroup = () => {
    window.open(CONFIG.deliveryGroupLink, "_blank")
    toast.info("Grupo de reparto abierto")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-2.5 shadow-lg shadow-orange-500/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enviar a Reparto
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Copiá el mensaje y pegalo en el grupo de WhatsApp del reparto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Mensaje para el reparto</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="resize-none border-slate-200 bg-orange-50/30 font-mono text-sm focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full border-slate-200 hover:bg-slate-50 sm:w-auto">
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleOpenGroup} className="w-full gap-2 border-slate-200 hover:bg-slate-50 sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            Abrir Grupo
          </Button>
          <Button
            onClick={handleCopy}
            className={cn(
              "w-full gap-2 font-semibold shadow-lg transition-all sm:w-auto",
              copied
                ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40"
                : "bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40",
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Mensaje
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
