import { Link } from 'react-router-dom'
import { useTujuan, modeAwam } from '../lib/tujuan'

/**
 * Panduan pemakaian: peta, bukan buku manual.
 *
 * Ditulis dengan bentuk yang sama dengan catatan penyakit — simpul, panah,
 * kotak — karena itu bentuk yang sudah dipakai di seluruh aplikasi ini, dan
 * panduan yang berbentuk lain justru menambah satu hal baru untuk dipelajari.
 *
 * Isinya dibatasi pada apa yang benar-benar perlu diketahui untuk mulai: ke
 * mana pergi, apa yang didapat, dan berapa lama. Sisanya sudah dijelaskan di
 * halamannya masing-masing.
 */

type Langkah = { ke?: string; ikon: string; judul: string; isi: string; lama: string }

const MULAI: Langkah[] = [
  { ke: '/profile', ikon: '👤', judul: 'Fill in a short profile', isi: 'Age, height, weight. Without these, the calculators and nutrition targets cannot be computed.', lama: '1 min' },
  { ke: '/tubuh', ikon: '❤️', judul: 'Record one number', isi: 'Blood pressure, weight, or pulse. One number is enough to start a chart.', lama: '30 sec' },
  { ke: '/latihan', ikon: '🏃', judul: 'Record one workout', isi: 'The app uses it to compute fatigue and suggest your next session.', lama: '1 min' },
]

const BELAJAR: Langkah[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Open one condition', isi: 'A map appears: Sebab → Tampak → Pastikan → Periksa → Obat → Bahaya. Tap a branch for the full content.', lama: '2 min' },
  { ke: '/med-study', ikon: '🩺', judul: 'Open one procedure', isi: 'Each phase becomes a branch. The order of phases is what you memorise; the steps are recalled when needed.', lama: '2 min' },
  { ke: '/clinical-calculators', ikon: '🧮', judul: 'Compute one score', isi: 'SOFA, Wells, Child-Pugh. Fill the fields and the result arrives with its interpretation.', lama: '1 min' },
]

/** Langkah yang sama tanpa istilah ujian. Halaman tujuannya persis sama. */
const BELAJAR_AWAM: Langkah[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Look up one condition', isi: 'A map appears: Sebab → Tampak → Pastikan → Periksa → Obat → Bahaya. Tap a branch for the full content.', lama: '2 min' },
  { ke: '/med-study', ikon: '🩺', judul: 'See how to give first aid', isi: 'Rescue breathing, cardiac arrest, splinting a fracture — each stage is a branch.', lama: '2 min' },
  { ke: '/clinical-calculators', ikon: '🧮', judul: 'Work out one risk', isi: 'Heart risk, kidney function. Fill the fields and the result arrives with its interpretation.', lama: '1 min' },
]

/** Arti warna cabang di peta penyakit — sama di seluruh 623 catatan. */
const WARNA: [string, string, string][] = [
  ['bg-neutral-700', 'APA', 'a short definition'],
  ['bg-rose-500', 'SEBAB', 'aetiology and risk factors'],
  ['bg-sky-500', 'TAMPAK', 'symptoms and signs'],
  ['bg-violet-500', 'PASTIKAN', 'how the diagnosis is made'],
  ['bg-amber-500', 'PERIKSA', 'supporting investigations'],
  ['bg-emerald-500', 'OBAT', 'management'],
  ['bg-neutral-400', 'BEDA DGN', 'differential diagnosis'],
  ['bg-red-600', 'BAHAYA', 'complications'],
]

function Baris({ l, no }: { l: Langkah; no: number }) {
  const isi = (
    <>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-black text-white">{no}</span>
      <span className="text-xl leading-none">{l.ikon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink dark:text-white">{l.judul}</span>
        <span className="block text-[12px] leading-snug text-neutral-500">{l.isi}</span>
      </span>
      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-white/10">{l.lama}</span>
    </>
  )
  const kelas = 'flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/5'
  return l.ke ? <Link to={l.ke} className={`${kelas} active:scale-[0.99]`}>{isi}</Link> : <div className={kelas}>{isi}</div>
}

function Bagian({ judul, langkah, dari }: { judul: string; langkah: Langkah[]; dari: number }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <div className="space-y-2">
        {langkah.map((l, i) => <Baris key={l.judul} l={l} no={dari + i} />)}
      </div>
    </section>
  )
}

export default function Tutorial() {
  // Panduan memakai bahasa pembacanya sendiri; kalau tidak, langkah pertama
  // pemakai awam justru menjadi menebak arti singkatan di dalam panduannya.
  const awam = modeAwam(useTujuan())
  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-[20px] font-black text-ink dark:text-white">How to Use</h1>
        <p className="text-[13px] text-neutral-500">Six steps, under 10 minutes. Tap to go straight there.</p>
      </header>

      <Bagian judul="① Set up first" langkah={MULAI} dari={1} />
      <Bagian judul={awam ? '② Start looking things up' : '② Start studying'} langkah={awam ? BELAJAR_AWAM : BELAJAR} dari={4} />

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">What the colours mean on the condition map</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          <p className="mb-2 text-[12px] leading-snug text-neutral-500">
            {awam
              ? 'The colours and their order are the same across all 623 conditions. Learn them once and they apply everywhere.'
              : 'The colours and their order are the same across all 623 conditions. Memorise them once and they apply everywhere.'}
          </p>
          <ul className="space-y-1">
            {WARNA.map(([w, label, arti]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`w-[68px] shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-black uppercase tracking-wide text-white ${w}`}>{label}</span>
                <span className="text-neutral-400">▶</span>
                <span className="text-[12px] text-neutral-600 dark:text-neutral-300">{arti}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">If you get lost</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/semua-fitur" className="rounded-full bg-brand px-3.5 py-2 text-[12px] font-bold text-white">🧭 All Features</Link>
          <Link to="/search" className="rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">🔍 Search</Link>
          <Link to="/atur-fitur" className="rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">⚙️ Hide features</Link>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-neutral-400">
        {awam
          ? 'The health content in this app is reading material, not a diagnosis and not a prescription. If something is wrong, see a doctor.'
          : 'The clinical content in this app is study material, not a substitute for examining a patient. Always check the current guidelines before applying any of it.'}
      </p>
    </div>
  )
}
