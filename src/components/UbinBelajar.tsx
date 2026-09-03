import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { KISAH } from '../lib/kisahKetahanan'
import { KUTIPAN_ATLET } from '../lib/kutipanAtlet'
import { MOTIVATION } from '../lib/studyContent'
import { SKDI_ENTRIES } from '../lib/skdiTherapyReference'
import { QUIZ_BANK, type QuizQuestion } from '../lib/quizBank'
import { PemutarBaca } from './PemutarBaca'
import { KARYA, JENIS_LABEL } from '../lib/ringkasanKarya'

// ─────────────────────────────────────────────────────────────────────────────
// Tiga widget yang mengambil dari isi yang SUDAH ADA di aplikasi ini.
//
// Tidak ada satu pun kalimat baru yang dikarang di berkas ini: kisah ketahanan
// (78 tokoh), kutipan atlet (11), kartu semangat koas (8), acuan tatalaksana
// SKDI (641 baris), dan bank soal berbahasa Indonesia sudah tertulis di
// pustaka masing-masing. Yang ditambahkan hanyalah CARA MEMBACANYA di beranda
// — sedikit demi sedikit, berganti sendiri tiap hari, dan dapat diganti dengan
// satu ketukan.
//
// MENGAPA BERGANTI MENURUT TANGGAL, BUKAN ACAK. Isi yang diacak berubah setiap
// kali beranda digambar ulang — menggulir ke bawah lalu kembali ke atas sudah
// cukup membuat kartu yang sedang dibaca hilang. Urutannya ditentukan tanggal,
// jadi kartunya tetap sama sepanjang hari kecuali memang ditekan "Lain".
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

/** Nomor urut hari ini — sama sepanjang hari, berbeda esok hari. */
function nomorHari(): number {
  return Math.floor(Date.now() / HARI)
}

function Kepala({ judul, ke, aksi }: { judul: string; ke: string; aksi?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <span className="flex items-center gap-3">
        {aksi}
        <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Open →
        </Link>
      </span>
    </div>
  )
}

function TombolLain({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500">
      Another ↻
    </button>
  )
}

// ── Inspirasi ──────────────────────────────────────────────────────────────
//
// Tiga sumber digabung karena ketiganya menjawab hal yang berbeda: kisah
// menunjukkan bahwa kesulitan pernah dilalui orang lain, kutipan atlet
// menyalakan, dan kartu semangat koas berbicara tepat tentang keadaan yang
// sedang dijalani pemakainya.

type Kartu =
  | { jenis: 'kisah'; nama: string; bidang: string; sulit: string; hikmah: string }
  | { jenis: 'atlet'; teks: string; oleh: string; prestasi: string }
  | { jenis: 'koas'; teks: string; konteks: string }

function semuaKartu(): Kartu[] {
  return [
    ...KISAH.map((k) => ({ jenis: 'kisah' as const, nama: k.name, bidang: k.field, sulit: k.hardship, hikmah: k.lesson })),
    ...KUTIPAN_ATLET.map((k) => ({ jenis: 'atlet' as const, teks: k.quote, oleh: k.author, prestasi: k.feat })),
    ...MOTIVATION.map((m) => ({ jenis: 'koas' as const, teks: m.quote, konteks: m.context })),
  ]
}

