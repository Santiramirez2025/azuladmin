"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

export const SignaturePad = forwardRef<
  SignaturePadHandle,
  {
    onChange?: (hasSignature: boolean) => void
    className?: string
  }
>(function SignaturePad({ onChange, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const emptyRef = useRef(true)
  const [, force] = useState(0)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#0a0a0a"
    ctx.lineWidth = 2.5
  }, [])

  useEffect(() => {
    setupCanvas()
    const onResize = () => {
      setupCanvas()
      emptyRef.current = true
      force((n) => n + 1)
      onChange?.(false)
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [setupCanvas, onChange])

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        emptyRef.current = true
        force((n) => n + 1)
        onChange?.(false)
      },
      isEmpty: () => emptyRef.current,
      toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    }),
    [onChange],
  )

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const point = getPoint(e)
    if (!point) return
    lastPointRef.current = point
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.beginPath()
    ctx.arc(point.x, point.y, 1.25, 0, Math.PI * 2)
    ctx.fillStyle = "#0a0a0a"
    ctx.fill()
    if (emptyRef.current) {
      emptyRef.current = false
      force((n) => n + 1)
      onChange?.(true)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const point = getPoint(e)
    const last = lastPointRef.current
    if (!point || !last) return
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  const handlePointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full touch-none rounded-xl border-2 border-dashed border-neutral-300 bg-white"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
    />
  )
})
