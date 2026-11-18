import { NextResponse } from "next/server";
import { z } from "zod";
import { context, route, jsonBody, ApiError } from "@/lib/server";
import { listFarmerPlots, createMonitoredPlot } from "@/services/monitoring";

const createPlotSchema = z.object({
  name: z.string().min(1).max(100),
  crop: z.string().min(1).max(50),
  planting_date: z.string().optional(),
  plot_area: z.string().optional(),
});

export const GET = route(async () => {
  const { user } = await context();
  const plots = await listFarmerPlots(user.id);
  return NextResponse.json(plots);
});

export const POST = route(async (request) => {
  const { user, profile, db } = await context();
  const body = await jsonBody(request);
  const validated = createPlotSchema.parse(body);
  let regionId = profile.region_id;
  if (!regionId) {
    const { data: firstRegion } = await db.from("regions").select("id").limit(1).single();
    regionId = firstRegion?.id;
  }
  if (!regionId) {
    throw new ApiError(400, "region_required", "Region assignment is required to monitor plots.");
  }
  const plot = await createMonitoredPlot(user.id, regionId, validated);
  return NextResponse.json(plot, { status: 201 });
});
