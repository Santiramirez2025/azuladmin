"use client"

// ============================================================================
// ClientSearch — Componente memoizado
// ─────────────────────────────────────────────────────────────────────────────
// memo() previene re-renders cuando el padre re-renderiza pero client/onChange
// no cambiaron. El padre DEBE envolver onChange en useCallback para que esto
// funcione correctamente.
// ============================================================================

import { useState, useEffect, memo } from "react"
import Link from "next/link"
import { User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import type { Client } from "../_lib/types"

interface ClientSearchProps {
  value: Client | null
  onChange: (client: Client | null) => void
}

export const ClientSearch = memo(function ClientSearch({
  value,
  onChange,
}: ClientSearchProps) {
  const [open, setOpen]             = useState(false)
  const [search, setSearch]         = useState("")
  const [clients, setClients]       = useState<Client[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName]   = useState("")
  const [quickPhone, setQuickPhone] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Debounce de búsqueda con cleanup para evitar memory leaks
  useEffect(() => {
    if (search.length < 2) {
      setClients([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(search)}&limit=10`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setClients(data.items ?? [])
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error searching clients:", err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort() // ← Cancela fetch en vuelo si el usuario sigue escribiendo
    }
  }, [search])

  // Cierra popover y resetea estado de quick add
  const closeQuickAdd = () => {
    setShowQuickAdd(false)
    setQuickName("")
    setQuickPhone("")
  }

  const handleQuickCreate = async () => {
    if (!quickName.trim() || !quickPhone.trim()) {
      toast.error("Nombre y teléfono son obligatorios")
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     quickName.trim(),
          phone:    quickPhone.trim(),
          city:     "Villa María",
          province: "Córdoba",
        }),
      })
      if (!res.ok) throw new Error("Error al crear cliente")
      const newClient: Client = await res.json()
      onChange(newClient)
      setOpen(false)
      closeQuickAdd()
      toast.success(`Cliente "${newClient.name}" creado`)
    } catch {
      toast.error("Error al crear cliente")
    } finally {
      setIsCreating(false)
    }
  }

  // ── Cliente ya seleccionado ────────────────────────────────────────────────
  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-3.5 shadow-sm transition-all hover:shadow-md md:p-4">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 md:h-12 md:w-12">
              <User className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 md:text-base">{value.name}</p>
              <p className="truncate text-xs text-slate-600 md:text-sm">{value.phone} · {value.city}</p>
            </div>
          </div>
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => onChange(null)}
            className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:bg-blue-100 hover:text-blue-700"
          >
            Cambiar
          </Button>
        </div>
      </div>
    )
  }

  // ── Buscador ──────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) closeQuickAdd() }}>
      <PopoverTrigger asChild>
        <Button
          type="button" variant="outline" role="combobox"
          className="w-full justify-start border-slate-200 bg-white/50 text-sm font-medium text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50/50"
        >
          <User className="mr-2 h-4 w-4" />
          Buscar o crear cliente...
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] border-slate-200/50 bg-white/95 p-0 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:w-[400px]"
        align="start"
      >
        {!showQuickAdd ? (
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Nombre o teléfono..."
              value={search}
              onValueChange={setSearch}
              className="border-0"
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                </div>
              )}

              {!isLoading && search.length >= 2 && clients.length === 0 && (
                <CommandEmpty>
                  <div className="py-8 text-center">
                    <User className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <p className="mb-1 text-sm font-semibold text-slate-700">No se encontraron clientes</p>
                    <p className="mb-4 text-xs text-slate-500">Creá uno rápidamente</p>
                    <div className="flex gap-2 px-4">
                      <Button size="sm" onClick={() => setShowQuickAdd(true)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25">
                        <User className="mr-1.5 h-4 w-4" /> Crear Rápido
                      </Button>
                      <Link href="/clientes/nuevo" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-sm font-semibold"
                          onClick={() => setOpen(false)}>
                          Crear Completo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && clients.length > 0 && (
                <>
                  <div className="border-b border-slate-100 p-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowQuickAdd(true)}
                      className="w-full justify-start gap-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                      <User className="h-4 w-4" /> + Crear nuevo cliente
                    </Button>
                  </div>
                  <CommandGroup>
                    {clients.map((c) => (
                      <CommandItem key={c.id} value={c.id}
                        onSelect={() => { onChange(c); setOpen(false); setSearch("") }}
                        className="cursor-pointer rounded-lg px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                            <p className="truncate text-xs text-slate-500">{c.phone} · {c.city}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {!isLoading && search.length < 2 && (
                <div className="p-3">
                  <Button size="sm" variant="ghost" onClick={() => setShowQuickAdd(true)}
                    className="w-full justify-start gap-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                    <User className="h-4 w-4" /> + Crear cliente nuevo
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        ) : (
          // ── Quick Create Form ──────────────────────────────────────────────
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Crear Cliente Rápido</h3>
              <Button size="sm" variant="ghost" onClick={closeQuickAdd}
                className="h-auto p-1 text-slate-400 hover:text-slate-600">✕</Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nombre *</Label>
                <Input placeholder="Ej: Juan Pérez" value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && quickName && quickPhone && handleQuickCreate()}
                  className="mt-1 border-slate-200 text-sm" autoFocus />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Teléfono *</Label>
                <Input placeholder="Ej: 3535123456" value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && quickName && quickPhone && handleQuickCreate()}
                  className="mt-1 border-slate-200 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={closeQuickAdd}
                  className="flex-1 text-sm" disabled={isCreating}>Cancelar</Button>
                <Button size="sm" onClick={handleQuickCreate}
                  disabled={isCreating || !quickName.trim() || !quickPhone.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/25">
                  {isCreating ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Creando...</>
                  ) : "Crear"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
})