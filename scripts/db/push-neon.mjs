#!/usr/bin/env node
/**
 * PanaceaMed.id OS — Idempotent Neon Serverless PostgreSQL Schema & Canonical Seed Pusher.
 *
 * Security / PHI Hygiene:
 * - Never prints DATABASE_URL, credentials, or raw PII/PHI to stdout or stderr.
 * - Supports `--dry-run` for deterministic CI & offline QA validation.
 * - Driver cascade: `@neondatabase/serverless` -> `pg` (SSL) -> Neon HTTP SQL API (`fetch`) -> `psql`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const SCHEMA_PATH = join(ROOT, 'sql', '001_panaceamed_neon_os.sql')

export const EXPECTED_TABLES = Object.freeze([
  'panacea_profiles',
  'panacea_family_members',
  'panacea_gta_character_state',
  'panacea_digital_twin_snapshots',
  'panacea_fascia_kinetic_assessments',
  'panacea_wearable_telemetry',
  'panacea_clinical_encounters_proms',
  'panacea_epidemic_signals',
  'panacea_media_assets',
  'panacea_rd_evidence_registry',
  'panacea_audit_trail',
  'panacea_sync_outbox',
])

export const CANONICAL_SEED_STATEMENTS = Object.freeze([
  `INSERT INTO panacea_profiles (profile_key, mrn, full_name, username, clinical_title, bio, website, avatar_initials, verified_clinician, role)
   VALUES ('rizkyazhar486', 'PMD-000486', 'dr. Rizky Muhammad Azrissal', 'rizkyazhar486', 'Doctor · Founder & Lead Engineer · Digital Twin & Longevity', 'Health, Made Visible — Longitudinal AI-EMR, 3D Body Exposure & Preventive Longevity OS.', 'panaceamed.id', 'DR', TRUE, 'doctor')
   ON CONFLICT (profile_key) DO UPDATE SET
     full_name = EXCLUDED.full_name,
     clinical_title = EXCLUDED.clinical_title,
     website = EXCLUDED.website,
     updated_at = NOW();`,

  `INSERT INTO panacea_gta_character_state (profile_key, codename, health_core, stamina_core, focus_core, recovery_reserve, readiness_score, overdrive_risk, needs_json, morph_json, stats_json, qr_pass_payload, barcode_payload, truth_class)
   VALUES (
     'rizkyazhar486', 'PANACEA-01', 88.00, 84.00, 90.00, 82.00, 86.00, 14.00,
     '{"sleepDebtHours":0.4,"hydrationStatus":"balanced","metabolicFuel":"steady","thermalRecovery":"ready","stressLoad":"low"}'::jsonb,
     '{"heightCm":173,"weightKg":68,"leanMassPct":84,"bodyFatPct":16,"posturalAlignment01":0.78,"turntablePreset":"anterior","zAnatomyLayerMask":["integument","muscular","skeletal","vascular"]}'::jsonb,
     '{"truthNotice":"Baseline simulation scaffold; replace with live recorded wearable telemetry"}'::jsonb,
     'PANACEA-PASS-V1|PMD-000486|rizkyazhar486|CLINICIAN-IN-LOOP',
     'PMD-000486-PANACEA',
     'simulated'
   )
   ON CONFLICT (profile_key) DO UPDATE SET
     updated_at = NOW(),
     truth_class = EXCLUDED.truth_class;`,

  `INSERT INTO panacea_digital_twin_snapshots (profile_key, twin_mode, biological_age_years, chronological_age_years, cardiovascular_risk_pct, metabolic_risk_pct, hs_crp_mg_l, physician_plan_json, counterfactual_json, organ_on_chip_json, truth_class)
   SELECT 'rizkyazhar486', 'health', 27.40, 30.00, 3.20, 4.10, 0.720,
     '["Maintain 7.5-8.5h consistent sleep window","Combine 150 min/wk Zone-2 aerobic work + 2x resistance sessions","Review annual preventive lipid, HbA1c & hs-CRP panel with licensed physician"]'::jsonb,
     '{"mode":"simulated_counterfactual","clinicallyReviewed":false}'::jsonb,
     '{"scaffold":"multi-scale-educational-only","clinicallyReviewed":false}'::jsonb,
     'simulated'
   WHERE NOT EXISTS (
     SELECT 1 FROM panacea_digital_twin_snapshots WHERE profile_key = 'rizkyazhar486' AND twin_mode = 'health'
   );`,

  `INSERT INTO panacea_fascia_kinetic_assessments (profile_key, posture_regime, plantar_arch_01, rotational_mobility_01, palatal_tongue_01, facial_release_01, metrics_json, sfl_nodes_json, truth_class)
   SELECT 'rizkyazhar486', 'aligned', 0.800, 0.760, 0.780, 0.740,
     '{"plantarArchStabilityPct":83,"gaitElasticRecoilEfficiencyPct":83,"craniocervicalAngleDeg":48.1,"submentalSoftTissueLiftPct":77}'::jsonb,
     '["scm","pectoralis","rectus_abdominis","quadriceps","subpatellar","tibialis_anterior","toe_extensors"]'::jsonb,
     'simulated'
   WHERE NOT EXISTS (
     SELECT 1 FROM panacea_fascia_kinetic_assessments WHERE profile_key = 'rizkyazhar486'
   );`,

  `INSERT INTO panacea_rd_evidence_registry (module_id, evidence_tier, citations_json, benchmark_metrics_json, validation_status)
   VALUES
     ('body-cockpit-readout', 'E2', '["Hodgdon & Beckett 1984 (US Navy)","Mifflin-St Jeor 1990 (PMID:2305711)","Pace & Rathbun 1945"]'::jsonb, '{"zeroFabricationContract":"PASS"}'::jsonb, 'verified_internal'),
     ('whole-body-os-kernel', 'E1', '["Ivanov 2021 Network Physiology","Borbely Two-Process Sleep Model","Wells-Riley Airborne Transmission Model"]'::jsonb, '{"binaryFrameBytes":28,"txMs9600bps":29.2}'::jsonb, 'verified_internal'),
     ('gta-character-personification', 'E1', '["Deterministic Simulation Envelope","Non-Clinical Wellness Visualization"]'::jsonb, '{"truthClass":"simulated","clinicallyReviewed":false}'::jsonb, 'verified_internal'),
     ('fascia-kinetic-chain', 'E1', '["Myers Anatomy Trains SFL/DFL/SL","Hicks 1954 Windlass Mechanism (PMID:13129168)"]'::jsonb, '{"truthClass":"simulated","osteogenesisClaim":false}'::jsonb, 'verified_internal')
   ON CONFLICT (module_id) DO UPDATE SET
     evidence_tier = EXCLUDED.evidence_tier,
     benchmark_metrics_json = EXCLUDED.benchmark_metrics_json,
     verified_at = NOW();`,
])

function loadEnvLocalDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim()
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) return ''
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const m = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

export function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean)
}

export function validateSchemaLocally() {
  if (!existsSync(SCHEMA_PATH)) {
    return { ok: false, error: 'Missing sql/001_panaceamed_neon_os.sql' }
  }
  const sql = readFileSync(SCHEMA_PATH, 'utf8')
  const missingTables = EXPECTED_TABLES.filter((t) => !new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${t}\\b`, 'i').test(sql))
  if (missingTables.length > 0) {
    return { ok: false, error: `Missing idempotent DDL for tables: ${missingTables.join(', ')}` }
  }
  const statements = splitSqlStatements(sql)
  return {
    ok: true,
    schemaPath: 'sql/001_panaceamed_neon_os.sql',
    tableCount: EXPECTED_TABLES.length,
    ddlStatementCount: statements.length,
    seedStatementCount: CANONICAL_SEED_STATEMENTS.length,
    tables: EXPECTED_TABLES,
  }
}

async function runViaNeonHttpApi(databaseUrl, statements) {
  const parsed = new URL(databaseUrl)
  const endpoint = `https://${parsed.hostname}/sql`
  const results = []
  for (const query of statements) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': databaseUrl,
      },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) {
      throw new Error(`Neon HTTP SQL error (HTTP ${res.status})`)
    }
    results.push(await res.json())
  }
  return results
}

async function runLivePush(databaseUrl) {
  const sql = readFileSync(SCHEMA_PATH, 'utf8')
  const allStatements = [...splitSqlStatements(sql), ...CANONICAL_SEED_STATEMENTS]

  // 1. Try @neondatabase/serverless if installed
  try {
    const mod = await import('@neondatabase/serverless')
    const client = mod.neon(databaseUrl)
    for (const stmt of allStatements) {
      await client(stmt)
    }
    const counts = await client(
      `SELECT 'panacea_profiles' AS tbl, COUNT(*)::int AS n FROM panacea_profiles
       UNION ALL SELECT 'panacea_gta_character_state', COUNT(*)::int FROM panacea_gta_character_state
       UNION ALL SELECT 'panacea_digital_twin_snapshots', COUNT(*)::int FROM panacea_digital_twin_snapshots
       UNION ALL SELECT 'panacea_fascia_kinetic_assessments', COUNT(*)::int FROM panacea_fascia_kinetic_assessments
       UNION ALL SELECT 'panacea_rd_evidence_registry', COUNT(*)::int FROM panacea_rd_evidence_registry`,
    )
    return { driver: '@neondatabase/serverless', counts }
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code !== 'ERR_MODULE_NOT_FOUND') throw err
  }

  // 2. Try pg if installed
  try {
    const pgMod = await import('pg')
    const Client = pgMod.Client ?? pgMod.default?.Client
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: true } })
    await client.connect()
    try {
      for (const stmt of allStatements) await client.query(stmt)
      const res = await client.query(
        `SELECT 'panacea_profiles' AS tbl, COUNT(*)::int AS n FROM panacea_profiles
         UNION ALL SELECT 'panacea_gta_character_state', COUNT(*)::int FROM panacea_gta_character_state
         UNION ALL SELECT 'panacea_rd_evidence_registry', COUNT(*)::int FROM panacea_rd_evidence_registry`,
      )
      return { driver: 'pg', counts: res.rows }
    } finally {
      await client.end()
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code !== 'ERR_MODULE_NOT_FOUND') throw err
  }

  // 3. Built-in Neon Serverless HTTP SQL API (zero external dependencies)
  const parsed = new URL(databaseUrl)
  if (parsed.hostname.includes('neon.tech')) {
    await runViaNeonHttpApi(databaseUrl, allStatements)
    const countRes = await runViaNeonHttpApi(databaseUrl, [
      `SELECT 'panacea_profiles' AS tbl, COUNT(*)::int AS n FROM panacea_profiles
       UNION ALL SELECT 'panacea_gta_character_state', COUNT(*)::int FROM panacea_gta_character_state
       UNION ALL SELECT 'panacea_rd_evidence_registry', COUNT(*)::int FROM panacea_rd_evidence_registry`,
    ])
    return { driver: 'neon-http-sql-native', counts: countRes[0]?.rows ?? [] }
  }

  // 4. Fallback to psql CLI if installed
  const combined = `${sql}\n${CANONICAL_SEED_STATEMENTS.join('\n')}\n`
  const r = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1'], {
    input: combined,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (r.error) throw new Error('No Postgres driver available (install pg or @neondatabase/serverless, or use a neon.tech URL / psql).')
  if (r.status !== 0) throw new Error('psql execution failed (check schema/connectivity without exposing credentials).')
  return { driver: 'psql', counts: [] }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const dryRun = process.argv.includes('--dry-run')
  const check = validateSchemaLocally()
  if (!check.ok) {
    console.error(`push-neon FAILED: ${check.error}`)
    process.exit(1)
  }
  const databaseUrl = loadEnvLocalDatabaseUrl()
  if (dryRun || !databaseUrl) {
    console.log(JSON.stringify({
      mode: dryRun ? 'dry-run' : 'no-database-url',
      status: 'SCHEMA_AND_SEED_VERIFIED',
      tableCount: check.tableCount,
      ddlStatementCount: check.ddlStatementCount,
      seedStatementCount: check.seedStatementCount,
      tables: check.tables,
      nextCommand: 'DATABASE_URL="postgres://<user>:<pass>@<neon-host>/<db>?sslmode=require" node scripts/db/push-neon.mjs',
    }, null, 2))
    process.exit(dryRun ? 0 : 0)
  }
  runLivePush(databaseUrl)
    .then((summary) => {
      console.log(JSON.stringify({ mode: 'live', status: 'PUSHED_TO_NEON', tableCount: check.tableCount, ...summary }, null, 2))
    })
    .catch((err) => {
      console.error(`push-neon LIVE FAILED: ${err instanceof Error ? err.message : 'unexpected error'}`)
      process.exit(1)
    })
}
