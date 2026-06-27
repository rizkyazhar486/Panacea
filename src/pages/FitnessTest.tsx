import { useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconActivity, IconFlame, IconRun } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { readAsDataUrl, compressImage } from '../lib/upload'

// ── Kesamaptaan / SIPSS scoring ─────────────────────────────────────────────
// Approximate max-score targets (≈ "Baik Sekali") for the Indonesian
// TNI-Polri physical test. Reps within 1 minute unless noted.
type Sex = 'L' | 'P'
const TARGET: Record<Sex, { pushup: number; situp: number; pullup: number; cooper: number }> = {
  L: { pushup: 43, situp: 41, pullup: 18, cooper: 2800 }, // pull-up reps, cooper metres / 12 min
  P: { pushup: 30, situp: 30, pullup: 90, cooper: 2300 }, // wanita: "pull-up" = chinning hang (detik)
}
const score = (v: number, target: number) => Math.max(0, Math.min(100, Math.round((v / target) * 100)))

interface FormResult { formScore: number; summary: string; goodPoints: string[]; corrections: string[]; injuryRisk: string }

const EXERCISES = [
  { id: 'pushup', name: 'Push-up', emoji: '🏋️', cues: ['Tubuh lurus dari kepala–tumit', 'Siku ±45° dari badan', 'Turun hingga dada hampir menyentuh lantai', 'Inti & glute aktif (jangan pinggul melorot)'] },
  { id: 'squat', name: 'Squat', emoji: '🦵', cues: ['Tumit menapak rata', 'Lutut searah jari kaki', 'Punggung netral, dada tegak', 'Paha minimal sejajar lantai'] },
  { id: 'pullup', name: 'Pull-up', emoji: '🧗', cues: ['Gantung lengan penuh (dead hang)', 'Tarik dagu melewati palang', 'Skapula turun-rapat, hindari ayunan', 'Turun terkontrol'] },
  { id: 'situp', name: 'Sit-up', emoji: '🔁', cues: ['Lutut ditekuk ±90°', 'Tangan di dada/belakang kepala tanpa menarik leher', 'Naik hingga siku menyentuh paha', 'Punggung bawah terkontrol'] },
  { id: 'burpee', name: 'Burpee', emoji: '💥', cues: ['Squat → plank lurus', 'Push-up penuh (opsional)', 'Lompat eksplosif', 'Pendaratan lutut menekuk (redam)'] },
  { id: 'plank', name: 'Plank', emoji: '🧱', cues: ['Garis lurus bahu–pinggul–tumit', 'Siku di bawah bahu', 'Glute & inti terkunci', 'Leher netral'] },
]

const PROGRAMS = [
  { id: 'sipss', emoji: '👮', name: 'Persiapan SIPSS / Kedinasan', weeks: 8, focus: 'Push-up, sit-up, pull-up, lari 12 menit', plan: ['Sen: Kekuatan push (push-up piramida) + core', 'Sel: Lari interval 6×400m', 'Rab: Pull-up/chinning + grip', 'Kam: Recovery / mobilitas', 'Jum: Sirkuit kesamaptaan B (push-up·sit-up·shuttle)', 'Sab: Lari jauh tempo (Cooper)', 'Min: Istirahat'] },
  { id: 'hyrox', emoji: '🏟️', name: 'HYROX', weeks: 10, focus: 'Lari + 8 stasiun fungsional (ski, sled, burpee broad jump, row, wall ball)', plan: ['Run + strength endurance', 'Compromised running (lari setelah beban)', 'Sled push/pull & wall ball', 'Erg (ski/row) interval', 'Burpee broad jump volume', 'Simulasi stasiun', 'Recovery'] },
  { id: 'marathon', emoji: '🏃', name: 'Marathon (42K)', weeks: 16, focus: 'Base, tempo, long run progresif', plan: ['Easy run', 'Interval VO2max', 'Easy + strides', 'Tempo threshold', 'Recovery', 'Long run (naik bertahap → 32K)', 'Rest'] },
  { id: 'half', emoji: '🥈', name: 'Half Marathon (21K)', weeks: 12, focus: 'Threshold & long run sedang', plan: ['Easy run', 'Interval 5×1K', 'Easy', 'Tempo 6–8K', 'Recovery', 'Long run (→ 18K)', 'Rest'] },
]

