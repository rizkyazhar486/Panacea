import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity, IconRun, IconHeart, IconChartUp } from '../components/icons'
import { useStore } from '../lib/store'

// ── Key Performance Indicators per cabang, dari sains olahraga nyata ──────────
// Tiap KPI menjelaskan: apa yang diukur, alat/indikator (jam/device/tes), dan
// kenapa penting untuk performa & pencegahan cedera.
const KPI_LIBRARY: { group: string; emoji: string; kpis: { name: string; how: string; why: string }[] }[] = [
  {
    group: 'Endurance (Lari, Sepeda, Renang, Triathlon)',
    emoji: '🏃',
    kpis: [
      { name: 'VO₂max', how: 'Estimasi jam dari HR + pace, atau tes lab', why: 'Plafon kapasitas aerobik — prediktor terbaik performa endurance.' },
      { name: 'Lactate Threshold (LT)', how: 'Tes lapangan 30 menit / analisis HR-pace jam', why: 'Intensitas tertinggi yang bisa dipertahankan; latihan tepat di LT menaikkan ambang.' },
      { name: 'Running Economy / Efisiensi', how: 'Watt atau pace per HR pada beban tetap', why: 'Seberapa hemat oksigen dipakai — pembeda elit pada VO₂max sama.' },
      { name: 'Acute:Chronic Workload (ACWR)', how: 'Beban 7 hari ÷ rata-rata 28 hari', why: 'Penanda risiko cedera utama; sweet spot 0.8–1.3.' },
      { name: 'HRV', how: 'Pengukuran malam dari jam (rMSSD)', why: 'Status pemulihan sistem saraf otonom — kapan boleh push.' },
    ],
  },
  {
    group: 'Tim/Lapangan (Sepak Bola, Basket, Rugby, Futsal)',
    emoji: '⚽',
    kpis: [
      { name: 'High-Speed Running & Sprint Distance', how: 'GPS vest (mis. Catapult/STATSports)', why: 'Beban eksternal — dosis lari cepat menentukan kesiapan & risiko hamstring.' },
      { name: 'Accelerations / Decelerations', how: 'Akselerometer GPS', why: 'Beban mekanis tinggi; pendorong kelelahan otot & cedera.' },
      { name: 'PlayerLoad / Total Load', how: 'GPS + akselerometer triaksial', why: 'Beban total sesi untuk periodisasi mingguan.' },
      { name: 'Countermovement Jump (CMJ)', how: 'Force plate / matras lompat', why: 'Monitor neuromuscular fatigue — turun >10% = belum pulih.' },
      { name: 'Heart Rate Recovery (HRR)', how: 'Penurunan HR 60 detik pasca-latihan', why: 'Indeks kebugaran & kesiapan kardiovaskular.' },
    ],
  },
  {
    group: 'Kekuatan & Power (Angkat Beban, Sprint, Combat)',
    emoji: '🏋️',
    kpis: [
      { name: 'Estimated 1RM & Velocity (VBT)', how: 'Velocity-based training encoder', why: 'Mengukur output kekuatan harian; atur beban sesuai kesiapan.' },
      { name: 'Rate of Force Development', how: 'Force plate', why: 'Seberapa cepat gaya dihasilkan — penting untuk power eksplosif.' },
      { name: 'Session RPE (sRPE)', how: 'Durasi × RPE (1–10), metode Foster', why: 'Beban internal sederhana tanpa alat mahal; basis ACWR.' },
      { name: 'Sleep & Recovery Score', how: 'Jam/cincin (Whoop, Oura, Garmin)', why: 'Pemulihan & adaptasi hormonal terjadi saat tidur.' },
    ],
  },
  {
    group: 'Presisi & Mental (Tenis, Golf, Esports, Menembak)',
    emoji: '🎾',
    kpis: [
      { name: 'Reaction Time & Consistency', how: 'Tes kognitif / aplikasi', why: 'Pembeda di momen kritis presisi tinggi.' },
      { name: 'Stress / Body Battery', how: 'HRV sepanjang hari dari jam', why: 'Mengelola beban mental & energi menuju kompetisi.' },
      { name: 'Mindfulness / RPE Mental', how: 'Jurnal harian + skala 1–10', why: 'Beban psikologis nyata memengaruhi performa & pemulihan.' },
    ],
  },
]

