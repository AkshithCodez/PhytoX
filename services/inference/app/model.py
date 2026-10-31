import io
import json
import os
import warnings
import threading
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

def postprocess(logits, manifest: Manifest, quality: list[str]):
    values = np.asarray(logits, dtype=np.float64)
    if values.shape != (1, len(manifest.labels)) or not np.isfinite(values).all():
        raise ValueError('Invalid model output shape or values')
    values = values[0] - values[0].max()
    probs = np.exp(values) / np.exp(values).sum()
    order = np.argsort(probs)[::-1]
    predictions = [Prediction(**manifest.labels[int(i)].model_dump(), confidence=float(probs[i])) for i in order[:5]]
    uncertain = predictions[0].confidence < manifest.confidence_threshold or float(probs[order[0]] - probs[order[1]]) < manifest.margin_threshold
    return PredictionResponse(model_version=manifest.version, prediction=predictions[0], alternatives=predictions[1:],
        quality_warnings=quality, review_recommended=True, abstained=bool(uncertain or quality))

class ModelAdapter:
    def __init__(self):
        self.model = None
        self.manifest = None
        self.reason = 'model_unconfigured'
        self.lock = threading.Lock()

    def load(self):
        path, manifest_path = os.getenv('MODEL_PATH'), os.getenv('MODEL_MANIFEST')
        if not path or not manifest_path:
            return
        try:
            import torch
            with open(manifest_path, encoding='utf-8') as file:
                self.manifest = Manifest.model_validate(json.load(file))
            # Only trusted, operator-supplied TorchScript artifacts. Never user uploads.
            self.model = torch.jit.load(path, map_location='cpu').eval()
            self.reason = 'ready'
        except Exception:
            self.model = None
            self.reason = 'model_load_failed'

    @property
    def ready(self):
        return self.model is not None and self.manifest is not None

    def predict(self, image, quality):
        import torch
        if not self.ready:
            raise RuntimeError('Model unavailable')
        size = self.manifest.input_size
        pixels = np.array(image.resize((size, size), Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
        pixels = (pixels - np.array(self.manifest.mean, dtype=np.float32)) / np.array(self.manifest.std, dtype=np.float32)
        tensor = torch.from_numpy(pixels.transpose(2, 0, 1).copy()).unsqueeze(0)
        with self.lock, torch.inference_mode():
            output = self.model(tensor)
        if not isinstance(output, torch.Tensor):
            raise ValueError('Expected one logits tensor')
        return postprocess(output.detach().cpu().numpy(), self.manifest, quality)
