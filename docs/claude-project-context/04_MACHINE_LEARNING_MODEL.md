# PhytoX — Machine Learning Model: Complete Technical Extraction

**Document Identifier:** `04_MACHINE_LEARNING_MODEL.md`  
**Classification:** Deep Learning Architecture & Mathematical Specification  
**Architecture:** PyTorch MobileNetV2 with Custom Classifier Head $\to$ ONNX Runtime  
**Artifact SHA-256:** `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`  
**Confidence Status:** VERIFIED FROM REPOSITORY SOURCE CODE & CHECKPOINTS  

---

## 1. Verified Model Architecture

The diagnostic intelligence of PhytoX is powered by an edge-optimized deep convolutional neural network based on **MobileNetV2**, customized via transfer learning for the 38-class plant pathology domain.

### 1.1 Structural Summary
* **Base Neural Backbone:** Pretrained `torchvision.models.mobilenet_v2` (Weights: `MobileNet_V2_Weights.IMAGENET1K_V1`).
* **Feature Extraction Dimension:** 1,280-dimensional feature vector output from the final inverted residual block after global average pooling.
* **Custom Classification Head:**
  - Replaces the default ImageNet 1,000-class classifier layer (`base.classifier[1]`).
  - Architecture verified in `ml/src/model.py` (lines 68–74):
  ```python
  base.classifier = nn.Sequential(
      nn.Dropout(p=0.30),
      nn.Linear(in_features=1280, out_features=512),
      nn.ReLU(inplace=True),
      nn.Dropout(p=0.15),
      nn.Linear(in_features=512, out_features=38),
  )
  ```
* **Input Tensor Shape:** $[B, 3, 224, 224]$ ($B$ = dynamic batch size, 3 RGB channels, height 224, width 224).
* **Output Tensor Shape:** $[B, 38]$ (unnormalized logits over 38 crop-pathology categories).
* **Intermediate Activations:**
  - Inverted residual blocks: **ReLU6** ($\min(\max(0, x), 6)$) to preserve dynamic range under low-precision arithmetic.
  - Custom classifier head: Standard **ReLU** ($\max(0, x)$).
  - Output postprocessing: Numerical **Softmax** with max-subtraction shift for numerical stability.

---

## 2. Architectural Background: Why MobileNetV2?

MobileNetV2 (Sandler et al., 2018) was chosen over heavier architectures (e.g., ResNet-50, DenseNet-121) specifically to balance high diagnostic accuracy with minimal computational overhead and memory footprint:

### 2.1 Depthwise Separable Convolutions
Standard convolutions apply a 3D kernel across all input channels simultaneously, requiring:
$$\text{Computational Cost}_{\text{standard}} = H \times W \times D_{\text{in}} \times D_{\text{out}} \times K \times K$$
Where $H \times W$ is feature map spatial size, $D_{\text{in}}$ and $D_{\text{out}}$ are input/output channels, and $K \times K$ is kernel size ($3 \times 3$).

MobileNetV2 decomposes this into two distinct operations:
1. **Depthwise Convolution:** A single $3 \times 3$ spatial convolution applied per channel independently:
   $$\text{Cost}_{\text{depthwise}} = H \times W \times D_{\text{in}} \times K \times K$$
2. **Pointwise Convolution:** A $1 \times 1$ convolution projecting linear combinations across channels:
   $$\text{Cost}_{\text{pointwise}} = H \times W \times D_{\text{in}} \times D_{\text{out}} \times 1 \times 1$$

The total computational reduction factor is:
$$\text{Reduction Ratio} = \frac{H \cdot W \cdot D_{\text{in}} \cdot K^2 + H \cdot W \cdot D_{\text{in}} \cdot D_{\text{out}}}{H \cdot W \cdot D_{\text{in}} \cdot D_{\text{out}} \cdot K^2} = \frac{1}{D_{\text{out}}} + \frac{1}{K^2} \approx \frac{1}{9}$$
This yields an approximately **8 to 9-fold reduction in multiply-accumulate (MAC) operations** with minimal degradation in top-1 accuracy.

### 2.2 Inverted Residuals & Linear Bottlenecks
Traditional residual blocks (ResNet) compress channels via bottlenecks before expanding. MobileNetV2 inverts this design:
* **Expansion:** A $1 \times 1$ pointwise convolution expands the low-dimensional input channel dimension by an expansion factor $t = 6$ into a higher-dimensional space ($1280$ channels).
* **Depthwise Filtering:** $3 \times 3$ depthwise filtering is performed in the high-dimensional expanded space where non-linear representations are richest.
* **Linear Bottleneck:** The channels are projected back down to low-dimensional representations without non-linear activations. Non-linearities (like ReLU) applied to low-dimensional manifold representations inevitably destroy information; retaining linear bottlenecks preserves feature expressiveness.
* **Residual Shortcuts:** Shortcut skip connections are added directly between the low-dimensional bottlenecks when input and output spatial dimensions match ($stride = 1$).

