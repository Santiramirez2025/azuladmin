import "server-only"
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

const SCRYPT_KEYLEN = 64
const SCRYPT_SALT_BYTES = 16

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32 || secret.startsWith("genera_un_secret") || secret === "default-secret-change-this" || secret === "nuevo-default-2026") {
    throw new Error(
      "AUTH_SECRET no configurado o inseguro. Generá uno con: openssl rand -base64 48",
    )
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(plaintext: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES)
  const derived = await scrypt(plaintext.normalize("NFKC"), salt, SCRYPT_KEYLEN)
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`
}

export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  const parts = stored.split(":")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const salt = Buffer.from(parts[1], "hex")
  const expected = Buffer.from(parts[2], "hex")
  if (expected.length !== SCRYPT_KEYLEN) return false

  const derived = await scrypt(plaintext.normalize("NFKC"), salt, SCRYPT_KEYLEN)
  return timingSafeEqual(derived, expected)
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab)
    return false
  }
  return timingSafeEqual(ab, bb)
}

export type AdminCredentials = { username: string; password: string }
export type AdminAuthResult = { ok: true } | { ok: false; reason: "config" | "invalid" }

export async function verifyAdminCredentials({ username, password }: AdminCredentials): Promise<AdminAuthResult> {
  const validUsername = process.env.AUTH_USERNAME
  const passwordHash = process.env.AUTH_PASSWORD_HASH

  if (!validUsername || !passwordHash) {
    return { ok: false, reason: "config" }
  }

  const userOk = timingSafeEqualStrings(username, validUsername)
  const passOk = await verifyPassword(password, passwordHash)
  return userOk && passOk ? { ok: true } : { ok: false, reason: "invalid" }
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfter: 0 }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}
