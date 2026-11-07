import { Prisma, RugStatus, type Rug } from "@prisma/client";
import { prisma } from "./db";

/** How long a unique rug stays locked while a buyer completes checkout. */
export const RESERVATION_MINUTES = 15;

export type ReservationErrorCode = "NOT_FOUND" | "SOLD" | "LOCKED" | "UNAVAILABLE";

export class RugReservationError extends Error {
  constructor(
    message: string,
    public readonly code: ReservationErrorCode,
  ) {
    super(message);
    this.name = "RugReservationError";
  }
}

/** The timestamp a reservation started at `now` will expire. */
export function reservationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);
}

type ReservationClient = Prisma.TransactionClient;

/**
 * Claim a unique rug inside an existing transaction.
 *
 * A rug can be claimed when it is AVAILABLE, or when it is RESERVED but its
 * `reservedUntil` timestamp has already passed. The conditional `updateMany`
 * makes concurrent claims safe: PostgreSQL re-checks the WHERE clause after a
 * competing update commits, so only one buyer wins.
 *
 * Exposed separately so checkout can reserve several rugs and create the order
 * atomically in the same database transaction.
 *
 * @throws {RugReservationError} if the rug is sold, currently locked by
 * another buyer, or does not exist.
 */
export async function claimUniqueRug(
  tx: ReservationClient,
  rugId: string,
  now: Date = new Date(),
): Promise<Rug> {
  const reservedUntil = reservationExpiry(now);

  const claimed = await tx.rug.updateMany({
    where: {
      id: rugId,
      OR: [
        { status: RugStatus.AVAILABLE },
        {
          status: RugStatus.RESERVED,
          reservedUntil: { lte: now },
        },
      ],
    },
    data: {
      status: RugStatus.RESERVED,
      reservedUntil,
      reservedByOrderId: null,
    },
  });

  if (claimed.count === 1) {
    return tx.rug.findUniqueOrThrow({ where: { id: rugId } });
  }

  const current = await tx.rug.findUnique({
    where: { id: rugId },
    select: {
      status: true,
      reservedUntil: true,
      sku: true,
      nameFr: true,
    },
  });

  if (!current) {
    throw new RugReservationError(
      `Rug "${rugId}" does not exist.`,
      "NOT_FOUND",
    );
  }

  if (current.status === RugStatus.SOLD) {
    throw new RugReservationError(
      `Rug ${current.sku} (${current.nameFr}) has already been sold.`,
      "SOLD",
    );
  }

  if (
    current.status === RugStatus.RESERVED &&
    current.reservedUntil &&
    current.reservedUntil > now
  ) {
    throw new RugReservationError(
      `Rug ${current.sku} (${current.nameFr}) is currently reserved by another buyer until ${current.reservedUntil.toISOString()}.`,
      "LOCKED",
    );
  }

  throw new RugReservationError(
    `Rug ${current.sku} (${current.nameFr}) is not available for reservation.`,
    "UNAVAILABLE",
  );
}

/**
 * Atomically reserve a one-of-a-kind rug for 15 minutes.
 *
 * @throws {RugReservationError} if the rug is sold, currently locked by
 * another buyer, or does not exist.
 */
export async function reserveUniqueRug(rugId: string): Promise<Rug> {
  return prisma.$transaction((tx) => claimUniqueRug(tx, rugId));
}

/**
 * Release every reservation whose 15-minute window has elapsed.
 * Safe to call from a cron job, the catalogue API or the checkout page.
 *
 * @returns the number of rugs returned to AVAILABLE.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const now = new Date();

  const result = await prisma.rug.updateMany({
    where: {
      status: RugStatus.RESERVED,
      reservedUntil: { not: null, lt: now },
    },
    data: {
      status: RugStatus.AVAILABLE,
      reservedUntil: null,
      reservedByOrderId: null,
    },
  });

  return result.count;
}