// ── Metode tim juara dunia (referensi nyata sains olahraga) ──────────────────
const WINNING_TEAMS: { team: string; emoji: string; principle: string; method: string }[] = [
  { team: 'Real Madrid', emoji: '👑', principle: 'Individualisasi & manajemen beban', method: 'Periodisasi taktis + pemantauan GPS individu; rotasi & load management menjaga pemain puncak di fase kritis (Champions League).' },
  { team: 'Mercedes-AMG F1', emoji: '🏎️', principle: 'Marginal gains & data', method: 'Budaya "marginal gains": ratusan titik data + simulasi; perbaikan 0.1% di banyak aspek menumpuk jadi keunggulan menang.' },
  { team: 'FC Barcelona', emoji: '🔵', principle: 'Periodisasi taktis (Seirul·lo)', method: 'Latihan terintegrasi teknik-taktik-fisik; beban dikondisikan dalam konteks permainan, bukan terpisah.' },
  { team: 'Manchester City', emoji: '🩵', principle: 'Sport science holistik', method: 'Tim sains besar: GPS, CMJ, HRV, tidur & nutrisi dipantau harian untuk individualisasi beban Guardiola.' },
  { team: 'LA Lakers', emoji: '🏀', principle: 'Load management & longevity', method: 'Pembatasan menit & istirahat terjadwal (load management) memperpanjang karier bintang & menjaga puncak di playoff.' },
  { team: 'Tim Roger Federer', emoji: '🎾', principle: 'Penjadwalan & efisiensi', method: 'Kalender selektif: memilih turnamen, periodisasi pemulihan, efisiensi gerak menjaga performa lintas dekade.' },
  { team: 'New England Patriots', emoji: '🏈', principle: 'Proses & disiplin detail', method: 'Budaya "do your job": standar latihan ketat, akuntabilitas, & persiapan terukur tiap fase musim.' },
  { team: 'Green Bay Packers', emoji: '🧀', principle: 'Reconditioning berbasis sains', method: 'Program reconditioning & pemantauan kesiapan untuk menekan cedera jaringan lunak sepanjang musim.' },
  { team: 'PSG', emoji: '🔴', principle: 'Monitoring beban elit', method: 'Integrasi data medis-performa untuk rotasi & pencegahan cedera pada jadwal padat.' },
  { team: 'Team Falcons (Esports)', emoji: '🎮', principle: 'Performa kognitif & recovery', method: 'Manajemen tidur, HRV & jeda kognitif untuk menjaga fokus dan reaksi di turnamen panjang.' },
  { team: 'Seattle Seahawks', emoji: '💚', principle: 'Mentalitas & mindfulness', method: 'Program mindfulness/psikologi (Pete Carroll & Michael Gervais): regulasi emosi & fokus sebagai KPI performa.' },
]

// ── Referensi jurnal & buku ──────────────────────────────────────────────────
const REFERENCES = [
  'Gabbett TJ. The training—injury prevention paradox. Br J Sports Med 2016.',
  'Foster C. Monitoring training in athletes (session RPE). Med Sci Sports Exerc 1998.',
  'Bompa & Buzzichelli. Periodization: Theory and Methodology of Training.',
  'Seiler S. Polarized training intensity distribution. Int J Sports Physiol Perform.',
  'Plews & Laursen. Heart Rate Variability in elite endurance athletes.',
  'Buchheit M. The 30-15 Intermittent Fitness Test & HR monitoring.',
  'Jones AM. The physiology of the world-record marathon (running economy).',
]

