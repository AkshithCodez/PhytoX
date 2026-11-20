# PhytoX — Complete System Diagrams Specification

**Document Identifier:** `16_SYSTEM_DIAGRAMS.md`  
**Classification:** Visual Systems Engineering & Architectural Schematics  
**Format:** Validated GitHub-Flavored Mermaid Diagram Specifications  
**Confidence Status:** VERIFIED FROM CODEBASE WORKFLOWS & SCHEMAS  

---

## 1. Overall System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Access Workspaces"]
        FarmerApp["Farmer Mobile PWA / Android APK\n(English, Telugu, Hindi)"]
        OfficerDesk["Agricultural Officer Workstation\n(Desktop Browser)"]
    end

    subgraph BFF["Next.js 16 Backend-for-Frontend (Vercel)"]
        Gateway["Route Handlers Gateway\n(/api/diagnoses, /api/reports, /api/monitoring)"]
        SharpEngine["Sharp Libvips Image Processor\n(EXIF rotate, Max 2048x2048, JPEG 90%)"]
        CacheMgr["Cryptographic Prediction Cache\n(Composite SHA-256 Key)"]
        AuthMiddleware["Session & CSRF Guard\n(SSR Cookies, Origin Check)"]
    end

    subgraph Inference["FastAPI ONNX Microservice (Render)"]
        PredictAPI["POST /v1/predict Gateway"]
        PillowGuard["Pillow & ImageStat Luminance Guard\n(Underexposure B < 30, Overexposure B > 235)"]
        ONNXEngine["ONNX Runtime CPU Engine\n(supplied.onnx, 38 Classes)"]
        CropConditioner["Foliar Crop Conditioning Engine\n(Candidate Subsetting, Evidence, Mismatch Alert)"]
    end

    subgraph Database["Supabase Cloud Platform"]
        AuthService["Supabase Auth (JWT Engine)"]
        PostgresDB[("PostgreSQL 15 Relational DB\n(13 Tables, 100% RLS Coverage)")]
        PrivateStorage[("Private S3 Storage Bucket\n(crop-images, Signed URLs)")]
    end

    FarmerApp -->|HTTPS / Multipart| Gateway
    OfficerDesk -->|HTTPS / REST| Gateway
    Gateway --> AuthMiddleware
    Gateway --> SharpEngine
    SharpEngine --> CacheMgr
    
    CacheMgr -->|Cache Miss: Dispatch Raw JPEG| PredictAPI
    PredictAPI --> PillowGuard
    PillowGuard --> ONNXEngine
    ONNXEngine --> CropConditioner
    CropConditioner -->|Prediction JSON| CacheMgr

    Gateway -->|RPC reserve_diagnosis / finish_diagnosis| PostgresDB
    Gateway -->|Private Upload / Signed Read| PrivateStorage
    AuthMiddleware -->|Verify Session JWT| AuthService
    OfficerDesk -->|Direct Supabase Query via RLS| PostgresDB
