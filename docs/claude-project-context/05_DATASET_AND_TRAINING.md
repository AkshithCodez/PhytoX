# PhytoX — Dataset Provenance & Training Methodology

**Document Identifier:** `05_DATASET_AND_TRAINING.md`  
**Classification:** Empirical Machine Learning & Dataset Provenance Specification  
**Dataset Source:** Kaggle (`vipoooool/new-plant-diseases-dataset`)  
**Training Execution Environment:** Google Colab Cloud Instance (NVIDIA Tesla T4 GPU)  
**Recorded Checkpoint Metric:** **96.04% Validation Accuracy** at Epoch 15  
**Confidence Status:** VERIFIED FROM REPOSITORY TRAINING SCRIPTS & ARTIFACTS  

---

## 1. Dataset Identification & Provenance

### 1.1 Dataset Origin & Benchmark Distinction
A common source of confusion in agricultural deep learning literature is the distinction between the original raw **PlantVillage** dataset and its augmented distributions. Repository analysis verifies the exact dataset utilized:

* **Primary Dataset Name:** **New Plant Diseases Dataset (Augmented)**
* **Dataset Publisher / Reference:** Vipul Patel (`vipoooool/new-plant-diseases-dataset` on Kaggle).
* **Base Benchmark:** PlantVillage project (Hughes & Salathé, 2015; Penn State University and EPFL).
* **Nature of the Dataset:** An augmented, balanced, and structured variant of the original PlantVillage corpus, curated specifically for robust transfer learning and deep neural network training.
* **Download Mechanism:** Automated via `kagglehub.dataset_download("vipoooool/new-plant-diseases-dataset")` inside `ml/notebooks/train_colab.ipynb`.

### 1.2 Exact Image Counts (Verified from Workspace Disk)
Direct enumeration of the local `Dataset/` directory in the repository establishes the exact count:
* **Training Directory (`train/`):** **70,295 images** across 38 class directories.
* **Validation Directory (`valid/`):** **17,572 images** across 38 class directories.
* **Benchmark Core Images:** $70,295 + 17,572 = \mathbf{87,867}$ **images**.
* **Test Directory (`test/test/`):** **33 standalone test images**.
* **Total Image Count:** **87,900 images**.

---

## 2. Complete Inventory of Supported Crops & 38 Classes

The model supports **14 agricultural and horticultural crops** spanning **38 distinct pathology categories** (including healthy controls), as verified in `services/inference/models/supplied.manifest.json` and `ml/models/class_info.json`:

