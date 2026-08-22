import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SKDI_ENTRIES } from '../lib/skdiTherapyReference'
import { RIWAYAT_OSCE } from '../lib/osceUkmppdRiwayat'

// ─────────────────────────────────────────────────────────────────────────────
// Widget yang BEKERJA di tempatnya, bukan mengantar ke halaman lain.
//
// Keluhan yang melahirkan berkas ini: "widget ini bahkan tidak ada, padahal
// anda bisa buat widget kalkulator, widget obat, widget skor". Benar — papan
// widget sebelumnya hanya memuat angka tubuh, sehingga separuh isi aplikasi
// (obat, kalkulator, arsip OSCE) sama sekali tidak terwakili di beranda.
//
// SYARAT YANG DIPEGANG DI SINI, sama seperti ubin angka tubuh:
//  1. Isinya harus BEKERJA di tempat: mengetik nama obat menampilkan dosisnya
//     di ubin itu juga, memasukkan angka menghasilkan hitungan di ubin itu
//     juga. Kartu yang hanya membuka halaman lain adalah pintu, bukan widget.
//  2. Angkanya berasal dari data yang benar-benar ada di aplikasi ini — 641
//     baris tatalaksana SKDI dan 1.416 catatan stasiun OSCE — bukan dikarang.
//  3. Rumus menyebut namanya. Hitungan tanpa nama rumus tidak dapat diperiksa
//     ulang oleh yang memakainya, dan hitungan klinis yang tidak dapat
//     diperiksa tidak layak dipercaya.
// ─────────────────────────────────────────────────────────────────────────────

function Kepala({ judul, ke, kanan }: { judul: string; ke: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? (
        <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Buka →
        </Link>
      )}
    </div>
  )
}

const KELAS_ISIAN =
  'min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-neutral-400 focus:border-brand dark:border-white/12 dark:bg-white/5 dark:text-white'