```

---

## 2. Use-Case Diagram

```mermaid
flowchart LR
    Farmer(("Smallholder Farmer"))
    Officer(("Agricultural Officer"))

    subgraph PhytoXSystem["PhytoX Platform Use Cases"]
        UC1["Select Operating Language\n(English, Telugu, Hindi)"]
        UC2["Authenticate / Register Profile"]
        UC3["Select Crop Variety\n(14 Supported Crops)"]
        UC4["Capture / Upload Leaf Photo"]
        UC5["Receive AI Pathology Diagnosis & Guidance"]
        UC6["Review Private Diagnosis History"]
        UC7["Submit Report for Officer Verification"]
        UC8["Register Farm Plot for Monitoring"]
        UC9["Submit Bi-Weekly Observations (Mon/Thu)"]
        UC10["Inspect k-Anonymized Regional Insights"]
        UC11["Receive Targeted Field Advisories"]

        UC12["Authenticate Officer Portal\n(Role Gated)"]
        UC13["Manage Farmers in District\n(Invite, Suspend, Reactivate)"]
        UC14["Inspect Pending Farmer Reports Queue"]
        UC15["Verify / Reject / Request Follow-up\n(With Clinical Notes)"]
        UC16["Inspect Regional GIS Disease Map"]
        UC17["Evaluate Outbreak Early-Warning Signals\n(Recurrence & Clusters)"]
        UC18["Issue Targeted Field Advisories"]
        UC19["Inspect Administrative Audit Trail"]
    end

    Farmer --> UC1
    Farmer --> UC2
    Farmer --> UC3
    Farmer --> UC4
    Farmer --> UC5
    Farmer --> UC6
    Farmer --> UC7
    Farmer --> UC8
    Farmer --> UC9
    Farmer --> UC10
    Farmer --> UC11

    Officer --> UC12
    Officer --> UC13
    Officer --> UC14
    Officer --> UC15
    Officer --> UC16
    Officer --> UC17
    Officer --> UC18
    Officer --> UC19
```

---

## 3. Context-Level Data Flow Diagram (DFD Level 0)

```mermaid
flowchart TD
    Farmer["Farmer Entity"]
    Officer["Agricultural Officer Entity"]
    System["PhytoX Core Platform\n(BFF, ML Engine, PostgreSQL DB)"]

    Farmer -->|"Leaf Photo, Selected Crop, Idempotency Key"| System
    Farmer -->|"Field Observation Notes, Consent, GPS Coordinates"| System
    Farmer -->|"Monitored Plot Details, Bi-Weekly Symptoms"| System

    System -->|"Conditioned Diagnosis, Confidence, Quality Guidance"| Farmer
    System -->|"Verified Diagnosis History, Field Advisories"| Farmer
    System -->|"k-Anonymized Regional Disease Summaries"| Farmer

    Officer -->|"Review Determination (Verify/Reject), Clinical Notes"| System
    Officer -->|"Farmer Administrative Updates (Invite/Suspend)"| System
    Officer -->|"Targeted Field Advisories, Outbreak Determinations"| System

    System -->|"Pending Report Queue, Signed Leaf Imagery"| Officer
    System -->|"GIS Disease Cluster Coordinates, Heatmap Data"| Officer
    System -->|"Early-Warning Outbreak Signals, Audit Logs"| Officer
```

---

## 4. DFD Level 1: Subsystem Deconstruction

```mermaid
flowchart TD
    subgraph Processes["PhytoX Core Processes"]
        P1["1.0 Image Validation & Sanitation"]
        P2["2.0 Two-Phase Diagnosis & Caching"]
        P3["3.0 Crop-Conditioned Inference Engine"]
        P4["4.0 Report Escalation & Verification"]
        P5["5.0 Longitudinal Plot Surveillance"]
        P6["6.0 Spatial & Temporal Signal Evaluator"]
        P7["7.0 Privacy-Preserving Regional Aggregator"]
    end

    subgraph DataStores["Data Stores"]
        D1[("D1: Private Storage (crop-images)")]
        D2[("D2: Diagnoses & Cache Store")]
        D3[("D3: Farmer Reports & Reviews")]
        D4[("D4: Monitored Plots & Schedules")]
        D5[("D5: Observations & Signals")]
        D6[("D6: User Profiles & Audit Logs")]
    end

    Farmer["Farmer"] -->|Uploads Leaf Photo| P1
    P1 -->|Sanitized JPEG Bytes| P2
    P2 -->|Save Raw Image| D1
    P2 -->|Check / Commit Result| D2
    P2 -->|Forward Bytes & Selected Crop| P3
    P3 -->|Conditioned Predictions| P2
    P2 -->|Render Diagnosis Result| Farmer

    Farmer -->|Submit Observation Report| P4
    P4 -->|Insert Report| D3
    Officer["Officer"] -->|Fetch Review Queue| P4
    P4 -->|Commit Review & Audit| D3
    P4 -->|Log Audit Action| D6

    Farmer -->|Register Plot & Observations| P5
    P5 -->|Update Plots & Due Dates| D4
    P5 -->|Insert Observation Photo| D5
    P5 -->|Trigger Heuristic Evaluation| P6
    P6 -->|Write Recurrence & Cluster Signals| D5
    Officer -->|Inspect Signals & Issue Advisory| P6

    D3 -->|Verified Reports (>= 3 Contributors)| P7
    P7 -->|k-Anonymized Insights| Farmer