export function UbinInspirasi() {
  const daftar = useMemo(semuaKartu, [])
  const [geser, setGeser] = useState(0)
  const k = daftar[(nomorHari() + geser) % daftar.length]

  return (
    <section>
      <Kepala judul="Inspiration" ke="/resilience-stories" aksi={<TombolLain onClick={() => setGeser((g) => g + 1)} />} />
      <div className="kaca rounded-3xl p-3">
        {k.jenis === 'kisah' ? (
          <>
            <span className="t-kecil block truncate font-black text-ink dark:text-white">{k.nama}</span>
            <span className="t-mikro block truncate text-neutral-400">{k.bidang}</span>
            <p className="t-mikro mt-2 line-clamp-2 leading-snug text-neutral-500 dark:text-neutral-400">{k.sulit}</p>
            <p className="t-kecil mt-1.5 line-clamp-3 leading-snug text-ink dark:text-white">{k.hikmah}</p>
          </>
        ) : k.jenis === 'atlet' ? (
          <>
            <p className="t-kecil leading-snug text-ink dark:text-white">“{k.teks}”</p>
            <span className="t-mikro mt-1.5 block truncate font-black text-neutral-500">{k.oleh}</span>
            <span className="t-mikro block truncate text-neutral-400">{k.prestasi}</span>
          </>
        ) : (
          <>
            <p className="t-kecil leading-snug text-ink dark:text-white">{k.teks}</p>
            <span className="t-mikro mt-1.5 block truncate text-neutral-400">{k.konteks}</span>
          </>
        )}
        <div className="mt-2">
          <PemutarBaca
            teks={k.jenis === 'kisah' ? `${k.nama}. ${k.bidang}. ${k.sulit} ${k.hikmah}`
              : k.jenis === 'atlet' ? `${k.teks} — ${k.oleh}, ${k.prestasi}`
                : `${k.teks} ${k.konteks}`}
            label="Listen"
          />
        </div>
        <p className="t-mikro mt-2 text-neutral-400">{daftar.length} cards · a new one each day</p>
      </div>
    </section>
  )
}

// ── Kartu belajar (tatalaksana) ────────────────────────────────────────────
//
// Sisi depan diagnosis, sisi belakang tatalaksananya — bentuk yang persis
// dipakai orang saat menghafal dosis. Jawabannya DISEMBUNYIKAN sampai
// ditekan; kartu yang jawabannya sudah terlihat bukan lagi latihan mengingat,
// hanya bacaan, dan bedanya justru itu yang membuat kartu ini berguna.
export function UbinKartuBelajar() {
  const [geser, setGeser] = useState(0)
  const [buka, setBuka] = useState(false)
  const e = SKDI_ENTRIES[(nomorHari() * 7 + geser) % SKDI_ENTRIES.length]

  return (
    <section>
      <Kepala
        judul="Study card"
        ke="/med-study?bagian=therapy"
        aksi={<TombolLain onClick={() => { setGeser((g) => g + 1); setBuka(false) }} />}
      />
      <button
        onClick={() => setBuka((v) => !v)}
        className="kaca block w-full rounded-3xl p-3 text-left transition active:scale-[0.99]"
      >
        <span className="t-mikro block truncate text-neutral-400">{e.system}</span>
        <span className="t-sedang mt-0.5 block font-black leading-snug text-ink dark:text-white">
          {e.diagnosis}
          {e.classification ? <span className="t-kecil font-bold text-neutral-400"> · {e.classification}</span> : null}
        </span>

        {buka ? (
          <p className="t-kecil mt-2 line-clamp-4 leading-snug text-neutral-600 dark:text-neutral-300">{e.therapy}</p>
        ) : (
          <p className="t-kecil mt-2 text-brand">Its management? Tap to reveal →</p>
        )}
        <span className="t-mikro mt-2 block text-neutral-400">SKDI management reference · {SKDI_ENTRIES.length} cards</span>
      </button>
      {/* Tombol dengar DI LUAR kartunya: kartu ini sendiri sebuah tombol
          (menekannya membuka jawaban), dan tombol di dalam tombol membuat
          setiap ketukan mengerjakan dua hal sekaligus. */}
      {buka && (
        <div className="mt-1.5">
          <PemutarBaca teks={`${e.diagnosis}. ${e.classification ?? ''}. ${e.therapy}`} label="Listen to the card" />
        </div>
      )}
    </section>
  )
}

// ── Soal ───────────────────────────────────────────────────────────────────
//
// Diambil dari bank soal berbahasa Indonesia yang sudah ada, tingkat koas
// sampai dokter umum. Sesudah dijawab, pembahasannya ditampilkan — termasuk
// ketika jawabannya benar, karena tahu MENGAPA benar adalah bedanya antara
// menebak dengan tepat dan mengerti.
const TINGKAT = ['koas', 'internship', 'dokter_umum'] as const

function soalHariIni(geser: number): { s: QuizQuestion; tingkat: string } {
  const kumpulan: { s: QuizQuestion; tingkat: string }[] = []
  for (const t of TINGKAT) for (const s of QUIZ_BANK[t] ?? []) kumpulan.push({ s, tingkat: t })
  return kumpulan[(nomorHari() * 3 + geser) % Math.max(1, kumpulan.length)]
}