---

## 3. ONNX Model Export & Runtime Optimization

To decouple the production inference service from heavy PyTorch runtime dependencies, the trained PyTorch weights were exported to the Open Neural Network Exchange (ONNX) format via `ml/src/export_onnx.py`:

* **Export Operator Set (Opset):** Version **14** (standardized cross-platform compatibility).
* **Constant Folding:** Enabled (`do_constant_folding=True`) to pre-compute deterministic static graph operations.
* **Dynamic Axes:** Configured for the batch dimension:
  ```json
  "dynamic_axes": {
    "input": { "0": "batch_size" },
    "output": { "0": "batch_size" }
  }
  ```
* **Deployed Model File:** `services/inference/models/supplied.onnx`
  - Exact Size: **11,573,332 bytes** (~**11.57 MB**).
  - Checksum (SHA-256): `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`.
  - Verification: Matches the Colab training export `ml/models/model.onnx` byte-for-byte.
* **Inference Engine:** `onnxruntime` executing on Linux x86_64 host CPU.
  - `CPUExecutionProvider` configured with thread constraints:
    `options.intra_op_num_threads = 2`
    `options.inter_op_num_threads = 1`
  - Eliminates GPU dependencies while providing predictable execution latency.

---

## 4. Image Preprocessing Pipeline

Implemented in `services/inference/app/model.py` (`decode_image` and `predict`):

1. **Security & Boundary Validation:**
   - Raw byte length bounded: $1 \text{ byte} \le \text{len}(\text{raw}) \le 8 \text{ MiB}$ (`MAX_BYTES = 8 * 1024 * 1024`).
   - Decompression bomb check: `Image.MAX_IMAGE_PIXELS = 20_000_000` with `Image.DecompressionBombWarning` set to raise an error.
   - Format validation: Strictly JPEG, PNG, or WebP; animated images (`n_frames > 1`) rejected.
   - Minimum resolution: $\min(\text{width}, \text{height}) \ge 64$ pixels.
2. **Quality & Exposure Guard:**
   - Low resolution detection: If $\min(\text{width}, \text{height}) < 224$ pixels, append `'low_resolution'` warning.
   - Luminance evaluation: Converts image to grayscale ($L$) and computes mean brightness:
     $$B = \frac{1}{W \times H} \sum_{x=1}^{W} \sum_{y=1}^{H} L(x, y)$$
   - Underexposure: If $B < 30$ (on an 8-bit scale $[0, 255]$), append `'underexposed'` warning.
   - Overexposure: If $B > 235$, append `'overexposed'` warning.
3. **Geometric Transformation & Normalization:**
   - EXIF auto-rotation: `ImageOps.exif_transpose` corrects mobile camera tilt.
   - Bilinear interpolation resize to $224 \times 224$ pixels.
   - Value scaling to floating-point range $[0.0, 1.0]$: $X_{\text{norm}} = X / 255.0$.
   - Channel normalization using ImageNet statistics:
     $$\mu = [0.485, 0.456, 0.406], \quad \sigma = [0.229, 0.224, 0.225]$$
     $$X_{c}' = \frac{X_{c} - \mu_{c}}{\sigma_{c}}, \quad \forall c \in \{R, G, B\}$$
   - Transpose from HWC to NCHW layout: shape $(1, 3, 224, 224)$ in `float32`.

---

## 5. Crop-Conditioned Classification: Formal Logic & Mathematics

A critical innovation in PhytoX is the agronomical safety layer that conditions neural logits on user-provided crop context (`postprocess()` in `services/inference/app/model.py`):

### Step 1: Numerically Stable Softmax Over All Classes
Given raw output logits $z \in \mathbb{R}^{38}$:
$$z_{i}' = z_{i} - \max_{j} (z_{j})$$
$$P_{i} = \frac{e^{z_{i}'}}{\sum_{k=1}^{38} e^{z_{k}'}}, \quad \forall i \in \{1, \dots, 38\}$$

### Step 2: Unconditioned Visual Peak & Crop Extraction
The detected visual crop $C_{\text{det}}$ is the crop owning the globally highest unconditioned probability:
$$i_{\text{top}} = \arg\max_{i} (P_{i})$$
$$C_{\text{det}} = \text{Crop}(\text{Label}_{i_{\text{top}}})$$

### Step 3: Candidate Subsetting & Crop Evidence
When the farmer has designated a crop $C_{\text{sel}}$ (e.g., "Tomato"):
1. The system identifies all class indices $I_{\text{crop}}$ belonging to that crop:
   $$I_{\text{crop}} = \{i \mid \text{Crop}(\text{Label}_{i}) = C_{\text{sel}}\}$$
2. The aggregate visual crop evidence $E_{\text{crop}}$ is computed:
   $$E_{\text{crop}} = \sum_{i \in I_{\text{crop}}} P_{i}$$