```

---

## 5. Farmer Diagnosis Flowchart

```mermaid
flowchart TD
    Start([Farmer Starts Diagnosis]) --> StepLang[Select Language: EN, TE, HI]
    StepLang --> StepCrop[Select Crop Variety from 14-Grid]
    StepCrop --> StepPhoto[Capture / Select Leaf Photo]
    StepPhoto --> ClientVal{Valid Format & Size <= 3 MiB?}
    ClientVal -- No --> ClientErr[Display File Error Alert] --> StepPhoto
    ClientVal -- Yes --> ShowPreview[Render Leaf Preview with Tips]
    
    ShowPreview --> ClickAnalyze[Click 'Analyze Photograph']
    ClickAnalyze --> StartBeam[Activate Scanning Beam Animation]
    StartBeam --> DispatchBFF[POST /api/diagnoses with request_key UUID]
    
    DispatchBFF --> ServerSharp{Sharp Validation: Valid Image?}
    ServerSharp -- No --> ServerErr[Return HTTP 422: Invalid Image] --> StopError([Display Error])
    ServerSharp -- Yes --> ReserveDB[RPC reserve_diagnosis: Create 'processing' row]
    
    ReserveDB --> UploadS3[Upload to private storage: user_id/diag_id/image]
    UploadS3 --> CheckCache{Cache Signature Match in diagnoses.result?}
    
    CheckCache -- Hit --> ReuseResult[Clone Cached Result, Set cached=true]
    ReuseResult --> CommitDB[RPC finish_diagnosis: Status 'complete']
    
    CheckCache -- Miss --> CallML[POST /v1/predict to FastAPI Inference]
    CallML --> MLProcess[ONNX Forward Pass + Crop Conditioning]
    MLProcess --> CommitDB
    
    CommitDB --> CheckAbstain{Abstained == true?}
    CheckAbstain -- Yes --> RenderWarn[Display Assessment + Warning Banners\nMismatch / Exposure / Expert Review]
    CheckAbstain -- No --> RenderSuccess[Display Top Diagnosis + Confidence Gauge]
    
    RenderWarn --> NextAction{Farmer Next Step?}
    RenderSuccess --> NextAction
    NextAction --> SaveHistory[Retain in Private History]
    NextAction --> EscalateOfficer[Click 'Submit an observation' to Officer]
