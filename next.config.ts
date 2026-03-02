import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  
  turbopack: {},
  
  serverExternalPackages: ["@prisma/client", "prisma"],

  outputFileTracingExcludes: {
    '*': [
      './node_modules/@prisma/engines/**',
      './node_modules/prisma/build/**',
      './node_modules/@prisma/engines-version/**',
      './node_modules/@prisma/get-platform/**',
    ],
  },
};

export default nextConfig;