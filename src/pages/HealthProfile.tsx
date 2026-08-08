import { useEffect, useRef, useState } from 'react'
import { KolomAngka } from '../components/KolomAngka'
import { simpanTeks } from '../lib/unduh'
import { bacaTeksBia, PERINTAH_BACA } from '../lib/biaGambar'
import { hariIni } from '../lib/tanggal'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconCheck, IconChevronRight } from '../components/icons'
import { api, backendEnabled, apiBaseUrl, type KatalogMetrik } from '../lib/api'
import { useStore } from '../lib/store'
import { setDemo } from '../lib/profile'
import { parseHealthFile, type ImportResult } from '../lib/healthImport'
import { mergeVitals } from '../lib/healthVitals'
import { parseWorkouts, parseHrNotifications } from '../lib/workoutImport'
import { mergeWorkouts, mergeHrNotifications } from '../lib/workoutStore'
import { diagnose, type SyncDiagnosis } from '../lib/syncDiagnostics'
import { generateInsights } from '../lib/healthInsights'
import { benchmarkVo2max, benchmarkRestingHr, benchmarkSleep, BENCHMARK_DISCLAIMER, type BenchmarkItem } from '../lib/benchmark'

// ─────────────────────────────────────────────────────────────────────────────
// Health Profile — per-user health data saved on the SERVER (keyed by account,
// so it follows the user across devices), filled manually, imported from an
// Apple Health / WHOOP export file, or copied from any wearable. Falls back to
// localStorage when the backend is offline. Keeps a dated history so the user
// can see trends, and mirrors demographics into the shared local profile so
// every calculator prefills.
// ─────────────────────────────────────────────────────────────────────────────

type Src = 'Manual' | 'WHOOP' | 'Apple Watch' | 'Garmin' | 'Samsung Health' | 'Fitbit' | 'Oura' | 'Other'
const SOURCES: Src[] = ['Manual', 'WHOOP', 'Apple Watch', 'Garmin', 'Samsung Health', 'Fitbit', 'Oura', 'Other']

interface Snapshot {
  date: string
  vo2max?: number; restingHr?: number; hrvMs?: number; recoveryPct?: number; sleepH?: number
}
interface HealthProfile {
  source: Src
  // Demographics
  age: number; sex: 'M' | 'F'; heightCm: number; weightKg: number
  // Body composition
  bodyFatPct: number; muscleMassKg: number
  // Cardio & recovery (wearable)
  vo2max: number; restingHr: number; hrvMs: number
  recoveryPct: number; strain: number
  // Sleep & activity
  sleepH: number; remH: number; deepH: number
  steps: number; activeKcal: number
  bloodPressure: string // "120/80"
  history?: Snapshot[]
  updatedAt?: string
  lastDeviceSyncAt?: string
  deviceSyncSource?: string
}
const DEF: HealthProfile = {
  source: 'Manual', age: 0, sex: 'M', heightCm: 0, weightKg: 0,
  bodyFatPct: 0, muscleMassKg: 0, vo2max: 0, restingHr: 0, hrvMs: 0,
  recoveryPct: 0, strain: 0, sleepH: 0, remH: 0, deepH: 0, steps: 0, activeKcal: 0, bloodPressure: '',
  history: [],
}
const LKEY = 'pmd_health_profile'

