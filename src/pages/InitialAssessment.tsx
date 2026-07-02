import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconActivity, IconHeart, IconCheck } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Penilaian Awal — required before starting a demanding program: movement
// pattern screen, pain/injury flags, strength baseline, L/R asymmetry, and a
// quality-of-life screening. Runs once (or re-run any time), persists locally.
// The QoL section offers short ADAPTATIONS inspired by the domains of four
// validated instruments (Nottingham Health Profile, McGill Pain Questionnaire
// Short-Form, IQOLA/SF-36, Frenchay Activities Index) — these are simplified
// screening items, not the licensed official instruments, and are labeled as
// such throughout.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'pm_assessment_v1'

interface Assessment {
  done: boolean; at: string
  movement: Record<string, number>
  painRegions: string[]
  painSeverity: number
  strength: { pushups: number; squats60: number; plankSec: number }
  asym: { balanceR: number; balanceL: number; hopR: number; hopL: number }
  qolInstrument: string
  qolAnswers: number[]
}
const DEF: Assessment = {
  done: false, at: '',
  movement: {}, painRegions: [], painSeverity: 0,
  strength: { pushups: 0, squats60: 0, plankSec: 0 },
  asym: { balanceR: 0, balanceL: 0, hopR: 0, hopL: 0 },
  qolInstrument: 'Nottingham Health Profile (adaptasi)',
  qolAnswers: [],
}
function load(): Assessment { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEF } }
export function isAssessmentDone(): boolean { try { return JSON.parse(localStorage.getItem(KEY) || '{}').done === true } catch { return false } }

const MOVEMENTS = [
  { id: 'squat', label: 'Overhead Squat', desc: 'Jongkok penuh, tangan lurus di atas kepala, tumit tetap menapak.' },
  { id: 'balance', label: 'Keseimbangan Satu Kaki', desc: 'Berdiri satu kaki 30 detik tanpa goyah berlebihan.' },
  { id: 'toetouch', label: 'Toe Touch', desc: 'Membungkuk menyentuh jari kaki, lutut lurus, tanpa nyeri.' },
  { id: 'shoulder', label: 'Jangkauan Bahu (Scratch Test)', desc: 'Satu tangan dari atas, satu dari bawah punggung, coba bertemu.' },
  { id: 'hop', label: 'Lompat Satu Kaki (Single-Leg Hop)', desc: 'Melompat & mendarat stabil satu kaki tanpa oleng.' },
]
const PAIN_REGIONS = ['Leher', 'Bahu', 'Punggung Atas', 'Punggung Bawah', 'Pinggul', 'Lutut', 'Pergelangan Kaki', 'Lainnya']

const QOL_INSTRUMENTS: Record<string, { note: string; items: string[] }> = {
  'Nottingham Health Profile (adaptasi)': {
    note: 'Adaptasi ringkas dari domain Nottingham Health Profile (energi, nyeri, reaksi emosional, tidur, isolasi sosial, mobilitas fisik) — bukan instrumen resmi berlisensi.',
    items: ['Energi saya cukup sepanjang hari', 'Saya jarang merasa nyeri mengganggu aktivitas', 'Suasana hati saya stabil belakangan ini', 'Kualitas tidur saya baik', 'Saya cukup terhubung secara sosial (tidak terisolasi)', 'Saya bisa bergerak/beraktivitas fisik dengan bebas'],
  },
  'McGill Pain Questionnaire - Short Form (adaptasi)': {
    note: 'Adaptasi ringkas dari domain McGill Pain Questionnaire Short-Form (deskriptor sensorik & afektif nyeri) — bukan instrumen resmi berlisensi.',
    items: ['Nyeri saya tidak berdenyut/menusuk', 'Nyeri saya tidak tajam/seperti disayat', 'Nyeri saya tidak melelahkan secara fisik', 'Nyeri saya tidak mengganggu emosi (tidak menyiksa)', 'Secara umum intensitas nyeri saya rendah'],
  },
  'IQOLA / SF-36 (adaptasi)': {
    note: 'Adaptasi ringkas dari domain International Quality of Life Assessment (SF-36): fungsi fisik, peran fisik, nyeri tubuh, kesehatan umum, vitalitas, fungsi sosial, peran emosional, kesehatan mental — bukan instrumen resmi berlisensi.',
    items: ['Saya bisa melakukan aktivitas fisik sedang tanpa hambatan', 'Pekerjaan/aktivitas harian saya tidak terganggu masalah fisik', 'Nyeri tubuh tidak membatasi aktivitas saya', 'Secara umum saya menilai kesehatan saya baik', 'Saya punya cukup energi/vitalitas', 'Aktivitas sosial saya tidak terganggu', 'Masalah emosional tidak mengganggu aktivitas saya', 'Kesehatan mental saya baik (tenang, bahagia)'],
  },
  'Frenchay Activities Index (adaptasi)': {
    note: 'Adaptasi ringkas dari domain Frenchay Activities Index (aktivitas hidup sehari-hari & partisipasi sosial) — bukan instrumen resmi berlisensi.',
    items: ['Saya rutin menyiapkan makanan sendiri', 'Saya rutin berbelanja kebutuhan sehari-hari', 'Saya melakukan pekerjaan rumah ringan/berat', 'Saya rutin berjalan kaki di luar rumah', 'Saya aktif menjalani hobi', 'Saya bepergian (mengemudi/transportasi umum) secara mandiri', 'Saya melakukan pekerjaan produktif/bermanfaat'],
  },
}

