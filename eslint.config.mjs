import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".backups/**",
    "scripts/**",
  ]),
  {
    rules: {
      // Tipos
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Prácticas generales
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "smart"],

      // Console: permitido pero advertido (mantenemos error para producción)
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // React
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",

      // Next.js: permitir <a> internos (ya usamos Link cuando aplica)
      "@next/next/no-html-link-for-pages": "error",
    },
  },
  {
    // En seeds y archivos generadores no aplicamos no-console
    files: ["src/app/api/seed/**", "prisma/seed*.ts"],
    rules: {
      "no-console": "off",
    },
  },
])

export default eslintConfig
