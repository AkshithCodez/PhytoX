import { NextResponse } from "next/server";
import { context, route, checkDb } from "@/lib/server";
export const GET = route(async () => {
  const { db } = await context();
  const { data, error } = await db.from("regions").select("*").order("name");
  checkDb(error);
  return NextResponse.json(data);
});