export function InitialAssessment() {
  const nav = useNavigate()
  const [a, setA] = useState<Assessment>(load)
  const [step, setStep] = useState(0)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(a)) } catch { /* ignore */ } }, [a])

  const movementScore = Object.values(a.movement).reduce((s, v) => s + v, 0)
  const movementMax = MOVEMENTS.length * 2
  const asymBalance = Math.max(a.asym.balanceR, a.asym.balanceL) > 0 ? (Math.abs(a.asym.balanceR - a.asym.balanceL) / Math.max(a.asym.balanceR, a.asym.balanceL)) * 100 : 0
  const asymHop = Math.max(a.asym.hopR, a.asym.hopL) > 0 ? (Math.abs(a.asym.hopR - a.asym.hopL) / Math.max(a.asym.hopR, a.asym.hopL)) * 100 : 0
  const qolItems = QOL_INSTRUMENTS[a.qolInstrument].items
  const qolScore = a.qolAnswers.reduce((s, v) => s + v, 0)
  const qolMax = qolItems.length * 4
  const qolPct = qolMax > 0 ? (qolScore / qolMax) * 100 : 0

  const painFlag = a.painRegions.length > 0 && a.painSeverity >= 4
  const movementFlag = movementScore < movementMax * 0.5
  const asymFlag = asymBalance > 15 || asymHop > 15

  function finish() {
    setA((x) => ({ ...x, done: true, at: new Date().toISOString() }))
    nav('/training-plan')
  }

  const STEPS = ['Pola Gerak', 'Nyeri & Cedera', 'Kekuatan Dasar', 'Asimetri', 'Kualitas Hidup', 'Ringkasan']

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Penilaian Awal" subtitle="Pola gerak, risiko cedera, nyeri, kekuatan & asimetri — sebelum memulai program berat" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (step === i ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{i + 1}. {s}</button>
          ))}
        </div>
      </Card>

      {step === 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Skrining Pola Gerak" subtitle="Nilai diri sendiri (bantu cermin/rekam video) — 0 tidak bisa, 1 dengan kompensasi, 2 sempurna" />
          <div className="mt-3 space-y-3">
            {MOVEMENTS.map((m) => (
              <div key={m.id} className="rounded-xl border border-neutral-100 p-3">
                <div className="text-sm font-bold">{m.label}</div>
                <p className="text-[11px] text-neutral-500">{m.desc}</p>
                <div className="mt-2 flex gap-1.5">
                  {[0, 1, 2].map((v) => (
                    <button key={v} onClick={() => setA((x) => ({ ...x, movement: { ...x.movement, [m.id]: v } }))}
                      className={'flex-1 rounded-lg py-1.5 text-xs font-bold ' + (a.movement[m.id] === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconHeart size={20} />} title="Nyeri & Riwayat Cedera" subtitle="Tandai area yang terasa nyeri/pernah cedera" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PAIN_REGIONS.map((r) => (
              <button key={r} onClick={() => setA((x) => ({ ...x, painRegions: x.painRegions.includes(r) ? x.painRegions.filter((p) => p !== r) : [...x.painRegions, r] }))}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (a.painRegions.includes(r) ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-500')}>{r}</button>
            ))}
          </div>
          <div className="mt-4">
            <Field label={`Tingkat nyeri keseluruhan (0-10): ${a.painSeverity}`}>
              <input type="range" min={0} max={10} value={a.painSeverity} onChange={(e) => setA((x) => ({ ...x, painSeverity: +e.target.value }))} className="w-full" />
            </Field>
          </div>
          {painFlag && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] text-rose-600">⚠️ Nyeri tercatat cukup signifikan. Sebaiknya konsultasikan ke dokter/fisioterapis sebelum memulai program latihan berat.</div>}
        </Card>
      )}

      {step === 2 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Kekuatan Dasar (Baseline)" subtitle="Tes sederhana — jadi acuan kemajuan Anda" />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Push-up maks"><input className={inputClass} type="number" value={a.strength.pushups || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, pushups: +e.target.value } }))} /></Field>
            <Field label="Squat/60 detik"><input className={inputClass} type="number" value={a.strength.squats60 || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, squats60: +e.target.value } }))} /></Field>
            <Field label="Plank (detik)"><input className={inputClass} type="number" value={a.strength.plankSec || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, plankSec: +e.target.value } }))} /></Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Asimetri & Ketidakseimbangan" subtitle="Bandingkan sisi kanan vs kiri" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Keseimbangan Kanan (dtk)"><input className={inputClass} type="number" value={a.asym.balanceR || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, balanceR: +e.target.value } }))} /></Field>
            <Field label="Keseimbangan Kiri (dtk)"><input className={inputClass} type="number" value={a.asym.balanceL || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, balanceL: +e.target.value } }))} /></Field>
            <Field label="Lompat Kanan (cm)"><input className={inputClass} type="number" value={a.asym.hopR || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, hopR: +e.target.value } }))} /></Field>
            <Field label="Lompat Kiri (cm)"><input className={inputClass} type="number" value={a.asym.hopL || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, hopL: +e.target.value } }))} /></Field>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Asimetri Keseimbangan</div><div className="text-base font-extrabold text-brand-dark">{asymBalance.toFixed(0)}%</div></div>
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Asimetri Lompat</div><div className="text-base font-extrabold text-brand-dark">{asymHop.toFixed(0)}%</div></div>
          </div>
          {asymFlag && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700">⚠️ Asimetri &gt;15% terdeteksi — pertimbangkan latihan unilateral tambahan untuk sisi lebih lemah.</div>}
        </Card>
      )}

      {step === 4 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconHeart size={20} />} title="Skrining Kualitas Hidup" subtitle="Pilih instrumen acuan (adaptasi ringkas, bukan versi resmi berlisensi)" />
          <Field label="Instrumen">
            <select className={inputClass} value={a.qolInstrument} onChange={(e) => setA((x) => ({ ...x, qolInstrument: e.target.value, qolAnswers: [] }))}>
              {Object.keys(QOL_INSTRUMENTS).map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{QOL_INSTRUMENTS[a.qolInstrument].note}</p>
          <div className="mt-3 space-y-3">
            {qolItems.map((q, i) => (
              <div key={q} className="rounded-xl border border-neutral-100 p-3">
                <div className="text-xs font-semibold">{q}</div>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3, 4].map((v) => (
                    <button key={v} onClick={() => setA((x) => { const next = [...x.qolAnswers]; next[i] = v; return { ...x, qolAnswers: next } })}
                      className={'flex-1 rounded-lg py-1.5 text-[11px] font-bold ' + ((a.qolAnswers[i] ?? -1) === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{v}</button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>Tidak setuju</span><span>Sangat setuju</span></div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-neutral-50 p-3">
            <div className="text-[9px] font-bold uppercase text-neutral-400">Skor</div>
            <div className="text-lg font-extrabold text-brand-dark">{qolPct.toFixed(0)}%</div>
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconCheck size={20} />} title="Ringkasan & Simpan" subtitle="Tinjau sebelum menyimpan penilaian" />
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Pola Gerak</span>
              <Badge tone={movementFlag ? 'critical' : 'brand'}>{movementScore}/{movementMax} {movementFlag ? '— Perlu perhatian' : '— Baik'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Nyeri</span>
              <Badge tone={painFlag ? 'critical' : 'brand'}>{a.painRegions.length > 0 ? a.painRegions.join(', ') : 'Tidak ada'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Asimetri</span>
              <Badge tone={asymFlag ? 'low' : 'brand'}>{asymFlag ? 'Terdeteksi >15%' : 'Seimbang'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Kualitas Hidup</span>
              <Badge tone={qolPct >= 70 ? 'brand' : qolPct >= 40 ? 'low' : 'critical'}>{qolPct.toFixed(0)}%</Badge>
            </div>
          </div>
          {(movementFlag || painFlag) && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-600">
              Ada tanda risiko cedera. Program Anda akan tetap dibuat, tapi mulai dari intensitas ringan dan pertimbangkan konsultasi profesional dulu.
            </div>
          )}
          <Button onClick={finish} className="mt-4 w-full">Simpan & Mulai Program →</Button>
        </Card>
      )}
    </div>
  )
}

export default InitialAssessment
