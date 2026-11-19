-- =============================================================================
-- PanaceaMed.id OS — Legacy Governance, Validation, Consent & RLS Schema (002)
-- Idempotent migration (safe to re-run across branching/staging/production).
-- Enforces Neon Row-Level Security (RLS) via app.current_profile_key and locks
-- the permanent Humanitarian Free-Forever Core boundary.
-- =============================================================================

CREATE TABLE IF NOT EXISTS panacea_scientific_benchmarks (
  benchmark_id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES panacea_rd_evidence_registry(module_id) ON DELETE CASCADE,
  evidence_tier TEXT NOT NULL CHECK (evidence_tier IN ('E0', 'E1', 'E2', 'E3', 'E4')),
  sample_size_n INTEGER NOT NULL CHECK (sample_size_n >= 0),
  brier_score NUMERIC(6,4),
  ece_score NUMERIC(6,4),
  bland_altman_bias NUMERIC(8,4),
  anova_p_value NUMERIC(8,6),
  dataset_ref TEXT NOT NULL,
  ethics_approval_ref TEXT,
  protocol_version TEXT NOT NULL,
  reproduction_command TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panacea_benchmarks_module ON panacea_scientific_benchmarks(module_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS panacea_consent_grants (
  grant_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('care', 'personal_twin', 'anonymized_research', 'emergency_qr')),
  scope_summary TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_panacea_consent_profile ON panacea_consent_grants(profile_key, purpose);

CREATE TABLE IF NOT EXISTS panacea_commercial_entitlements (
  profile_key TEXT PRIMARY KEY REFERENCES panacea_profiles(profile_key) ON DELETE CASCADE,
  humanitarian_free_core BOOLEAN NOT NULL DEFAULT TRUE CHECK (humanitarian_free_core = TRUE),
  tier TEXT NOT NULL DEFAULT 'free_core' CHECK (tier IN ('free_core', 'pro_twin', 'clinic_saas', 'research_api')),
  personal_data_sale_allowed BOOLEAN NOT NULL DEFAULT FALSE CHECK (personal_data_sale_allowed = FALSE),
  emergency_paywall_allowed BOOLEAN NOT NULL DEFAULT FALSE CHECK (emergency_paywall_allowed = FALSE),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Neon Row-Level Security (RLS) Isolation scoped to app.current_profile_key
-- =============================================================================

ALTER TABLE panacea_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_profiles ON panacea_profiles;
CREATE POLICY pmd_rls_profiles ON panacea_profiles
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_family_members ON panacea_family_members;
CREATE POLICY pmd_rls_family_members ON panacea_family_members
  USING (owner_profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (owner_profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_gta_character_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_gta_character ON panacea_gta_character_state;
CREATE POLICY pmd_rls_gta_character ON panacea_gta_character_state
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_digital_twin_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_twin_snapshots ON panacea_digital_twin_snapshots;
CREATE POLICY pmd_rls_twin_snapshots ON panacea_digital_twin_snapshots
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_fascia_kinetic_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_fascia_kinetic ON panacea_fascia_kinetic_assessments;
CREATE POLICY pmd_rls_fascia_kinetic ON panacea_fascia_kinetic_assessments
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_wearable_telemetry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_wearable_telemetry ON panacea_wearable_telemetry;
CREATE POLICY pmd_rls_wearable_telemetry ON panacea_wearable_telemetry
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_clinical_encounters_proms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_clinical_encounters ON panacea_clinical_encounters_proms;
CREATE POLICY pmd_rls_clinical_encounters ON panacea_clinical_encounters_proms
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_media_assets ON panacea_media_assets;
CREATE POLICY pmd_rls_media_assets ON panacea_media_assets
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_audit_trail ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_audit_trail ON panacea_audit_trail;
CREATE POLICY pmd_rls_audit_trail ON panacea_audit_trail
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_sync_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_sync_outbox ON panacea_sync_outbox;
CREATE POLICY pmd_rls_sync_outbox ON panacea_sync_outbox
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_continuum_episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_continuum_episodes ON panacea_continuum_episodes;
CREATE POLICY pmd_rls_continuum_episodes ON panacea_continuum_episodes
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_consent_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_consent_grants ON panacea_consent_grants;
CREATE POLICY pmd_rls_consent_grants ON panacea_consent_grants
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_commercial_entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_commercial_entitlements ON panacea_commercial_entitlements;
CREATE POLICY pmd_rls_commercial_entitlements ON panacea_commercial_entitlements
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));
