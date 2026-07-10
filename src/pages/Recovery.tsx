import { useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconMoon, IconLeaf, IconActivity } from '../components/icons'
import { VideoGallery } from '../components/VideoGallery'

type RecoveryType = 'surgery' | 'injury' | 'illness' | 'overtraining'

interface RecoveryProfile { type: RecoveryType; startDate: string }

const KEY = 'pm_recovery_profile'
const def: RecoveryProfile = { type: 'injury', startDate: new Date().toISOString().slice(0, 10) }
function load(): RecoveryProfile {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return d.startDate ? d : def } catch { return def }
}
function save(p: RecoveryProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

const TYPE_LABEL: Record<RecoveryType, string> = {
  surgery: 'Pasca Operasi',
  injury: 'Cedera (Otot/Sendi/Tulang)',
  illness: 'Pasca Sakit (Infeksi/Demam)',
  overtraining: 'Overtraining / Kelelahan Berlebih',
}

interface Phase { label: string; days: [number, number]; guidance: string[] }

const PHASES: Record<RecoveryType, Phase[]> = {
  surgery: [
    { label: 'Akut (0-3 hari)', days: [0, 3], guidance: ['Istirahat total, elevasi area operasi', 'Ikuti instruksi analgesik dari dokter', 'Hindari aktivitas fisik & angkat beban', 'Cukupi protein 1.2-1.5g/kgBB untuk penyembuhan jaringan'] },
    { label: 'Subakut (4-14 hari)', days: [4, 14], guidance: ['Mobilisasi ringan bertahap sesuai anjuran', 'Perawatan luka rutin, pantau tanda infeksi', 'Mulai latihan pernapasan & ROM pasif', 'Tidur 8-9 jam/malam untuk regenerasi'] },
    { label: 'Pemulihan (15-42 hari)', days: [15, 42], guidance: ['Fisioterapi terstruktur', 'Latihan kekuatan ringan, hindari beban berat', 'Evaluasi ulang dengan dokter bedah', 'Tingkatkan aktivitas harian secara gradual'] },
    { label: 'Lanjutan (>42 hari)', days: [43, 9999], guidance: ['Kembali ke aktivitas normal bertahap', 'Latihan kekuatan & daya tahan penuh sesuai toleransi', 'Pantau gejala residual', 'Konsultasi rutin bila ada keluhan'] },
  ],
  injury: [
    { label: 'Inflamasi (0-3 hari)', days: [0, 3], guidance: ['RICE: Rest, Ice, Compression, Elevation', 'Hindari panas & pijatan pada area cedera', 'Hindari aktivitas yang memperparah nyeri', 'Anti-inflamasi sesuai anjuran dokter'] },
    { label: 'Proliferasi (4-21 hari)', days: [4, 21], guidance: ['Mobilisasi lembut & stretching ringan', 'Mulai latihan isometrik tanpa nyeri', 'Kompres hangat dapat dimulai', 'Protein cukup untuk perbaikan jaringan'] },
    { label: 'Remodeling (22-90 hari)', days: [22, 90], guidance: ['Latihan penguatan progresif', 'Latihan proprioseptif & keseimbangan', 'Kembali ke olahraga bertahap (return-to-play protocol)', 'Pantau nyeri saat eskalasi intensitas'] },
    { label: 'Maintenance (>90 hari)', days: [91, 9999], guidance: ['Latihan pencegahan cedera berulang', 'Pertahankan fleksibilitas & kekuatan otot penyokong', 'Evaluasi biomekanik/teknik olahraga', 'Lanjutkan program penguatan rutin'] },
  ],
  illness: [
    { label: 'Akut (0-3 hari)', days: [0, 3], guidance: ['Istirahat total, hidrasi 2.5-3L/hari', 'Hindari olahraga sama sekali (kondisi demam/akut)', 'Tidur cukup 8+ jam', 'Makanan mudah cerna & bergizi'] },
    { label: 'Pemulihan Awal (4-7 hari)', days: [4, 7], guidance: ['Aktivitas ringan jika sudah tanpa demam 24 jam', 'Jalan kaki santai 10-15 menit', 'Pantau detak jantung saat istirahat', 'Hindari intensitas tinggi'] },
    { label: 'Graded Return (8-14 hari)', days: [8, 14], guidance: ['Tingkatkan durasi & intensitas 10% per hari', 'Perhatikan gejala kambuh (myocarditis risk pasca virus)', 'Aerobik ringan-moderat', 'Konsultasi dokter bila ada sesak/nyeri dada'] },
    { label: 'Normal (>14 hari)', days: [15, 9999], guidance: ['Kembali ke rutinitas olahraga penuh', 'Pantau daya tahan & energi harian', 'Jaga imunitas dengan tidur & nutrisi seimbang'] },
  ],
  overtraining: [
    { label: 'Deload (0-7 hari)', days: [0, 7], guidance: ['Stop latihan intensitas tinggi total', 'Tidur 9+ jam/malam', 'Pijat/relaksasi otot, hindari stres tambahan', 'Asupan kalori & protein cukup, jangan defisit'] },
    { label: 'Aktif Ringan (8-14 hari)', days: [8, 14], guidance: ['Aktivitas Z1 (recovery) saja', 'Mobility & stretching harian', 'Pantau HRV/nadi istirahat pagi', 'Evaluasi pemicu overtraining (volume/stres/tidur)'] },
    { label: 'Re-build (15-28 hari)', days: [15, 28], guidance: ['Latihan bertahap 50-70% volume sebelumnya', 'Prioritaskan kualitas tidur & pemulihan', 'Tambah volume maksimal 10%/minggu', 'Hindari kembali ke volume penuh terlalu cepat'] },
    { label: 'Normal (>28 hari)', days: [29, 9999], guidance: ['Kembali ke program latihan penuh', 'Terapkan deload rutin tiap 4-6 minggu', 'Pantau tanda dini overtraining berikutnya'] },
  ],
}

function daysSince(dateStr: string) {
  const d = new Date(dateStr); const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000))
}

