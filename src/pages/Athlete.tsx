import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconRun, IconActivity, IconHeart } from '../components/icons'
import { ShareToFeed } from '../components/ShareToFeed'

interface AthleteProfile { age: number; g: 'M' | 'F'; weight: number; hrRest: number; hrMax: number }

const KEY = 'pm_athlete_profile'
const def: AthleteProfile = { age: 24, g: 'M', weight: 70, hrRest: 55, hrMax: 0 }
function load(): AthleteProfile {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return d.age ? d : def } catch { return def }
}
function save(p: AthleteProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

// Jackson non-exercise VO2max (uses resting HR) — same formula used in HealthTrends.
function vo2max(age: number, g: 'M' | 'F', hrRest: number) {
  return g === 'M' ? (15.3 * (220 - age)) / hrRest : (15.3 * (226 - age)) / hrRest
}

const ZONES = [
  { z: 'Z1', label: 'Recovery', pct: [0.5, 0.6], desc: 'Pemulihan aktif, percakapan nyaman' },
  { z: 'Z2', label: 'Aerobik Dasar', pct: [0.6, 0.7], desc: 'Membangun fondasi daya tahan' },
  { z: 'Z3', label: 'Tempo', pct: [0.7, 0.8], desc: 'Ambang aerobik, masih bisa bicara singkat' },
  { z: 'Z4', label: 'Ambang Laktat', pct: [0.8, 0.9], desc: 'Berat, interval 4-8 menit' },
  { z: 'Z5', label: 'VO₂max / Anaerobik', pct: [0.9, 1.0], desc: 'Maksimal, interval pendek 30s-3 menit' },
] as const

function vo2Tier(v: number, g: 'M' | 'F') {
  const t = g === 'M'
    ? [[60, 'Elit'], [52, 'Sangat Baik'], [45, 'Baik'], [38, 'Cukup'], [0, 'Perlu Ditingkatkan']] as const
    : [[54, 'Elit'], [46, 'Sangat Baik'], [39, 'Baik'], [32, 'Cukup'], [0, 'Perlu Ditingkatkan']] as const
  return t.find(([min]) => v >= min)?.[1] ?? 'Perlu Ditingkatkan'
}

export function Athlete() {
  const [p, setP] = useState<AthleteProfile>(load)
  const hrMax = p.hrMax > 0 ? p.hrMax : 220 - p.age
  const v = vo2max(p.age, p.g, p.hrRest)
  const tier = vo2Tier(v, p.g)

  function upd(next: Partial<AthleteProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex justify-end">
        <ShareToFeed activity="🏃 Performa Atlet" defaultCaption="Update latihan & performa saya hari ini 💪" />
      </div>
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Performa Atlet" subtitle="VO₂max, zona latihan & target beban mingguan" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Usia"><input className={inputClass} type="number" value={p.age} onChange={(e) => upd({ age: +e.target.value })} /></Field>
          <Field label="Jenis Kelamin">
            <select className={inputClass} value={p.g} onChange={(e) => upd({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Laki-laki</option><option value="F">Perempuan</option>
            </select>
          </Field>
          <Field label="Berat (kg)"><input className={inputClass} type="number" value={p.weight} onChange={(e) => upd({ weight: +e.target.value })} /></Field>
          <Field label="Nadi Istirahat"><input className={inputClass} type="number" value={p.hrRest} onChange={(e) => upd({ hrRest: +e.target.value })} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Nadi Maks Terukur (opsional, kosongkan untuk estimasi 220-usia)">
            <input className={inputClass} type="number" value={p.hrMax || ''} placeholder={String(220 - p.age)} onChange={(e) => upd({ hrMax: +e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">VO₂max Estimasi</div>
            <div className="text-3xl font-extrabold text-brand">{v.toFixed(1)}<span className="ml-1 text-sm font-medium text-white/50">ml/kg/min</span></div>
            <Badge tone="brand">{tier}</Badge>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Nadi Maks</div>
            <div className="text-3xl font-extrabold text-ink">{hrMax}<span className="ml-1 text-sm font-medium text-neutral-400">bpm</span></div>
            <div className="mt-1 text-[11px] text-neutral-400">Dasar perhitungan 5 zona latihan</div>
          </div>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Zona Latihan" subtitle="Persentase dari nadi maksimal" />
        <div className="mt-3 space-y-2">
          {ZONES.map((z) => {
            const lo = Math.round(hrMax * z.pct[0]); const hi = Math.round(hrMax * z.pct[1])
            return (
              <div key={z.z} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
                <div>
                  <div className="text-sm font-bold">{z.z} — {z.label}</div>
                  <div className="text-[11px] text-neutral-400">{z.desc}</div>
                </div>
                <div className="text-right text-sm font-extrabold text-brand-dark">{lo}–{hi} bpm</div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Target Beban Mingguan" subtitle="Rekomendasi umum berdasarkan tingkat VO₂max" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• Total volume: {tier === 'Elit' || tier === 'Sangat Baik' ? '8-12 jam' : tier === 'Baik' ? '5-8 jam' : '3-5 jam'} / minggu</li>
          <li>• Z1-Z2 (basis aerobik): 70-80% dari total volume</li>
          <li>• Z4-Z5 (interval intensitas tinggi): maksimal 1-2 sesi/minggu</li>
          <li>• Latihan kekuatan/resistensi: 2-3x/minggu untuk mencegah cedera</li>
          <li>• Hari pemulihan penuh (Z1 atau istirahat total): minimal 1-2 hari/minggu</li>
        </ul>
      </Card>
    </div>
  )
}

export default Athlete