```

---

## 6. MobileNetV2 Inference Pipeline

```mermaid
flowchart TD
    InputRaw["Raw Leaf Image Bytes (JPEG/PNG/WebP)"] --> PILDecode["Pillow Image Open & EXIF Transpose"]
    PILDecode --> DecompressGuard{"Pixels <= 20 Million?"}
    DecompressGuard -- Exceeded --> ThrowBomb["Raise DecompressionBombError"]
    DecompressGuard -- Safe --> MinDim{"Min(Width, Height) >= 64px?"}
    MinDim -- No --> ThrowDim["Raise InvalidImage (<64px)"]
    MinDim -- Yes --> QualityCheck["Compute Mean Grayscale Luminance B"]

    QualityCheck --> CheckUnder{"B < 30?"}
    CheckUnder -- Yes --> FlagUnder["Append 'underexposed' warning"]
    CheckUnder -- No --> CheckOver{"B > 235?"}
    CheckOver -- Yes --> FlagOver["Append 'overexposed' warning"]
    CheckOver -- No --> Resize["Bilinear Resize to 224x224 pixels"]

    FlagUnder --> Resize
    FlagOver --> Resize
    Resize --> Scale["Scale to [0.0, 1.0]: Pixels / 255.0"]
    Scale --> Normalize["ImageNet Normalize:\n(x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]"]
    Normalize --> Transpose["Transpose HWC to NCHW Tensor [1, 3, 224, 224]"]

    Transpose --> ONNXSession["ONNX Runtime Forward Pass\n(CPU Execution Provider, 2 Threads)"]
    ONNXSession --> Logits["Raw Logits Vector z in R^38"]
    Logits --> StableSoftmax["Numerically Stable Softmax:\nP_i = exp(z_i - max(z)) / sum(exp)"]

    StableSoftmax --> GlobalPeak["Extract Detected Visual Crop: C_det = Crop(argmax P)"]
    GlobalPeak --> HasSelectedCrop{"Did Farmer Select Crop C_sel?"}

    HasSelectedCrop -- Yes --> SubsetClasses["Filter Indices I_crop where Crop == C_sel"]
    SubsetClasses --> CalcEvidence["Compute Crop Evidence: E_crop = sum(P_i) for i in I_crop"]
    CalcEvidence --> CheckMismatch{"C_det != C_sel AND E_crop < 0.25?"}
    CheckMismatch -- Yes --> FlagMismatch["Set crop_mismatch_warning = true\nuncertain = true"]
    CheckMismatch -- No --> Renormalize["Renormalize: P(d_i | C_sel) = P_i / E_crop"]
    FlagMismatch --> Renormalize

    Renormalize --> TopPred["Top-1 Conditioned Prediction: i* = argmax P(d_i | C_sel)"]
    TopPred --> CalcMargin["Margin Delta = Top1_Conf - Top2_Conf"]
    CalcMargin --> UncertaintyCheck{"Top1_Conf < 0.70 OR Delta < 0.15?"}
    UncertaintyCheck -- Yes --> SetUncertain["Set uncertain = true"]
    UncertaintyCheck -- No --> SetAbstained["abstained = uncertain OR quality_warnings OR mismatch"]
    SetUncertain --> SetAbstained

    HasSelectedCrop -- No --> GlobalPred["Top-1 Global Prediction\nTop1_Conf = max(P)"]
    GlobalPred --> SetAbstained

    SetAbstained --> ReturnResponse["Return PredictionResponse JSON"]
```

---

## 7. Authentication & Role-Based Authorization Workflow

```mermaid
flowchart TD
    User([User Attempts Access]) --> CheckCookie{Encrypted Session Cookie Present?}
    CheckCookie -- No --> RedirectLogin[Redirect to /auth/login]
    
    CheckCookie -- Yes --> DecodeJWT[Supabase Auth Decodes JWT & auth.uid]
    DecodeJWT --> FetchProfile[Query public.user_profiles where id = auth.uid]
    
    FetchProfile --> RouteTarget{Target Route?}
    
    RouteTarget -- "/farmer/*" --> CheckFarmer{role in ('farmer', 'admin')?}
    CheckFarmer -- Yes --> AllowFarmer[Allow Access to Farmer PWA]
    CheckFarmer -- No --> DenyFarmer[Redirect to /officer]

    RouteTarget -- "/officer/*" --> CheckOfficer{role in ('officer', 'admin')?}
    CheckOfficer -- Yes --> FetchJurisdiction[Query public.officer_regions where officer_id = auth.uid]
    CheckOfficer -- No --> DenyOfficer[Return HTTP 403 Forbidden / Redirect to /farmer]
    
    FetchJurisdiction --> BindScope[Bind Regional Scope: region_id in (Officer Regions)]
    BindScope --> AllowOfficer[Allow Access to Officer Command Workstation]
