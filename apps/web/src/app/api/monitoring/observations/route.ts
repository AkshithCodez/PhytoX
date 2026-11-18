import { NextResponse } from "next/server";
import { z } from "zod";
import { context, route, jsonBody } from "@/lib/server";
import { recordCropObservation } from "@/services/monitoring";

const observationSchema = z.object({
  plot_id: z.string().uuid(),
  image_path: z.string().min(1),
  symptoms: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  ai_assessment: z.any().optional(),
  observation_date: z.string().optional(),
});

export const POST = route(async (request) => {
  const { user } = await context();
  const body = await jsonBody(request);
  const validated = observationSchema.parse(body);
  const observation = await recordCropObservation(user.id, validated);
  return NextResponse.json(observation, { status: 201 });
});
