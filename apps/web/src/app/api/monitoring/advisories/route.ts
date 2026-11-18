import { NextResponse } from "next/server";
import { context, route } from "@/lib/server";
import { listFarmerAdvisories } from "@/services/monitoring";

export const GET = route(async () => {
  const { user } = await context();
  const advisories = await listFarmerAdvisories(user.id);
  return NextResponse.json(advisories);
});
