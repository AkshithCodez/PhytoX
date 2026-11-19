# PhytoX — Model Training Provenance & Hyperparameter Specification

**Audit Source:** `../ml/notebooks/train_colab.ipynb`, `../ml/src/train.py`, `../ml/src/dataset.py`, and `../ml/models/best_model.pt`  
**Execution Environment:** Google Colab Cloud Instance  
**Hardware Accelerator:** NVIDIA Tesla T4 GPU (16 GB VRAM)  
**Host Architecture:** Linux x86_64, CUDA 12.x  
**Training Framework:** PyTorch 2.x  

---

## 1. Dataset Provenance & Stratification

* **Dataset Name:** New Plant Diseases Dataset (PlantVillage augmentation benchmark)
* **Dataset Source:** Kaggle (`vipoooool/new-plant-diseases-dataset`)
* **Total Target Classes:** 38 crop-condition classes across 14 distinct crops
* **Data Splitting Strategy:** Stratified splitting ensuring identical class distribution across splits:
  - **Training Split:** $70\%$
  - **Validation Split:** $15\%$
  - **Test Split:** $15\%$
  - **Random Seed:** `42` (`sklearn.model_selection.train_test_split(..., random_state=42)`)

### 14 Supported Crops:
Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato.

---

## 2. Data Augmentation Strategy

To counteract class imbalance, `dataset.py` implements a **Tier-Based Dual-Pipeline Augmentation**:

### Standard Augmentation (Classes with $\ge 500$ images):
- `RandomResizedCrop(224, scale=(0.8, 1.0))`
- `RandomHorizontalFlip(p=0.5)`
- `RandomRotation(degrees=15)`
- `ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1)`
- `Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)`

### Aggressive Augmentation (Minority Classes with $< 500$ images):
- `RandomResizedCrop(224, scale=(0.7, 1.0))`
- `RandomHorizontalFlip(p=0.5)`
- `RandomVerticalFlip(p=0.3)`
- `RandomRotation(degrees=20)`
- `ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.15)`
- `RandomAffine(shear=10, translate=(0.1, 0.1))`
- `GaussianBlur(kernel_size=5, sigma=(0.1, 2.0))`
- `RandomErasing(p=0.2, scale=(0.02, 0.15))`
- `Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)`

---

## 3. Loss Function & Class Weighting

Training utilized **Weighted Cross-Entropy Loss** to penalize misclassification on minority classes:
$$\text{Weight}_{i} = \frac{N_{\text{total}}}{C \times N_{i}}$$
Where $N_{\text{total}}$ is total dataset images, $C = 38$ classes, and $N_{i}$ is the count for class $i$.
Computed class weights were saved to `class_info.json`.

---

## 4. Hyperparameter Schedule & Optimization

| Hyperparameter | Value | Evidence Source |
|---|---|---|
| **Batch Size** | 32 | `train_colab.ipynb` step 4 |
| **Epochs Trained** | 15 | `best_model.pt` (`epoch: 15`) |
| **Initial Head Learning Rate** | $1 \times 10^{-3}$ ($0.001$) | `train.py` `--head-lr` |
| **Backbone Learning Rate** | $1 \times 10^{-4}$ ($0.0001$) | `train.py` `--backbone-lr` |
| **Optimizer** | Adam | `torch.optim.Adam` in `train.py` |
| **Weight Decay ($L_2$ Regularization)** | $1 \times 10^{-4}$ | `train.py` line 55 |
| **Learning Rate Scheduler** | ReduceLROnPlateau | Factor = 0.5, Patience = 3 epochs, Mode = "min" |
| **Early Stopping** | Patience = 5 epochs | `train.py` line 56 |
| **Dropout Rate** | 0.30 (first layer), 0.15 (second layer) | `model.py` lines 69, 72 |

---

## 5. Checkpoint Verification Results

Recovered directly from `../ml/models/best_model.pt`:
- **Best Recorded Validation Accuracy:** **$96.03566\%$** ($\approx 96.04\%$)
- **Best Epoch:** 15
- **Checkpoint Checksum:** Matches exported `model.onnx` and deployed `supplied.onnx`.