```

---

## 8. Farmer-to-Officer Reporting Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer (Client App)
    participant BFF as Next.js BFF (/api/reports)
    participant DB as PostgreSQL (Supabase)
    actor Officer as Agricultural Officer

    Note over Farmer: Completed Diagnosis in Hand (ID, Leaf Photo)
    Farmer->>BFF: POST /api/reports (diagnosis_id, region_id, notes, consent=true, lat, lng)
    Note over BFF: Zod reportSchema validates:<br/>consent === true, valid coordinates
    
    BFF->>DB: RPC submit_report(...)
    Note over DB: Verifies diagnosis belongs to auth.uid().<br/>Creates farmer_reports row (status='pending', version=1).
    DB-->>BFF: Return report record
    BFF-->>Farmer: Report submitted confirmation

    Note over Officer: Officer inspects /officer/reports
    Officer->>BFF: GET /api/reports?region={id}&status=pending
    BFF->>DB: SELECT * FROM farmer_reports WHERE private.can_review(region_id)
    DB-->>BFF: Scoped pending reports
    BFF-->>Officer: Render review queue with signed photo URLs

    Officer->>BFF: POST /api/reports/{id} (version=1, status="verified", notes="Confirmed Alternaria solani")
    Note over BFF: Zod reviewSchema validates:<br/>status in ('verified','rejected','follow_up'), notes 3-2000 chars
    
    BFF->>DB: RPC review_report(p_id, p_version=1, p_status, p_notes)
    Note over DB: Verifies private.can_review(region_id).<br/>Optimistic Concurrency Check: report.version == 1.<br/>Inserts officer_reviews record.<br/>Updates farmer_reports (status='verified', version=2).<br/>Inserts audit_logs record.
    DB-->>BFF: Review committed
    BFF-->>Officer: Return success response

    Farmer->>BFF: GET /api/diagnoses (or /farmer/history)
    BFF->>DB: SELECT from diagnoses join farmer_reports
    DB-->>BFF: Returns status='verified' with officer notes
    BFF-->>Farmer: Displays green 'Verified' badge & treatment advice
```

---

## 9. Crop Monitoring & Longitudinal Surveillance Workflow

```mermaid
flowchart TD
    StartPlot([Farmer Enrolls Plot]) --> InputPlot[Input Name, Crop, Region, Planting Date, Area]
    InputPlot --> SubmitPlot[POST /api/monitoring/plots]
    SubmitPlot --> CreatePlot[Insert into public.monitored_plots]
    CreatePlot --> CalcNext[calculateNextDueDate: Dynamic Mon/Thu Scheduler]
    CalcNext --> CreateSchedule[Insert into public.monitoring_schedules]
    CreateSchedule --> PlotReady([Plot Active for Surveillance])

    PlotReady --> ScheduleTimer{Is Today Monday or Thursday?}
    ScheduleTimer -- Yes --> DueAlert[Display 'Observation Due' on Plot Card]
    ScheduleTimer -- No --> WaitNext[Display Next Scheduled Due Date]

    DueAlert --> CaptureObs[Farmer Captures Periodic Foliar Photo]
    CaptureObs --> CheckSymptoms[Select Observed Symptoms: Yellowing, Spots, etc.]
    CheckSymptoms --> SubmitObs[POST /api/monitoring/observations]
    SubmitObs --> InsertObs[Insert into public.crop_observations]
    InsertObs --> AdvanceSchedule[Recalculate and Update next_due_date]
    AdvanceSchedule --> TriggerSignals{Evaluate Early-Warning Heuristic Rules}

    TriggerSignals --> Rule1{Sequential observations on same plot\ndetect identical non-healthy disease\nwithin 14 days?}
    Rule1 -- Yes --> GenRecurrent[Insert monitoring_signals:\nsignal_type='recurrent_disease', severity='high']
    Rule1 -- No --> Rule2

    GenRecurrent --> Rule2{>= 3 observations in same region\ndetect identical disease within 7 days?}
    Rule2 -- Yes --> GenCluster[Insert monitoring_signals:\nsignal_type='regional_cluster', severity='high']
    Rule2 -- No --> FinishObs([Surveillance Observation Complete])
    GenCluster --> FinishObs
```

