import { z } from "zod";

export const predictionSchema = z.object({
  crop: z.string().min(1).max(100),
  disease: z.string().min(1).max(160),
  confidence: z.number().min(0).max(1),
});
export const resultSchema = z.object({
  schema_version: z.literal("1.0"),
  status: z.literal("success"),
  model_version: z.string().min(1),
  prediction: predictionSchema,
  alternatives: z.array(predictionSchema).max(4),
  quality_warnings: z.array(z.string()).max(20),
  review_recommended: z.boolean(),
  abstained: z.boolean(),
  uncertainty_note: z.string(),
});
export const reportSchema = z
  .object({
    diagnosis_id: z.uuid(),
    region_id: z.uuid(),
    notes: z.string().max(2000),
    consent: z.literal(true),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
  })
  .refine((v) => (v.latitude === null) === (v.longitude === null), {
    message: "Both coordinates are required",
  });
export const reviewSchema = z.object({
  version: z.number().int().positive(),
  status: z.enum(["verified", "rejected", "follow_up"]),
  notes: z.string().trim().min(3).max(2000),
});
export const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(100),
  language: z.enum(["en", "te", "hi"]),
  region_id: z.uuid().nullable(),
});
export const authSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});
export const alertSchema = z.object({
  region_id: z.uuid(),
  crop: z.string().min(1).max(100),
  disease: z.string().min(1).max(160),
  notes: z.string().trim().min(3).max(2000),
});
export const resolveSchema = z.object({
  status: z.enum(["confirmed", "dismissed"]),
  notes: z.string().trim().min(3).max(2000),
});
export const filterSchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    region: z.uuid().optional(),
    status: z.enum(["pending", "verified", "rejected", "follow_up"]).optional(),
    disease: z.string().max(160).optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "Start date must precede end date",
  });
export type PredictionResult = z.infer<typeof resultSchema>;
export type Profile = {
  id: string;
  display_name: string;
  role: "farmer" | "officer" | "admin";
  language: "en" | "te" | "hi";
  region_id: string | null;
};
export type Region = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};
export type Diagnosis = {
  id: string;
  status: "processing" | "complete" | "failed";
  result: PredictionResult | null;
  image_path: string | null;
  image_url?: string | null;
  created_at: string;
  error_code: string | null;
  farmer_reports?: { id: string; status: string }[];
};
export type Report = {
  id: string;
  owner_id: string;
  diagnosis_id: string;
  region_id: string;
  crop: string;
  disease: string;
  notes: string;
  status: "pending" | "verified" | "rejected" | "follow_up";
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  version: number;
  regions?: Region;
  diagnoses?: Diagnosis;
  officer_reviews?: Review[];
};
export type Review = {
  id: string;
  status: string;
  notes: string;
  created_at: string;
};
export type Alert = {
  id: string;
  region_id: string;
  crop: string;
  disease: string;
  status: string;
  notes: string;
  created_at: string;
};
export type Signal = {
  region_id: string;
  crop: string;
  disease: string;
  recent: number;
  baseline: number;
  verified: number;
  reporters: number;
  growth: number | null;
};