/* ══════════════════ SLEEP QUALITY SCORING ══════════════════ */
function clamp100(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }

function sleepScore(hours: number, latencyMin: number, awakenings: number, bedtimeVarianceMin: number) {
  const duration = clamp100(hours >= 7 && hours <= 9 ? 100 : 100 - Math.abs(hours - 8) * 20)
  const latency = clamp100(latencyMin <= 15 ? 100 : 100 - (latencyMin - 15) * 2)
  const awakening = clamp100(100 - awakenings * 15)
  const consistency = clamp100(bedtimeVarianceMin <= 30 ? 100 : 100 - (bedtimeVarianceMin - 30) * 1.5)
  const total = clamp100(duration * 0.4 + latency * 0.2 + awakening * 0.2 + consistency * 0.2)
  return { total, duration, latency, awakening, consistency }
}

function SleepScoreCard() {
  const [hours, setHours] = useState(7)
  const [latency, setLatency] = useState(15)
  const [awakenings, setAwakenings] = useState(0)
  const [variance, setVariance] = useState(20)

  const s = sleepScore(hours, latency, awakenings, variance)
  const grade = s.total >= 85 ? { l: 'Sangat Baik', tone: 'normal' as const } : s.total >= 70 ? { l: 'Baik', tone: 'normal' as const } : s.total >= 50 ? { l: 'Cukup', tone: 'low' as const } : { l: 'Buruk', tone: 'critical' as const }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconMoon size={20} />} title="Skor Kualitas Tidur" subtitle="Skoring fisiologis berbasis durasi, latensi, terbangun & konsistensi jam tidur" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Total Tidur (jam)"><input className={inputClass} type="number" step="0.5" value={hours} onChange={(e) => setHours(+e.target.value)} /></Field>
        <Field label="Waktu Sampai Tertidur (menit)"><input className={inputClass} type="number" value={latency} onChange={(e) => setLatency(+e.target.value)} /></Field>
        <Field label="Jumlah Terbangun Malam"><input className={inputClass} type="number" value={awakenings} onChange={(e) => setAwakenings(+e.target.value)} /></Field>
        <Field label="Variasi Jam Tidur (menit)"><input className={inputClass} type="number" value={variance} onChange={(e) => setVariance(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{s.total}<span className="text-sm font-semibold text-neutral-400">/100</span></div>
        <Badge tone={grade.tone}>{grade.l}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div><div className="text-sm font-black text-ink">{s.duration}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Durasi</div></div>
        <div><div className="text-sm font-black text-ink">{s.latency}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Latensi</div></div>
        <div><div className="text-sm font-black text-ink">{s.awakening}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Terbangun</div></div>
        <div><div className="text-sm font-black text-ink">{s.consistency}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Konsistensi</div></div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Bobot: Durasi 40% (optimal 7-9 jam) · Latensi 20% (idealnya ≤15 menit tertidur) · Terbangun 20% (idealnya 0x) · Konsistensi jam tidur 20% (idealnya varian ≤30 menit dari biasanya) — pola ini merefleksikan komponen inti Pittsburgh Sleep Quality Index (PSQI), disederhanakan untuk pemantauan harian mandiri.</p>
    </Card>
  )
}

