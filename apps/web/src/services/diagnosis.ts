import "server-only";
import sharp from "sharp";
import { z } from "zod";
import { resultSchema, type Diagnosis } from "@/lib/contracts";
import { ApiError, checkDb, context, readBody } from "@/lib/server";
import { trustedClient } from "@/lib/supabase/trusted";

export async function analyze(request: Request) {
  const { db, user } = await context();
  const trusted = trustedClient();
  if (!process.env.INFERENCE_URL || !process.env.INFERENCE_API_KEY)
    throw new ApiError(
      503,
      "model_unconfigured",
      "The inference service has not been configured.",
    );
  const form = await new Response(await readBody(request, 4 * 1024 * 1024), {
      headers: request.headers,
    }).formData(),
    file = form.get("file");
  const key = z.uuid().parse(form.get("request_key"));
  if (
    !(file instanceof File) ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 3 * 1024 * 1024 ||
    !file.size
  )
    throw new ApiError(
      422,
      "invalid_image",
      "Choose a JPEG, PNG or WebP image up to 3 MiB.",
    );
  let bytes: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1 ||
      (metadata.width ?? 0) < 64 ||
      (metadata.height ?? 0) < 64
    )
      throw new Error("invalid image");
    bytes = await image
      .rotate()
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    throw new ApiError(
      422,
      "invalid_image",
      "The image could not be decoded. Use a clear, non-animated photograph at least 64 × 64 pixels.",
    );
  }
  const { data: reserved, error } = await db.rpc("reserve_diagnosis", {
    p_key: key,
  });
  checkDb(error);
  const d = reserved as Diagnosis;
  if (d.status === "complete") return d;
  if (d.status === "failed")
    throw new ApiError(
      409,
      "previous_failed",
      "This analysis failed. Start a new analysis to retry.",
    );
  const path = `${user.id}/${d.id}/image`;
  const upload = await db.storage
    .from("crop-images")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (upload.error) {
    // A duplicate in-flight request must not finalize or delete another request's upload.
    throw new ApiError(
      409,
      "upload_conflict",
      "The image could not be uploaded, or this analysis is already running. Check history before retrying.",
    );
  }
  try {
    const body = new FormData();
    body.set(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }),
      "crop.jpg",
    );
    const response = await fetch(`${process.env.INFERENCE_URL}/v1/predict`, {
      method: "POST",
      headers: { "X-API-Key": process.env.INFERENCE_API_KEY },
      body,
      signal: AbortSignal.timeout(60000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new ApiError(
        response.status === 503 ? 503 : 502,
        "inference_unavailable",
        "Analysis is unavailable. No prediction has been created. Please try again later.",
      );
    const parsed = resultSchema.safeParse(await response.json());
    if (!parsed.success)
      throw new ApiError(
        502,
        "invalid_prediction",
        "The model returned an incomplete response. No result was saved.",
      );
    const complete = await trusted.rpc("finish_diagnosis", {
      p_id: d.id,
      p_owner: user.id,
      p_result: parsed.data,
    });
    checkDb(complete.error);
    return { ...d, status: "complete", image_path: path, result: parsed.data };
  } catch (error) {
    const failure =
      error instanceof ApiError
        ? error
        : new ApiError(
            503,
            "inference_unavailable",
            "The analysis service did not respond. Please try again.",
          );
    await trusted.rpc("finish_diagnosis", {
      p_id: d.id,
      p_owner: user.id,
      p_result: null,
      p_error: failure.code,
    });
    await db.storage.from("crop-images").remove([path]);
    throw failure;
  }
}
