# PhytoX — Model Evaluation Methodology & Out-of-Distribution Safety

**Module:** `services/inference/app/classifier.py`  
**Purpose:** Agricultural Safety Barriers, Crop-Conditioning, and Abstention Logic  

---

## 1. Agricultural Domain Risk & The Need for Defense

Standard computer vision classifiers operate under a closed-set assumption: they force-map any uploaded photograph into one of their $K$ classes, even if the image is a tractor, a dog, or a completely different crop. 

In an agricultural advisory system, a tomato farmer uploading an apple leaf that gets confidently diagnosed as "Apple Scab" would receive incorrect chemical spray recommendations. PhytoX solves this through a four-stage defense:

1. **Pre-Inference Crop Selection:** The farmer selects their cultivated crop prior to leaf image acquisition.
2. **Quality & Exposure Pre-Flight:** Low-resolution images ($< 224\text{ px}$) or extreme lighting (mean brightness $< 0.15$ or $> 0.85$) trigger warnings.
3. **Crop-Conditioned Prior Filtering:** Probability distribution is restricted to diseases associated with the farmer's crop.
4. **Crop-Image Mismatch Detection:** If the unconditioned global top class belongs to a different crop and the matching probability for the selected crop is low ($< 25\%$), the system raises `crop_mismatch_warning: true` and abstains from definitive diagnosis.

---

## 2. Decision Logic Flowchart

```
Farmer selects crop C and uploads leaf image I
                    │
                    ▼
          [ Image Quality Check ]
   (Resolution >= 224x224, Brightness in [0.15, 0.85])
                    │
                    ▼
     [ MobileNetV2 ONNX Inference ]
      Raw Logits Z in R^38
                    │
                    ▼
      Global Softmax P_global = Softmax(Z)
      Global Top Prediction: (Crop_top, Disease_top) with Prob P_top
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  Crop C is Selected      Crop C is "Unknown / All"
        │                       │
        ▼                       ▼
Condition Probabilities:   Use Global Softmax
Sum(P_global in Crop C)     P_top >= 0.70 & Margin >= 0.15?
        │                       │
        ├─ Yes (Evidence >= 0.25): Normalize P_conditioned
        │   Top Conditioned Disease
        │
        └─ No (Evidence < 0.25 AND Crop_top != C):
            Trigger crop_mismatch_warning = True!
            Display "Selected crop does not match leaf"
            Mark prediction as UNCERTAIN
```

---

## 3. Mathematical Formulation of Crop Conditioning

Let $\mathcal{C}$ be the universe of 38 classes, partitioned into subsets $\mathcal{C}_{k}$ for crop $k \in \{1, \dots, 14\}$.
Given raw logits $\mathbf{z} = (z_1, \dots, z_{38})$ from MobileNetV2:

1. **Global Posterior Probability:**
   $$p(y = i \mid \mathbf{x}) = \frac{e^{z_i}}{\sum_{j=1}^{38} e^{z_j}}$$

2. **Crop Evidence Ratio:**
   $$E_k = \sum_{i \in \mathcal{C}_k} p(y = i \mid \mathbf{x})$$

3. **Conditioned Class Probability (when $E_k \ge \tau_{\text{evidence}} = 0.25$):**
   $$p(y = i \mid \mathbf{x}, \text{crop} = k) = \frac{p(y = i \mid \mathbf{x})}{E_k} \quad \text{for } i \in \mathcal{C}_k$$

4. **Abstention and Uncertainty Rule:**
   A prediction is marked uncertain (`is_uncertain = true`) if:
   $$\max_{i \in \mathcal{C}_k} p(y = i \mid \mathbf{x}, \text{crop} = k) < \tau_{\text{conf}} \quad (0.70)$$
   $$\text{OR} \quad (p_{(1)} - p_{(2)}) < \tau_{\text{margin}} \quad (0.15)$$
   $$\text{OR} \quad \text{image\_quality\_warning} = \text{true}$$
   $$\text{OR} \quad \text{crop\_mismatch\_warning} = \text{true}$$

---

## 4. Distinction Between Heuristic Defense and Universal OOD

* **What it achieves:** Effectively blocks intra-dataset cross-crop misclassifications (e.g., mistaking Potato Late Blight for Tomato Late Blight or Apple Scab).
* **Academic Limitation:** It is a domain-aware heuristic gating mechanism. It does **not** replace an open-set out-of-distribution detector (e.g., Mahalanobis distance or Energy-based OOD). If an arbitrary non-plant image has visual textures that accidentally fire tomato features with high confidence, the model may still produce a false prediction. The user interface explicitly addresses this with the mandatory disclaimer:
  > *"AI assessments are suggestions, not definitive diagnoses. Confidence is not proven accuracy."*
