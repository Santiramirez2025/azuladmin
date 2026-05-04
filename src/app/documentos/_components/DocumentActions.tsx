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
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-xl p-0 transition-all hover:bg-slate-100 hover:shadow-md"
        >
          <span className="sr-only">Abrir menú de acciones</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          #{String(doc.number).padStart(5, "0")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />

        <Link href={`/documentos/${doc.id}`}>
          <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
            <Eye className="h-4 w-4 text-slate-600" />
            <span className="font-medium">Ver detalle</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Enviar
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={onSendClient} className="cursor-pointer gap-2 rounded-lg">
          <User className="h-4 w-4 text-green-600" />
          <span className="font-medium">Enviar a cliente</span>
        </DropdownMenuItem>

        {(doc.type === "REMITO" || doc.type === "RECIBO") && (
          <DropdownMenuItem onClick={onSendDelivery} className="cursor-pointer gap-2 rounded-lg">
            <Truck className="h-4 w-4 text-orange-600" />
            <span className="font-medium">
              {doc.type === "RECIBO" ? "Enviar a reparto" : "Copiar para reparto"}
            </span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Documentos
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading} className="cursor-pointer gap-2 rounded-lg">
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <Download className="h-4 w-4 text-blue-600" />
          )}
          <span className="font-medium">Descargar PDF</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onPrint} className="cursor-pointer gap-2 rounded-lg">
          <Printer className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Imprimir</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100" />

        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer gap-2 rounded-lg">
          <Copy className="h-4 w-4 text-slate-600" />
          <span className="font-medium">Duplicar</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer gap-2 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          <span className="font-medium">Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