---

## 10. Regional Outbreak Warning & Advisory Workflow

```mermaid
flowchart TD
    SignalGenerated[monitoring_signals Generated by System] --> OfficerQueue[Surfaces in Officer Queue: /officer/surveillance]
    OfficerQueue --> OfficerInspect[Officer Inspects Spatial Distribution & Leaf Photos]
    
    OfficerInspect --> Determination{Officer Action?}
    
    Determination -- Dismiss --> DismissSignal[UPDATE monitoring_signals SET status='dismissed']
    DismissSignal --> AuditDismiss[Log to audit_logs]
    
    Determination -- Formulate Advisory --> OpenAdvisoryModal[Click 'Issue Advisory']
    OpenAdvisoryModal --> WriteAdvisory[Input Advisory Text: 5-3000 chars\nStructured Treatment Steps JSON]
    WriteAdvisory --> SubmitAdvisory[POST /api/officer/monitoring]
    
    SubmitAdvisory --> InsertAdvisory[INSERT INTO public.monitoring_advisories\n(farmer_id, plot_id, advisory_text, recommendations)]
    InsertAdvisory --> UpdateSignal[UPDATE monitoring_signals SET status='advisory_issued',\nreviewed_by=auth.uid, reviewed_at=now()]
    UpdateSignal --> AuditAdvisory[Log to audit_logs]
    
    AuditAdvisory --> FarmerInbox[Advisory Surfaces in Farmer Monitoring View]
    FarmerInbox --> FarmerAction([Farmer Applies Recommended Treatment])
```

---

