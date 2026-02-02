# 🛏️ Azul Colchones - Sistema de Gestión Comercial

Sistema completo de gestión para presupuestos, recibos y remitos de **Azul Colchones** (Villa María, Córdoba).

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI + shadcn/ui
- **Forms:** React Hook Form + Zod
- **State:** Zustand

## 📦 Instalación Rápida

```bash
# 1. Clonar o descomprimir el proyecto
cd azul-colchones

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Generar cliente de Prisma y crear tablas
npx prisma generate
npx prisma db push

# 5. Poblar datos iniciales (opcional)
# Iniciar servidor y visitar: http://localhost:3000/api/seed (POST)

# 6. Ejecutar en desarrollo
npm run dev
```

## 🔧 Configuración de Supabase

1. Crear cuenta en [Supabase](https://supabase.com)
2. Crear nuevo proyecto (región: South America - São Paulo)
3. Ir a **Project Settings > Database > Connection string**
4. Copiar la **URI** y pegarla en `.env` como `DATABASE_URL`
5. Agregar también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📂 Estructura del Proyecto

```
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx           # Dashboard principal
│   ├── documentos/        # CRUD de documentos
│   │   ├── page.tsx       # Lista de documentos
│   │   ├── nuevo/         # Crear documento
│   │   └── [id]/          # Ver/editar documento
│   ├── clientes/          # CRUD de clientes
│   ├── productos/         # Catálogo de productos
│   ├── estadisticas/      # Reportes y métricas
│   ├── configuracion/     # Ajustes del sistema
│   └── api/               # API Routes
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── sidebar.tsx        # Navegación principal
│   └── documents/         # Componentes de documentos
├── lib/
│   ├── db.ts              # Cliente de Prisma
│   ├── utils.ts           # Funciones utilitarias
│   ├── store.ts           # Estado global (Zustand)
│   └── validations.ts     # Esquemas Zod
└── types/
    └── index.ts           # Tipos TypeScript
```

## 🗄️ Modelo de Datos

Ver `prisma/schema.prisma` para el schema completo:

- **Users:** Usuarios del sistema (Admin/Vendedor)
- **Clients:** Clientes con datos de contacto
- **Products:** Catálogo de productos PIERO
- **ProductVariants:** Variantes por medida con precios
- **Documents:** Presupuestos, Recibos, Remitos
- **DocumentItems:** Items de cada documento
- **Categories:** Categorías de productos
- **Settings:** Configuración del sistema

## 💰 Lógica de Cuotas

| Plan | Recargo |
|------|---------|
| Contado | 0% |
| 3 cuotas | +18% |
| 6 cuotas | +25% |
| 9 cuotas | +35% |
| 12 cuotas | +47% |

## 📱 Características

### ✅ Implementadas
- Dashboard con métricas y estadísticas
- Lista de documentos con filtros y búsqueda
- Crear/ver/editar documentos completos
- Gestión de clientes (CRUD completo)
- Catálogo de productos con variantes
- Cálculo automático de cuotas y recargos
- Envío por WhatsApp con mensaje formateado
- Vista previa de documentos para imprimir
- Diferenciación Stock vs Catálogo
- Responsive (móvil y escritorio)

### 📋 Próximos pasos
- Autenticación de usuarios
- Generación de PDF
- Reportes avanzados
- Historial de cambios

## 🚀 Deploy en Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Configurar proyecto
vercel

# 3. Agregar variables de entorno en Vercel Dashboard:
#    - DATABASE_URL
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Deploy
vercel --prod
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build de producción (requiere Prisma)
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
npm run db:push      # Sincronizar schema con DB
npm run db:generate  # Generar cliente Prisma
```

## 🔐 Variables de Entorno

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Supabase Client (opcional, para funciones adicionales)
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
```

## 📄 Licencia

Privado - Azul Colchones © 2026