/* ══════════════════ MEDITATION: GUIDED SCRIPTS + AMBIENT SOUND ══════════════════ */
interface MeditationScript { key: string; label: string; emoji: string; durationMin: number; steps: string[] }
const MEDITATION_SCRIPTS: MeditationScript[] = [
  { key: 'breathing478', label: 'Napas 4-7-8', emoji: '🌬️', durationMin: 5, steps: [
    'Duduk atau berbaring nyaman, punggung tegak namun rileks.',
    'Buang napas penuh lewat mulut hingga paru-paru kosong.',
    'Tarik napas lewat hidung, hitung diam-diam 1-2-3-4.',
    'Tahan napas, hitung 1-2-3-4-5-6-7.',
    'Buang napas penuh lewat mulut sambil berdesis, hitung 1-2-3-4-5-6-7-8.',
    'Ulangi siklus ini 4-8 kali. Bila pusing, kembali ke napas normal sejenak.',
  ] },
  { key: 'bodyscan', label: 'Body Scan', emoji: '🧘', durationMin: 10, steps: [
    'Berbaring telentang, tangan di samping tubuh, mata tertutup.',
    'Arahkan perhatian ke ujung jari kaki — rasakan sensasi apa pun tanpa menghakimi.',
    'Perlahan geser perhatian ke atas: telapak kaki, betis, lutut, paha.',
    'Lanjutkan ke panggul, perut, dada — perhatikan naik-turun napas.',
    'Geser ke tangan, lengan, bahu, leher, lalu wajah dan kepala.',
    'Rasakan seluruh tubuh sebagai satu kesatuan selama beberapa napas terakhir.',
  ] },
  { key: 'metta', label: 'Loving-Kindness (Metta)', emoji: '💚', durationMin: 8, steps: [
    'Duduk nyaman, mata tertutup, napas natural.',
    'Ucapkan dalam hati untuk diri sendiri: "Semoga aku bahagia, semoga aku sehat, semoga aku tenang."',
    'Bayangkan orang yang Anda kasihi — ulangi harapan yang sama untuknya.',
    'Bayangkan seseorang yang netral (kenalan biasa) — ulangi harapan yang sama.',
    'Bila mampu, bayangkan seseorang yang sulit bagi Anda — coba ulangi harapan yang sama.',
    'Perluas harapan ini ke semua makhluk: "Semoga semua makhluk bahagia & bebas dari penderitaan."',
  ] },
]

// Self-contained ambient sound generator (Web Audio API) — no external
// service/API key needed, so it works fully offline and isn't dependent on
// a third-party music API that can't be verified reachable from every
// deployment environment.
type AmbientKind = 'rain' | 'ocean' | 'tone'
function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ src?: AudioBufferSourceNode; gain?: GainNode; osc?: OscillatorNode; lfo?: OscillatorNode }>({})
  const [playing, setPlaying] = useState<AmbientKind | null>(null)

  function stop() {
    const n = nodesRef.current
    try { n.src?.stop(); n.osc?.stop(); n.lfo?.stop() } catch { /* already stopped */ }
    n.src?.disconnect(); n.gain?.disconnect(); n.osc?.disconnect(); n.lfo?.disconnect()
    nodesRef.current = {}
    setPlaying(null)
  }

  function play(kind: AmbientKind, volume: number) {
    stop()
    const ctx = ctxRef.current ?? new AudioContext()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)

    if (kind === 'tone') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'; osc.frequency.value = 136.1 // "Om" frequency, common calming reference tone
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.15; lfoGain.gain.value = 8
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency)
      osc.connect(gain); osc.start(); lfo.start()
      nodesRef.current = { osc, lfo, gain }
    } else {
      const bufferSize = ctx.sampleRate * 4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buffer; src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = kind === 'rain' ? 1200 : 500
      src.connect(filter); filter.connect(gain)
      src.start()
      nodesRef.current = { src, gain }
    }
    setPlaying(kind)
  }

  function setVolume(v: number) { if (nodesRef.current.gain) nodesRef.current.gain.gain.value = v }

  return { playing, play, stop, setVolume }
}