export function UbinSoal() {
  const [geser, setGeser] = useState(0)
  const [jawab, setJawab] = useState<number | boolean | null>(null)
  const butir = useMemo(() => soalHariIni(geser), [geser])
  if (!butir) return null
  const { s } = butir

  const pilihan: { label: string; nilai: number | boolean }[] =
    s.type === 'tf'
      ? [{ label: 'Fact', nilai: true }, { label: 'Myth', nilai: false }]
      : (s.options ?? []).map((o, i) => ({ label: o, nilai: i }))

  const sudah = jawab !== null
  const benar = sudah && jawab === s.answer

  return (
    <section>
      <Kepala
        judul="Today’s question"
        ke="/med-study"
        aksi={<TombolLain onClick={() => { setGeser((g) => g + 1); setJawab(null) }} />}
      />
      <div className="kaca rounded-3xl p-3">
        <p className="t-kecil leading-snug text-ink dark:text-white">{s.q}</p>

        <div className={`mt-2 grid gap-1.5 ${s.type === 'tf' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {pilihan.map((p) => {
            const ini = jawab === p.nilai
            const kunci = p.nilai === s.answer
            /* Sesudah dijawab, jawaban yang BENAR selalu ditandai — bukan hanya
               yang dipilih. Menandai pilihan yang salah tanpa menunjukkan yang
               benar meninggalkan orang dengan satu hal yang diketahui salah dan
               tidak satu pun yang diketahui benar. */
            const nada = !sudah
              ? 'border-neutral-200 dark:border-white/12'
              : kunci
                ? 'border-brand bg-brand/10 text-brand-dark dark:text-brand'
                : ini
                  ? 'border-rose-400 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-neutral-200 opacity-60 dark:border-white/12'
            return (
              <button
                key={String(p.nilai)}
                disabled={sudah}
                onClick={() => setJawab(p.nilai)}
                className={`t-kecil min-h-[40px] rounded-xl border px-2.5 py-1.5 text-left font-bold transition ${nada}`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {sudah && (
          <>
            <p className={`t-kecil mt-2 font-black ${benar ? 'text-brand' : 'text-rose-500'}`}>
              {benar ? 'Correct' : 'Not quite'}
            </p>
            <p className="t-mikro mt-0.5 line-clamp-4 leading-snug text-neutral-500 dark:text-neutral-400">{s.explanation}</p>
            {s.source && <p className="t-mikro mt-1 truncate text-neutral-400">Source: {s.source}</p>}
            <div className="mt-2">
              <PemutarBaca teks={`${s.q}. Explanation. ${s.explanation}`} label="Listen to the explanation" />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ── Ringkasan karya (buku & film) ──────────────────────────────────────────
//
// Satu karya per hari dari daftar ringkasan. Bentuknya sama dengan widget
// inspirasi — berganti menurut tanggal, dapat diganti dengan satu ketukan —
// karena keduanya menjawab kebutuhan yang sama: sesuatu yang layak dibaca
// sebentar, bukan tugas yang menuntut waktu.
export function UbinRingkasanKarya() {
  const [geser, setGeser] = useState(0)
  const k = KARYA[(nomorHari() * 5 + geser) % KARYA.length]

  return (
    <section>
      <Kepala judul="Work summaries" ke="/ringkasan-karya" aksi={<TombolLain onClick={() => setGeser((g) => g + 1)} />} />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-kecil min-w-0 truncate font-black text-ink dark:text-white">{k.judul}</span>
          <span className="t-mikro shrink-0 uppercase text-neutral-400">{JENIS_LABEL[k.jenis]}</span>
        </div>
        <span className="t-mikro block truncate text-neutral-400">{k.oleh}{k.tahun ? ` · ${k.tahun}` : ''}</span>
        <p className="t-kecil mt-2 line-clamp-5 leading-snug text-neutral-600 dark:text-neutral-300">{k.ringkas}</p>
        <div className="mt-2">
          <PemutarBaca teks={`${k.judul}, oleh ${k.oleh}. ${k.ringkas}`} label="Listen" />
        </div>
        <p className="t-mikro mt-2 text-neutral-400">{KARYA.length} works · a new one each day</p>
      </div>
    </section>
  )
}
