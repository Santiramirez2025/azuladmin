import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppNav } from "@/components/app-nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Azul Colchones",
  description: "Sistema de gestión",
  authors: [{ name: "Azul Colchones" }],
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <AppNav />
        <main className="min-h-screen pt-14 pb-20 md:pb-0 md:pl-60">
          {children}
        </main>
      </body>
    </html>
  )
}
