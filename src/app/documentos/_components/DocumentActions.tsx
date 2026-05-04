"use client"

import Link from "next/link"
import {
  Copy,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Printer,
  Trash2,
  Truck,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentListItem } from "./types"

interface DocumentActionsProps {
  document: DocumentListItem
  onSendClient: () => void
  onSendDelivery: () => void
  onDownloadPDF: () => void
  onPrint: () => void
  onDuplicate: () => void
  onDelete: () => void
  isDownloading: boolean
}

export function DocumentActions({
  document: doc,
  onSendClient,
  onSendDelivery,
  onDownloadPDF,
  onPrint,
  onDuplicate,
  onDelete,
  isDownloading,
}: DocumentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Acciones">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-neutral-500">
          #{String(doc.number).padStart(5, "0")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <Link href={`/documentos/${doc.id}`}>
          <DropdownMenuItem className="cursor-pointer gap-2">
            <Eye className="h-4 w-4" />
            <span>Ver detalle</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSendClient} className="cursor-pointer gap-2">
          <User className="h-4 w-4" />
          <span>Enviar a cliente</span>
        </DropdownMenuItem>

        {(doc.type === "REMITO" || doc.type === "RECIBO") && (
          <DropdownMenuItem onClick={onSendDelivery} className="cursor-pointer gap-2">
            <Truck className="h-4 w-4" />
            <span>{doc.type === "RECIBO" ? "Enviar a reparto" : "Copiar para reparto"}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading} className="cursor-pointer gap-2">
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span>Descargar PDF</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onPrint} className="cursor-pointer gap-2">
          <Printer className="h-4 w-4" />
          <span>Imprimir</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer gap-2">
          <Copy className="h-4 w-4" />
          <span>Duplicar</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
