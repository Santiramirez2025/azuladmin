/**
 * Genera un hash scrypt para AUTH_PASSWORD_HASH.
 * Uso:
 *   npx ts-node scripts/hash-password.ts 'mi-password-nueva'
 *   o pasarla por stdin:
 *   echo -n 'mi-password' | npx ts-node scripts/hash-password.ts
 */
import { randomBytes, scrypt as scryptCb } from "crypto"
import { promisify } from "util"

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf8").trim()
}

async function main() {
  const arg = process.argv[2]
  const password = arg ?? (await readStdin())
  if (!password) {
    console.error("Uso: ts-node scripts/hash-password.ts '<password>'")
    process.exit(1)
  }
  const salt = randomBytes(16)
  const derived = await scrypt(password.normalize("NFKC"), salt, 64)
  const hash = `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`
  console.log("\nAUTH_PASSWORD_HASH=" + hash + "\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