// ── Tujuh cabang ilmu keolahragaan (exercise science) ────────────────────────
// Tiap cabang dijelaskan + bagaimana ia membentuk rencana latihan pengguna.
const SCIENCE_BRANCHES: { name: string; emoji: string; what: string; apply: string }[] = [
  { name: 'Biomekanika', emoji: '📐', what: 'Analisis gaya, gerak, tuas & teknik tubuh.', apply: 'Perbaiki teknik (postur lari, sudut squat) untuk efisiensi & cegah cedera overuse.' },
  { name: 'Anatomi', emoji: '🦴', what: 'Struktur otot, sendi, tulang & jaringan.', apply: 'Pilih latihan yang menargetkan rantai otot benar & lindungi sendi rentan.' },
  { name: 'Fisiologi', emoji: '🫀', what: 'Respons sistem energi, kardiovaskular & otot terhadap beban.', apply: 'Atur zona HR, VO₂max & ambang laktat agar adaptasi tepat sasaran.' },
  { name: 'Perilaku Psikomotor', emoji: '🎯', what: 'Hubungan kognisi–gerak: akurasi, waktu reaksi, koordinasi.', apply: 'Latih keterampilan spesifik (drill presisi) dalam kondisi mirip kompetisi.' },
  { name: 'Neurosains', emoji: '🧠', what: 'Peran otak & saraf dalam adaptasi dan kelelahan.', apply: 'Kelola beban neural (HRV) & jadwalkan recovery agar sistem saraf pulih.' },
  { name: 'Kontrol Motorik', emoji: '🕹️', what: 'Bagaimana gerakan dipelajari & diotomatisasi.', apply: 'Progresi dari sadar → otomatis lewat repetisi terstruktur & variasi.' },
  { name: 'Psikologi Olahraga', emoji: '💭', what: 'Motivasi, fokus, regulasi emosi & mentalitas juara.', apply: 'Tetapkan tujuan, rutin pra-kompetisi & mindfulness untuk performa puncak.' },
]

// ── Prinsip latihan (7 prinsip ilmu olahraga) ────────────────────────────────
const TRAINING_PRINCIPLES: { name: string; emoji: string; rule: string; apply: string }[] = [
  { name: 'Overload', emoji: '⬆️', rule: 'Beri beban di atas kebiasaan agar tubuh beradaptasi.', apply: 'Naikkan volume/intensitas terukur — tapi jaga ACWR ≤1.3.' },
  { name: 'Progression', emoji: '📈', rule: 'Tingkatkan beban bertahap & sistematis.', apply: 'Aturan +10%/minggu; tambah satu variabel (jarak ATAU intensitas), bukan semua.' },
  { name: 'Periodization', emoji: '🗓️', rule: 'Susun siklus beban–pemulihan menuju puncak.', apply: 'Blok meso 3–4 minggu + deload; taper jelang kompetisi.' },
  { name: 'Specificity', emoji: '🎯', rule: 'Adaptasi spesifik pada jenis beban yang dilatih.', apply: 'Latih sesuai tuntutan cabang (energi, gerak, kecepatan) Anda.' },
  { name: 'Individualization', emoji: '🧬', rule: 'Sesuaikan dengan usia, level, genetik & respons.', apply: 'Pakai data pribadi (VO₂max, HRV, RPE) bukan rata-rata umum.' },
  { name: 'Reversibility', emoji: '⬇️', rule: '"Use it or lose it" — kebugaran menurun bila berhenti.', apply: 'Jaga beban minimum saat sibuk/cedera agar tak detraining.' },
  { name: 'Recovery / Adaptation', emoji: '😴', rule: 'Adaptasi terjadi saat pulih, bukan saat latihan.', apply: 'Tidur 7–9 jam, sisipkan hari ringan; pantau HRV & Recovery Time.' },
]

const SPORT_FILTERS = ['Semua', 'Lari', 'Sepeda', 'Renang', 'Gym', 'HIIT', 'Bola', 'Lainnya'] as const

const ID_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const ID_DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function rpeColor(rpe: number) {
  if (rpe >= 8) return 'bg-red-500'
  if (rpe >= 6) return 'bg-amber-500'
  if (rpe >= 4) return 'bg-brand'
  return 'bg-emerald-300'
}

