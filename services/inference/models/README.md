# Model integration and model card

## Discovered local artifact

On 1 November 2026, the sibling `Mini Project/ml` folder was inspected. It contains `models/model.onnx`, `models/best_model.pt`, `models/class_info.json`, and PyTorch training/preprocessing source. The ONNX graph was checked with `onnx.checker.check_model` and executed through the FastAPI service using a synthetic image. This is an execution/contract smoke test, not a diagnostic evaluation.

- Version: `local-onnx-fde9536ff18a`
- SHA-256: `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`
- Producer metadata: PyTorch 2.11.0.
- Architecture: MobileNetV2 convolutional backbone with a 1280 → 512 → 38 classifier, consistent with the supplied source and graph.
- Input: float32 NCHW `[batch, 3, 224, 224]`, input name `input`.
- Preprocessing: RGB; PIL bilinear resize to 224×224; divide by 255; mean `[0.485, 0.456, 0.406]`, standard deviation `[0.229, 0.224, 0.225]`. This matches the supplied evaluation transform.
- Output: `[batch, 38]` logits named `output`; softmax supplies relative confidence and alternatives.
- Class order: copied exactly from the source `class_info.json` and verified against the checkpoint's 38 class names using static pickle opcode inspection (without executing its pickle); readable crop/disease labels are recorded in `supplied.manifest.json`.
- Training dataset is described as PlantVillage by the supplied source, but dataset provenance, licensing, splits actually used, training completion, and metrics have not been independently verified. The sibling data directory is empty.
- Per-class precision/recall, macro F1, calibration, unknown-image detection, and field-image performance: **unavailable**.

`supplied.onnx` is a local copy, excluded from Git. The manifest and import script are tracked. To recreate it, install `requirements-onnx.txt`, then run `scripts/import_onnx.py` with `--model`, `--classes`, and `--architecture`. Its fixed preprocessing must only be used with exports matching the documented transform. Configure `MODEL_PATH` and `MODEL_MANIFEST` to the imported files.

## Supported adapters

The manifest selects `runtime: "onnx"` or `"torchscript"` (default). ONNX Runtime uses the CPU provider and checks tensor contracts against the manifest. TorchScript requires `requirements-model.txt` and a trusted exported single-logits tensor model. Do not feed a regular training checkpoint to the TorchScript adapter. An optional SHA-256 pins artifact identity before loading.

The example manifest is an interface illustration, not a production configuration. Class order and normalization must match training. No automatic downloading or unpickling of the adjacent PyTorch checkpoint is performed.

## Limitations

Confidence/margin thresholds and exposure checks are unvalidated heuristics. They do not establish that an image contains a plant. All predictions recommend expert review; low confidence/margin or image warnings cause abstention. Healthy labels mean only that the model selected a healthy training class, not that the crop is proven disease-free. No Grad-CAM, calibrated OOD detector, field efficacy, or treatment recommendation is claimed.