export function FitnessTest() {
  const [sex, setSex] = useState<Sex>('L')
  const [reps, setReps] = useState({ pushup: 0, situp: 0, pullup: 0, cooper: 0 })
  const t = TARGET[sex]
  const items = [
    { k: 'pushup' as const, label: 'Push-up (1 mnt)', unit: 'x' },
    { k: 'situp' as const, label: 'Sit-up (1 mnt)', unit: 'x' },
    { k: 'pullup' as const, label: sex === 'L' ? 'Pull-up' : 'Chinning (detik)', unit: sex === 'L' ? 'x' : 's' },
    { k: 'cooper' as const, label: 'Lari 12 mnt (Cooper)', unit: 'm' },
  ]
  const scores = items.map((it) => ({ ...it, nilai: score(reps[it.k], t[it.k]) }))
  const total = Math.round(scores.reduce((s, x) => s + x.nilai, 0) / scores.length)
  const lulus = total >= 60 && scores.every((s) => s.nilai >= 41)

  // ── AI form analysis ──
  const [exercise, setExercise] = useState(EXERCISES[0])
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<FormResult | null>(null)
  const [note, setNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyzeForm(file?: File) {
    if (!file) return
    setBusy(true); setForm(null); setNote('')
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setPreview(dataUrl)
      if (!backendEnabled) {
        setNote('Analisis AI butuh server aktif. Sementara gunakan checklist form di bawah.')
        setBusy(false); return
      }
      const prompt = `Anda pelatih kekuatan & fisioterapis. Analisis FORM/POSTUR gerakan "${exercise.name}" pada foto ini (edukasi, bukan diagnosis). Nilai kelurusan tubuh, sudut sendi, dan risiko cedera. Keluarkan HANYA JSON minified: {"formScore":number(0-100),"summary":string,"goodPoints":string[],"corrections":string[],"injuryRisk":string}`
      const r = await api.aiVision(dataUrl, prompt)
      const m = r.text.match(/\{[\s\S]*\}/)
      if (m) setForm(JSON.parse(m[0]))
      else setNote('Tidak dapat membaca hasil. Coba foto dari samping dengan pencahayaan baik.')
    } catch {
      setNote('Gagal menganalisis. Coba lagi dengan foto samping yang jelas.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🎖️</span>
        <div>
          <h1 className="text-lg font-black text-ink">Tes Fisik & Analisis Form</h1>
          <p className="text-xs text-neutral-400">Kesamaptaan SIPSS/Kedinasan · form AI · program Hyrox/Marathon</p>
        </div>
      </div>

      {/* 1. Skor Kesamaptaan */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Skor Tes Kesamaptaan" subtitle="Estimasi nilai untuk ujian SIPSS / TNI-Polri / kedinasan" />
        <div className="mt-3 mb-3 flex gap-2">
          {(['L', 'P'] as Sex[]).map((s) => (
            <button key={s} onClick={() => setSex(s)} className={`flex-1 rounded-xl py-2 text-sm font-bold ${sex === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {s === 'L' ? '♂ Pria' : '♀ Wanita'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <Field key={it.k} label={`${it.label} (${it.unit})`}>
              <input type="number" value={reps[it.k] || ''} onChange={(e) => setReps({ ...reps, [it.k]: +e.target.value || 0 })} className={inputClass} />
            </Field>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {scores.map((s) => (
            <div key={s.k} className="flex items-center gap-2 text-xs">
              <span className="w-36 shrink-0 text-neutral-500">{s.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full" style={{ width: `${s.nilai}%`, background: s.nilai >= 60 ? '#00BF63' : '#f59e0b' }} />
              </div>
              <span className="w-8 text-right font-bold text-ink">{s.nilai}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl p-3" style={{ background: lulus ? '#E9FAF2' : '#FFF4E5' }}>
          <div>
            <div className="text-[11px] text-neutral-500">Nilai Total</div>
            <div className="text-2xl font-black" style={{ color: lulus ? '#0B7A4B' : '#B45309' }}>{total}<span className="text-sm">/100</span></div>
          </div>
          <Badge tone={lulus ? 'normal' : 'high'}>{lulus ? '✓ Memenuhi Syarat' : 'Perlu Ditingkatkan'}</Badge>
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">Estimasi penyetaraan; ambang & tabel resmi dapat berbeda per instansi/umur. Lari 12 menit bisa diukur otomatis lewat GPS Tracker.</p>
      </Card>

      {/* 2. Analisis Form AI */}
      <Card className="!p-5">
        <SectionTitle icon={<IconFlame size={18} />} title="Analisis Form & Postur (AI)" subtitle="Unggah foto gerakan Anda — AI menilai form & risiko cedera" />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXERCISES.map((e) => (
            <button key={e.id} onClick={() => { setExercise(e); setForm(null); setPreview(null) }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${exercise.id === e.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {e.emoji} {e.name}
            </button>
          ))}
        </div>

        {/* "Excellent form" reference slot (akan diisi gambar Higgsfield bila kredit tersedia) */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">{exercise.emoji}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-ink">Form Ideal — {exercise.name}</div>
            <ul className="mt-0.5 text-[11px] text-neutral-500">
              {exercise.cues.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        </div>

        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 py-4 text-sm font-bold text-brand-dark disabled:opacity-60">
          {busy ? 'Menganalisis…' : `📷 Unggah Foto ${exercise.name} (samping, jelas)`}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => analyzeForm(e.target.files?.[0])} />

        {preview && <img src={preview} alt="" className="mt-3 max-h-64 w-full rounded-xl object-contain" />}
        {note && <p className="mt-2 text-xs font-semibold text-amber-600">{note}</p>}

        {form && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
              <span className="text-sm font-bold text-brand-dark">Skor Form</span>
              <span className="text-2xl font-black text-brand-dark">{form.formScore}/100</span>
            </div>
            <p className="text-xs text-neutral-600">{form.summary}</p>
            {form.goodPoints?.length > 0 && <div className="rounded-xl bg-neutral-50 p-2 text-[11px]"><b className="text-brand-dark">✓ Sudah baik:</b> <ul className="mt-1 space-y-0.5 text-neutral-600">{form.goodPoints.map((g, i) => <li key={i}>• {g}</li>)}</ul></div>}
            {form.corrections?.length > 0 && <div className="rounded-xl bg-amber-50 p-2 text-[11px]"><b className="text-amber-700">⚠ Perbaiki:</b> <ul className="mt-1 space-y-0.5 text-amber-800">{form.corrections.map((g, i) => <li key={i}>• {g}</li>)}</ul></div>}
            {form.injuryRisk && <div className="rounded-xl bg-red-50 p-2 text-[11px] text-red-700"><b>Risiko cedera:</b> {form.injuryRisk}</div>}
            <p className="text-[10px] text-neutral-400">Edukasi gerakan, bukan pengganti penilaian pelatih/fisioterapis langsung.</p>
          </div>
        )}
      </Card>

      {/* 3. Program Latihan */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={18} />} title="Program Latihan" subtitle="Persiapan ujian & kejuaraan" />
        <div className="mt-3 space-y-3">
          {PROGRAMS.map((p) => (
            <details key={p.id} className="rounded-xl border border-neutral-100 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
                <span className="text-xl">{p.emoji}</span>
                <span className="flex-1">{p.name}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-dark">{p.weeks} mgg</span>
              </summary>
              <p className="mt-2 text-[11px] text-neutral-500">Fokus: {p.focus}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-neutral-600">
                {p.plan.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => { window.location.hash = '#/athlete' }}>Lihat VO2Max & Zona Latihan →</Button>
      </div>
    </div>
  )
}
