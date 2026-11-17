import { describe, expect, it } from "vitest";
import { resultSchema } from "@/lib/contracts";
import { SUPPORTED_CROPS } from "@/features/diagnosis/scanner";

describe("Crop Conditioning & Safeguards", () => {
  it("validates that all 14 crops are represented in SUPPORTED_CROPS", () => {
    expect(SUPPORTED_CROPS.length).toBe(14);
    const cropIds = SUPPORTED_CROPS.map((c) => c.id);
    expect(cropIds).toContain("Tomato");
    expect(cropIds).toContain("Potato");
    expect(cropIds).toContain("Corn (maize)");
    expect(cropIds).toContain("Pepper, bell");
    expect(cropIds).toContain("Grape");
    expect(cropIds).toContain("Apple");
    expect(cropIds).toContain("Orange");
    expect(cropIds).toContain("Strawberry");
    expect(cropIds).toContain("Peach");
    expect(cropIds).toContain("Cherry (including sour)");
    expect(cropIds).toContain("Blueberry");
    expect(cropIds).toContain("Squash");
    expect(cropIds).toContain("Soybean");
    expect(cropIds).toContain("Raspberry");
  });

  it("parses valid crop-conditioned prediction responses with mismatch warning", () => {
    const raw = {
      schema_version: "1.0",
      status: "success",
      model_version: "local-onnx-v2",
      prediction: {
        crop: "Tomato",
        disease: "Early blight",
        confidence: 0.82,
      },
      alternatives: [
        { crop: "Tomato", disease: "Late blight", confidence: 0.12 },
        { crop: "Tomato", disease: "healthy", confidence: 0.06 },
      ],
      quality_warnings: [],
      review_recommended: true,
      abstained: true,
      uncertainty_note: "Model confidence is not proven accuracy.",
      selected_crop: "Tomato",
      crop_mismatch_warning: true,
      crop_confidence: 0.18,
      detected_crop: "Grape",
      mismatch_message:
        "You selected Tomato, but the visual model detected features typical of Grape with only 18.0% crop match.",
    };

    const parsed = resultSchema.parse(raw);
    expect(parsed.selected_crop).toBe("Tomato");
    expect(parsed.crop_mismatch_warning).toBe(true);
    expect(parsed.crop_confidence).toBe(0.18);
    expect(parsed.detected_crop).toBe("Grape");
    expect(parsed.abstained).toBe(true);
  });

  it("parses valid crop-matched prediction responses without mismatch", () => {
    const raw = {
      schema_version: "1.0",
      status: "success",
      model_version: "local-onnx-v2",
      prediction: {
        crop: "Tomato",
        disease: "healthy",
        confidence: 0.94,
      },
      alternatives: [
        { crop: "Tomato", disease: "Early blight", confidence: 0.04 },
      ],
      quality_warnings: [],
      review_recommended: true,
      abstained: false,
      uncertainty_note: "Model confidence is not proven accuracy.",
      selected_crop: "Tomato",
      crop_mismatch_warning: false,
      crop_confidence: 0.98,
      detected_crop: "Tomato",
      mismatch_message: null,
    };

    const parsed = resultSchema.parse(raw);
    expect(parsed.selected_crop).toBe("Tomato");
    expect(parsed.crop_mismatch_warning).toBe(false);
    expect(parsed.crop_confidence).toBe(0.98);
    expect(parsed.abstained).toBe(false);
  });
});
