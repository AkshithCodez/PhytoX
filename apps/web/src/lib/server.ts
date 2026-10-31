import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serverClient } from "./supabase/server";
import { isConfigured } from "./supabase/config";
import type { Profile } from "./contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function context(officer = false) {
  if (!isConfigured())
    throw new ApiError(
      503,
      "unconfigured",
      "The database and authentication service have not been configured.",
    );
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new ApiError(401, "unauthorized", "Please sign in to continue.");
  const { data: profile, error: failure } = await db
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (failure || !profile)
    throw new ApiError(
      503,
      "profile_unavailable",
      "Your profile could not be loaded.",
    );
  if (officer && !["officer", "admin"].includes(profile.role))
    throw new ApiError(
      403,
      "forbidden",
      "An authorized officer account is required.",
    );
  return { db, user, profile: profile as Profile };
}
export function checkDb(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "42501")
    throw new ApiError(403, "forbidden", "This action is not permitted.");
  if (error.code === "40001" || error.code === "23505")
    throw new ApiError(
      409,
      "conflict",
      "This record changed or already exists. Reload and try again.",
    );
  if (error.message.includes("Hourly analysis"))
    throw new ApiError(
      429,
      "rate_limited",
      "The hourly analysis limit has been reached. Try again later.",
    );
  throw new ApiError(
    500,
    "database_error",
    "The change could not be completed. Please try again.",
  );
}
export function route(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) {
        const origin = request.headers.get("origin");
        if (
          !origin ||
          origin !== (process.env.APP_ORIGIN || new URL(request.url).origin)
        )
          throw new ApiError(
            403,
            "invalid_origin",
            "Request origin is not permitted.",
          );
      }
      const response = await fn(request);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch (error) {
      if (error instanceof z.ZodError)
        return NextResponse.json(
          {
            error: {
              code: "invalid_input",
              message: "Check the submitted fields.",
              issues: error.issues,
            },
          },
          { status: 400 },
        );
      if (error instanceof SyntaxError)
        return NextResponse.json(
          {
            error: { code: "invalid_input", message: "Invalid request body." },
          },
          { status: 400 },
        );
      const e =
        error instanceof ApiError
          ? error
          : new ApiError(
              500,
              "internal_error",
              "The request could not be completed.",
            );
      return NextResponse.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
export async function jsonBody(request: Request) {
  return JSON.parse(new TextDecoder().decode(await readBody(request, 16_384)));
}
export async function readBody(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new ApiError(413, "too_large", "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ApiError(413, "too_large", "Request is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
