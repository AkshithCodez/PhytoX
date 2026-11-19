# PhytoX — Machine Learning Model Architecture Specification

**Model Name:** PlantDiseaseClassifier  
**Base Architecture:** MobileNetV2 (`torchvision.models.mobilenet_v2`)  
**Weights Provenance:** Pretrained on ImageNet-1K (`MobileNet_V2_Weights.IMAGENET1K_V1`), fine-tuned on PlantVillage  
**Deployment Format:** Open Neural Network Exchange (ONNX) v14  
**Runtime Engine:** ONNX Runtime 1.31.1 (CPU optimized execution provider)  
**File Location:** `services/inference/models/supplied.onnx`  
**File Size:** 11,573,332 bytes (~11.04 MB)  
**Model Fingerprint (SHA-256):** `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`  
**Source Code Reference:** `../ml/src/model.py` and `services/inference/app/model.py`  

---

## 1. Network Topology & Layer Hierarchy

MobileNetV2 employs inverted residual blocks with linear bottlenecks, designed for high computational efficiency on mobile and edge devices. The original 1000-class ImageNet classifier head is replaced with a custom two-stage classification head.

```
Input Image [Batch, 3, 224, 224] (float32, normalized)
      │
      ▼
MobileNetV2 Backbone (18 Inverted Residual Blocks)
      │
      ├── Depthwise Separable Convolutions (3x3 depthwise, 1x1 pointwise)
      ├── Batch Normalization & Inverted Residual Shortcuts
      └── Global Average Pooling 7x7
      │
      ▼
Penultimate Feature Vector [Batch, 1280]
      │
      ▼
Custom Classification Head:
      ├── Dropout (p = 0.30)
      ├── Fully Connected Linear Layer (1280 -> 512)
      ├── ReLU Activation
      ├── Dropout (p = 0.15)
      └── Final Classification Layer (512 -> 38)
      │
      ▼
Raw Logits [Batch, 38] (float32)
      │
      ▼
Crop-Conditioned Softmax Normalization
```

---

## 2. Input & Output Tensor Specifications

| Property | Input Tensor | Output Tensor |
|---|---|---|
| **Tensor Name** | `input` | `output` |
| **Shape** | `['batch_size', 3, 224, 224]` | `['batch_size', 38]` |
| **Data Type** | `tensor(float)` (32-bit floating point) | `tensor(float)` (32-bit floating point) |
| **Layout** | NCHW (Batch, Channels, Height, Width) | NC (Batch, Class Logits) |
| **Channel Order** | RGB | Ordered matching `class_info.json` |

---

## 3. Preprocessing & Normalization Pipeline

The model expects standard ImageNet statistical normalization:
1. **Resizing:** Input image is resized using bilinear interpolation to $224 \times 224$ pixels.
2. **Dynamic Range Scaling:** Pixel values in range $[0, 255]$ are divided by $255.0$ to produce $[0.0, 1.0]$.
3. **Z-Score Normalization:**
   $$\hat{x}_{c} = \frac{x_{c} - \mu_{c}}{\sigma_{c}}$$
   - Channel Means: $\mu_{\text{RGB}} = [0.485, 0.456, 0.406]$
   - Channel Standard Deviations: $\sigma_{\text{RGB}} = [0.229, 0.224, 0.225]$

---

## 4. Parameter Count & Computational Footprint

| Component | Total Parameters | Trainable Parameters (Phase 1) | Fine-Tuning (Top 30%) |
|---|---|---|---|
| **Backbone Features** | $2,223,872$ | 0 (Frozen) | $\approx 667,161$ |
| **Classifier Head** | $675,366$ | $675,366$ | $675,366$ |
| **Total Model** | $\mathbf{2,899,238}$ | $\mathbf{675,366}$ | $\approx \mathbf{1,342,527}$ |

* **Total Disk Size (ONNX):** 11.57 MB
* **Memory Footprint in RAM:** $\approx 45\text{ MB}$ under ONNX Runtime
* **Single-Inference FLOPs:** $\approx 300\text{ MFLOPs}$
