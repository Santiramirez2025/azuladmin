"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      // Redirigir al inicio
      router.push("/")
      router.refresh()
    } catch (error) {
      setError("Error de conexión")
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Elementos decorativos de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-600/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-300/10 to-indigo-500/10 blur-3xl"></div>
      </div>

      {/* Patrón de puntos sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(148_163_184/0.1)_1px,transparent_0)] bg-[length:24px_24px]"></div>

      {/* Contenedor principal */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card de login con glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            {/* Brillo superior */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            
            <div className="p-8 sm:p-10">
              {/* Logo y Header */}
              <div className="mb-8 text-center">
                <div className="relative mx-auto mb-6 w-fit">
                  {/* Animación de pulso en el fondo */}
                  <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl"></div>
                  
                  {/* Logo */}
                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-2xl shadow-blue-500/30">
                    <span className="text-3xl font-bold text-white">A</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  
                  {/* Icono flotante */}
                  <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>

                <h1 className="mb-2 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-3xl font-bold text-transparent">
                  Azul Colchones
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  Sistema de Gestión Empresarial
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Usuario */}
                <div className="group space-y-2">
                  <label 
                    htmlFor="username" 
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    Usuario
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3.5 text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Ingresa tu usuario"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="group space-y-2">
                  <label 
                    htmlFor="password" 
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <Lock className="h-4 w-4 text-blue-600" />
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3.5 pr-12 text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Ingresa tu contraseña"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                  <div className="animate-shake rounded-xl border border-red-200/50 bg-gradient-to-r from-red-50 to-rose-50/50 px-4 py-3.5 backdrop-blur-sm">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                        <span className="text-xs">✕</span>
                      </div>
                      {error}
                    </p>
                  </div>
                )}

                {/* Botón de login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-transform group-hover:translate-x-0 group-disabled:translate-x-0"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        Iniciar Sesión
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  <span className="text-xs font-medium text-slate-400">Acceso Seguro</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <p className="text-center text-xs text-slate-500">
                  Versión 1.0 • Acceso restringido
                </p>
              </div>
            </div>

            {/* Brillo inferior */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          </div>

          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              ¿Problemas para acceder?{" "}
              <button className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Contacta al administrador
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}