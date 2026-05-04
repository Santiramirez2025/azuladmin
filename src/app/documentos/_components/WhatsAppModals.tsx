"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Loader2, MessageCircle } from "lucide-react"
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
  const [trackedDocId, setTrackedDocId] = useState<string | null>(null)

  const currentDocId = open && doc ? doc.id : null
  if (currentDocId !== trackedDocId) {
    setTrackedDocId(currentDocId)
    if (doc && open) {
      setMessage(generateClientMessage(doc))
      setPhone(doc.client.phone)
    }
  }

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
      toast.success("WhatsApp abierto")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar a cliente</DialogTitle>
          <DialogDescription>Personalizá el mensaje antes de enviar por WhatsApp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-phone">Teléfono</Label>
            <Input
              id="client-phone"
              placeholder="+54 9 351 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-message">Mensaje</Label>
            <Textarea
              id="client-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="resize-none font-mono text-sm"
              disabled={isSending}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !phone.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {isSending ? "Enviando…" : "Enviar"}
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
  const [trackedDocId, setTrackedDocId] = useState<string | null>(null)

  const currentDocId = open && doc ? doc.id : null
  if (currentDocId !== trackedDocId) {
    setTrackedDocId(currentDocId)
    if (doc && open) {
      setMessage(generateDeliveryMessage(doc))
      setCopied(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
      toast.error("Error al copiar")
    }
  }

  const handleOpenGroup = () => {
    window.open(CONFIG.deliveryGroupLink, "_blank")
    toast.info("Grupo de reparto abierto")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar a reparto</DialogTitle>
          <DialogDescription>Copiá y pegá el mensaje en el grupo del reparto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Mensaje para reparto</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="resize-none font-mono text-sm"
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleOpenGroup} className="w-full gap-1.5 sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            Abrir grupo
          </Button>
          <Button onClick={handleCopy} className="w-full gap-1.5 sm:w-auto">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
