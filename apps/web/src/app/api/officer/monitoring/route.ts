import { NextResponse } from "next/server";
import { z } from "zod";
import { context, route, jsonBody } from "@/lib/server";
import { listOfficerSignals, issueMonitoringAdvisory } from "@/services/monitoring";

const advisorySchema = z.object({
  signal_id: z.string().uuid().optional().nullable(),
  plot_id: z.string().uuid(),
  farmer_id: z.string().uuid(),
  advisory_text: z.string().min(5).max(3000),
  recommendations: z.array(z.string()).optional(),
});

export const GET = route(async () => {
  const { user } = await context(true);
  const signals = await listOfficerSignals(user.id);
  return NextResponse.json(signals);
});

export const POST = route(async (request) => {
  const { user } = await context(true);
  const body = await jsonBody(request);
  const validated = advisorySchema.parse(body);
  const advisory = await issueMonitoringAdvisory(user.id, validated);
  return NextResponse.json(advisory, { status: 201 });
});
