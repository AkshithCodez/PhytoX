import { NextResponse } from "next/server";
import { context, route, checkDb, jsonBody } from "@/lib/server";
import { profileSchema } from "@/lib/contracts";
export const GET = route(async () => {
  const { profile } = await context();
  return NextResponse.json(profile);
});
export const PATCH = route(async (request) => {
  const { db, user } = await context();
  const input = profileSchema.parse(await jsonBody(request));
  const { error } = await db
    .from("user_profiles")
    .update(input)
    .eq("id", user.id);
  checkDb(error);
  return NextResponse.json({ ok: true });
});