export function HealthProfile() {
  const { account } = useStore()
  const [p, setP] = useState<HealthProfile>(DEF)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load: server first (per-user), else local. Re-pull from the server on mount
  // AND whenever the tab regains focus, so data pushed from the phone (via the
  // health webhook) shows up automatically without a manual refresh.
  useEffect(() => {
    let alive = true
    async function load(initial: boolean) {
      let data: Partial<HealthProfile> = {}
      if (initial) { try { data = JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { /* ignore */ } }
      if (backendEnabled) {
        try { const remote = await api.getHealthProfile(); if (remote && Object.keys(remote).length) data = { ...data, ...(remote as Partial<HealthProfile>) } } catch { /* offline */ }
      }
      if (!alive) return
      // Anything the server holds — including readings pushed straight from the
      // phone by the Health Auto Export webhook — is republished to the shared
      // vitals store, so a webhook sync reaches the rest of the app too and not
      // just this form.
      mergeVitals({
        weightKg: data.weightKg, heightCm: data.heightCm, bodyFatPct: data.bodyFatPct,
        vo2max: data.vo2max, restingHr: data.restingHr, hrvMs: data.hrvMs,
        recoveryPct: data.recoveryPct, strain: data.strain, sleepH: data.sleepH,
        steps: data.steps, activeKcal: data.activeKcal,
        source: data.deviceSyncSource ?? data.source, measuredAt: data.lastDeviceSyncAt,
      })
      if (initial) { setP({ ...DEF, ...data }); setSavedAt((data as HealthProfile).updatedAt ?? null); setLoading(false) }
      else if (Object.keys(data).length) {
        // Merge server-authoritative device fields over the current form without
        // clobbering unsaved edits to unrelated fields.
        setP((cur) => ({ ...cur, ...data }))
      }
    }
    load(true)
    const onFocus = () => load(false)
    window.addEventListener('focus', onFocus)
    return () => { alive = false; window.removeEventListener('focus', onFocus) }
  }, [])

  const u = (patch: Partial<HealthProfile>) => setP((x) => ({ ...x, ...patch }))

  // Append/replace today's snapshot for the trend chart.
  function withSnapshot(cur: HealthProfile): Snapshot[] {
    const today = hariIni()
    const snap: Snapshot = {
      date: today,
      vo2max: cur.vo2max || undefined, restingHr: cur.restingHr || undefined,
      hrvMs: cur.hrvMs || undefined, recoveryPct: cur.recoveryPct || undefined, sleepH: cur.sleepH || undefined,
    }
    const prev = (cur.history ?? []).filter((s) => s.date !== today)
    return [...prev, snap].slice(-90)
  }

  async function save() {
    setSaving(true); setErr('')
    const now = new Date().toISOString()
    const history = withSnapshot(p)
    const payload = { ...p, history, updatedAt: now }
    setP(payload)
    try { localStorage.setItem(LKEY, JSON.stringify(payload)) } catch { /* ignore */ }
    // Keep the shared local demographics in sync for every calculator.
    setDemo({ age: p.age || undefined, sex: p.sex, weightKg: p.weightKg || undefined, heightCm: p.heightCm || undefined,
      vo2max: p.vo2max || undefined, restingHr: p.restingHr || undefined, hrvMs: p.hrvMs || undefined })
    if (backendEnabled) {
      try { await api.saveHealthProfile(payload as unknown as Record<string, unknown>) }
      catch { setErr('Saved on this device, but syncing to the server failed (offline). It will be kept locally automatically.') }
    }
    setSavedAt(now); setSaving(false)
  }

  const MAX_IMPORT_BYTES = 60 * 1024 * 1024 // 60 MB — big Apple Health exports can freeze the tab if loaded whole
  /**
   * Baca tangkapan layar laporan timbangan.
   *
   * Pembacaan hurufnya dikerjakan model penglihatan di server; pencocokan label
   * dan pemeriksaan satuan dikerjakan `bacaTeksBia`, yang bisa diuji tanpa
   * jaringan. Galatnya dilempar apa adanya agar pemanggil bisa membedakan
   * "AI belum aktif" dari "gambar tidak terbaca" — dua hal yang butuh saran
   * berbeda bagi pengguna.
   */
  async function bacaGambarBia(file: File): Promise<ImportResult> {
    setNote('Membaca gambar…')
    const dataUrl = await new Promise<string>((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(String(fr.result))
      fr.onerror = () => rej(new Error('read_failed'))
      fr.readAsDataURL(file)
    })
    let teks: string
    try {
      const r = await api.aiVision(dataUrl, PERINTAH_BACA)
      teks = r.text ?? ''
    } catch (e) {
      const msg = String((e as Error)?.message ?? '')
      throw new Error(/503|not_configured/.test(msg) ? 'ai_not_configured' : 'ai_failed')
    }
    return bacaTeksBia(teks)
  }

  async function onImport(file?: File) {
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      setNote(''); setErr(`File too large (${(file.size / 1048576).toFixed(0)} MB, max 60 MB). For large Apple Health exports, enter the key values manually.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setNote('Reading file…'); setErr('')
    try {
      // Gambar ditangani jalur tersendiri: aplikasi timbangan seperti Moving
      // Life sering tidak punya tombol ekspor sama sekali, jadi tangkapan layar
      // adalah SATU-SATUNYA bentuk data yang bisa dibawa keluar penggunanya.
      // Menolak gambar berarti menyuruh mereka mengetik ulang delapan belas
      // angka dari layar yang sudah ada di tangan.
      const gambar = /^image\//.test(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name)
      let r: ImportResult
      if (gambar) {
        r = await bacaGambarBia(file)
      } else {
        const text = await file.text()
        r = parseHealthFile(file.name, text)
      }
      const keys = Object.keys(r).filter((k) => k !== 'source')
      if (!keys.length) {
        setNote('')
        setErr(gambar
          ? 'Tidak ada angka yang terbaca dari gambar itu. Pastikan seluruh daftar terlihat dan tidak terpotong, lalu coba lagi.'
          : 'No recognizable data found in that file. Try export.xml (Apple Health), physiological_cycles.csv (WHOOP), or a JSON export from WHOOP/Garmin Connect.')
        return
      }
      setP((x) => ({
        ...x,
        source: (r.source as Src) ?? x.source,
        vo2max: r.vo2max ?? x.vo2max, restingHr: r.restingHr ?? x.restingHr, hrvMs: r.hrvMs ?? x.hrvMs,
        recoveryPct: r.recoveryPct ?? x.recoveryPct, strain: r.strain ?? x.strain, sleepH: r.sleepH ?? x.sleepH,
        weightKg: r.weightKg ?? x.weightKg, bodyFatPct: r.bodyFatPct ?? x.bodyFatPct,
      }))
      // Publish to the shared store so every other page (Vita Pulse, the
      // calculators, dashboards) prefills from this import immediately —
      // previously the data stopped here and the rest of the app kept its
      // hardcoded defaults.
      // Spread rather than listing fields one by one: every field on
      // ImportResult is a Vitals field, and the hand-written list silently
      // dropped each newly-parsed metric until someone remembered to add it
      // here too — which is how gait, running form and sleep stages stayed
      // invisible after they were already being parsed correctly.
      mergeVitals({ ...r, source: r.source, measuredAt: r.measuredAt })

      // Workouts and heart-rate notifications live in the same file but are not
      // "latest value of a metric", so they go to their own store instead of
      // being flattened away.
      // Tangkapan layar tidak memuat sesi latihan; lewati saja.
      const text = gambar ? '' : await file.text()
      const w = parseWorkouts(text)
      const n = parseHrNotifications(text)
      const wBaru = mergeWorkouts(w)
      const nBaru = mergeHrNotifications(n)
      const extra = [
        wBaru ? `${wBaru} latihan baru` : '',
        nBaru ? `${nBaru} peringatan denyut` : '',
      ].filter(Boolean).join(', ')

      setNote(`Filled from ${r.source}: ${keys.length} values — now shared across the app.${extra ? ` Plus ${extra}.` : ''} Review, then press Save.`)
    } catch (e) {
      setNote('')
      const m = (e as Error)?.message
      setErr(m === 'ai_not_configured'
        ? 'Membaca gambar memerlukan AI yang belum aktif di server ini. Sementara itu, isi angkanya manual di bawah.'
        : m === 'ai_failed' ? 'Gagal membaca gambar. Coba lagi, atau isi angkanya manual di bawah.'
        : 'Failed to read the file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function download(name: string, text: string, type: string) {
    void simpanTeks(text, name, type, 'Panaceamed.id')
  }
  function exportJson() {
    download(`health-data-${hariIni()}.json`, JSON.stringify(p, null, 2), 'application/json')
  }
  function exportCsv() {
    const rows = p.history ?? []
    if (!rows.length) { setErr('No history to export yet — save your data first.'); return }
    const cols: (keyof Snapshot)[] = ['date', 'vo2max', 'restingHr', 'hrvMs', 'recoveryPct', 'sleepH']
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => r[c] ?? '').join(','))].join('\n')
    download(`health-history-${hariIni()}.csv`, csv, 'text/csv')
  }

  const num = (label: string, key: keyof HealthProfile, step = 1, ph = '') => (
    <Field label={label}>
      <KolomAngka step={step} placeholder={ph}
        nilai={p[key] as number | undefined} onNilai={(n) => u({ [key]: n } as Partial<HealthProfile>)} ariaLabel={label} />
    </Field>
  )

  if (loading) return <div className="mx-auto max-w-2xl py-16 text-center text-sm text-neutral-400">Loading health data…</div>

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="My Health Data"
          subtitle={backendEnabled ? 'Saved on the server per account — follows you across all devices' : 'Saved on this device (server not active)'} />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Apple Watch auto-syncs live; Garmin and WHOOP import from a file you export and upload;
          everything else can be entered by hand. Whatever you fill in here flows straight into every
          fitness &amp; longevity calculator in the app.
        </p>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Data Source</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <button key={s} onClick={() => u({ source: s })}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (p.source === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {account && <div className="mt-2 text-[10px] text-neutral-400">Account: {account.email}</div>}
      </Card>

      {/* Import from / export to a file */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Import & Export" subtitle="Apple Health .xml · Health Auto Export .json · InBody .csv · WHOOP/Garmin .csv/.json · tangkapan layar timbangan .jpg/.png" />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          <b>Apple Watch</b> can auto-sync below. <b>Garmin and WHOOP don't offer a live sync link</b>,
          so export your data from the Garmin Connect or WHOOP app and upload the file here — the
          fields fill in automatically, and you'll see exactly what was found before saving.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          <b>Timbangan pintar (Moving Life, Xiaomi dan sekelasnya)</b> sering tidak punya tombol
          ekspor sama sekali — unggah saja <b>tangkapan layar</b> laporannya dan angkanya dibaca
          otomatis.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
          Berkas .xml/.csv/.json diproses di perangkat Anda dan tidak pernah diunggah.
          <b> Tangkapan layar berbeda:</b> gambarnya dikirim ke server untuk dibaca, karena
          pembacaan huruf memerlukan model penglihatan. Kalau laporan itu memuat nama atau hal lain
          yang tidak ingin Anda kirim, potong dulu bagian itu sebelum mengunggah.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".xml,.csv,.json,.jpg,.jpeg,.png,.webp,text/xml,text/csv,application/json,image/*" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()} className="!px-4">Choose export file…</Button>
          <button onClick={exportJson} className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200">Download JSON</button>
          <button onClick={exportCsv} className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200">Download history CSV</button>
          {note && <span className="w-full text-[11px] font-semibold text-brand-dark">{note}</span>}
        </div>
      </Card>

      {backendEnabled && <AutoSyncCard />}
      <SyncDiagnosticsCard />

      {p.lastDeviceSyncAt && <DeviceSyncSummary profile={p} />}

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Demographics" subtitle="The basis for all calculations" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('Age', 'age', 1, 'e.g. 26')}
          <Field label="Sex">
            <select className={inputClass} value={p.sex} onChange={(e) => u({ sex: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {num('Height (cm)', 'heightCm', 1, 'e.g. 170')}
          {num('Weight (kg)', 'weightKg', 0.1, 'e.g. 68')}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Cardio, Recovery & HRV" subtitle="From a watch/ring or a test" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('VO₂max (ml/kg/min)', 'vo2max', 0.1, 'e.g. 42')}
          {num('Resting HR (bpm)', 'restingHr', 1, 'e.g. 58')}
          {num('HRV (ms)', 'hrvMs', 1, 'e.g. 65')}
          {num('Recovery (%) — WHOOP', 'recoveryPct', 1, '0-100')}
          {num('Strain (0-21) — WHOOP', 'strain', 0.1, '0-21')}
          <Field label="Blood Pressure"><input className={inputClass} placeholder="120/80" value={p.bloodPressure} onChange={(e) => u({ bloodPressure: e.target.value })} /></Field>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Sleep & Activity" subtitle="Daily snapshot" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('Total sleep (hours)', 'sleepH', 0.1, 'e.g. 7.5')}
          {num('REM (hours)', 'remH', 0.1)}
          {num('Deep/N3 (hours)', 'deepH', 0.1)}
          {num('Steps', 'steps', 1, 'e.g. 8000')}
          {num('Active calories', 'activeKcal', 1)}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Body Composition" subtitle="From a smart scale / InBody" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('Body fat (%)', 'bodyFatPct', 0.1, 'e.g. 18')}
          {num('Muscle mass (kg)', 'muscleMassKg', 0.1)}
        </div>
      </Card>

      <InsightCard history={p.history ?? []} />
      <BenchmarkCard profile={p} />
      <TrendChart history={p.history ?? []} />

      <div className="sticky bottom-4 z-10">
        <Card className="!p-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0 text-[11px] text-neutral-500">
            {savedAt ? <span className="flex items-center gap-1 font-semibold text-brand-dark"><IconCheck size={13} /> Saved {new Date(savedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> : 'Not saved yet'}
            {err && <span className="mt-0.5 block text-amber-600">{err}</span>}
          </div>
          <Button onClick={save} disabled={saving} className="shrink-0">{saving ? 'Saving…' : 'Save'}</Button>
        </Card>
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-3 text-center text-[11px] leading-relaxed text-brand-dark">
        {backendEnabled
          ? 'Your data is stored securely on the server per account — log in on another device and it follows you. Not diagnostic medical data; for education & personal tracking.'
          : 'Server not active — data is stored locally on this device. Enable the backend (VITE_API_URL) to sync across devices.'}
        <div className="mt-1">
          <Badge tone="brand">Source: {p.source}</Badge>
        </div>
      </div>
    </div>
  )
}

// Rule-based coaching nudges from the user's own history — no AI/LLM call, so
// it's free and instant. See lib/healthInsights.ts for the rules.
function InsightCard({ history }: { history: Snapshot[] }) {
  const insights = generateInsights(history)
  const toneClass: Record<string, string> = {
    brand: 'border-brand/20 bg-brand-50/60 text-brand-dark',
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
    low: 'border-amber-200 bg-amber-50 text-amber-700',
    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  }
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Automatic Insights" subtitle="From your own data trends — free, no AI" />
      <div className="mt-3 space-y-2">
        {insights.map((ins) => (
          <div key={ins.id} className={`rounded-xl border p-3 ${toneClass[ins.tone]}`}>
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">{ins.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-bold">{ins.title}</div>
                <p className="mt-0.5 text-[12px] leading-relaxed opacity-90">{ins.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// "See how you compare" — percentile/category estimate against published
// population norms (ACSM/Cooper), same evidence basis already used elsewhere
// in the app. Only renders for metrics the user has actually filled in.
function BenchmarkCard({ profile }: { profile: HealthProfile }) {
  if (!profile.age || !profile.sex) return null
  const items: BenchmarkItem[] = []
  if (profile.vo2max > 0) items.push(benchmarkVo2max(profile.vo2max, profile.age, profile.sex))
  if (profile.restingHr > 0) items.push(benchmarkRestingHr(profile.restingHr))
  if (profile.sleepH > 0) items.push(benchmarkSleep(profile.sleepH))
  if (!items.length) return null

  const barPct: Record<string, number> = {}
  items.forEach((it) => {
    const m = it.percentileLabel.match(/P(\d+)/)
    barPct[it.key] = m ? +m[1] : it.tone === 'brand' ? 85 : it.tone === 'low' ? 60 : it.tone === 'critical' ? 15 : 40
  })

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Compare with the General Population" subtitle="Estimate based on age & sex norms" />
      <div className="mt-3 space-y-4">
        {items.map((it) => (
          <div key={it.key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-ink">{it.label}: {it.value}{it.unit === 'jam' ? ' hours' : ` ${it.unit}`}</span>
              <span className="font-semibold text-neutral-500">{it.categoryLabel}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className={`h-full rounded-full ${it.tone === 'brand' ? 'bg-brand' : it.tone === 'critical' ? 'bg-rose-400' : it.tone === 'low' ? 'bg-amber-400' : 'bg-neutral-400'}`}
                style={{ width: `${Math.max(4, Math.min(100, barPct[it.key]))}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">{it.percentileLabel} · {it.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">{BENCHMARK_DISCLAIMER}</p>
    </Card>
  )
}

// Trend of the key longevity/fitness metrics across saved snapshots.
function TrendChart({ history }: { history: Snapshot[] }) {
  if (history.length < 2) {
    return (
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Trends" subtitle="Chart appears after ≥2 saves" />
        <p className="mt-1 text-[11px] text-neutral-500">Save your data regularly (e.g. every morning) to track your VO₂max, HRV, and resting HR over time.</p>
      </Card>
    )
  }
  const data = history.map((s) => ({ ...s, label: new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }))
  const series = [
    { key: 'vo2max', name: 'VO₂max', color: '#00BF63' },
    { key: 'hrvMs', name: 'HRV (ms)', color: '#6366f1' },
    { key: 'restingHr', name: 'Resting HR', color: '#f59e0b' },
  ] as const
  const active = series.filter((s) => data.some((d) => (d as unknown as Record<string, number>)[s.key]))
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Trends" subtitle={`${history.length} records saved`} />
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #eee' }} />
            {active.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {active.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}
          </span>
        ))}
      </div>
    </Card>
  )
}

