import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconCheck } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'
import { setDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Health Profile — per-user health data saved on the SERVER (keyed by account,
// so it follows the user across devices), filled manually or copied from
// WHOOP / Apple Watch / Garmin / other health apps. Falls back to localStorage
// when the backend is offline. Also mirrors demographics into the shared local
// profile so every calculator prefills.
// ─────────────────────────────────────────────────────────────────────────────

type Src = 'Manual' | 'WHOOP' | 'Apple Watch' | 'Garmin' | 'Samsung Health' | 'Fitbit' | 'Oura' | 'Lainnya'
const SOURCES: Src[] = ['Manual', 'WHOOP', 'Apple Watch', 'Garmin', 'Samsung Health', 'Fitbit', 'Oura', 'Lainnya']

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
  updatedAt?: string
}
const DEF: HealthProfile = {
  source: 'Manual', age: 0, sex: 'M', heightCm: 0, weightKg: 0,
  bodyFatPct: 0, muscleMassKg: 0, vo2max: 0, restingHr: 0, hrvMs: 0,
  recoveryPct: 0, strain: 0, sleepH: 0, remH: 0, deepH: 0, steps: 0, activeKcal: 0, bloodPressure: '',
}
const LKEY = 'pmd_health_profile'

export function HealthProfile() {
  const { account } = useStore()
  const [p, setP] = useState<HealthProfile>(DEF)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState('')

  // Load: server first (per-user), else local.
  useEffect(() => {
    let alive = true
    async function load() {
      let data: Partial<HealthProfile> = {}
      try { data = JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { /* ignore */ }
      if (backendEnabled) {
        try { const remote = await api.getHealthProfile(); if (remote && Object.keys(remote).length) data = { ...data, ...(remote as Partial<HealthProfile>) } } catch { /* offline */ }
      }
      if (alive) { setP({ ...DEF, ...data }); setSavedAt((data as HealthProfile).updatedAt ?? null); setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [])

  const u = (patch: Partial<HealthProfile>) => setP((x) => ({ ...x, ...patch }))

  async function save() {
    setSaving(true); setErr('')
    const now = new Date().toISOString()
    const payload = { ...p, updatedAt: now }
    try { localStorage.setItem(LKEY, JSON.stringify(payload)) } catch { /* ignore */ }
    // Keep the shared local demographics in sync for every calculator.
    setDemo({ age: p.age || undefined, sex: p.sex, weightKg: p.weightKg || undefined, heightCm: p.heightCm || undefined } as never)
    if (backendEnabled) {
      try { await api.saveHealthProfile(payload as unknown as Record<string, unknown>) }
      catch { setErr('Tersimpan di perangkat, tapi gagal sinkron ke server (offline). Akan otomatis tersimpan lokal.') }
    }
    setSavedAt(now); setSaving(false)
  }

  const num = (label: string, key: keyof HealthProfile, step = 1, ph = '') => (
    <Field label={label}>
      <input className={inputClass} type="number" step={step} placeholder={ph}
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
          Isi manual, atau salin dari <b>WHOOP · Apple Watch · Garmin · Samsung Health · Fitbit · Oura</b>. Data ini mengisi otomatis semua kalkulator kebugaran & longevity Anda.
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

export default HealthProfile
