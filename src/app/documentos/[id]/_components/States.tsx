import Link from "next/link"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-12 w-12 md:h-16 md:w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <p className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-base font-semibold text-transparent md:text-lg">
          Cargando documento...
        </p>
      </div>
    </div>
  )
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  not_found: {
    title: "Documento no encontrado",
    description: "El documento que buscas no existe o fue eliminado",
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 md:gap-6">
      <FileText className="h-16 w-16 text-slate-300 md:h-20 md:w-20" />
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-slate-900 md:text-2xl">{info.title}</h2>
        <p className="text-sm text-slate-600 md:text-base">{info.description}</p>
      </div>
      <Link href="/documentos">
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25 md:text-base">
          Volver a Documentos
        </Button>
      </Link>
    </div>
  )
}
