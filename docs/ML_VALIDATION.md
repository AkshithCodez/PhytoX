# ML validation — 5 November 2026

## Current evidence

The real supplied ONNX artifact executes through both the adapter and FastAPI prediction route. The initial audit baseline was **16 passing Pytest tests**. After the corrections below, `.\.venv\Scripts\python.exe -m pytest -q` reported **20 passed, 1 warning in 1.69 seconds**, including actual artifact execution (not skipped).

The warning is Starlette's upstream deprecation of its TestClient `httpx` transport. No runtime dependency was added for this audit.

## Model contract independently checked

| Property | Observed result |
| --- | --- |
| Artifact | `services/inference/models/supplied.onnx` |
| Version | `local-onnx-fde9536ff18a` |
| SHA-256 | `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4` |
| Original artifact | `../../ml/models/model.onnx` relative to repository root |
| Integrity | Imported artifact, original artifact, and manifest hashes match |
| Graph | `onnx.checker.check_model` passed |
| Class mapping | All 38 ordered crop/disease pairs match original `class_info.json` |
| Input | float32 NCHW, one RGB image, 224×224 |
| Resize | PIL bilinear resize, matching the supplied evaluation transform's resize convention |
| Normalization | Divide uint8 pixels by 255; subtract `[0.485, 0.456, 0.406]`; divide by `[0.229, 0.224, 0.225]` |
| Output | Float logits, one batch, 38 ordered classes; stable softmax |
| Architecture | Supplied MobileNetV2 export; no new training or weight modification |

Read `../../ml/src/dataset.py` directly to check RGB conversion and the evaluation transform. No training module or checkpoint pickle was executed. The original model remains unchanged.

## Defects corrected

1. **Malformed authentication header could raise a server exception.** The original middleware compared Unicode strings with `hmac.compare_digest`, which rejects non-ASCII strings. It now compares byte sequences before parsing a request body. A regression sends a raw non-ASCII key and verifies HTTP 401, without exposing internal details. The route-level check uses equivalent byte comparison.
2. **Readiness accepted an incompatible fixed batch contract.** ONNX input/output checks inspected only dimensions after the batch dimension. A model requiring batch size two could be marked ready even though the adapter always sends one image. Readiness now accepts only a fixed batch of one or a dynamic batch and rejects unsupported output element types. Three regressions cover incompatible input batch, output batch, and integer output.

Existing tests still cover malformed images, image-size limits, underexposure, malformed model output, uncertainty, authorized/unavailable behavior, sanitized inference errors, raw-body bounds, fingerprint mismatch, and repeatable real graph/API execution.

## Performance observation

A local CPU-only measurement used one deterministic synthetic RGB texture, one warm-up, then 20 sequential predictions through the adapter (including preprocessing/postprocessing): model initialization **279.97 ms**, warm median **13.31 ms**, warm p95 **21.65 ms**. This is a single local measurement, not a deployment benchmark, concurrency test, or disease-accuracy result. No performance rewrite was justified by this measurement.

## Uncertainty and image suitability

The service rejects unsafe/unsupported/animated files and images below 64 pixels per side. It flags dimensions below 224 and extreme mean exposure. Predictions abstain when the top softmax score is below 0.70, the top-two margin is below 0.15, or any image-quality warning is present. Every result recommends human review and includes the statement that confidence is not proven accuracy and unknown-image detection is unvalidated.

These are conservative presentation heuristics, not calibrated probabilities or a plant-presence detector. A closed-set classifier may confidently identify an unrelated object as a crop class. No unsupported OOD, Grad-CAM, treatment, or automatic outbreak feature was added.

## Evaluation blocked by missing data

The adjacent `../../ml/data` directory contains only `.gitkeep`. No representative labeled evaluation images were found in the supplied ML project. Consequently accuracy, per-class precision/recall, confusion matrices, confidence calibration, unknown-category rejection rates, and field performance were **not measured**. Synthetic test textures establish executable behavior only.

Before agricultural deployment, obtain an independently labeled evaluation set with documented provenance and separate field-image and unrelated-image cohorts. Preserve the ordered label mapping, measure per-class errors and confusion, assess calibration and abstention coverage/error tradeoffs, and choose any rejection thresholds using held-out data. Agricultural specialists must assess practical failure modes. TorchScript is supported in code but was not runtime-tested because this installation uses ONNX Runtime.

## Remaining operational checks

- Hosted latency, queue/concurrency limits, service-to-service network protection, and recovery during worker termination need deployment testing.
- The prediction semaphore bounds active decoding/inference work, not total authenticated connections; enforce reverse-proxy request/concurrency limits for the internal service.
- Supabase persistence of real model responses remains a separate live integration check requiring credentials.

VERDICT: PASS

This verdict covers the executed contract, integrity, and regression checks above. It does not certify agricultural model performance or production readiness.
