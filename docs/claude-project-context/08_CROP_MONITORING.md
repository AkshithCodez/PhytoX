# PhytoX — Longitudinal Crop Surveillance & Early-Warning Architecture

**Document Identifier:** `08_CROP_MONITORING.md`  
**Classification:** Temporal Surveillance & Epidemiological Logic Specification  
**Subsystem Source Files:** `apps/web/src/services/monitoring.ts`, `supabase/migrations/202611180001_...sql`  
**Algorithmic Approach:** Deterministic Spatial & Temporal Agronomic Heuristics  
**Confidence Status:** VERIFIED FROM REPOSITORY SOURCE CODE  

---

## 1. Longitudinal Surveillance Concept & Architecture

A foundational limitation of conventional plant pathology tools is their isolated, "one-shot" nature. A single diagnostic snapshot cannot answer whether a fungal blight is actively spreading, responding to fungicide treatment, or re-infecting new foliage across subsequent growth stages.

PhytoX addresses this by implementing an integrated **Longitudinal Crop Surveillance Subsystem**:
1. **Plot-Centric Data Model:** Farmers enroll distinct spatial farm parcels (`monitored_plots`) rather than treating scans as anonymous disconnected files.
2. **Fixed Cadence Scheduling:** Implements an automated twice-weekly observation schedule (Mondays and Thursdays) to establish temporal baseline data across vegetative and fruiting cycles.
3. **Deterministic Early-Warning Engine:** Evaluates incoming observations against spatiotemporal heuristic rules to detect disease recurrence and emerging regional infection clusters.
4. **Actionable Agronomic Feedback:** Connects field surveillance directly to agricultural officers, who formulate targeted treatment advisories.

---

## 2. Core Relational Data Models

Implemented in `supabase/migrations/202611180001_farmer_management_and_monitoring.sql`:

### 2.1 `public.monitored_plots`
Represents an enrolled physical land parcel:
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE).
* `name` (`text`, NOT NULL, length between 1 and 100, e.g., "North Chili Acre").
* `crop` (`text`, NOT NULL, length between 1 and 50).
* `region_id` (`uuid`, NOT NULL, References `public.regions(id)`).
* `planting_date` (`date`, NULLABLE): Date of sowing or transplantation.
* `plot_area` (`text`, default `''`, e.g., "2.5 Acres").
* `status` (`text`, NOT NULL, default `'active'`, check `status in ('active','archived')`).
* `created_at` / `updated_at` (`timestamptz`, default `now()`).

### 2.2 `public.monitoring_schedules`
Maintains surveillance cadence and dynamic due dates:
* `plot_id` (`uuid`, Primary Key, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `cadence` (`text`, NOT NULL, default `'twice_weekly'`, check `cadence in ('twice_weekly','weekly','custom')`).
* `observation_days` (`text[]`, default `array['monday','thursday']`).
* `next_due_date` (`date`, NOT NULL).
* `updated_at` (`timestamptz`, default `now()`).

### 2.3 `public.crop_observations`
Stores periodic time-series photographic entries:
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE).
* `observation_date` (`date`, NOT NULL, default `current_date`).
* `image_path` (`text`, NOT NULL): Object path in `crop-images` storage.
* `symptoms` (`text[]`, default `array[]::text[]`): Checkbox tags selected by farmer (e.g., `["yellowing", "wilting", "lesions"]`).
* `notes` (`text`, default `''`, length $\le 2000$).
* `ai_assessment` (`jsonb`, default `'{}'::jsonb`): Cached prediction snapshot from the ONNX microservice.
* `status` (`text`, NOT NULL, default `'submitted'`, check `status in ('submitted','reviewed','flagged')`).
* `created_at` (`timestamptz`, default `now()`).

### 2.4 `public.monitoring_signals`
Stores system-generated early-warning alerts:
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `region_id` (`uuid`, NOT NULL, References `public.regions(id)`).
* `signal_type` (`text`, NOT NULL, check `signal_type in ('recurrent_disease','confidence_shift','symptom_progression','regional_cluster')`).
* `severity` (`text`, NOT NULL, default `'medium'`, check `severity in ('low','medium','high')`).
* `suspected_condition` (`text`, NOT NULL).
* `notes` (`text`, NOT NULL, length between 3 and 2000).
* `status` (`text`, NOT NULL, default `'open'`, check `status in ('open','reviewed','dismissed','advisory_issued')`).
* `created_at` (`timestamptz`, default `now()`).
* `reviewed_by` (`uuid`, NULLABLE, References `public.user_profiles(id)`).
* `reviewed_at` (`timestamptz`, NULLABLE).

### 2.5 `public.monitoring_advisories`
Maintains official guidance dispatched by officers back to growers:
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `signal_id` (`uuid`, NULLABLE, References `public.monitoring_signals(id)` ON DELETE SET NULL).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `officer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `farmer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `advisory_text` (`text`, NOT NULL, length between 5 and 3000).
* `recommendations` (`jsonb`, default `'[]'::jsonb`).
* `created_at` (`timestamptz`, default `now()`).

---

## 3. Dynamic Observation Scheduling Algorithm

PhytoX implements a deterministic observation calendar based on agricultural field monitoring standards. The scheduling logic is implemented in `calculateNextDueDate()` in `apps/web/src/services/monitoring.ts`:

### Mathematical Schedule Function:
Let $d \in \{0, 1, 2, 3, 4, 5, 6\}$ represent the day of the week, where $0 = \text{Sunday}$, $1 = \text{Monday}$, and $4 = \text{Thursday}$:

