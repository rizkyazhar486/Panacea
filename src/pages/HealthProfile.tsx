import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconCheck, IconChevronRight } from '../components/icons'
import { api, backendEnabled, apiBaseUrl } from '../lib/api'
import { useStore } from '../lib/store'
import { setDemo } from '../lib/profile'
import { parseHealthFile, type ImportResult } from '../lib/healthImport'
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

type Src = 'Manual' | 'WHOOP' | 'Apple Watch' | 'Garmin' | 'Samsung Health' | 'Fitbit' | 'Oura' | 'Lainnya'
const SOURCES: Src[] = ['Manual', 'WHOOP', 'Apple Watch', 'Garmin', 'Samsung Health', 'Fitbit', 'Oura', 'Lainnya']

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
    const today = new Date().toISOString().slice(0, 10)
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
      catch { setErr('Tersimpan di perangkat, tapi gagal sinkron ke server (offline). Akan otomatis tersimpan lokal.') }
    }
    setSavedAt(now); setSaving(false)
  }

  const MAX_IMPORT_BYTES = 60 * 1024 * 1024 // 60 MB — big Apple Health exports can freeze the tab if loaded whole
  async function onImport(file?: File) {
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      setNote(''); setErr(`File terlalu besar (${(file.size / 1048576).toFixed(0)} MB, maks 60 MB). Untuk export Apple Health yang besar, isi nilai kunci secara manual.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setNote('Membaca file…'); setErr('')
    try {
      const text = await file.text()
      const r: ImportResult = parseHealthFile(file.name, text)
      const keys = Object.keys(r).filter((k) => k !== 'source')
      if (!keys.length) { setNote(''); setErr('Tidak menemukan data yang dikenali di file itu. Coba export.xml (Apple Health) atau physiological_cycles.csv (WHOOP).'); return }
      setP((x) => ({
        ...x,
        source: (r.source as Src) ?? x.source,
        vo2max: r.vo2max ?? x.vo2max, restingHr: r.restingHr ?? x.restingHr, hrvMs: r.hrvMs ?? x.hrvMs,
        recoveryPct: r.recoveryPct ?? x.recoveryPct, strain: r.strain ?? x.strain, sleepH: r.sleepH ?? x.sleepH,
        weightKg: r.weightKg ?? x.weightKg, bodyFatPct: r.bodyFatPct ?? x.bodyFatPct,
      }))
      setNote(`Terisi dari ${r.source}: ${keys.length} nilai. Periksa lalu tekan Simpan.`)
    } catch {
      setNote(''); setErr('Gagal membaca file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
  function exportJson() {
    download(`data-kesehatan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(p, null, 2), 'application/json')
  }
  function exportCsv() {
    const rows = p.history ?? []
    if (!rows.length) { setErr('Belum ada riwayat untuk diekspor — simpan data dulu.'); return }
    const cols: (keyof Snapshot)[] = ['date', 'vo2max', 'restingHr', 'hrvMs', 'recoveryPct', 'sleepH']
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => r[c] ?? '').join(','))].join('\n')
    download(`riwayat-kesehatan-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
  }

  const num = (label: string, key: keyof HealthProfile, step = 1, ph = '') => (
    <Field label={label}>
      <input className={inputClass} type="number" step={step} min={0} placeholder={ph}
        value={(p[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<HealthProfile>)} />
    </Field>
  )

  if (loading) return <div className="mx-auto max-w-2xl py-16 text-center text-sm text-neutral-400">Memuat data kesehatan…</div>

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Data Kesehatan Saya"
          subtitle={backendEnabled ? 'Tersimpan di server per akun — ikut di semua perangkat' : 'Tersimpan di perangkat ini (server tidak aktif)'} />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Isi manual, impor file export, atau salin dari <b>WHOOP · Apple Watch · Garmin · Samsung Health · Fitbit · Oura</b>. Data ini mengisi otomatis semua kalkulator kebugaran & longevity Anda.
        </p>
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sumber Data</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <button key={s} onClick={() => u({ source: s })}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (p.source === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {account && <div className="mt-2 text-[10px] text-neutral-400">Akun: {account.email}</div>}
      </Card>

      {/* Import from / export to a file */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Impor & Ekspor" subtitle="Apple Health export.xml · WHOOP .csv" />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Ekspor dari aplikasi kesehatan Anda lalu unggah di sini — kolom akan terisi otomatis. File diproses di perangkat, tidak diunggah saat dibaca. Anda juga bisa mengunduh data Anda kapan saja.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".xml,.csv,text/xml,text/csv" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()} className="!px-4">Pilih file export…</Button>
          <button onClick={exportJson} className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200">Unduh JSON</button>
          <button onClick={exportCsv} className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200">Unduh riwayat CSV</button>
          {note && <span className="w-full text-[11px] font-semibold text-brand-dark">{note}</span>}
        </div>
      </Card>

      {backendEnabled && <AutoSyncCard />}

      {p.lastDeviceSyncAt && <DeviceSyncSummary profile={p} />}

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Demografi" subtitle="Dasar untuk semua perhitungan" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('Usia', 'age', 1, 'mis. 26')}
          <Field label="Jenis Kelamin">
            <select className={inputClass} value={p.sex} onChange={(e) => u({ sex: e.target.value as 'M' | 'F' })}>
              <option value="M">Laki-laki</option><option value="F">Perempuan</option>
            </select>
          </Field>
          {num('Tinggi (cm)', 'heightCm', 1, 'mis. 170')}
          {num('Berat (kg)', 'weightKg', 0.1, 'mis. 68')}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Kardio, Recovery & HRV" subtitle="Dari jam/cincin atau tes" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('VO₂max (ml/kg/mnt)', 'vo2max', 0.1, 'mis. 42')}
          {num('Resting HR (bpm)', 'restingHr', 1, 'mis. 58')}
          {num('HRV (ms)', 'hrvMs', 1, 'mis. 65')}
          {num('Recovery (%) — WHOOP', 'recoveryPct', 1, '0-100')}
          {num('Strain (0-21) — WHOOP', 'strain', 0.1, '0-21')}
          <Field label="Tekanan Darah"><input className={inputClass} placeholder="120/80" value={p.bloodPressure} onChange={(e) => u({ bloodPressure: e.target.value })} /></Field>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Tidur & Aktivitas" subtitle="Snapshot harian" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('Tidur total (jam)', 'sleepH', 0.1, 'mis. 7.5')}
          {num('REM (jam)', 'remH', 0.1)}
          {num('Deep/N3 (jam)', 'deepH', 0.1)}
          {num('Langkah', 'steps', 1, 'mis. 8000')}
          {num('Kalori aktif', 'activeKcal', 1)}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Komposisi Tubuh" subtitle="Dari timbangan pintar / InBody" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('Lemak tubuh (%)', 'bodyFatPct', 0.1, 'mis. 18')}
          {num('Massa otot (kg)', 'muscleMassKg', 0.1)}
        </div>
      </Card>

      <InsightCard history={p.history ?? []} />
      <BenchmarkCard profile={p} />
      <TrendChart history={p.history ?? []} />

      <div className="sticky bottom-4 z-10">
        <Card className="!p-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0 text-[11px] text-neutral-500">
            {savedAt ? <span className="flex items-center gap-1 font-semibold text-brand-dark"><IconCheck size={13} /> Tersimpan {new Date(savedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> : 'Belum disimpan'}
            {err && <span className="mt-0.5 block text-amber-600">{err}</span>}
          </div>
          <Button onClick={save} disabled={saving} className="shrink-0">{saving ? 'Menyimpan…' : 'Simpan'}</Button>
        </Card>
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-3 text-center text-[11px] leading-relaxed text-brand-dark">
        {backendEnabled
          ? 'Data tersimpan aman di server per akun Anda — login di perangkat lain, data ikut. Bukan data medis diagnostik; untuk edukasi & pelacakan pribadi.'
          : 'Server belum aktif — data tersimpan lokal di perangkat ini. Aktifkan backend (VITE_API_URL) agar tersinkron antar-perangkat.'}
        <div className="mt-1">
          <Badge tone="brand">Sumber: {p.source}</Badge>
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
      <SectionTitle icon={<IconActivity size={20} />} title="Insight Otomatis" subtitle="Dari tren data Anda sendiri — gratis, tanpa AI" />
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
      <SectionTitle icon={<IconHeart size={20} />} title="Bandingkan dengan Populasi Umum" subtitle="Estimasi berbasis norma usia & jenis kelamin" />
      <div className="mt-3 space-y-4">
        {items.map((it) => (
          <div key={it.key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-ink">{it.label}: {it.value}{it.unit === 'jam' ? ' jam' : ` ${it.unit}`}</span>
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
        <SectionTitle icon={<IconActivity size={20} />} title="Tren" subtitle="Grafik muncul setelah ≥2 kali simpan" />
        <p className="mt-1 text-[11px] text-neutral-500">Simpan data secara berkala (mis. tiap pagi) untuk melihat perkembangan VO₂max, HRV, dan HR istirahat dari waktu ke waktu.</p>
      </Card>
    )
  }
  const data = history.map((s) => ({ ...s, label: new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }))
  const series = [
    { key: 'vo2max', name: 'VO₂max', color: '#00BF63' },
    { key: 'hrvMs', name: 'HRV (ms)', color: '#6366f1' },
    { key: 'restingHr', name: 'HR Istirahat', color: '#f59e0b' },
  ] as const
  const active = series.filter((s) => data.some((d) => (d as unknown as Record<string, number>)[s.key]))
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Tren" subtitle={`${history.length} catatan tersimpan`} />
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
  const metrics: { label: string; value: string }[] = []
  const add = (label: string, v: number | undefined, unit = '', dp = 0) => {
    if (typeof v === 'number' && v > 0) metrics.push({ label, value: `${v.toFixed(dp)}${unit}` })
  }
  add('VO₂max', profile.vo2max, ' ml/kg/min', 1)
  add('Resting HR', profile.restingHr, ' bpm')
  add('HRV', profile.hrvMs, ' ms')
  add('Sleep', profile.sleepH, ' h', 1)
  add('Weight', profile.weightKg, ' kg', 1)
  add('Body fat', profile.bodyFatPct, ' %', 1)
  add('Steps', profile.steps, '')
  add('Active energy', profile.activeKcal, ' kcal')

  const when = profile.lastDeviceSyncAt ? new Date(profile.lastDeviceSyncAt) : null
  const ago = when ? timeAgoShort(when) : ''

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<IconActivity size={20} />} title="Synced from Your Device" subtitle={`${profile.deviceSyncSource ?? 'Device'} · processed automatically`} />
        <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-dark">
          <span className="h-2 w-2 rounded-full bg-brand vital-dot" /> {ago}
        </span>
      </div>
      {metrics.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 text-center">
              <div className="text-sm font-extrabold text-ink">{m.value}</div>
              <div className="text-[10px] font-semibold text-neutral-400">{m.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-400">Your device connected, but this sync carried no matching metrics — widen the Date Range in Health Auto Export and it will fill in here.</p>
      )}
      <p className="mt-3 text-[10px] text-neutral-400">These values flow straight into your calculators and the trend chart below — no manual entry needed. Reopen this page (or refocus the tab) to pull the latest sync.</p>
    </Card>
  )
}

// Compact "Xm ago" / "Xh ago" / "Xd ago" for the last sync stamp.
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

  useEffect(() => { api.getHealthWebhookToken().then(setToken).catch(() => {}) }, [])

  const url = token ? `${apiBaseUrl}/api/health-webhook/${token}` : ''

  async function rotate() {
    if (!confirm('Buat ulang tautan sinkron? Tautan lama akan berhenti bekerja — Anda perlu memperbarui URL di aplikasi Health Auto Export.')) return
    setBusy(true)
    try { setToken(await api.rotateHealthWebhookToken()) } finally { setBusy(false) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Sinkron Otomatis dari Apple Watch" subtitle="Lewat aplikasi pihak ketiga “Health Auto Export”" />
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
        Website tidak bisa membaca Apple Health langsung — itu batasan dari Apple, khusus aplikasi native. Cara paling dekat dengan "otomatis": pasang aplikasi <b>Health Auto Export</b> (App Store, sekali beli) di iPhone Anda, lalu arahkan ke tautan pribadi di bawah ini.
      </p>

      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tautan Sinkron Pribadi</div>
        <div className="mt-1.5 flex items-center gap-2">
          <input readOnly value={url || 'Memuat…'} className={inputClass + ' flex-1 !text-[11px]'} onFocus={(e) => e.target.select()} />
          <button onClick={copy} disabled={!url} className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-50">{copied ? 'Tersalin ✓' : 'Salin'}</button>
        </div>
        <p className="mt-1 text-[10px] text-neutral-400">Jaga tautan ini rahasia — siapa pun yang memilikinya bisa mengirim data ke akun Anda.</p>
      </div>

      <Link to="/health-data/tutorial"
        className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-dark transition hover:bg-brand-50/80">
        📖 Lihat Tutorial Setup Lengkap (7 langkah, ±5 menit)
        <IconChevronRight size={16} className="shrink-0" />
      </Link>

      <button onClick={rotate} disabled={busy || !token} className="mt-3 text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-50">
        {busy ? 'Memproses…' : 'Buat ulang tautan (jika bocor)'}
      </button>
    </Card>
  )
}

export default HealthProfile
