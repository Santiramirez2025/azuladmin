import Link from "next/link"
import { FileX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Cargando documento…</p>
      </div>
    </div>
  )
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  not_found: {
    title: "Documento no encontrado",
    description: "El documento que buscás no existe o fue eliminado.",
  },
  server_error: {
    title: "Error del servidor",
    description: "Ocurrió un error al cargar el documento.",
  },
  network_error: {
    title: "Error de conexión",
    description: "No se pudo conectar con el servidor.",
  },
}

export function ErrorState({ error }: { error: string }) {
  const info = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <FileX className="h-6 w-6 text-neutral-500" />
      </div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{info.title}</h2>
      <p className="mb-6 text-sm text-neutral-500">{info.description}</p>
      <Link href="/documentos">
        <Button>Volver a documentos</Button>
      </Link>
    </div>
  )
}
