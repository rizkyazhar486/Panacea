import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Aging & Fungsi Organ — quantitative/QC/safety layer for longevity.
// Distinct from Longevity (composite score/decades) and Komposisi Tubuh
// (BMI/InBody). Here: per-organ biomarker panels with reference RANGES and a
// safety band (green in-range / amber borderline / red act-now), quantified
// SKIN aging metrics, and AESTHETIC body-composition targets with a safety
// floor (how lean is healthy, how fast to change). Manual, offline.
// ─────────────────────────────────────────────────────────────────────────────

type Band = 'ok' | 'warn' | 'bad' | 'na'
interface Marker {
  id: string; label: string; unit: string
  lo: number; hi: number          // healthy reference range
  warnLo?: number; warnHi?: number // borderline edges (outside = red)
  note: string
}
interface Panel { id: string; emoji: string; organ: string; blurb: string; markers: Marker[] }

// Reference ranges are general adult guidance for education — NOT diagnosis.
const PANELS: Panel[] = [
  {
    id: 'metabolic', emoji: '🩸', organ: 'Metabolik & Pankreas', blurb: 'Kontrol gula & insulin — pendorong penuaan (glikasi) tercepat.',
    markers: [
      { id: 'glucose', label: 'Gula darah puasa', unit: 'mg/dL', lo: 70, hi: 99, warnLo: 60, warnHi: 125, note: '100-125 pradiabetes · ≥126 diabetes' },
      { id: 'hba1c', label: 'HbA1c', unit: '%', lo: 4.0, hi: 5.6, warnHi: 6.4, note: '5.7-6.4 pradiabetes · ≥6.5 diabetes' },
      { id: 'trig', label: 'Trigliserida', unit: 'mg/dL', lo: 40, hi: 149, warnHi: 199, note: 'penanda sensitivitas insulin' },
    ],
  },
  {
    id: 'cardio', emoji: '❤️', organ: 'Jantung & Pembuluh', blurb: 'Aterosklerosis mulai diam-diam sejak muda.',
    markers: [
      { id: 'ldl', label: 'LDL kolesterol', unit: 'mg/dL', lo: 40, hi: 99, warnHi: 159, note: '<100 optimal · ≥160 tinggi' },
      { id: 'hdl', label: 'HDL kolesterol', unit: 'mg/dL', lo: 50, hi: 90, warnLo: 40, note: 'makin tinggi makin protektif' },
      { id: 'sbp', label: 'Tekanan darah sistolik', unit: 'mmHg', lo: 90, hi: 119, warnHi: 139, note: '120-129 meningkat · ≥140 hipertensi' },
      { id: 'crp', label: 'hsCRP (inflamasi)', unit: 'mg/L', lo: 0, hi: 1, warnHi: 3, note: '<1 rendah · >3 risiko kardio tinggi' },
    ],
  },
  {
    id: 'liver', emoji: '🫗', organ: 'Hati (Liver)', blurb: 'Detoksifikasi & metabolisme; perlemakan hati kian umum.',
    markers: [
      { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', lo: 7, hi: 40, warnHi: 55, note: 'naik = stres/lemak hati' },
      { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', lo: 8, hi: 40, warnHi: 55, note: '' },
      { id: 'ggt', label: 'GGT', unit: 'U/L', lo: 8, hi: 48, warnHi: 70, note: 'sensitif thd alkohol & lemak hati' },
    ],
  },
  {
    id: 'kidney', emoji: '🫘', organ: 'Ginjal', blurb: 'Fungsi filtrasi menurun perlahan seiring usia.',
    markers: [
      { id: 'creat', label: 'Kreatinin', unit: 'mg/dL', lo: 0.6, hi: 1.2, warnHi: 1.4, note: 'naik = filtrasi turun' },
      { id: 'egfr', label: 'eGFR', unit: 'mL/mnt', lo: 90, hi: 120, warnLo: 60, note: '<60 (3 bln) = penyakit ginjal kronik' },
      { id: 'uricacid', label: 'Asam urat', unit: 'mg/dL', lo: 3.5, hi: 7.0, warnHi: 8.0, note: 'tinggi → gout & risiko kardio' },
    ],
  },
  {
    id: 'hormone', emoji: '⚗️', organ: 'Hormon & Tiroid', blurb: 'Mengatur metabolisme, otot, mood, libido.',
    markers: [
      { id: 'tsh', label: 'TSH (tiroid)', unit: 'mIU/L', lo: 0.4, hi: 4.0, warnHi: 6, note: 'tinggi = hipotiroid' },
      { id: 'vitd', label: 'Vitamin D (25-OH)', unit: 'ng/mL', lo: 30, hi: 60, warnLo: 20, note: '<20 defisiensi (imun, tulang, mood)' },
      { id: 'ferritin', label: 'Feritin (cadangan besi)', unit: 'ng/mL', lo: 30, hi: 300, warnLo: 15, note: 'rendah = anemia/lelah' },
    ],
  },
  {
    id: 'blood', emoji: '🔬', organ: 'Darah & Imun', blurb: 'Oksigenasi & pertahanan tubuh.',
    markers: [
      { id: 'hb', label: 'Hemoglobin', unit: 'g/dL', lo: 13, hi: 17, warnLo: 11, note: 'rendah = anemia (♀ 12-15)' },
      { id: 'wbc', label: 'Leukosit', unit: '10³/µL', lo: 4, hi: 11, warnHi: 13, note: 'tinggi = infeksi/inflamasi' },
    ],
  },
]

function bandOf(m: Marker, v: number): Band {
  if (!v) return 'na'
  if (v >= m.lo && v <= m.hi) return 'ok'
  const wLo = m.warnLo ?? m.lo, wHi = m.warnHi ?? m.hi
  if (v >= wLo && v <= wHi) return 'warn'
  return 'bad'
}
const BAND_COLOR: Record<Band, string> = { ok: '#00BF63', warn: '#f59e0b', bad: '#ef4444', na: '#d4d4d4' }
const BAND_LABEL: Record<Band, string> = { ok: 'Normal', warn: 'Perbatasan', bad: 'Perlu tindakan', na: '—' }

// Range bar showing where the value sits across [display min..max].
function MarkerBar({ m, v }: { m: Marker; v: number }) {
  const band = bandOf(m, v)
  const dispMin = Math.min(m.warnLo ?? m.lo, m.lo) * 0.6
  const dispMax = Math.max(m.warnHi ?? m.hi, m.hi) * 1.25
  const pct = (x: number) => Math.max(0, Math.min(100, ((x - dispMin) / (dispMax - dispMin)) * 100))
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold">{m.label}</span>
        <span className="text-sm font-extrabold" style={{ color: BAND_COLOR[band] }}>
          {v || '—'}<span className="ml-0.5 text-[10px] font-medium text-neutral-400">{m.unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="absolute inset-y-0 rounded-full bg-emerald-200" style={{ left: `${pct(m.lo)}%`, width: `${pct(m.hi) - pct(m.lo)}%` }} />
        {v > 0 && <div className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full" style={{ left: `${pct(v)}%`, background: BAND_COLOR[band] }} />}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
        <span>Normal {m.lo}-{m.hi} {m.unit}</span>
        <span className="font-bold" style={{ color: BAND_COLOR[band] }}>{BAND_LABEL[band]}</span>
      </div>
      {m.note && <div className="mt-0.5 text-[9px] text-neutral-400">{m.note}</div>}
    </div>
  )
}

// ── Skin aging (quantified) ──────────────────────────────────────────────────
interface SkinData { spfDays: number; hydrationGlasses: number; sleepH: number; smoke: boolean; sugarHigh: boolean; retinoid: boolean; antioxidant: boolean; type: number }
const SKIN_DEF: SkinData = { spfDays: 3, hydrationGlasses: 6, sleepH: 7, smoke: false, sugarHigh: false, retinoid: false, antioxidant: false, type: 3 }
function skinScore(s: SkinData): number {
  let sc = 40
  sc += (s.spfDays / 7) * 22       // UV = ~80% of extrinsic aging
  sc += Math.min(1, s.hydrationGlasses / 8) * 8
  sc += Math.max(0, 1 - Math.abs(s.sleepH - 7.75) / 3) * 10
  if (s.retinoid) sc += 8
  if (s.antioxidant) sc += 6
  if (s.smoke) sc -= 18
  if (s.sugarHigh) sc -= 8         // glycation → collagen cross-linking
  return Math.round(Math.max(5, Math.min(100, sc)))
}

// ── Aesthetic body-composition targets WITH a safety floor ───────────────────
function aestheticBodyFat(g: 'M' | 'F') {
  return g === 'M'
    ? { essential: 3, athletic: [6, 13], fit: [14, 17], healthy: [18, 24], floor: 5 }
    : { essential: 12, athletic: [14, 20], fit: [21, 24], healthy: [25, 31], floor: 12 }
}

export function OrganVitality() {
  const [tab, setTab] = useState<'organ' | 'kulit' | 'estetika'>('organ')
  const [labs, setLabs] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem('pmd_organ_labs') || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem('pmd_organ_labs', JSON.stringify(labs)) } catch { /* ignore */ } }, [labs])

  const [skin, setSkin] = useState<SkinData>(() => { try { return { ...SKIN_DEF, ...JSON.parse(localStorage.getItem('pmd_skin') || '{}') } } catch { return SKIN_DEF } })
  useEffect(() => { try { localStorage.setItem('pmd_skin', JSON.stringify(skin)) } catch { /* ignore */ } }, [skin])

  // Aesthetic tab pulls from Komposisi Tubuh if present.
  const bc = useMemo(() => { try { return JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}') } catch { return {} } }, [])
  const g: 'M' | 'F' = bc.g === 'F' ? 'F' : 'M'
  const [pbf, setPbf] = useState<number>(bc.bfm && bc.w ? +((bc.bfm / bc.w) * 100).toFixed(1) : 20)

  // Overall organ-panel summary.
  const allMarkers = PANELS.flatMap((p) => p.markers)
  const filled = allMarkers.filter((m) => labs[m.id] > 0)
  const flags = filled.map((m) => bandOf(m, labs[m.id]))
  const bad = flags.filter((f) => f === 'bad').length
  const warn = flags.filter((f) => f === 'warn').length

  const sScore = skinScore(skin)
  const skinBioAge = Math.round((100 - sScore) * 0.25) // extra "skin years" heuristic
  const bf = aestheticBodyFat(g)
  const pbfBand: Band = pbf < bf.floor ? 'bad' : pbf <= bf.fit[1] ? 'ok' : pbf <= bf.healthy[1] ? 'warn' : 'bad'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Anti-Aging & Fungsi Organ" subtitle="Angka, rentang aman & kendali mutu di balik penuaan sehat — bukan sekadar wellness" />
        <div className="mt-3 flex gap-1.5">
          {([['organ', '🫀 Panel Organ'], ['kulit', '✨ Kulit'], ['estetika', '💪 Estetika Aman']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={'flex-1 rounded-xl py-2 text-xs font-bold transition ' + (tab === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{l}</button>
          ))}
        </div>
        {tab === 'organ' && filled.length > 0 && (
          <div className="mt-3 flex items-center justify-around rounded-2xl bg-neutral-50 p-3 text-center">
            <div><div className="text-xl font-extrabold text-brand-dark">{filled.length}</div><div className="text-[9px] uppercase text-neutral-400">terisi</div></div>
            <div><div className="text-xl font-extrabold text-amber-600">{warn}</div><div className="text-[9px] uppercase text-neutral-400">perbatasan</div></div>
            <div><div className="text-xl font-extrabold text-rose-500">{bad}</div><div className="text-[9px] uppercase text-neutral-400">perlu tindakan</div></div>
          </div>
        )}
      </Card>

      {/* ORGAN PANELS */}
      {tab === 'organ' && (
        <>
          {PANELS.map((p) => (
            <Card key={p.id} className="!p-5">
              <SectionTitle icon={<span className="text-lg">{p.emoji}</span>} title={p.organ} subtitle={p.blurb} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {p.markers.map((m) => (
                  <Field key={m.id} label={`${m.label} (${m.unit})`}>
                    <input className={inputClass} type="number" step="any" value={labs[m.id] || ''} placeholder={`${m.lo}-${m.hi}`}
                      onChange={(e) => setLabs((l) => ({ ...l, [m.id]: +e.target.value }))} />
                  </Field>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {p.markers.filter((m) => labs[m.id] > 0).map((m) => <MarkerBar key={m.id} m={m} v={labs[m.id]} />)}
              </div>
            </Card>
          ))}
          <div className="rounded-2xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
            ⚠️ <b>Quality control & keamanan:</b> rentang di atas adalah acuan edukatif dewasa umum — laboratorium berbeda punya rentang sendiri, dan nilai harus ditafsirkan bersama gejala & riwayat. Nilai <b>merah</b> berarti diskusikan dengan dokter, jangan mendiagnosis sendiri. Fitur <a href="#/chatbot" className="font-bold underline">Konsultasi AI</a> membantu menyiapkan pertanyaan untuk dokter.
          </div>
        </>
      )}

      {/* SKIN */}
      {tab === 'kulit' && (
        <Card className="!p-5">
          <SectionTitle icon={<span className="text-lg">✨</span>} title="Penuaan Kulit (Kuantitatif)" subtitle="UV ≈ 80% penuaan kulit ekstrinsik — terukur & bisa dicegah" />
          <div className="mt-2 flex items-center justify-around rounded-2xl bg-ink p-4 text-white">
            <div className="text-center">
              <div className="text-4xl font-extrabold" style={{ color: sScore >= 75 ? '#00BF63' : sScore >= 50 ? '#f59e0b' : '#ef4444' }}>{sScore}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">Skor Kulit</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-amber-300">+{skinBioAge}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">Estimasi "usia kulit" ekstra</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Hari pakai SPF/minggu"><input className={inputClass} type="number" max={7} value={skin.spfDays} onChange={(e) => setSkin((s) => ({ ...s, spfDays: +e.target.value }))} /></Field>
            <Field label="Gelas air/hari"><input className={inputClass} type="number" value={skin.hydrationGlasses} onChange={(e) => setSkin((s) => ({ ...s, hydrationGlasses: +e.target.value }))} /></Field>
            <Field label="Tidur (jam)"><input className={inputClass} type="number" step={0.1} value={skin.sleepH} onChange={(e) => setSkin((s) => ({ ...s, sleepH: +e.target.value }))} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {([['retinoid', '🧴 Retinoid rutin', false], ['antioxidant', '🍊 Antioksidan/Vit C', false], ['smoke', '🚬 Merokok', true], ['sugarHigh', '🍰 Gula tinggi (glikasi)', true]] as const).map(([k, l, bad]) => (
              <button key={k} onClick={() => setSkin((s) => ({ ...s, [k]: !s[k] }))}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (skin[k] ? (bad ? 'bg-rose-500 text-white' : 'bg-brand text-white') : 'bg-neutral-100 text-neutral-500')}>{l}</button>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-neutral-500">
            <li>• <b>SPF harian</b> adalah intervensi anti-aging kulit paling terbukti (mencegah photoaging & kanker kulit).</li>
            <li>• <b>Glikasi</b>: gula darah tinggi mengikat kolagen (AGEs) → kulit kaku & kusam — jadi kontrol gula = perawatan kulit.</li>
            <li>• <b>Tidur & hidrasi</b>: perbaikan kolagen terjadi saat tidur dalam; dehidrasi mempertegas garis halus.</li>
            <li>• <b>Rokok</b>: menyempitkan pembuluh mikro kulit, mempercepat kerutan secara dramatis.</li>
          </ul>
        </Card>
      )}

      {/* AESTHETIC + SAFETY */}
      {tab === 'estetika' && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Estetika Komposisi — dengan Batas Aman" subtitle="Bentuk optimal tanpa mengorbankan hormon, imun & organ" />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field label="Jenis kelamin">
              <select className={inputClass} value={g} disabled><option>{g === 'M' ? 'Laki-laki' : 'Perempuan'}</option></select>
            </Field>
            <Field label="% Lemak tubuh"><input className={inputClass} type="number" step={0.1} value={pbf} onChange={(e) => setPbf(+e.target.value)} /></Field>
          </div>
          <div className="mt-3 rounded-2xl p-3 text-center" style={{ background: `${BAND_COLOR[pbfBand]}14`, border: `1px solid ${BAND_COLOR[pbfBand]}30` }}>
            <div className="text-sm font-extrabold" style={{ color: BAND_COLOR[pbfBand] }}>
              {pbf < bf.floor ? '⚠️ Di bawah batas aman' : pbf <= bf.fit[1] ? 'Zona atletis/fit' : pbf <= bf.healthy[1] ? 'Sehat' : 'Di atas rentang sehat'}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              {pbf < bf.floor
                ? `Di bawah ${bf.floor}% (${g === 'F' ? 'perempuan' : 'laki-laki'}) mengganggu hormon${g === 'F' ? ' & siklus menstruasi' : ' (testosteron turun)'}, imun, & suhu tubuh. Estetika "shredded" ekstrem tidak berkelanjutan.`
                : 'Target penampilan tetap dalam koridor yang menjaga fungsi hormon & imun.'}
            </p>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-neutral-600">
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Essential (batas minimum fisiologis)</span><b>{bf.essential}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Atletis</span><b>{bf.athletic[0]}-{bf.athletic[1]}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Fit / definisi terlihat</span><b>{bf.fit[0]}-{bf.fit[1]}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Sehat</span><b>{bf.healthy[0]}-{bf.healthy[1]}%</b></div>
          </div>
          <div className="mt-3 rounded-xl border border-neutral-100 p-3 text-[11px] leading-relaxed text-neutral-500">
            <b className="text-ink">Laju perubahan aman (quality control):</b> defisit/surplus ≤0.5-1% berat badan per minggu.
            Cut lebih cepat = kehilangan otot & metabolisme adaptif; bulk lebih cepat = lemak berlebih.
            Jaga protein ≥1.6 g/kg + latihan beban agar yang turun adalah lemak, bukan otot.
            Pantau eksekusinya di <a href="#/body" className="font-bold text-brand-dark underline">Komposisi Tubuh</a> & <a href="#/training-plan" className="font-bold text-brand-dark underline">Program AI</a>.
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-[11px] leading-relaxed text-brand-dark">
        Ini lapisan <b>klinis-kuantitatif</b> longevity: <a href="#/longevity" className="font-bold underline">Pusat Longevity</a> menilai skor & proyeksi dekade,
        halaman ini mengurai <b>angka organ, kulit & estetika aman</b>. Semua nilai edukatif — bukan diagnosis. Data tersimpan di perangkat Anda.
      </div>
    </div>
  )
}

export default OrganVitality
