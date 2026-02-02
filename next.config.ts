import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de producción
  poweredByHeader: false,
  
  // Configuración de Turbopack (requerido en Next.js 16+)
  turbopack: {
    // Configuración vacía para usar defaults
  },
  
  // Manejo de módulos externos
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