function MeditationCard() {
  const [scriptKey, setScriptKey] = useState(MEDITATION_SCRIPTS[0].key)
  const [stepIdx, setStepIdx] = useState(0)
  const [volume, setVolume] = useState(0.15)
  const { playing, play, stop, setVolume: setAmbientVolume } = useAmbientSound()
  const script = MEDITATION_SCRIPTS.find((s) => s.key === scriptKey)!

  function changeVolume(v: number) { setVolume(v); setAmbientVolume(v) }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconLeaf size={20} />} title="Meditasi Terpandu" subtitle="Skrip panduan + suara ambient untuk menenangkan pikiran sebelum tidur" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEDITATION_SCRIPTS.map((s) => (
          <button key={s.key} onClick={() => { setScriptKey(s.key); setStepIdx(0) }}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${scriptKey === s.key ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-neutral-400">Langkah {stepIdx + 1}/{script.steps.length} · ~{script.durationMin} menit total</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{script.steps[stepIdx]}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0} className="flex-1 rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">← Sebelumnya</button>
          <button onClick={() => setStepIdx((i) => Math.min(script.steps.length - 1, i + 1))} disabled={stepIdx === script.steps.length - 1} className="flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white disabled:opacity-40">Berikutnya →</button>
        </div>
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Suara Ambient</h4>
      <div className="mt-2 flex gap-2">
        {([['rain', '🌧️ Hujan'], ['ocean', '🌊 Ombak'], ['tone', '🎵 Nada Tenang']] as const).map(([k, l]) => (
          <button key={k} onClick={() => (playing === k ? stop() : play(k, volume))}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${playing === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {playing === k ? '⏸ ' : ''}{l}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-neutral-400">Volume</span>
        <input type="range" min={0} max={0.5} step={0.01} value={volume} onChange={(e) => changeVolume(+e.target.value)} className="flex-1 accent-brand" />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Suara ambient dihasilkan langsung di perangkat (Web Audio API) — berfungsi sepenuhnya offline, tanpa bergantung pada layanan musik pihak ketiga yang mungkin tidak selalu dapat diakses.</p>
    </Card>
  )
}

export function Recovery() {
  const [p, setP] = useState<RecoveryProfile>(load)
  const elapsed = daysSince(p.startDate)
  const phases = PHASES[p.type]
  const idx = phases.findIndex((ph) => elapsed >= ph.days[0] && elapsed <= ph.days[1])
  const current = phases[idx === -1 ? phases.length - 1 : idx]

  function upd(next: Partial<RecoveryProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <VideoGallery
        icon={<IconLeaf size={20} />}
        title="Video Pemulihan"
        subtitle="Peregangan lembut & latihan napas untuk mempercepat recovery"
        videos={[
          { label: 'Peregangan Hamstring & Twist', cue: 'Tahan 20-30 dtk per sisi · napas dalam · tanpa nyeri', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072959_151332b7-0e3e-4388-b7f3-4775a65c9b9c.mp4' },
          { label: 'Napas & Meditasi', cue: 'Duduk tegak · napas 4-7-8 · 10 menit menurunkan stres & memperbaiki HRV', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_073011_31df726a-68e4-43bf-a5c6-7cbbb41c748e.mp4' },
        ]}
      />

      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Recovery Tracker" subtitle="Pelacak fase pemulihan & panduan bertahap" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Jenis Pemulihan">
            <select className={inputClass} value={p.type} onChange={(e) => upd({ type: e.target.value as RecoveryType })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Tanggal Mulai">
            <input className={inputClass} type="date" value={p.startDate} onChange={(e) => upd({ startDate: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Hari ke-{elapsed} &middot; Fase Saat Ini</div>
          <div className="mt-1 text-2xl font-extrabold text-brand">{current.label}</div>
          <Badge tone="brand">{TYPE_LABEL[p.type]}</Badge>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconLeaf size={20} />} title="Panduan Fase Ini" subtitle="Rekomendasi berdasarkan hari sejak mulai" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          {current.guidance.map((g, i) => <li key={i}>• {g}</li>)}
        </ul>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Garis Waktu Pemulihan" subtitle="Seluruh fase untuk jenis ini" />
        <div className="mt-3 space-y-2">
          {phases.map((ph, i) => (
            <div key={ph.label} className={'flex items-center justify-between rounded-xl border p-3 ' + (i === (idx === -1 ? phases.length - 1 : idx) ? 'border-brand/40 bg-brand-50/40' : 'border-neutral-100')}>
              <div className="text-sm font-bold">{ph.label}</div>
              <div className="text-right text-xs font-semibold text-neutral-400">
                {ph.days[1] >= 9999 ? `>${ph.days[0]} hari` : `${ph.days[0]}-${ph.days[1]} hari`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SleepScoreCard />
      <MeditationCard />
    </div>
  )
}

export default Recovery
