import io
import json
import os
import warnings
import threading
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError, ImageStat
from .schemas import Manifest, Prediction, PredictionResponse

MAX_BYTES = 8 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000

class InvalidImage(ValueError):
    pass

def decode_image(raw: bytes):
    if not raw or len(raw) > MAX_BYTES:
        raise InvalidImage('Image must be between 1 byte and 8 MiB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as probe:
                if probe.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise InvalidImage('Only JPEG, PNG and WebP images are supported.')
                if getattr(probe, 'n_frames', 1) != 1:
                    raise InvalidImage('Animated images are not supported.')
                probe.verify()
            with Image.open(io.BytesIO(raw)) as source:
                image = ImageOps.exif_transpose(source).convert('RGB')
                image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise InvalidImage('Image cannot be safely decoded.') from exc
    if min(image.size) < 64:
        raise InvalidImage('Image dimensions must be at least 64 × 64 pixels.')
    quality = []
    if min(image.size) < 224:
        quality.append('low_resolution')
    brightness = ImageStat.Stat(image.convert('L')).mean[0]
    if brightness < 30:
        quality.append('underexposed')
    if brightness > 235:
        quality.append('overexposed')
    return image, quality

def find_matching_crop(selected: str | None, manifest: Manifest) -> str | None:
    if not selected:
        return None
    s = selected.strip().lower()
    if s in {"", "unknown", "not_sure", "not sure", "other", "none", "all", "i'm not sure", "i am not sure"}:
        return None
    unique_crops = list(dict.fromkeys(l.crop for l in manifest.labels))
    for c in unique_crops:
        if c.lower() == s:
            return c
    for c in unique_crops:
        c_low = c.lower()
        if s in c_low or c_low in s:
            return c
        if "corn" in s and "maize" in c_low:
            return c
        if "pepper" in s and "pepper" in c_low:
            return c
        if "cherry" in s and "cherry" in c_low:
            return c
    return None

def postprocess(logits, manifest: Manifest, quality: list[str], selected_crop: str | None = None):
    values = np.asarray(logits, dtype=np.float64)
    if values.shape != (1, len(manifest.labels)) or not np.isfinite(values).all():
        raise ValueError('Invalid model output shape or values')
    values = values[0] - values[0].max()
    probs = np.exp(values) / np.exp(values).sum()

    unconditioned_order = np.argsort(probs)[::-1]
    detected_crop = manifest.labels[int(unconditioned_order[0])].crop

    matched_crop = find_matching_crop(selected_crop, manifest)

    if matched_crop:
        crop_indices = [i for i, l in enumerate(manifest.labels) if l.crop == matched_crop]
        crop_evidence = float(sum(probs[i] for i in crop_indices))
        mismatch = bool(detected_crop != matched_crop and crop_evidence < 0.25)
        mismatch_msg = (
            f"You selected {matched_crop}, but the visual model detected features typical of {detected_crop} "
            f"with only {crop_evidence * 100:.1f}% crop match. Please check the leaf image or consult an expert."
            if mismatch else None
        )

        denom = crop_evidence if crop_evidence > 1e-12 else 1.0
        cond_probs = {i: probs[i] / denom for i in crop_indices}
        sorted_crop_indices = sorted(crop_indices, key=lambda idx: cond_probs[idx], reverse=True)

        top_idx = sorted_crop_indices[0]
        top_conf = float(cond_probs[top_idx])
        top_prediction = Prediction(**manifest.labels[top_idx].model_dump(), confidence=top_conf)
        alternatives = [
            Prediction(**manifest.labels[idx].model_dump(), confidence=float(cond_probs[idx]))
            for idx in sorted_crop_indices[1:5]
        ]

        if mismatch:
            uncertain = True
        elif len(sorted_crop_indices) > 1:
            margin = float(cond_probs[sorted_crop_indices[0]] - cond_probs[sorted_crop_indices[1]])
            uncertain = top_conf < manifest.confidence_threshold or margin < manifest.margin_threshold
        else:
            uncertain = top_conf < manifest.confidence_threshold

        return PredictionResponse(
            model_version=manifest.version,
            prediction=top_prediction,
            alternatives=alternatives,
            quality_warnings=quality,
            review_recommended=True,
            abstained=bool(uncertain or quality or mismatch),
            selected_crop=matched_crop,
            crop_mismatch_warning=mismatch,
            crop_confidence=crop_evidence,
            detected_crop=detected_crop,
            mismatch_message=mismatch_msg,
        )

    order = unconditioned_order
    predictions = [Prediction(**manifest.labels[int(i)].model_dump(), confidence=float(probs[i])) for i in order[:5]]
    uncertain = predictions[0].confidence < manifest.confidence_threshold or float(probs[order[0]] - probs[order[1]]) < manifest.margin_threshold
    top_crop_evidence = float(sum(probs[i] for i, l in enumerate(manifest.labels) if l.crop == detected_crop))

    return PredictionResponse(
        model_version=manifest.version,
        prediction=predictions[0],
        alternatives=predictions[1:],
        quality_warnings=quality,
        review_recommended=True,
        abstained=bool(uncertain or quality),
        selected_crop=None,
        crop_mismatch_warning=False,
        crop_confidence=top_crop_evidence,
        detected_crop=detected_crop,
        mismatch_message=None,
    )

class ModelAdapter:
    def __init__(self):
        self.model = None
        self.manifest = None
        self.reason = 'model_unconfigured'
        self.lock = threading.Lock()

    def load(self):
        self.model = None
        self.manifest = None
        self.reason = 'model_unconfigured'
        path, manifest_path = os.getenv('MODEL_PATH'), os.getenv('MODEL_MANIFEST')

        # Robust path resolution: if env vars are unset or point to non-existent paths, look in models directory
        default_dir = Path(__file__).resolve().parent.parent / 'models'
        if not path or not Path(path).exists():
            candidate = default_dir / 'supplied.onnx'
            if candidate.exists():
                path = str(candidate)

        if not manifest_path or not Path(manifest_path).exists():
            candidate_m = default_dir / 'supplied.manifest.json'
            if candidate_m.exists():
                manifest_path = str(candidate_m)

        if not path or not manifest_path or not Path(path).exists() or not Path(manifest_path).exists():
            self.reason = f'model_file_not_found: path={path}, manifest={manifest_path}'
            return

        try:
            with open(manifest_path, encoding='utf-8') as file:
                self.manifest = Manifest.model_validate(json.load(file))
            if self.manifest.sha256 and hashlib.sha256(Path(path).read_bytes()).hexdigest() != self.manifest.sha256:
                raise ValueError('Model fingerprint does not match its manifest')
            if self.manifest.runtime == 'onnx':
                import onnxruntime as ort
                options = ort.SessionOptions()
                options.intra_op_num_threads = 2
                options.inter_op_num_threads = 1
                model = ort.InferenceSession(path, sess_options=options, providers=['CPUExecutionProvider'])
                inputs, outputs = model.get_inputs(), model.get_outputs()
                expected = [3, self.manifest.input_size, self.manifest.input_size]
                def accepts_single_batch(shape):
                    return bool(shape) and (shape[0] == 1 or shape[0] is None or isinstance(shape[0], str))
                if len(inputs) != 1 or inputs[0].type != 'tensor(float)' or inputs[0].shape[1:] != expected or not accepts_single_batch(inputs[0].shape):
                    raise ValueError('Unsupported ONNX input contract')
                if len(outputs) != 1 or outputs[0].type != 'tensor(float)' or outputs[0].shape[1:] != [len(self.manifest.labels)] or not accepts_single_batch(outputs[0].shape):
                    raise ValueError('ONNX output does not match class mapping')
                self.model = model
            else:
                import torch
                # Only trusted operator-supplied TorchScript artifacts, never user uploads.
                self.model = torch.jit.load(path, map_location='cpu').eval()
            self.reason = 'ready'
        except Exception as exc:
            import logging
            logging.getLogger("uvicorn.error").error("Model loading failed: %s: %s", type(exc).__name__, exc)
            self.model = None
            self.reason = 'model_load_failed'

    @property
    def ready(self):
        return self.model is not None and self.manifest is not None

    def predict(self, image, quality, selected_crop: str | None = None):
        if not self.ready:
            raise RuntimeError('Model unavailable')
        size = self.manifest.input_size
        pixels = np.array(image.resize((size, size), Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
        pixels = (pixels - np.array(self.manifest.mean, dtype=np.float32)) / np.array(self.manifest.std, dtype=np.float32)
        batch = pixels.transpose(2, 0, 1).copy()[None, ...]
        if self.manifest.runtime == 'onnx':
            with self.lock:
                output = self.model.run(None, {self.model.get_inputs()[0].name: batch})[0]
        else:
            import torch
            with self.lock, torch.inference_mode():
                output = self.model(torch.from_numpy(batch))
            if not isinstance(output, torch.Tensor):
                raise ValueError('Expected one logits tensor')
            output = output.detach().cpu().numpy()
        return postprocess(output, self.manifest, quality, selected_crop=selected_crop)