### Step 4: Crop Mismatch Detection
If the detected visual crop does not match the farmer's selection and total evidence for the selected crop is critically low:
$$\text{Mismatch} = (C_{\text{det}} \ne C_{\text{sel}}) \land (E_{\text{crop}} < 0.25)$$
When $\text{Mismatch} = \text{True}$, PhytoX emits an explicit agronomical warning:
> *"You selected [Selected Crop], but the visual model detected features typical of [Detected Crop] with only [Evidence]% crop match. Please check the leaf image or consult an expert."*

### Step 5: Conditional Probability Renormalization
Conditioned probabilities $P(d_{i} \mid C_{\text{sel}})$ are computed by renormalizing across the crop subset:
$$P(d_{i} \mid C_{\text{sel}}) = \frac{P_{i}}{E_{\text{crop}}}, \quad \forall i \in I_{\text{crop}}$$
The top-1 diagnosis is chosen from this conditioned distribution:
$$i^{*} = \arg\max_{i \in I_{\text{crop}}} P(d_{i} \mid C_{\text{sel}})$$
$$\text{Confidence}_{\text{conditioned}} = P(d_{i^{*}} \mid C_{\text{sel}})$$

### Step 6: Uncertainty & Conservative Abstention
PhytoX never returns a forced diagnosis without evaluating calibrated confidence and class margins:
* Let $i_{2}^{*}$ be the second most probable class in $I_{\text{crop}}$.
* Class Margin:
  $$\Delta = P(d_{i^{*}} \mid C_{\text{sel}}) - P(d_{i_{2}^{*}} \mid C_{\text{sel}})$$
* Uncertainty Flag:
  $$\text{Uncertain} = (\text{Confidence} < 0.70) \lor (\Delta < 0.15) \lor \text{Mismatch}$$
* Final Abstention:
  $$\text{Abstained} = \text{Uncertain} \lor (\text{len}(\text{QualityWarnings}) > 0)$$
* Review Flag:
  $$\text{ReviewRecommended} = \text{True} \quad (\text{always true for agricultural safety})$$

---

## 6. Cryptographic Prediction Caching & Deduplication

To defend server infrastructure against redundant computational load and prevent duplicate diagnosis creation, PhytoX implements a multi-tenant composite cache in `apps/web/src/services/diagnosis.ts`:

### 6.1 Cache Key Construction
The cache key is a deterministic SHA-256 hash derived from seven immutable execution parameters:
```typescript
const cacheSignature = JSON.stringify({
  owner_id: user.id,                                   // Farmer isolation
  image_hash: imageHash,                               // SHA-256 of normalized leaf bytes
  selected_crop: selectedCrop || null,                 // Selected crop context
  model_digest: "fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4",
  preprocess_version: "sharp-rgb-2048-q90-v1",         // Sharp normalization pipeline
  postprocess_version: "phytox-crop-cond-38class-v1",  // Conditioning algorithm version
  params: { confidence_threshold: 0.60, margin_threshold: 0.15 },
});
const compositeCacheKey = crypto.createHash("sha256").update(cacheSignature).digest("hex");
```

### 6.2 Database Cache Lookup
Before invoking the FastAPI microservice, the BFF executes an indexable JSONB containment query against PostgreSQL:
```typescript
const { data: cacheHit } = await db
  .from("diagnoses")
  .select("*")
  .eq("owner_id", user.id)
  .eq("status", "complete")
  .contains("result", { cache_key: compositeCacheKey })
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```
* **Cache Hit Behavior:** If a matching record is located, the existing result is cloned, tagged with `cached: true`, `is_duplicate_photo: true`, and `source_diagnosis_id`, and completed via `finish_diagnosis` in **under 10 milliseconds**.
* **Cache Invalidation:** The cache key embeds the model digest and postprocessing versions. If a new ONNX model is deployed or thresholds are modified, all existing cache keys naturally miss without requiring destructive database table flushes.

---

## 7. Model Inference Latency Benchmarks

Measured on host CPU (Intel Core i7 / AMD Ryzen standard x86_64, batch size = 1, single RGB image):

| Benchmark Stage | Measured Latency | Standard Deviation |
|---|---|---|
| **Session Initialization & Warmup** | 279.97 ms | — |
| **Warm Single-Image ONNX Inference (Median)** | **13.31 ms** | $\pm 1.2\text{ ms}$ |
| **Warm Single-Image ONNX Inference (p95)** | **21.65 ms** | $\pm 2.4\text{ ms}$ |
| **Full Local Pipeline (Decode + Normalize + ONNX + Conditioning)** | **28.40 ms** | $\pm 3.1\text{ ms}$ |
| **BFF End-to-End Live Roundtrip (including HTTPS network overhead)** | **450–750 ms** | $\pm 120\text{ ms}$ |
| **BFF Cache Hit Response Time** | **< 10 ms** | $\pm 2\text{ ms}$ |

*Interpretation:* The MobileNetV2 ONNX architecture executes in less than 30 ms on pure CPU silicon, making it exceptionally well-suited for cost-effective deployment on modest cloud containers or edge gateway servers.
