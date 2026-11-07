import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Pure cryptographic helpers for the admin back-office.
 *
 * Kept free of Next.js and Prisma imports so `prisma/seed.ts` and the
 * `admin:code` CLI can reuse exactly the same password/TOTP implementation as
 * the login route.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const SCRYPT_KEY_LENGTH = 64;

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function normalizeBase32(value: string): string {
  return value.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
}

export function base32Decode(value: string): Buffer {
  const clean = normalizeBase32(value);
  if (!clean) throw new Error("A base32 secret is required.");

  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];

  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${character}`);
    }

    buffer = (buffer << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/** RFC 6238 TOTP code (HMAC-SHA1, 30 s, 6 digits). */
export function generateTotp(
  secret: string,
  options: { timeMs?: number; stepSeconds?: number; digits?: number } = {},
): string {
  const stepSeconds = options.stepSeconds ?? TOTP_STEP_SECONDS;
  const digits = options.digits ?? TOTP_DIGITS;
  const counter = Math.floor((options.timeMs ?? Date.now()) / 1000 / stepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter % 2 ** 32, 4);

  const digest = createHmac("sha1", base32Decode(secret))
    .update(counterBuffer)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return String(binary % 10 ** digits).padStart(digits, "0");
}

/** Verify a six-digit code with a ±1 step tolerance for clock drift. */
export function verifyTotp(
  secret: string,
  code: string,
  window = 1,
  now = Date.now(),
): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(normalized)) return false;

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateTotp(secret, {
      timeMs: now + offset * TOTP_STEP_SECONDS * 1000,
    });

    if (constantTimeEqual(expected, normalized)) return true;
  }

  return false;
}

/** Format: scrypt$<salt hex>$<derived key hex>. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH);

  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}

export function buildOtpAuthUrl(options: {
  email: string;
  secret: string;
  issuer?: string;
}): string {
  const issuer = options.issuer ?? "Zarbia Atlas";
  const label = encodeURIComponent(`${issuer}:${options.email}`);
  const params = new URLSearchParams({
    secret: normalizeBase32(options.secret),
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
