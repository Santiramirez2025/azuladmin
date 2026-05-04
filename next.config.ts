import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,

  turbopack: {},

  // Estos paquetes deben quedarse fuera del bundle (require Node nativo / leen archivos del FS)
  serverExternalPackages: ["@prisma/client", "prisma", "pdfkit"],

  outputFileTracingExcludes: {
    "*": [
      "./node_modules/@prisma/engines/**",
      "./node_modules/prisma/build/**",
      "./node_modules/@prisma/engines-version/**",
      "./node_modules/@prisma/get-platform/**",
    ],
  },

  // Asegurar que pdfkit incluye sus fuentes .afm en el bundle de servidor
  outputFileTracingIncludes: {
    "/api/documents/**": ["./node_modules/pdfkit/js/data/**"],
  },
}

export default nextConfig
