// ============================================================================
// useKeyboardShortcuts
// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMA ORIGINAL:
//   El useEffect en el componente tenía stale closure bug:
//   handleSubmit se usaba dentro del closure pero no estaba en el array,
//   lo que podía hacer que se ejecutase con valores viejos de amountPaid/items.
//
// SOLUCIÓN:
//   Ref pattern: los callbacks se actualizan en un ref en cada render,
//   pero el effect solo se registra una vez (array vacío intencional).
//   Esto garantiza que siempre se ejecuta el callback más reciente
//   sin re-registrar el listener en cada render.
// ============================================================================

import { useEffect, useRef } from "react"

interface UseKeyboardShortcutsProps {
  onSave: () => void
  onSend: () => void
  enabled: boolean  // Permite desactivar cuando el form no está listo
}

export function useKeyboardShortcuts({
  onSave,
  onSend,
  enabled,
}: UseKeyboardShortcutsProps): void {
  // Refs estables: se actualizan en cada render sin triggear el effect
  const onSaveRef   = useRef(onSave)
  const onSendRef   = useRef(onSend)
  const enabledRef  = useRef(enabled)

  // Sincronizar refs después de cada render — sin dependencias
  useEffect(() => {
    onSaveRef.current  = onSave
    onSendRef.current  = onSend
    enabledRef.current = enabled
  })

  // Registrar listener solo una vez — array vacío INTENCIONAL
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return
      if (!e.ctrlKey && !e.metaKey) return

      if (e.key === "s") {
        e.preventDefault()
        onSaveRef.current()
      } else if (e.key === "Enter") {
        e.preventDefault()
        onSendRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}