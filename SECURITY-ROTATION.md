# Rotación de credenciales — pasos a ejecutar

Las credenciales actuales en `.env` deben considerarse **comprometidas** (estuvieron en el filesystem por meses, podrían haberse compartido en pantalla, backups, etc.). Ejecutá los pasos en orden.

## 1. Rotar password de la base de datos (Neon)

1. Entrá a https://console.neon.tech → proyecto `azuladmin` → **Roles**.
2. Reseteá la password de `neondb_owner` (botón "Reset password").
3. Copiá la nueva connection string.
4. Reemplazá `DATABASE_URL` en:
   - `.env` local
   - Vercel: `vercel env add DATABASE_URL production` (y `preview`/`development`).

## 2. Rotar Supabase ANON_KEY

Si usás Supabase realmente:
1. https://supabase.com/dashboard → proyecto `juupurpqobvkrjnmfmki` → **Settings → API**.
2. Click **Reset anon key**.
3. Reemplazá `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env` y en Vercel.

Si no estás usando Supabase activamente (la DB ahora es Neon), considerá borrar el proyecto Supabase y eliminar las dos variables `NEXT_PUBLIC_SUPABASE_*`.

## 3. Generar nuevo AUTH_SECRET (JWT signing)

```bash
openssl rand -base64 48
```

Pegalo en `.env` como `AUTH_SECRET=...` y subilo a Vercel. **Esto invalida todas las sesiones activas** — vas a tener que volver a loguearte.

## 4. Generar AUTH_PASSWORD_HASH (reemplaza AUTH_PASSWORD plaintext)

```bash
npx ts-node scripts/hash-password.ts 'tu-nueva-password'
```

Copiá la línea `AUTH_PASSWORD_HASH=scrypt:...` al `.env`.

**Importante:** ahora la variable se llama `AUTH_PASSWORD_HASH` (no `AUTH_PASSWORD`). Eliminá la vieja:

```bash
# .env: borrar AUTH_PASSWORD=...
# Vercel:
vercel env rm AUTH_PASSWORD production
```

## 5. Generar ADMIN_SETUP_SECRET (para /api/seed y /api/products/clear)

```bash
openssl rand -hex 32
```

Pegalo en `.env` como `ADMIN_SETUP_SECRET=...`. Este secret hay que pasarlo como header `x-admin-secret` para llamar esos endpoints. En producción están bloqueados a menos que pongas `ALLOW_DESTRUCTIVE_OPS=true` (no lo hagas salvo que sepas lo que hacés).

Ejemplo de uso en dev:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "x-admin-secret: <tu-secret>"
```

## 6. Verificar que `.env` no esté en git

```bash
git ls-files | grep -E '^\.env'
# debe devolver vacío
git log --all --diff-filter=A -- .env
# debe devolver vacío
```

Si aparece algo, hay que purgar el archivo del histórico con `git filter-repo` o `bfg`. **Por ahora no aparece** — pero rotá igual los secretos por las dudas.

## 7. Verificar deploy

Después de actualizar variables en Vercel:

```bash
vercel deploy --prod
```

Probá login → debería funcionar con la nueva password. Cualquier tab abierta con sesión vieja se cerrará.

---

## Variables nuevas (resumen)

| Variable | Antes | Ahora |
|---|---|---|
| `AUTH_PASSWORD` | plaintext | **eliminada** |
| `AUTH_PASSWORD_HASH` | — | scrypt hash |
| `ADMIN_SETUP_SECRET` | — | secreto para endpoints destructivos |
| `ALLOW_DESTRUCTIVE_OPS` | — | (opcional) `true` para habilitar destructivos en prod |

## Cambios de código aplicados

- `src/lib/auth.ts` — módulo nuevo: scrypt, timingSafeEqual, rate limit, getAuthSecret().
- `src/app/api/auth/login/route.ts` — usa scrypt + Zod + rate limit, JWT con `sub`/`role`/`iat`/`exp`.
- `src/middleware.ts` — sin fallback de secret, valida `exp` explícito.
- `src/app/api/seed/route.ts` y `src/app/api/products/clear/route.ts` — protegidos con `ADMIN_SETUP_SECRET` + bloqueo en prod.
- `scripts/hash-password.ts` — genera hashes scrypt.