| Crop (#) | Scientific / Common Name | Specific Disease / Condition Class Name | Label Mapping Index |
|---|---|---|---|
| **Apple** (1) | *Malus domestica* | Apple scab (*Venturia inaequalis*) | 0 |
| Apple | *Malus domestica* | Black rot (*Botryosphaeria obtusa*) | 1 |
| Apple | *Malus domestica* | Cedar apple rust (*Gymnosporangium juniperi-virginianae*) | 2 |
| Apple | *Malus domestica* | Healthy leaf | 3 |
| **Blueberry** (2) | *Vaccinium corymbosum* | Healthy leaf | 4 |
| **Cherry** (3) | *Prunus avium* | Powdery mildew (*Podosphaera clandestina*) | 5 |
| Cherry | *Prunus avium* | Healthy leaf | 6 |
| **Corn (Maize)** (4) | *Zea mays* | Cercospora leaf spot / Gray leaf spot (*Cercospora zeae-maydis*) | 7 |
| Corn (Maize) | *Zea mays* | Common rust (*Puccinia sorghi*) | 8 |
| Corn (Maize) | *Zea mays* | Northern Leaf Blight (*Exserohilum turcicum*) | 9 |
| Corn (Maize) | *Zea mays* | Healthy leaf | 10 |
| **Grape** (5) | *Vitis vinifera* | Black rot (*Guignardia bidwellii*) | 11 |
| Grape | *Vitis vinifera* | Esca / Black Measles (*Phaeoacremonium aleophilum*) | 12 |
| Grape | *Vitis vinifera* | Leaf blight / Isariopsis Leaf Spot (*Pseudocercospora cladosporioides*) | 13 |
| Grape | *Vitis vinifera* | Healthy leaf | 14 |
| **Orange** (6) | *Citrus sinensis* | Huanglongbing / Citrus greening (*Candidatus Liberibacter*) | 15 |
| **Peach** (7) | *Prunus persica* | Bacterial spot (*Xanthomonas campestris pv. pruni*) | 16 |
| Peach | *Prunus persica* | Healthy leaf | 17 |
| **Bell Pepper** (8) | *Capsicum annuum* | Bacterial spot (*Xanthomonas vesicatoria*) | 18 |
| Bell Pepper | *Capsicum annuum* | Healthy leaf | 19 |
| **Potato** (9) | *Solanum tuberosum* | Early blight (*Alternaria solani*) | 20 |
| Potato | *Solanum tuberosum* | Late blight (*Phytophthora infestans*) | 21 |
| Potato | *Solanum tuberosum* | Healthy leaf | 22 |
| **Raspberry** (10) | *Rubus idaeus* | Healthy leaf | 23 |
| **Soybean** (11) | *Glycine max* | Healthy leaf | 24 |
| **Squash** (12) | *Cucurbita pepo* | Powdery mildew (*Podosphaera fusca*) | 25 |
| **Strawberry** (13) | *Fragaria × ananassa* | Leaf scorch (*Diplocarpon earlianum*) | 26 |
| Strawberry | *Fragaria × ananassa* | Healthy leaf | 27 |
| **Tomato** (14) | *Solanum lycopersicum* | Bacterial spot (*Xanthomonas campestris*) | 28 |
| Tomato | *Solanum lycopersicum* | Early blight (*Alternaria solani*) | 29 |
| Tomato | *Solanum lycopersicum* | Late blight (*Phytophthora infestans*) | 30 |
| Tomato | *Solanum lycopersicum* | Leaf Mold (*Passalora fulva*) | 31 |
| Tomato | *Solanum lycopersicum* | Septoria leaf spot (*Septoria lycopersici*) | 32 |
| Tomato | *Solanum lycopersicum* | Spider mites / Two-spotted spider mite (*Tetranychus urticae*) | 33 |
| Tomato | *Solanum lycopersicum* | Target Spot (*Corynespora cassiicola*) | 34 |
| Tomato | *Solanum lycopersicum* | Tomato Yellow Leaf Curl Virus (TYLCV) | 35 |
| Tomato | *Solanum lycopersicum* | Tomato mosaic virus (ToMV) | 36 |
| Tomato | *Solanum lycopersicum* | Healthy leaf | 37 |

---

## 3. Data Splitting & Stratification Strategy

Implemented in `ml/src/dataset.py` (`get_data_loaders`):

1. **Stratified Splitting:** Class proportions vary widely across raw agricultural sets (some conditions have $>2,000$ images while rare rusts have $<500$). To ensure representative distributions across evaluation phases, stratified partitioning via `sklearn.model_selection.train_test_split` with a fixed seed (`random_state=42`) was applied:
   - **Training Set:** **$70\%$**
   - **Validation Set:** **$15\%$** (used for checkpoint selection and learning rate decay)
   - **Independent Test Set:** **$15\%$** (held out entirely from training)
2. **Leakage Prevention:** Splitting was performed prior to augmentation. No augmented duplicates of training images were permitted to leak into the validation or testing splits.

---

## 4. Tier-Based Data Augmentation Pipeline

To counteract class imbalance without over-saturating majority classes, `ml/src/dataset.py` implements a **Tier-Based Dual-Pipeline Augmentation** governed by a class size threshold:
$$\text{Threshold} = 500 \text{ training samples}$$

### Pipeline A: Standard Augmentation (Classes $\ge 500$ samples)
Applied to majority classes (e.g., Tomato Yellow Leaf Curl Virus, Tomato Early Blight):
* `transforms.RandomResizedCrop(224, scale=(0.8, 1.0))`
* `transforms.RandomHorizontalFlip(p=0.5)`
* `transforms.RandomRotation(degrees=15)`
* `transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1)`
* `transforms.ToTensor()`
* `transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])`

### Pipeline B: Aggressive Augmentation (Minority Classes $< 500$ samples)
Applied to rare pathologies (e.g., Potato healthy, Apple cedar rust) to synthetically expand the decision boundary:
* `transforms.RandomResizedCrop(224, scale=(0.7, 1.0))`
* `transforms.RandomHorizontalFlip(p=0.5)`
* `transforms.RandomVerticalFlip(p=0.3)`
* `transforms.RandomRotation(degrees=20)`
* `transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.15)`
* `transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=10)`
* `transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 2.0))`
* `transforms.RandomErasing(p=0.2, scale=(0.02, 0.15))` (forces model to learn localized lesion features rather than relying on global leaf contours)
* `transforms.ToTensor()`
* `transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])`

### Pipeline C: Evaluation Transform (Validation & Test)
No stochastic transformations:
* `transforms.Resize((224, 224))`
* `transforms.ToTensor()`
* `transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])`

---

## 5. Loss Function: Inverse-Frequency Class Weighting

To prevent majority classes from dominating the gradient updates, `ml/src/dataset.py` calculates inverse-frequency penalty weights for the PyTorch `nn.CrossEntropyLoss`:

$$w_{i} = \frac{N_{\text{total}}}{C \times N_{i}}$$

Where:
* $N_{\text{total}}$ = Total images in the training split.
* $C = 38$ (total classes).
* $N_{i}$ = Number of images available for class $i$.

The computed weights vector $w \in \mathbb{R}^{38}$ is stored in `ml/models/class_info.json` and passed directly into `nn.CrossEntropyLoss(weight=class_weights)`.

---

## 6. Training Configuration & Hyperparameters

Extracted from `ml/src/train.py`, `ml/src/model.py`, and `ml/notebooks/train_colab.ipynb`:

| Hyperparameter / Setting | Configured Value | Verification Source File |
|---|---|---|
| **Base Deep Learning Framework** | PyTorch 2.6+ (`torch`, `torchvision`) | `ml/src/train.py` |
| **Neural Backbone** | MobileNetV2 (Pretrained on ImageNet-1K) | `ml/src/model.py` (line 60) |
| **Backbone Layer Freezing** | Frozen during baseline epoch runs | `train.py` (`--freeze-backbone`) |
| **Total Epochs Trained** | **15 Epochs** | `ml/models/best_model.pt` (`epoch: 15`) |
| **Batch Size** | **32** | `train_colab.ipynb` (step 4) |
| **Optimizer** | **Adam** (`torch.optim.Adam`) | `train.py` (line 190) |
| **Classifier Head Learning Rate** | **$1 \times 10^{-3}$ ($0.001$)** | `train.py` (`--head-lr`) |
| **Backbone Fine-Tuning LR** | **$1 \times 10^{-4}$ ($0.0001$)** | `train.py` (`--backbone-lr`) |
| **Weight Decay ($L_{2}$ Regularization)** | **$1 \times 10^{-4}$** | `train.py` (line 55) |
| **Learning Rate Scheduler** | **ReduceLROnPlateau** | Factor = 0.5, Patience = 3 epochs, Mode = "min" |
| **Early Stopping Criterion** | Patience = 5 epochs on validation loss | `train.py` (lines 56, 250) |
| **Dropout Regularization** | 0.30 (first dense layer), 0.15 (second layer) | `ml/src/model.py` (lines 69, 72) |
| **Compute Hardware** | Google Colab NVIDIA Tesla T4 GPU (16 GB VRAM) | `train_colab.ipynb` |
| **Training Duration** | Estimated ~18–25 minutes | Colab notebook cell annotation |

---

## 7. Model Checkpoint & Evaluation Verification

### 7.1 Recorded Validation Metrics
Direct inspection of the checkpoint file `ml/models/best_model.pt` recovered the exact serialized training parameters:
* **Best Validation Accuracy:** **$96.03566009104704\%$** ($\approx \mathbf{96.04\%}$)
* **Checkpoint Epoch:** **15**
* **Saved Architecture:** `mobilenetv2`
* **Output Classes:** `38`

### 7.2 Independent Local Evaluation Status (Academic Integrity Statement)
In strict compliance with academic standards and non-negotiable verification invariants:
* The training script executed on Google Colab's ephemeral cloud environment where the ~2 GB dataset was downloaded.
* The best model weights (`best_model.pt`) and class mappings (`class_info.json`) were downloaded into the local repository.
* The local directory `Dataset/` contains the full New Plant Diseases Dataset (87,900 images).
* The reported **96.04% accuracy** represents the empirical validation accuracy logged at epoch 15 on the 15% stratified holdout split during the training session.
* No synthetic or artificially fabricated per-class confusion matrices have been generated for claims not explicitly recorded in the training history.

---

## 8. Domain Shift: Controlled Benchmark vs. Real-Field Images

An essential topic for academic discussion is the **domain gap** inherent in the PlantVillage benchmark:
1. **Laboratory / Controlled Conditions:** PlantVillage leaves were predominantly photographed against uniform gray, black, or white backgrounds under controlled diffuse lighting. Leaves were detached from the plant and centered in the frame.
2. **Real-World Agricultural Field Complexity:** Field photographs taken by farmers exhibit:
   - Natural, cluttered backgrounds (soil, weeds, overlapping adjacent leaves, farm equipment).
   - Highly variable solar lighting (harsh direct sunlight causing high-contrast specular glare, or deep shadows under dense foliage).
   - Complex multi-pathology co-infections on a single leaf blade.
3. **PhytoX Architectural Mitigations:**
   - **Foliar Crop Conditioning:** Constrains the classifier to the farmer's known crop, eliminating false positive detections of pathologies native only to unrelated crops.
   - **Sharp Center Bounding & EXIF Alignment:** Eliminates mobile orientation artifacts.
   - **Quality Rejection (Luminance Guard):** Rejects underexposed ($B < 30$) and overexposed ($B > 235$) field images before inference.
   - **Uncertainty Abstention:** Demands human agronomist review whenever prediction confidence falls below 70% or margin between top-2 classes is narrower than 15%.
