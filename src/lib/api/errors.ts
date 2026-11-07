import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RugReservationError } from "../stock";
import { ShippingError } from "../shipping";

/**
 * Error type used by every API route. `code` is a stable, machine-readable
 * string that clients can switch on; `details` is safe to expose (validation
 * paths, missing ids, …) and must never contain secrets.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "API_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiError(
  status: number,
  message: string,
  code: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

/** Parse a JSON body, turning malformed payloads into a 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(
      400,
      "Request body must be valid JSON.",
      "INVALID_JSON",
    );
  }
}

function zodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

function prismaDetails(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  return Array.isArray(target) ? { fields: target } : undefined;
}

/**
 * Convert any thrown value into the API's uniform error envelope.
 * Unknown errors are logged but never echoed to the client.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return apiError(error.status, error.message, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return apiError(
      400,
      "The request payload is invalid.",
      "VALIDATION_ERROR",
      zodDetails(error),
    );
  }

  if (error instanceof RugReservationError) {
    const status = error.code === "NOT_FOUND" ? 404 : 409;

    return apiError(status, error.message, `RUG_${error.code}`);
  }

  if (error instanceof ShippingError) {
    return apiError(422, error.message, `SHIPPING_${error.code}`);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError(
        409,
        "A record with this unique value already exists.",
        "CONFLICT",
        prismaDetails(error),
      );
    }

    if (error.code === "P2025") {
      return apiError(404, "The requested record was not found.", "NOT_FOUND");
    }

    if (error.code === "P2003") {
      return apiError(
        422,
        "A referenced record does not exist.",
        "INVALID_REFERENCE",
        prismaDetails(error),
      );
    }
  }

  console.error("[api] Unhandled error:", error);

  return apiError(
    500,
    "An unexpected error occurred. Please try again.",
    "INTERNAL_ERROR",
  );
}
