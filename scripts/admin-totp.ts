import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildOtpAuthUrl,
  generateTotp,
  normalizeBase32,
} from "../src/lib/admin/crypto";

/**
 * Print the current RFC 6238 code for the seeded admin account.
 *
 * Usage:
 *   npm run admin:code            # full details
 *   npm run admin:code -- --code-only
 *   npm run admin:code -- <BASE32>  # one-off secret
 */

function loadDotEnv() {
  const file = resolve(process.cwd(), ".env");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

const args = process.argv.slice(2);
const codeOnly = args.includes("--code-only");
const explicitSecret = args.find((arg) => !arg.startsWith("--"));
const secret =
  explicitSecret ?? process.env.SEED_ADMIN_TOTP_SECRET ?? undefined;

if (!secret) {
  console.error(
    "Missing TOTP secret. Set SEED_ADMIN_TOTP_SECRET in .env or pass a base32 secret.",
  );
  process.exit(1);
}

const normalized = normalizeBase32(secret);

if (!normalized) {
  console.error("The TOTP secret is empty.");
  process.exit(1);
}

const code = generateTotp(normalized);
const secondsRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);

if (codeOnly) {
  console.log(code);
  process.exit(0);
}

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@zarbia-atlas.ma";

console.log("");
console.log("  Zarbia Atlas — administrateur");
console.log("  ------------------------------");
console.log(`  Compte      : ${email}`);
console.log(`  Secret TOTP : ${normalized}`);
console.log(`  Code actuel : ${code}   (expire dans ${secondsRemaining}s)`);
console.log("");
console.log("  otpauth :");
console.log(`  ${buildOtpAuthUrl({ email, secret: normalized })}`);
console.log("");
