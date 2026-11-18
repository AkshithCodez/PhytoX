import { NextResponse } from "next/server";
import { route } from "@/lib/server";
import { listFarmers, inviteFarmer } from "@/services/farmers";

export const GET = route(async (request) => {
  return NextResponse.json(await listFarmers(request));
});

export const POST = route(async (request) => {
  const result = await inviteFarmer(request);
  return NextResponse.json(result, { status: 201 });
});
