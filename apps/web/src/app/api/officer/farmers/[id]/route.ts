import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/server";
import { updateFarmer } from "@/services/farmers";

export const PATCH = route(async (request) => {
  const id = z.string().uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const result = await updateFarmer(id, request);
  return NextResponse.json(result);
});

