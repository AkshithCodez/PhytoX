# PhytoX — Database Relationships & Referential Integrity

**Document Purpose:** Academic specification of database foreign-key constraints, cascade rules, and entity multiplicity.  

---

## 1. Entity Multiplicity & Foreign Key Matrix

| Source Entity | Foreign Key Column | Target Entity | On Delete Action | Enforced Multiplicity | Business Semantics |
|---|---|---|---|---|---|
| `user_profiles` | `id` | `auth.users(id)` | CASCADE | $1 : 1$ | Every user profile corresponds strictly to one Supabase Auth identity |
| `user_profiles` | `region_id` | `regions(id)` | NO ACTION | $N : 1$ | A farmer or officer may belong to an administrative district |
| `user_profiles` | `invited_by` | `user_profiles(id)` | SET NULL | $N : 1$ | Self-referencing link tracking which officer enrolled a farmer |
| `officer_regions`| `officer_id` | `user_profiles(id)` | CASCADE | $N : M$ (Junction) | An agricultural officer can oversee one or more regional districts |
| `officer_regions`| `region_id` | `regions(id)` | CASCADE | $N : M$ (Junction) | A region can have multiple assigned officers |
| `diagnoses` | `owner_id` | `user_profiles(id)` | RESTRICT | $N : 1$ | Every AI diagnosis is permanently bound to its farmer |
| `diagnosis_predictions` | `diagnosis_id` | `diagnoses(id)` | CASCADE | $N : 1$ | Top-5 classification scores belong to a single diagnosis instance |
| `farmer_reports` | `owner_id` | `user_profiles(id)` | RESTRICT | $N : 1$ | Report author identity |
| `farmer_reports` | `diagnosis_id` | `diagnoses(id)` | RESTRICT | $1 : 1$ (UNIQUE) | A diagnosis can only be converted into a formal officer report once |
| `farmer_reports` | `region_id` | `regions(id)` | RESTRICT | $N : 1$ | Geographic jurisdiction anchoring |
| `officer_reviews`| `report_id` | `farmer_reports(id)` | CASCADE | $N : 1$ | Review history on an escalating or contested farmer report |
| `officer_reviews`| `officer_id` | `user_profiles(id)` | RESTRICT | $N : 1$ | Reviewing officer identity |
| `monitored_plots`| `owner_id` | `user_profiles(id)` | CASCADE | $N : 1$ | Crop plots owned by a farmer |
| `monitored_plots`| `region_id` | `regions(id)` | RESTRICT | $N : 1$ | Regional anchoring of farm fields |
| `monitoring_schedules` | `plot_id` | `monitored_plots(id)` | CASCADE | $1 : 1$ | One observation schedule per plot |
| `crop_observations` | `plot_id` | `monitored_plots(id)` | CASCADE | $N : 1$ | Time-series photographic monitoring entries on a plot |
| `crop_observations` | `owner_id` | `user_profiles(id)` | CASCADE | $N : 1$ | Farmer author identity |
| `monitoring_signals` | `plot_id` | `monitored_plots(id)` | CASCADE | $N : 1$ | Plot where an epidemiological alert was flagged |
| `monitoring_signals` | `region_id` | `regions(id)` | RESTRICT | $N : 1$ | Regional grouping of signals |
| `monitoring_signals` | `reviewed_by` | `user_profiles(id)` | SET NULL | $N : 1$ | Officer evaluating the alert |
| `monitoring_advisories`| `signal_id` | `monitoring_signals(id)` | SET NULL | $N : 1$ | Alert trigger leading to an advisory |
| `monitoring_advisories`| `plot_id` | `monitored_plots(id)` | CASCADE | $N : 1$ | Farm plot targeted by the advisory |
| `monitoring_advisories`| `officer_id` | `user_profiles(id)` | RESTRICT | $N : 1$ | Dispatching officer |
| `monitoring_advisories`| `farmer_id` | `user_profiles(id)` | CASCADE | $N : 1$ | Recipient farmer |
| `audit_logs` | `actor_id` | `user_profiles(id)` | SET NULL | $N : 1$ | System compliance actor audit |
| `audit_logs` | `region_id` | `regions(id)` | SET NULL | $N : 1$ | Regional audit filter |
