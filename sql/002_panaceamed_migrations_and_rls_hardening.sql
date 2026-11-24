-- =============================================================================
-- PanaceaMed.id OS — Versioned Migrations, UU PDP Tables & Hardened RLS (002)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.panacea_schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.panacea_privacy_consents (
  consent_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL REFERENCES public.panacea_profiles(profile_key) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_panacea_privacy_consents_profile
  ON public.panacea_privacy_consents(profile_key, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.panacea_data_requests (
  request_id TEXT PRIMARY KEY,
  profile_key TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'erasure', 'rectification', 'consent_withdraw')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_panacea_data_requests_profile
  ON public.panacea_data_requests(profile_key, requested_at DESC);

DO $$
DECLARE
  v_owner TEXT := current_user;
  v_rec RECORD;
  v_col TEXT;
  v_pol TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'panacea_rls_app') THEN
    CREATE ROLE panacea_rls_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  ELSE
    ALTER ROLE panacea_rls_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;

  EXECUTE format('GRANT panacea_rls_app TO %I', v_owner);
  GRANT USAGE ON SCHEMA public TO panacea_rls_app;

  FOR v_rec IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE 'panacea_%'
      AND c.relname NOT IN ('panacea_schema_migrations')
    ORDER BY c.relname
  LOOP
    SELECT a.attname INTO v_col
    FROM pg_attribute a
    WHERE a.attrelid = format('public.%I', v_rec.tbl)::regclass
      AND a.attname IN ('profile_key', 'owner_profile_key')
      AND NOT a.attisdropped
    ORDER BY CASE a.attname WHEN 'profile_key' THEN 1 ELSE 2 END
    LIMIT 1;

    IF v_col IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO panacea_rls_app', v_rec.tbl);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_rec.tbl);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_rec.tbl);

      FOR v_pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = v_rec.tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_pol, v_rec.tbl);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY pmd_tenant_isolation ON public.%I FOR ALL TO PUBLIC USING (%I = NULLIF(current_setting(''app.current_profile_key'', true), '''')) WITH CHECK (%I = NULLIF(current_setting(''app.current_profile_key'', true), ''''))',
        v_rec.tbl,
        v_col,
        v_col
      );
    ELSE
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO panacea_rls_app', v_rec.tbl);
    END IF;
  END LOOP;

  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO panacea_rls_app;
END
$$;
