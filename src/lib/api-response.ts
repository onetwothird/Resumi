import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Central error responses for route handlers.
 *
 * Why this exists: Prisma and node-postgres errors carry table names, column
 * names, constraint names and occasionally connection detail. Returning
 * `error.message` from a catch block leaks all of that to the caller. These
 * helpers log the detail server-side and return an opaque message instead.
 */
export function internalError(context: string, error: unknown): NextResponse {
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

/** 422 with per-field messages. Safe to expose: these come from our own schema. */
export function validationError(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: "Invalid request.", fields: error.flatten().fieldErrors },
    { status: 400 }
  );
}