$$\Delta_{\text{days}}(d) = \begin{cases}
4 - d, & \text{if } 1 \le d < 4 \quad (\text{Monday, Tuesday, Wednesday} \to \text{Thursday}) \\
4, & \text{if } d = 4 \quad (\text{Thursday} \to \text{Monday}) \\
3, & \text{if } d = 5 \quad (\text{Friday} \to \text{Monday}) \\
2, & \text{if } d = 6 \quad (\text{Saturday} \to \text{Monday}) \\
1, & \text{if } d = 0 \quad (\text{Sunday} \to \text{Monday})
\end{cases}$$

$$\text{NextDueDate} = \text{CurrentDate} + \Delta_{\text{days}}(d)$$

Whenever a farmer registers a plot or logs a new observation, the schedule record is automatically advanced to the subsequent due date.

---

## 4. Deterministic Early-Warning Signal Rules

A critical academic distinction in PhytoX is the explicit rejection of exaggerated claims regarding "AI epidemic forecasting." The system does **not** employ black-box recurrent neural networks (RNNs/LSTMs) or unverified time-series machine learning models for outbreak prediction. 

Instead, PhytoX relies on **deterministic, agronomically sound heuristic rules** executed in `recordCropObservation()` (`apps/web/src/services/monitoring.ts`):

### Rule 1: Recurrent Disease Signal (`recurrent_disease`)
* **Agronomic Rationale:** If a leaf condition is detected repeatedly on the same plot across sequential observation dates, it indicates that chemical or cultural interventions have failed, or that secondary fungal sporulation is occurring.
* **Deterministic Logic:**
  1. Extract predicted condition $C_{\text{new}}$ from `ai_assessment`.
  2. If $C_{\text{new}}$ does not contain `"healthy"`:
  3. Query the prior 2 observations on the same `plot_id` within the past 14 days:
     $$\text{PriorObs} = \{O_{k} \mid O_{k}.\text{plot\_id} = \text{PlotID} \land O_{k}.\text{date} \ge (\text{Today} - 14\text{ days})\}$$
  4. Condition:
     $$\exists O_{k} \in \text{PriorObs} \text{ such that } O_{k}.\text{disease} = C_{\text{new}}$$
  5. Action: If matched, insert a record into `public.monitoring_signals`:
     - `signal_type`: `'recurrent_disease'`
     - `severity`: `'high'`
     - `suspected_condition`: $C_{\text{new}}$
     - `notes`: *"Repeated detection of [Disease] on plot '[Plot Name]' across sequential observation dates. Immediate officer review and preventive intervention recommended."*
     - `status`: `'open'`

### Rule 2: Regional Cluster Outbreak Signal (`regional_cluster`)
* **Agronomic Rationale:** Foliar pathogens (such as Late Blight or Rusts) propagate aerially across adjacent farms under favorable humidity. Identifying multiple distinct observations of the same disease within an administrative district allows containment before widespread loss.
* **Deterministic Logic:**
  1. Retrieve all plot identifiers belonging to the same administrative district:
     $$\text{PlotIDs}_{\text{region}} = \{p.\text{id} \mid p \in \text{monitored\_plots} \land p.\text{region\_id} = \text{Plot}.\text{region\_id}\}$$
  2. Query all observations across these plots within the preceding 7 days:
     $$\text{WindowObs} = \{O \in \text{crop\_observations} \mid O.\text{plot\_id} \in \text{PlotIDs}_{\text{region}} \land O.\text{date} \ge (\text{Today} - 7\text{ days})\}$$
  3. Filter matching observations:
     $$M = \{O \in \text{WindowObs} \mid O.\text{disease} = C_{\text{new}}\}$$
  4. Condition:
     $$|M| \ge 3$$
  5. Action: If $\ge 3$ distinct observations across the district indicate the same pathology within 7 days, insert a record into `public.monitoring_signals`:
     - `signal_type`: `'regional_cluster'`
     - `severity`: `'high'`
     - `suspected_condition`: $C_{\text{new}}$
     - `notes`: *"Cluster alert: [N] distinct foliar observations indicating [Disease] in this regional zone within the last 7 days."*
     - `status`: `'open'`

---

## 5. Officer Intervention & Advisory Delivery Workflow

```
[ Incoming Observation ] ──► [ Heuristic Signal Triggered ]
                                      │
                                      ▼
                        Insert into monitoring_signals
                               (status = 'open')
                                      │
                                      ▼
                    Officer Surveillance Queue (/officer/surveillance)
                    Officer evaluates leaf imagery, plot history, farmer details
                                      │
                                      ▼
                       Formulate Targeted Field Advisory
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   Insert into monitoring_advisories         Update monitoring_signals
   (farmer_id, plot_id, advisory_text,       (status = 'advisory_issued',
    recommendations JSONB)                    reviewed_by = officer_id,
                 │                            reviewed_at = now())
                 ▼
       Farmer Advisory Inbox
       (/farmer/monitoring or /farmer/settings)
       Grower receives verified treatment steps
```

---

## 6. Real-World Limitations of the Surveillance Model

For academic rigor, the limitations of this implementation must be documented transparently:
1. **Reliance on Farmer Adherence:** The twice-weekly schedule assumes voluntary farmer compliance. If a farmer misses Monday and Thursday check-ins, temporal continuity is broken.
2. **Heuristic Simplicity:** The recurrence and clustering rules use fixed thresholds (2 sequential detections within 14 days; 3 observations within 7 days). They do not incorporate micro-climatic environmental variables (e.g., relative humidity, rainfall, canopy temperature) that influence fungal sporulation.
3. **No Automatic Spraying Actuation:** The platform provides decision-support advisories; it does not control autonomous agricultural machinery.
4. **Data Sparsity in Early Adoption:** In newly onboarded districts with few active farmers, the cluster detection threshold ($|M| \ge 3$) may not trigger even during genuine outbreaks until adoption scales.