// ── Obat & dosis ───────────────────────────────────────────────────────────
//
// Pencarian dijalankan DI DALAM ubin. Bentuk sebelumnya — kartu bertuliskan
// "Tatalaksana SKDI · cari obat dan dosis per penyakit" — menuntut dua ketukan
// dan satu halaman baru hanya untuk mengetahui dosis satu obat, padahal yang
// dicari orang di sela jaga hanyalah satu baris.
export function UbinObat() {
  const [q, setQ] = useState('')

  const hasil = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (k.length < 2) return []
    const out = []
    for (const e of SKDI_ENTRIES) {
      const cocok =
        e.diagnosis.toLowerCase().includes(k) ||
        e.therapy.toLowerCase().includes(k) ||
        (e.classification ?? '').toLowerCase().includes(k)
      if (cocok) out.push(e)
      if (out.length >= 3) break
    }
    return out
  }, [q])

  /* Bila belum diketik apa-apa, ubin ini TIDAK dibiarkan kosong: satu baris
     tatalaksana ditampilkan, dipilih dari tanggal hari ini — bukan diacak.
     Acak berarti isinya berubah setiap kali beranda digambar ulang, dan
     sesuatu yang berubah saat digulir tidak pernah sempat dibaca. */
  const hariKe = Math.floor(Date.now() / 864e5)
  const bawaan = SKDI_ENTRIES[hariKe % SKDI_ENTRIES.length]
  const tampil = hasil.length ? hasil : q.trim().length >= 2 ? [] : [bawaan]

  return (
    <section>
      <Kepala judul="Obat & dosis" ke="/med-study?bagian=therapy" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tifoid, amoksisilin, kejang…"
            aria-label="Cari obat atau penyakit"
            className={KELAS_ISIAN}
          />
        </div>

        {tampil.length === 0 ? (
          <p className="t-kecil mt-2 text-neutral-500">Tidak ada yang cocok.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {tampil.map((e, i) => (
              <Link
                key={`${e.diagnosis}-${i}`}
                to={`/med-study?bagian=therapy&q=${encodeURIComponent(e.diagnosis)}`}
                className="block"
              >
                <span className="t-kecil block truncate font-black text-ink dark:text-white">
                  {e.diagnosis}
                  {e.classification ? <span className="font-bold text-neutral-400"> · {e.classification}</span> : null}
                </span>
                {/* Dua baris, lalu dipotong. Baris dosis di berkas ini bisa
                    sepanjang satu paragraf; menampilkannya utuh membuat satu
                    obat memenuhi seluruh ubin. */}
                <span className="t-mikro line-clamp-2 leading-snug text-neutral-500 dark:text-neutral-400">
                  {e.therapy}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="t-mikro mt-2 text-neutral-400">
          {hasil.length ? `${hasil.length} dari ${SKDI_ENTRIES.length} baris` : `Sumber: acuan tatalaksana SKDI · ${SKDI_ENTRIES.length} baris`}
        </p>
      </div>
    </section>
  )
}

// ── Kalkulator cepat ───────────────────────────────────────────────────────

type Rumus = {
  id: string
  label: string
  medan: { kunci: string; label: string; satuan: string }[]
  satuan: string
  sumber: string
  hitung: (v: Record<string, number>) => number | null
}

/*
 * Empat rumus, bukan empat puluh tiga.
 *
 * Halaman Kalkulator Klinis memuat 43 kalkulator, dan memindahkan semuanya ke
 * beranda hanya akan memindahkan masalahnya. Yang ditaruh di sini adalah yang
 * dipakai berulang kali dalam satu hari kerja dan hanya butuh dua isian —
 * sisanya tetap di halamannya, satu ketukan dari sini.
 */
const RUMUS: Rumus[] = [
  {
    id: 'imt',
    label: 'IMT',
    medan: [
      { kunci: 'bb', label: 'Berat', satuan: 'kg' },
      { kunci: 'tb', label: 'Tinggi', satuan: 'cm' },
    ],
    satuan: 'kg/m²',
    sumber: 'BB ÷ TB²',
    hitung: (v) => (v.bb > 0 && v.tb > 0 ? v.bb / (v.tb / 100) ** 2 : null),
  },
  {
    id: 'map',
    label: 'MAP',
    medan: [
      { kunci: 'sis', label: 'Sistolik', satuan: 'mmHg' },
      { kunci: 'dia', label: 'Diastolik', satuan: 'mmHg' },
    ],
    satuan: 'mmHg',
    sumber: 'MAP = (2×diastolik + sistolik) ÷ 3',
    hitung: (v) => (v.sis > 0 && v.dia > 0 ? (2 * v.dia + v.sis) / 3 : null),
  },
  {
    id: 'lpb',
    label: 'LPB',
    medan: [
      { kunci: 'bb', label: 'Berat', satuan: 'kg' },
      { kunci: 'tb', label: 'Tinggi', satuan: 'cm' },
    ],
    satuan: 'm²',
    sumber: 'Mosteller: √(TB×BB ÷ 3600)',
    hitung: (v) => (v.bb > 0 && v.tb > 0 ? Math.sqrt((v.tb * v.bb) / 3600) : null),
  },
  {
    id: 'dosis',
    label: 'Dosis/kg',
    medan: [
      { kunci: 'bb', label: 'Berat', satuan: 'kg' },
      { kunci: 'dos', label: 'Dosis', satuan: 'mg/kg' },
    ],
    satuan: 'mg',
    sumber: 'BB × dosis per kg',
    hitung: (v) => (v.bb > 0 && v.dos > 0 ? v.bb * v.dos : null),
  },
]

export function UbinKalkulator() {
  const [pilih, setPilih] = useState(RUMUS[0].id)
  const [isi, setIsi] = useState<Record<string, string>>({})
  const r = RUMUS.find((x) => x.id === pilih) ?? RUMUS[0]

  const angka: Record<string, number> = {}
  for (const m of r.medan) angka[m.kunci] = Number((isi[`${r.id}.${m.kunci}`] ?? '').replace(',', '.'))
  const hasil = r.hitung(angka)

  return (
    <section>
      <Kepala judul="Hitung cepat" ke="/clinical-calculators" />
      <div className="kaca rounded-3xl p-3">
        <div className="geser-aman -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {RUMUS.map((x) => (
            <button
              key={x.id}
              onClick={() => setPilih(x.id)}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                x.id === pilih ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {r.medan.map((m) => (
            <input
              key={m.kunci}
              inputMode="decimal"
              value={isi[`${r.id}.${m.kunci}`] ?? ''}
              onChange={(e) => setIsi((s) => ({ ...s, [`${r.id}.${m.kunci}`]: e.target.value }))}
              placeholder={`${m.label} (${m.satuan})`}
              aria-label={`${m.label} dalam ${m.satuan}`}
              className={KELAS_ISIAN}
            />
          ))}
        </div>

        {/* Hasil KOSONG selama isiannya belum lengkap, bukan nol. Nol adalah
            angka, dan angka yang muncul sebelum ada yang diisi terbaca sebagai
            hasil hitungan. */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
            {hasil == null ? '—' : hasil.toFixed(hasil < 10 ? 2 : 1)}
          </span>
          <span className="t-mikro font-bold text-neutral-400">{r.satuan}</span>
        </div>
        <p className="t-mikro mt-1 truncate text-neutral-400">{r.sumber}</p>
      </div>
    </section>
  )
}

// ── Stasiun OSCE tersering ─────────────────────────────────────────────────
//
// Bukan tebakan soal ujian: hitungan langsung dari arsip stasiun yang benar-
// benar pernah keluar. Yang dinyatakan hanyalah SEBERAPA SERING sebuah kasus
// muncul di arsip itu — bukan seberapa mungkin ia keluar lagi. Frekuensi masa
// lalu bukan peluang masa depan, dan menuliskannya sebagai peluang berarti
// menjual ramalan.
export function UbinStasiun() {
  const [sistem, setSistem] = useState<string | null>(null)

  const { sistemTeratas, kasus, total } = useMemo(() => {
    const perSistem = new Map<string, number>()
    for (const s of RIWAYAT_OSCE) perSistem.set(s.sistem, (perSistem.get(s.sistem) ?? 0) + 1)
    const sistemTeratas = [...perSistem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    const pilihan = sistem ?? sistemTeratas[0]?.[0] ?? ''
    const perKasus = new Map<string, number>()
    for (const s of RIWAYAT_OSCE) {
      if (s.sistem !== pilihan) continue
      perKasus.set(s.kasus.trim(), (perKasus.get(s.kasus.trim()) ?? 0) + 1)
    }
    const kasus = [...perKasus.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    const total = kasus.reduce((a, b) => Math.max(a, b[1]), 0)
    return { sistemTeratas, kasus, total }
  }, [sistem])

  if (!sistemTeratas.length) return null
  const aktif = sistem ?? sistemTeratas[0][0]

  return (
    <section>
      <Kepala judul="Stasiun tersering" ke="/osce-ukmppd" />
      <div className="kaca rounded-3xl p-3">
        <div className="geser-aman -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {sistemTeratas.map(([nama, n]) => (
            <button
              key={nama}
              onClick={() => setSistem(nama)}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                nama === aktif ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {nama.split(',')[0]} {n}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          {kasus.map(([nama, n]) => (
            <Link key={nama} to={`/osce-ukmppd?q=${encodeURIComponent(nama)}`} className="block">
              <span className="flex items-baseline justify-between gap-2">
                <span className="t-kecil truncate font-bold text-ink dark:text-white">{nama}</span>
                <span className="t-mikro shrink-0 tabular-nums text-neutral-400">{n}×</span>
              </span>
              {/* Batang sebanding jumlah kemunculan, dasar nol, pembagi adalah
                  kasus terbanyak pada sistem yang sama. */}
              <span className="mt-0.5 block h-1.5 w-full rounded-full bg-neutral-200 dark:bg-white/12">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(6, (n / Math.max(1, total)) * 100)}%` }}
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="t-mikro mt-2 text-neutral-400">
          Dari {RIWAYAT_OSCE.length} stasiun yang tercatat pernah keluar. Seberapa sering, bukan seberapa mungkin.
        </p>
      </div>
    </section>
  )
}