// Sync Apple Watch/iPhone health data automatically via the "Health Auto
// Export" app (HealthyApps) — a third-party app that reads HealthKit and POSTs
// a JSON export to a URL on a schedule. A website can't read HealthKit
// directly (Apple restricts it to native apps), so this webhook is the closest
// thing to "auto-sync" without building a companion iOS app.
// Shows the data that arrived automatically from the user's device (via the
// health webhook) — a confirmation that the sync worked and a live readout of
// every processed metric, so device data is visibly "displayed & processed
// automatically" the moment it's pushed, no manual entry.
function DeviceSyncSummary({ profile }: { profile: HealthProfile }) {
  // Dulu kartu ini menampilkan delapan angka yang ditulis tangan satu per satu,
  // sehingga metrik yang baru dikenali server tidak akan pernah muncul di sini
  // tanpa mengubah kode lagi. Sekarang isinya digerakkan oleh katalog server:
  // apa pun yang berhasil ditangkap akan tampil, lengkap dengan label, satuan
  // dan kategorinya.
  const [katalog, setKatalog] = useState<KatalogMetrik[]>([])
  const [semua, setSemua] = useState(false)

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    api.metricCatalog().then((r) => { if (hidup) setKatalog(r.metrics) }).catch(() => { /* offline */ })
    return () => { hidup = false }
  }, [])

  const blob = profile as unknown as Record<string, unknown>
  const terisi = katalog.filter((d) => {
    const v = blob[d.kunci]
    return typeof v === 'number' && Number.isFinite(v)
  })

  // Beberapa nilai tidak berasal dari katalog (tidur punya bentuk sampel
  // sendiri), jadi ditambahkan terpisah agar tidak hilang.
  const tambahan: KatalogMetrik[] = typeof blob.sleepH === 'number' && (blob.sleepH as number) > 0
    ? [{ kunci: 'sleepH', label: 'Durasi tidur', kategori: 'Tidur', satuan: 'jam' }]
    : []
  const daftar = [...terisi, ...tambahan]

  const perKategori = new Map<string, KatalogMetrik[]>()
  for (const d of daftar) {
    const arr = perKategori.get(d.kategori) ?? []
    arr.push(d)
    perKategori.set(d.kategori, arr)
  }
  const kategoriTampil = [...perKategori.entries()]
  const terlihat = semua ? kategoriTampil : kategoriTampil.slice(0, 3)

  const fmt = (v: number, satuan: string) => {
    const bulat = Math.abs(v) >= 100 || Number.isInteger(v)
    return `${bulat ? Math.round(v).toLocaleString('en-GB') : v.toFixed(1)}${satuan ? ' ' + satuan : ''}`
  }

  const when = profile.lastDeviceSyncAt ? new Date(profile.lastDeviceSyncAt) : null
  const ago = when ? timeAgoShort(when) : ''

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={<IconActivity size={20} />} title="Synced from Your Device"
          subtitle={`${profile.deviceSyncSource ?? 'Device'} · ${daftar.length} metrik terisi otomatis`} />
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-dark">
          <span className="h-2 w-2 rounded-full bg-brand vital-dot" /> {ago}
        </span>
      </div>

      {daftar.length > 0 ? (
        <>
          {terlihat.map(([kategori, items]) => (
            <div key={kategori} className="mt-3">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">{kategori}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {items.map((d) => (
                  <div key={d.kunci} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 text-center dark:border-white/10 dark:bg-white/5">
                    <div className="text-sm font-extrabold text-ink dark:text-white">
                      {fmt(blob[d.kunci] as number, d.satuan)}
                    </div>
                    <div className="text-[10px] font-semibold leading-tight text-neutral-400">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {kategoriTampil.length > 3 && (
            <button onClick={() => setSemua(!semua)}
              className="mt-3 w-full rounded-xl bg-neutral-100 py-2 text-[12px] font-bold text-ink dark:bg-white/10 dark:text-white">
              {semua ? 'Tampilkan lebih sedikit' : `Tampilkan ${kategoriTampil.length - 3} kategori lainnya`}
            </button>
          )}
        </>
      ) : (
        <p className="mt-2 text-xs text-neutral-400">
          Perangkat tersambung, tetapi sinkronisasi ini tidak membawa metrik yang cocok — perluas
          Date Range di Health Auto Export dan angkanya akan terisi di sini.
        </p>
      )}
    </Card>
  )
}

function timeAgoShort(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function AutoSyncCard() {
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  // Connection state. Worth surfacing because "is the server even up?" is the
  // first thing to rule out when a sync produces nothing, and until now the
  // only way to answer it was to guess a URL by hand.
  const [conn, setConn] = useState<'checking' | 'up' | 'down'>('checking')
  const [lastSync, setLastSync] = useState<string | null>(null)

  const checkConnection = async () => {
    setConn('checking')
    try { await api.health(); setConn('up') } catch { setConn('down') }
  }

  useEffect(() => {
    api.getHealthWebhookToken().then(setToken).catch(() => {})
    checkConnection()
    api.getHealthProfile()
      .then((r) => setLastSync((r as { lastDeviceSyncAt?: string })?.lastDeviceSyncAt ?? null))
      .catch(() => {})
  }, [])

  const url = token ? `${apiBaseUrl}/api/health-webhook/${token}` : ''
  // Rotating silently swaps the token and breaks the phone until the new link is
  // pasted over the old one. That consequence has to be on screen, not implied.
  const [baruDiputar, setBaruDiputar] = useState(false)

  async function rotate() {
    if (!confirm(
      'Buat tautan sinkronisasi baru?\n\n'
      + 'Tautan LAMA langsung berhenti bekerja. Sampai Anda menempelkan tautan baru ke Health Auto Export, '
      + 'tidak ada data dari iPhone yang masuk.\n\n'
      + 'Lakukan ini bila tautan Anda pernah terkirim ke orang lain, tertangkap layar, maupun tertempel di tempat umum.'
    )) return
    setBaruDiputar(false)
    setBusy(true)
    try {
      setToken(await api.rotateHealthWebhookToken())
      setBaruDiputar(true)
    } finally { setBusy(false) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Auto-Sync from Apple Watch" subtitle="Via the third-party “Health Auto Export” app" />
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
        A website can't read Apple Health directly — that's an Apple restriction, native apps only. The closest thing to "automatic": install the <b>Health Auto Export</b> app (App Store, one-time purchase) on your iPhone, then point it at your private link below.
      </p>

      {/* Server reachability + last push, so the two questions that actually
          matter when nothing arrives are answered without leaving the page. */}
      <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Server Panaceamed</span>
          <div className="flex items-center gap-2">
            <Badge tone={conn === 'up' ? 'normal' : conn === 'down' ? 'critical' : 'low'}>
              {conn === 'up' ? 'Terhubung' : conn === 'down' ? 'Tidak merespons' : 'Memeriksa…'}
            </Badge>
            <button onClick={checkConnection} className="text-[11px] font-bold text-brand-dark hover:underline">Cek ulang</button>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Kiriman terakhir dari perangkat</span>
          <span className="text-[12px] font-black text-ink dark:text-white">
            {lastSync ? timeAgoShort(new Date(lastSync)) : "belum pernah"}
          </span>
        </div>
        {conn === 'down' && (
          <p className="mt-2 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
            Server tidak menjawab. Selama ini terjadi, tidak ada data dari iPhone yang bisa masuk —
            periksa status deployment sebelum menelusuri pengaturan di aplikasi.
          </p>
        )}
        {conn === 'up' && !lastSync && (
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            Server sehat, tetapi belum pernah menerima kiriman dari perangkat Anda. Artinya
            masalahnya ada di sisi iPhone — URL, izin Health, atau otomatisasi yang belum berjalan —
            bukan di server.
          </p>
        )}
      </div>

      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Private Sync Link</div>
        <div className="mt-1.5 flex items-center gap-2">
          <input readOnly value={url || 'Loading…'} className={inputClass + ' flex-1 !text-[11px]'} onFocus={(e) => e.target.select()} />
          <button onClick={copy} disabled={!url} className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-50">{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
          Rahasiakan tautan ini — siapa pun yang memilikinya bisa mengirim data ke akun Anda.
          Saat menempelkannya di Health Auto Export, <b>kosongkan dahulu kolom URL</b> lalu tempel
          sekali; menempel di atas isi lama menghasilkan alamat ganda yang tidak akan pernah dikenali server.
        </p>
      </div>

      {baruDiputar && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="text-[12px] font-black text-amber-800 dark:text-amber-300">Tautan baru dibuat — sinkronisasi Anda sekarang MATI</div>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[12px] leading-relaxed text-amber-900 dark:text-amber-100/90">
            <li>Tekan <b>Copy</b> pada tautan baru di atas.</li>
            <li>Buka Health Auto Export → otomatisasi Anda → <b>kosongkan kolom URL</b>, tempel sekali.</li>
            <li>Tekan <b>Update</b> di kanan atas, lalu <b>Manual Export</b> sekali.</li>
            <li>Ulangi untuk setiap otomatisasi yang memakai tautan ini.</li>
          </ol>
        </div>
      )}

      <Link to="/health-data/tutorial"
        className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-dark transition hover:bg-brand-50/80">
        📖 Buka panduan lengkap (8 langkah, ~5 menit)
        <IconChevronRight size={16} className="shrink-0" />
      </Link>

      <button
        onClick={rotate}
        disabled={busy || !token}
        className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      >
        {busy ? 'Memproses…' : '🔑 Buat tautan baru (bila tautan lama bocor)'}
      </button>
      <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
        Setelah ini tautan lama langsung tidak berlaku, dan Anda harus memperbarui URL di aplikasi
        sebelum data bisa masuk lagi.
      </p>
    </Card>
  )
}

/**
 * Lets a user find out WHY a sync produced nothing, without reading server logs.
 *
 * The four causes look identical from the outside — phone says success, website
 * shows nothing — but need opposite fixes, so guessing wastes everyone's time.
 * Paste the payload, get the actual cause named.
 */
// A real 7-day Apple Health export is megabytes of text. Holding that in React
// state and re-rendering this whole page on every keystroke of a paste is what
// made the tab die repeatedly on iPhone ("a problem repeatedly occurred") — so
// the textarea here is deliberately UNCONTROLLED: the browser owns the string,
// React only reads it once when the user presses Periksa. Better still, the
// file picker never puts the text on screen at all.
function SyncDiagnosticsCard() {
  const [open, setOpen] = useState(false)
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [d, setD] = useState<SyncDiagnosis | null>(null)
  const [busy, setBusy] = useState(false)
  const [fileNote, setFileNote] = useState('')

  const MAX_ROWS = 60 // never render thousands of metric rows on a phone

  const run = (raw: string) => {
    setBusy(true)
    // Yield a frame first so the button paints its busy state before a large
    // parse blocks the main thread.
    setTimeout(() => {
      try { setD(diagnose(raw)) } finally { setBusy(false) }
    }, 0)
  }

  const onPickFile = (f: File | undefined) => {
    if (!f) return
    setFileNote(`${f.name} · ${(f.size / 1e6).toFixed(2)} MB`)
    const r = new FileReader()
    r.onload = () => run(String(r.result ?? ''))
    r.onerror = () => setFileNote('File tidak bisa dibaca. Coba salin isinya ke kotak di bawah.')
    r.readAsText(f)
  }

  const TONE: Record<SyncDiagnosis['verdict'], 'normal' | 'high' | 'critical'> = {
    ok: 'normal', 'empty-samples': 'high', 'name-mismatch': 'critical',
    'no-payload': 'critical', 'not-json': 'critical',
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Diagnostik Sinkronisasi"
        subtitle="Find out why data from your iPhone is not arriving" />
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200">
          Buka alat diagnostik
        </button>
      ) : (
        <>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
            Pilih berkas ekspor apa pun secara langsung — <b>JSON</b> dari Health Auto Export,
            <b> CSV</b> dari InBody maupun WHOOP, atau <b>XML</b> dari Apple Health.
            Isinya diperiksa di perangkat Anda sendiri — tidak dikirim ke mana pun.
          </p>

          <input ref={fileRef} type="file" accept=".json,.csv,.xml,.txt,.tsv,application/json,text/csv,text/xml,text/plain" className="hidden"
            onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = '' }} />
          <Button className="mt-2 w-full" onClick={() => fileRef.current?.click()}>
            📄 Pilih berkas (.json · .csv · .xml)
          </Button>
          {fileNote && <p className="mt-1 text-[11px] text-neutral-500">{fileNote}</p>}

          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Menempel isinya juga bisa, tapi file 7 hari bisa berukuran beberapa megabyte dan berat
            untuk browser di HP — memilih file jauh lebih aman.
          </p>
          <textarea
            ref={taRef}
            className={inputClass + ' mt-1 h-28 font-mono !text-[10px]'}
            placeholder='{"data":{"metrics":[ … ]}}'
            defaultValue=""
          />
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => run(taRef.current?.value ?? '')}>
              {busy ? 'Memeriksa…' : 'Periksa'}
            </Button>
            <button onClick={() => { if (taRef.current) taRef.current.value = ''; setD(null); setFileNote('') }}
              className="rounded-xl bg-neutral-100 px-4 text-sm font-bold text-neutral-600 dark:bg-white/10">Bersihkan</button>
          </div>

          {d && (
            <div className="mt-3 space-y-3">
              <div>
                <Badge tone={TONE[d.verdict]}>{d.headline}</Badge>
                <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{d.explanation}</p>
              </div>

              <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand/10">
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Yang perlu dilakukan</div>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {d.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </div>

              {d.unknownNames.length > 0 && (
                <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                  <div className="text-[11px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">Nama yang belum kami kenali</div>
                  <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-200">
                    {d.unknownNames.join(', ')}
                  </p>
                </div>
              )}

              {d.metrics.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">
                    Rincian · {d.matchedCount} dikenali · {d.emptyCount} kosong · {d.metrics.length} total
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {d.metrics.slice(0, MAX_ROWS).map((m, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-white/5">
                        <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-neutral-600 dark:text-neutral-300">{m.name}</span>
                        <span className="shrink-0 text-[10px] text-neutral-400">{m.sampleCount} sampel</span>
                        <span className={`shrink-0 text-[10px] font-bold ${
                          m.sampleCount === 0 ? 'text-amber-600'
                          : m.recognised ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.sampleCount === 0 ? 'kosong' : m.recognised ? `→ ${m.mappedTo}` : 'tidak dikenali'}
                        </span>
                      </div>
                    ))}
                    {d.metrics.length > MAX_ROWS && (
                      <p className="pt-1 text-[10px] text-neutral-400">
                        …dan {d.metrics.length - MAX_ROWS} metrik lain (disembunyikan agar halaman tetap ringan).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  )
}

export default HealthProfile
