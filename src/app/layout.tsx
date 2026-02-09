import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Azul Colchones - Sistema de Gestión",
  description: "Sistema de gestión comercial para Azul Colchones. Presupuestos, recibos y remitos.",
  keywords: ["colchones", "PIERO", "Villa María", "gestión comercial", "presupuestos", "facturación"],
  authors: [{ name: "Azul Colchones" }],
  creator: "Azul Colchones",
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "Azul Colchones - Sistema de Gestión",
    description: "Sistema de gestión comercial para Azul Colchones",
    siteName: "Azul Colchones",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 font-sans antialiased">
        {/* Sidebar fijo */}
        <Sidebar />
        
        {/* Main content con transición suave */}
        <main className="relative min-h-screen transition-all duration-300 ease-in-out md:ml-72">
          {/* Contenedor con padding responsivo */}
          <div className="mx-auto w-full">
            {children}
          </div>
          
          {/* Elementos decorativos de fondo */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-600/10 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/10 to-purple-600/10 blur-3xl"></div>
          </div>
        </main>
      </body>
    </html>
  );
}