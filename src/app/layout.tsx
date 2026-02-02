import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Azul Colchones - Sistema de Gestión",
  description: "Sistema de gestión comercial para Azul Colchones. Presupuestos, recibos y remitos.",
  keywords: ["colchones", "PIERO", "Villa María", "gestión comercial"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Sidebar />
        <main className="md:ml-64 min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