## 11. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    REGIONS {
        uuid id PK
        text name UK
        float latitude
        float longitude
    }

    USER_PROFILES {
        uuid id PK,FK
        text display_name
        text role
        text language
        uuid region_id FK
        text status
        uuid invited_by FK
        text phone
        text village
        text farm_size
        timestamptz created_at
    }

    OFFICER_REGIONS {
        uuid officer_id PK,FK
        uuid region_id PK,FK
    }

    DIAGNOSES {
        uuid id PK
        uuid owner_id FK
        uuid request_key
        text status
        text image_path
        jsonb result
        text error_code
        timestamptz created_at
    }

    DIAGNOSIS_PREDICTIONS {
        uuid diagnosis_id PK,FK
        smallint rank PK
        text crop
        text disease
        float confidence
    }

    FARMER_REPORTS {
        uuid id PK
        uuid owner_id FK
        uuid diagnosis_id UK,FK
        uuid region_id FK
        text crop
        text disease
        text notes
        timestamptz consent_at
        float latitude
        float longitude
        text status
        integer version
        timestamptz created_at
    }

    OFFICER_REVIEWS {
        uuid id PK
        uuid report_id FK
        uuid officer_id FK
        text status
        text notes
        timestamptz created_at
    }

    MONITORED_PLOTS {
        uuid id PK
        uuid owner_id FK
        text name
        text crop
        uuid region_id FK
        date planting_date
        text plot_area
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    MONITORING_SCHEDULES {
        uuid plot_id PK,FK
        text cadence
        text_array observation_days
        date next_due_date
        timestamptz updated_at
    }

    CROP_OBSERVATIONS {
        uuid id PK
        uuid plot_id FK
        uuid owner_id FK
        date observation_date
        text image_path
        text_array symptoms
        text notes
        jsonb ai_assessment
        text status
        timestamptz created_at
    }

    MONITORING_SIGNALS {
        uuid id PK
        uuid plot_id FK
        uuid region_id FK
        text signal_type
        text severity
        text suspected_condition
        text notes
        text status
        timestamptz created_at
        uuid reviewed_by FK
        timestamptz reviewed_at
    }

    MONITORING_ADVISORIES {
        uuid id PK
        uuid signal_id FK
        uuid plot_id FK
        uuid officer_id FK
        uuid farmer_id FK
        text advisory_text
        jsonb recommendations
        timestamptz created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        text action
        uuid record_id
        uuid region_id FK
        jsonb details
        timestamptz created_at
    }

    REGIONS ||--o{ USER_PROFILES : "contains"
    REGIONS ||--o{ OFFICER_REGIONS : "assigned_to"
    REGIONS ||--o{ FARMER_REPORTS : "located_in"
    REGIONS ||--o{ MONITORED_PLOTS : "encompasses"
    REGIONS ||--o{ MONITORING_SIGNALS : "surveils"
    REGIONS ||--o{ AUDIT_LOGS : "audits"

    USER_PROFILES ||--o{ OFFICER_REGIONS : "supervises"
    USER_PROFILES ||--o{ DIAGNOSES : "owns"
    USER_PROFILES ||--o{ FARMER_REPORTS : "submits"
    USER_PROFILES ||--o{ OFFICER_REVIEWS : "authors"
    USER_PROFILES ||--o{ MONITORED_PLOTS : "operates"
    USER_PROFILES ||--o{ CROP_OBSERVATIONS : "records"
    USER_PROFILES ||--o{ MONITORING_ADVISORIES : "receives_or_issues"
    USER_PROFILES ||--o{ AUDIT_LOGS : "triggers"

    DIAGNOSES ||--o{ DIAGNOSIS_PREDICTIONS : "yields"
    DIAGNOSES ||--o| FARMER_REPORTS : "escalated_into"

    FARMER_REPORTS ||--o{ OFFICER_REVIEWS : "reviewed_by"

    MONITORED_PLOTS ||--|| MONITORING_SCHEDULES : "governed_by"
    MONITORED_PLOTS ||--o{ CROP_OBSERVATIONS : "tracks"
    MONITORED_PLOTS ||--o{ MONITORING_SIGNALS : "generates"
    MONITORED_PLOTS ||--o{ MONITORING_ADVISORIES : "targeted_by"

    MONITORING_SIGNALS ||--o| MONITORING_ADVISORIES : "resolves_into"
```

---

## 12. Prediction Caching & Deduplication Architecture

```mermaid
flowchart TD
    InputBytes["Incoming Image File Bytes"] --> SharpSanitize["Sharp Libvips Normalization\n(Auto-rotate, Max 2048x2048, JPEG 90%)"]
    SharpSanitize --> GenHash["Compute SHA-256 Digest: imageHash"]
    
    GenHash --> BuildSig["Construct Composite Cache Signature Object:\n• owner_id: user.id\n• image_hash: imageHash\n• selected_crop: selectedCrop\n• model_digest: 'fde9536ff18a...'\n• preprocess_version: 'sharp-rgb-2048-q90-v1'\n• postprocess_version: 'phytox-crop-cond-38class-v1'\n• params: {confidence: 0.60, margin: 0.15}"]
    
    BuildSig --> HashSig["Compute compositeCacheKey = SHA256(JSON(Signature))"]
    
    HashSig --> QueryDB["SELECT * FROM diagnoses WHERE\nowner_id = user.id AND status = 'complete' AND\nresult @> {'cache_key': compositeCacheKey} LIMIT 1"]
    
    QueryDB --> CacheHitCheck{Record Found?}
    
    CacheHitCheck -- Yes (Hit) --> FormatCached["Clone Cached Result:\n• cached = true\n• is_duplicate_photo = true\n• source_diagnosis_id = hit.id\n• cache_hit_at = now()"]
    FormatCached --> QuickCommit["RPC finish_diagnosis(p_id, p_owner, cachedResult)"]
    QuickCommit --> ReturnCached["Return Result to Farmer (< 10 ms)"]

    CacheHitCheck -- No (Miss) --> DispatchInference["Dispatch POST /v1/predict to FastAPI Microservice"]
    DispatchInference --> ParseResponse["Validate Response via Zod resultSchema"]
    ParseResponse --> EmbedCacheData["Attach Cache Metadata:\n• cache_key = compositeCacheKey\n• cached = false\n• model_artifact_digest\n• is_duplicate_photo = false"]
    EmbedCacheData --> FullCommit["RPC finish_diagnosis(p_id, p_owner, resultWithCache)"]
    FullCommit --> ReturnInference["Return Result to Farmer (~600 ms)"]
```

---

## 13. Deployment Infrastructure Topology

```mermaid
flowchart TD
    subgraph Internet["Public Internet"]
        UserDevice["Farmer Smartphone / Officer Laptop"]
    end

    subgraph Vercel["Vercel Global Edge Network (CDN)"]
        Anycast["Anycast DNS & Edge TLS 1.3"]
        StaticAssets["Static Assets CDN\n(PWA Manifest, Icons, WebP, Draco Decoders, GLB Meshes)"]
        ServerlessBFF["Next.js 16 Serverless Function Runtime\n(https://phytox.vercel.app)"]
    end

    subgraph Render["Render Cloud Container Platform"]
        DockerHost["Docker Linux Container (Python 3.11-slim)"]
        UvicornASGI["Uvicorn ASGI Server (Port 8000)"]
        FastAPIEngine["FastAPI 0.115 Application"]
        ONNXRuntime["ONNX Runtime Engine (CPU Provider, 2 Threads)"]
        SuppliedONNX["supplied.onnx (11.57 MB, 38 Classes)"]
    end

    subgraph Supabase["Supabase Cloud Platform (AWS)"]
        KongGateway["Kong API Gateway & TLS Terminator"]
        GoTrue["GoTrue Authentication Engine (JWT)"]
        Postgres15[("PostgreSQL 15 Relational Instance\n(13 Tables, 22 RLS Policies)")]
        StorageS3[("S3-Compatible Object Store\n(crop-images Private Bucket)")]
    end

    UserDevice -->|HTTPS / Port 443| Anycast
    Anycast --> StaticAssets
    Anycast --> ServerlessBFF

    ServerlessBFF -->|Internal HTTPS + X-API-Key HMAC| DockerHost
    DockerHost --> UvicornASGI --> FastAPIEngine --> ONNXRuntime --> SuppliedONNX

    ServerlessBFF -->|HTTPS + JWT / Service Key| KongGateway
    KongGateway --> GoTrue
    KongGateway --> Postgres15
    KongGateway --> StorageS3
```

---

## 14. Android / Capacitor Mobile Container Architecture

```mermaid
flowchart TD
    subgraph AndroidDevice["Physical Android Smartphone"]
        Launcher["Android OS App Launcher (PhytoX Icon)"]
        
        subgraph NativeApp["PhytoX Android App (app-debug.apk, 4.12 MB)"]
            MainActivity["org.phytox.app.MainActivity\n(Extends BridgeActivity)"]
            CapacitorBridge["Capacitor 8.6.2 Native Java Bridge"]
            AndroidWebView["Android WebView (WebKit Runtime)\nandroidScheme: 'https'"]
            LocalAssets["Local Bundled Assets\n(capacitor.config.json, Splash Screen, Native Icons)"]
        end

        CameraHardware["Device Hardware: Rear Camera & Gallery"]
        GPSHardware["Device Hardware: GPS Geolocation Chip"]
    end

    subgraph RemoteCloud["Cloud Infrastructure"]
        VercelBFF["Next.js 16 Web Application & BFF\n(https://phytox.vercel.app)"]
        FastAPIML["FastAPI ONNX Inference Microservice"]
    end

    Launcher --> MainActivity
    MainActivity --> CapacitorBridge
    LocalAssets --> CapacitorBridge
    CapacitorBridge --> AndroidWebView
    
    AndroidWebView -->|HTML5 capture='environment'| CameraHardware
    AndroidWebView -->|W3C Geolocation API| GPSHardware

    AndroidWebView -->|HTTPS Allowed Navigation| VercelBFF
    VercelBFF --> FastAPIML
```
