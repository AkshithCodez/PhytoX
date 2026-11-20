# Technical claim traceability

Paths refer to the application repository unless a sibling directory is named.

| Finding | Primary evidence | Observation |
|---|---|---|
| Checkpoint validation | Sibling ml/models/best_model.pt, data.pkl metadata | Epoch 15, validation accuracy 0.9603566009104704, mobilenetv2, 38 classes. |
| Model serving | services/inference/models/supplied.onnx and supplied.manifest.json | 11,573,332 bytes, SHA-256 fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4. |
| Data inventory | Dataset/ train, valid and standalone test folders | 70,295 training, 17,572 validation, 33 standalone image files. Folder names alone do not identify the exact checkpoint split. |
| Training | Sibling ml/src/model.py, dataset.py, train.py | Classification head, stratified split helper, optimizer and scheduler configuration. |
| Decision rules | services/inference/app/model.py | Output always recommends review. Abstention depends on uncertainty, crop mismatch or quality. Under/overexposure adds warnings. |
| Caching | apps/web/src/services/diagnosis.ts | Owner-bound signature includes versions. Cache signature confidence setting 0.60 differs from serving manifest 0.70. |
| Monitoring | apps/web/src/services/monitoring.ts | Either of two latest prior observations can match. No 14-day predicate. Regional query uses observation count without grouping by plot. |
| Review and image access | apps/web/src/app/api/reports/[id]/route.ts and diagnoses/route.ts | Versioned review RPC and 300-second image links on these routes. |
| Access and data model | supabase/migrations/, apps/web/tests/database/authorization.test.ts | Local schema and policy test evidence. No fresh production schema inspection. |
| Test rerun | npm test --workspace @phytox/web and python -m pytest services/inference/tests -q | 44 and 23 passed on 20 November. The latter emitted one dependency deprecation warning. |
| Browser scenarios | docs/academic-evidence/04-testing/test_execution_summary.md | Three historical passes dated 19 November. |
| Android package | apps/web/android/app/build/outputs/apk/debug/app-debug.apk | 4,118,894 bytes. |
| Worked inference example | verification/local_inference_example.json | AppleScab1.JPG evaluated by the local deployed ONNX graph with no selection, apple and tomato. |
