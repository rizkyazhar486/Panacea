-- ============================================================================
-- PanaceaMed.id OS — Migration 003: 50-User Real-World Beta Cohort & Telemetry
-- ============================================================================
-- Strictly non-PHI operational telemetry & feedback tables with idempotent DDL
-- and Neon Row-Level Security (RLS) matching app.current_profile_key.
-- ============================================================================

CREATE TABLE IF NOT EXISTS panacea_beta_feedback (
  feedback_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL,
  route_hash TEXT NOT NULL DEFAULT '/',
  rating_1_to_5 INTEGER NOT NULL CHECK (rating_1_to_5 BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('bug', 'confusing', 'slow', 'love', 'request')),
  note TEXT NOT NULL,
  viewport TEXT NOT NULL DEFAULT 'unknown',
  user_agent_short TEXT NOT NULL DEFAULT 'browser',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panacea_beta_feedback_profile_created
  ON panacea_beta_feedback (profile_key, created_at DESC);

CREATE TABLE IF NOT EXISTS panacea_beta_funnel_events (
  event_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL,
  step_name TEXT NOT NULL CHECK (
    step_name IN (
      'landed',
      'onboarded',
      'opened_body_exposure',
      'completed_scan',
      'completed_sync',
      'completed_export'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panacea_beta_funnel_profile_step
  ON panacea_beta_funnel_events (profile_key, step_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_panacea_beta_funnel_step_created
  ON panacea_beta_funnel_events (step_name, created_at DESC);

-- Neon Row-Level Security (strict profile_key scope)
ALTER TABLE panacea_beta_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_beta_feedback ON panacea_beta_feedback;
CREATE POLICY pmd_rls_beta_feedback ON panacea_beta_feedback
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));

ALTER TABLE panacea_beta_funnel_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pmd_rls_beta_funnel_events ON panacea_beta_funnel_events;
CREATE POLICY pmd_rls_beta_funnel_events ON panacea_beta_funnel_events
  USING (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''))
  WITH CHECK (profile_key = NULLIF(current_setting('app.current_profile_key', true), ''));