export function SportsScience() {
  const { state } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [sport, setSport] = useState<typeof SPORT_FILTERS[number]>('Semua')

  // Index activities (training logs + GPS) by yyyy-mm-dd for the calendar.
  const byDate = useMemo(() => {
    const map: Record<string, { rpe?: number; type: string; emoji: string }[]> = {}
    const matches = (t: string) => sport === 'Semua' || t.toLowerCase().includes(sport.toLowerCase()) || (sport === 'Lainnya' && !['lari', 'sepeda', 'renang', 'gym', 'hiit', 'bola'].some((s) => t.toLowerCase().includes(s)))
    for (const l of state.trainingLogs ?? []) {
      if (!matches(l.type)) continue
      ;(map[l.date] ??= []).push({ rpe: l.rpe, type: l.type, emoji: '🔥' })
    }
    for (const g of state.gpsActivities ?? []) {
      const date = (g.at || '').slice(0, 10)
      if (!date || !matches(g.sport)) continue
      ;(map[date] ??= []).push({ type: g.sport, emoji: g.emoji || '📍' })
    }
    return map
  }, [state.trainingLogs, state.gpsActivities, sport])

  // Build the month grid (Mon-first).
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const startDow = (first.getDay() + 6) % 7 // Mon=0
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const out: (string | null)[] = []
    for (let i = 0; i < startDow; i++) out.push(null)
    for (let d = 1; d <= days; d++) out.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    return out
  }, [cursor])

  const monthCount = cells.filter((c) => c && byDate[c]).length
  function shift(delta: number) {
    setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Sains Olahraga & KPI" subtitle="Indikator performa, analisis & mentalitas — berbasis jurnal dan metode tim juara dunia" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Persiapan fisik, beban (workload), dan timing yang tepat memastikan Anda mencapai puncak kebugaran di
          fase kritis. Latihan berbasis data — VO₂max, kadar oksigen & CO₂, ambang laktat, HRV — menentukan
          <b> apa yang harus didorong, apa yang dilindungi, dan bagaimana mengelola pemulihan cedera.</b>
        </p>
      </Card>

      {/* Activity Profile calendar */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Profil Aktivitas" subtitle="Kalender latihan per cabang olahraga" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SPORT_FILTERS.map((s) => (
            <button key={s} onClick={() => setSport(s)}
              className={'rounded-full px-3 py-1 text-[11px] font-bold transition ' + (sport === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => shift(-1)} aria-label="Bulan sebelumnya" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:scale-90">‹</button>
          <div className="text-sm font-extrabold">{ID_MONTHS[cursor.m]} {cursor.y} <span className="ml-1 text-[11px] font-medium text-neutral-400">· {monthCount} hari aktif</span></div>
          <button onClick={() => shift(1)} aria-label="Bulan berikutnya" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:scale-90">›</button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
          {ID_DOW.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />
            const items = byDate[c]
            const day = Number(c.slice(8))
            const top = items?.reduce((mx, it) => Math.max(mx, it.rpe ?? 0), 0) ?? 0
            return (
              <div key={i} className={'relative aspect-square rounded-lg border p-1 text-[10px] ' + (items ? 'border-brand/30 bg-brand-50' : 'border-neutral-100')} title={items?.map((it) => `${it.emoji} ${it.type}${it.rpe ? ` (RPE ${it.rpe})` : ''}`).join(', ')}>
                <span className="text-neutral-400">{day}</span>
                {items && (
                  <div className="absolute inset-x-1 bottom-1 flex items-center gap-0.5">
                    {top > 0 && <span className={'h-1.5 w-1.5 rounded-full ' + rpeColor(top)} />}
                    <span className="truncate text-[9px] leading-none">{items[0].emoji}{items.length > 1 ? `+${items.length - 1}` : ''}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-300" />Ringan</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" />Sedang</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Berat</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Maksimal (RPE 8+)</span>
        </div>
        {monthCount === 0 && <p className="mt-3 text-center text-xs text-neutral-400">Belum ada aktivitas bulan ini. Catat di Log & Statistik atau rekam GPS.</p>}
      </Card>

      {/* KPI library */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Indikator Kunci per Cabang" subtitle="Apa diukur · alat/indikator · kenapa penting" />
        <div className="mt-3 space-y-4">
          {KPI_LIBRARY.map((grp) => (
            <div key={grp.group}>
              <div className="text-sm font-extrabold text-ink">{grp.emoji} {grp.group}</div>
              <div className="mt-2 space-y-2">
                {grp.kpis.map((k) => (
                  <div key={k.name} className="rounded-xl border border-neutral-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-brand-dark">{k.name}</span>
                      <Badge tone="neutral">{k.how}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{k.why}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Seven branches of exercise science */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Tujuh Cabang Ilmu Olahraga" subtitle="Dasar ilmiah yang membentuk rencana latihan Anda" />
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Perencanaan latihan berbasis ilmu menerapkan metode ilmiah dari tujuh cabang untuk memahami &
          meningkatkan performa, olahraga, dan aktivitas fisik.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SCIENCE_BRANCHES.map((b) => (
            <div key={b.name} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-sm font-extrabold">{b.emoji} {b.name}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{b.what}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-dark"><b>Penerapan:</b> {b.apply}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Training principles */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Prinsip Latihan (7 Prinsip)" subtitle="Panduan utama merancang program yang efektif" />
        <div className="mt-3 space-y-2">
          {TRAINING_PRINCIPLES.map((pr, i) => (
            <div key={pr.name} className="flex gap-3 rounded-xl border border-neutral-100 p-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-dark">{i + 1}</div>
              <div>
                <div className="text-sm font-extrabold">{pr.emoji} {pr.name}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{pr.rule}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-brand-dark"><b>Terapkan:</b> {pr.apply}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Periodization & peaking */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Periodisasi & Mencapai Puncak" subtitle="Mengatur beban agar puncak kebugaran jatuh di momen kritis" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Makrosiklus:</b> rencana musiman menuju target (kompetisi utama).</li>
          <li>• <b>Mesosiklus (3–4 minggu):</b> blok beban progresif lalu 1 minggu deload (~–40% volume).</li>
          <li>• <b>Mikrosiklus (1 minggu):</b> distribusi keras/ringan; jaga ACWR 0.8–1.3.</li>
          <li>• <b>Tapering:</b> 7–14 hari jelang kompetisi, kurangi volume 40–60% namun pertahankan intensitas — superkompensasi → performa puncak.</li>
          <li>• <b>Distribusi polarized (80/20):</b> 80% latihan ringan (Z1–Z2), 20% keras (Z4–Z5) — pola atlet endurance elit.</li>
        </ul>
      </Card>

      {/* Injury management */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Manajemen Beban & Pemulihan Cedera" subtitle="Apa yang didorong, apa yang dilindungi" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Lindungi</b> saat ACWR &gt;1.5, HRV turun &gt;15% dari baseline, atau CMJ turun &gt;10% — turunkan beban.</li>
          <li>• <b>Dorong</b> saat status "Productive/Maintaining", HRV seimbang, tidur &ge;75 — tambah stimulus terukur.</li>
          <li>• <b>Return-to-play bertahap:</b> naikkan beban maksimal +10%/minggu setelah cedera; nyeri &le;3/10 saat & sesudah.</li>
          <li>• <b>Tidur 7–9 jam</b> adalah pemulih utama; defisit tidur menaikkan risiko cedera secara nyata.</li>
        </ul>
      </Card>

      {/* References */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Metode Tim Juara Dunia" subtitle="Prinsip nyata yang bisa Anda adopsi" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {WINNING_TEAMS.map((t) => (
            <div key={t.team} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{t.emoji}</span>
                <span className="text-sm font-extrabold">{t.team}</span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-brand-dark">{t.principle}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{t.method}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Referensi Jurnal & Buku</div>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-neutral-500">
            {REFERENCES.map((r) => <li key={r}>• {r}</li>)}
          </ul>
          <p className="mt-2 text-[10px] text-neutral-400">Sumber indikator perangkat: Garmin fēnix 7 — Performance Measurements, Training Status & Recovery (manual resmi Garmin).</p>
        </div>
      </Card>
    </div>
  )
}
