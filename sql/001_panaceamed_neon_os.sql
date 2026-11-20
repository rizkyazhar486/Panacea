-- =============================================================================
-- PanaceaMed.id OS — Canonical Neon Serverless PostgreSQL Schema (001)
-- Idempotent migration (safe to re-run across branching/staging/production).
-- Operating Doctrine: 1 Human Commander + AI Fleet · Local-First + Neon Sync.
-- =============================================================================

CREATE TABLE IF NOT EXISTS panacea_profiles (
  profile_key TEXT PRIMARY KEY DEFAULT 'rizkyazhar486',
  mrn TEXT UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'dr. Rizky Muhammad Azrissal',
  username TEXT NOT NULL UNIQUE,
  clinical_title TEXT DEFAULT 'Doctor · Founder & Lead Engineer · Digital Twin & Longevity',
  bio TEXT DEFAULT '',
  website TEXT DEFAULT 'panaceamed.id',
  avatar_url TEXT,
  avatar_initials TEXT DEFAULT 'DR',
  verified_clinician BOOLEAN NOT NULL DEFAULT TRUE,
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('patient', 'doctor', 'nurse', 'lab', 'admin', 'owner')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS panacea_family_members (
  member_key TEXT PRIMARY KEY,
  owner_profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mrn TEXT UNIQUE,
  relation TEXT,
  vaccine_reminders_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  isolated_scope BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_family_owner ON panacea_family_members(owner_profile_key);

CREATE TABLE IF NOT EXISTS panacea_gta_character_state (
  profile_key TEXT PRIMARY KEY REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  codename TEXT NOT NULL DEFAULT 'PANACEA-01',
  health_core NUMERIC(5,2) NOT NULL DEFAULT 88.00,
  stamina_core NUMERIC(5,2) NOT NULL DEFAULT 84.00,
  focus_core NUMERIC(5,2) NOT NULL DEFAULT 90.00,
  recovery_reserve NUMERIC(5,2) NOT NULL DEFAULT 82.00,
  readiness_score NUMERIC(5,2) NOT NULL DEFAULT 86.00,
  overdrive_risk NUMERIC(5,2) NOT NULL DEFAULT 14.00,
  needs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  morph_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  qr_pass_payload TEXT NOT NULL,
  barcode_payload TEXT NOT NULL,
  truth_class TEXT NOT NULL DEFAULT 'simulated' CHECK (truth_class IN ('measured', 'estimated', 'simulated', 'curated_physiology', 'retrospective')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS panacea_digital_twin_snapshots (
  id BIGSERIAL PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  twin_mode TEXT NOT NULL CHECK (twin_mode IN ('health', 'research', 'kinetic_fascia', 'gta_character')),
  biological_age_years NUMERIC(5,2),
  chronological_age_years NUMERIC(5,2),
  cardiovascular_risk_pct NUMERIC(5,2),
  metabolic_risk_pct NUMERIC(5,2),
  hs_crp_mg_l NUMERIC(6,3),
  physician_plan_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  counterfactual_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  organ_on_chip_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  truth_class TEXT NOT NULL DEFAULT 'simulated' CHECK (truth_class IN ('measured', 'estimated', 'simulated', 'curated_physiology', 'retrospective')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_twin_profile_time ON panacea_digital_twin_snapshots(profile_key, recorded_at DESC);

CREATE TABLE IF NOT EXISTS panacea_fascia_kinetic_assessments (
  id BIGSERIAL PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  posture_regime TEXT NOT NULL CHECK (posture_regime IN ('compensated', 'aligned')),
  plantar_arch_01 NUMERIC(4,3),
  rotational_mobility_01 NUMERIC(4,3),
  palatal_tongue_01 NUMERIC(4,3),
  facial_release_01 NUMERIC(4,3),
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sfl_nodes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  truth_class TEXT NOT NULL DEFAULT 'simulated' CHECK (truth_class IN ('measured', 'estimated', 'simulated', 'curated_physiology', 'retrospective')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_fascia_profile_time ON panacea_fascia_kinetic_assessments(profile_key, recorded_at DESC);

CREATE TABLE IF NOT EXISTS panacea_wearable_telemetry (
  id BIGSERIAL PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  source_device TEXT NOT NULL CHECK (source_device IN ('garmin', 'whoop', 'oura', 'amazfit', 'apple_watch', 'web_bluetooth_gatt', 'phone_rppg', 'manual')),
  metric_code TEXT NOT NULL,
  loinc_code TEXT,
  value_numeric NUMERIC(12,4),
  unit_ucum TEXT,
  truth_class TEXT NOT NULL DEFAULT 'measured' CHECK (truth_class IN ('measured', 'estimated', 'simulated', 'curated_physiology', 'retrospective')),
  captured_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_wearable_profile_metric ON panacea_wearable_telemetry(profile_key, metric_code, captured_at DESC);

CREATE TABLE IF NOT EXISTS panacea_clinical_encounters_proms (
  encounter_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  triage_level TEXT NOT NULL CHECK (triage_level IN ('self_care_ai', 'routine_hybrid', 'urgent_clinician', 'emergency')),
  proms_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary_text TEXT,
  xai_reasoning_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  icd10_codes TEXT[] NOT NULL DEFAULT '{}',
  icd11_tm1_codes TEXT[] NOT NULL DEFAULT '{}',
  fhir_bundle_json JSONB,
  clinician_signed BOOLEAN NOT NULL DEFAULT FALSE,
  clinician_reviewer TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_encounters_profile ON panacea_clinical_encounters_proms(profile_key, created_at DESC);

CREATE TABLE IF NOT EXISTS panacea_epidemic_signals (
  signal_id TEXT PRIMARY KEY,
  region_code TEXT NOT NULL,
  syndrome_category TEXT NOT NULL,
  case_velocity_index NUMERIC(8,3),
  severity TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_epidemic_region ON panacea_epidemic_signals(region_code, reported_at DESC);

CREATE TABLE IF NOT EXISTS panacea_media_assets (
  asset_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('profile_portrait', 'clinical_photo', 'biomechanics_video', 'body_scan_360', 'imaging_mpr', 'document_ref')),
  storage_uri TEXT NOT NULL,
  sha256_digest TEXT,
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent_scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_media_profile ON panacea_media_assets(profile_key, asset_kind);

CREATE TABLE IF NOT EXISTS panacea_rd_evidence_registry (
  module_id TEXT PRIMARY KEY,
  evidence_tier TEXT NOT NULL CHECK (evidence_tier IN ('E0', 'E1', 'E2', 'E3', 'E4')),
  citations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  benchmark_metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'verified_internal',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS panacea_audit_trail (
  audit_id BIGSERIAL PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('patient', 'ai_assistant', 'clinician', 'system')),
  actor_ref TEXT NOT NULL,
  profile_key TEXT,
  action_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload_digest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_audit_profile_time ON panacea_audit_trail(profile_key, created_at DESC);

CREATE TABLE IF NOT EXISTS panacea_sync_outbox (
  event_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'conflict', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_panacea_outbox_status ON panacea_sync_outbox(status, created_at ASC);
