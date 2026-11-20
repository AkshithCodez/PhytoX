import "server-only";
import crypto from "node:crypto";
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
  const selectedCropRaw = form.get("selected_crop")?.toString()?.trim();
  const selectedCrop = selectedCropRaw && selectedCropRaw !== "not_sure" ? selectedCropRaw : null;
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

  // Compute server-verified SHA-256 fingerprint for deduplication and cache validation
  const imageHash = crypto.createHash("sha256").update(bytes).digest("hex");

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
  const upload = await trusted.storage
    .from("crop-images")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (upload.error) {
    // A duplicate in-flight request must not finalize or delete another request's upload.
    throw new ApiError(
      409,
      "upload_conflict",
      "The image could not be uploaded, or this analysis is already running. Check history before retrying.",
    );
  }

  // -------------------------------------------------------------------------
  // Part IX: Hardened Farmer-Scoped Prediction Caching
  // Composite Key: owner_id + image_hash + selected_crop + model_digest + versions
  // -------------------------------------------------------------------------
  const MODEL_ARTIFACT_DIGEST = "fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4";
  const PREPROCESS_VERSION = "sharp-rgb-2048-q90-v1";
  const POSTPROCESS_VERSION = "phytox-crop-cond-38class-v1";
  const INFERENCE_PARAMS = { confidence_threshold: 0.60, margin_threshold: 0.15 };

  const cacheSignature = JSON.stringify({
    owner_id: user.id,
    image_hash: imageHash,
    selected_crop: selectedCrop || null,
    model_digest: MODEL_ARTIFACT_DIGEST,
    preprocess_version: PREPROCESS_VERSION,
    postprocess_version: POSTPROCESS_VERSION,
    params: INFERENCE_PARAMS,
  });
  const compositeCacheKey = crypto.createHash("sha256").update(cacheSignature).digest("hex");

  try {
    // Unbounded indexable JSONB lookup matching exact composite cache key for this farmer
    const { data: cacheHit } = await db
      .from("diagnoses")
      .select("*")
      .eq("owner_id", user.id)
      .eq("status", "complete")
      .contains("result", { cache_key: compositeCacheKey })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheHit && cacheHit.result) {
      // Re-use verified prediction without triggering redundant ONNX inference
      const cachedResult = {
        ...cacheHit.result,
        cached: true,
        cache_hit_at: new Date().toISOString(),
        source_diagnosis_id: cacheHit.id,
        is_duplicate_photo: true,
      };
      const complete = await trusted.rpc("finish_diagnosis", {
        p_id: d.id,
        p_owner: user.id,
        p_result: cachedResult,
      });
      checkDb(complete.error);
      return { ...d, status: "complete", image_path: path, result: cachedResult };
    }
  } catch (cacheErr) {
    // Non-fatal: if cache lookup encounters an error, proceed to live inference
    console.warn("[Cache] Cache lookup non-fatal fallback:", cacheErr);
  }

  try {
    const body = new FormData();
    body.set(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }),
      "crop.jpg",
    );
    if (selectedCrop) {
      body.set("selected_crop", selectedCrop);
    }
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

    // Attach server-verified cryptographic SHA-256 hash and full cache provenance
    const resultWithCache = {
      ...parsed.data,
      image_hash: imageHash,
      cache_key: compositeCacheKey,
      cached: false,
      model_artifact_digest: MODEL_ARTIFACT_DIGEST,
      preprocess_version: PREPROCESS_VERSION,
      postprocess_version: POSTPROCESS_VERSION,
      cache_version: "v2.0",
      is_duplicate_photo: false,
    };

    const complete = await trusted.rpc("finish_diagnosis", {
      p_id: d.id,
      p_owner: user.id,
      p_result: resultWithCache,
    });
    checkDb(complete.error);
    return { ...d, status: "complete", image_path: path, result: resultWithCache };
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
    await trusted.storage.from("crop-images").remove([path]);
    throw failure;
  }
}
