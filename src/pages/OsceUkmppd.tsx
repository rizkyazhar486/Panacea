import { useMemo, useState } from 'react'
import { hitungKasus, ringkasPerSistem, ringkasSeluruh, periodeTerurut, type HitunganKasus } from '../lib/analisisOsce'
import { RIWAYAT_OSCE } from '../lib/osceUkmppdRiwayat'

// ─────────────────────────────────────────────────────────────────────────────
// Rekap stasiun OSCE UKMPPD — apa yang benar-benar keluar, 2016 sampai 2026.
//
// PERTANYAAN YANG DIJAWAB HALAMAN INI. Daftar SKDI memuat ratusan penyakit dan
// tidak memberi tahu mana yang diujikan. Halaman ini memberi tahu, dan itu
// mengubah urutan belajar: kasus yang keluar sepuluh kali dalam sepuluh tahun
// tidak setara dengan kasus yang belum pernah sekali pun.
//
// SATU KALIMAT YANG TIDAK BOLEH HILANG DARI LAYAR INI. Tiga dari empat kasus
// hanya muncul SEKALI. Angka frekuensi berguna untuk menentukan mana yang
// dikuasai lebih dahulu, dan TIDAK berguna untuk menebak soal — dan halaman
// yang menampilkan frekuensi tanpa menyebutkan ekor panjangnya sedang menjual
// keyakinan yang tidak dimilikinya.
// ─────────────────────────────────────────────────────────────────────────────

function Bilah({ nilai, maks }: { nilai: number; maks: number }) {
  const persen = Math.max(4, Math.round((nilai / maks) * 100))
  return (
    <span className="block h-1.5 rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden="true">
      <span className="block h-1.5 rounded-full bg-brand" style={{ width: `${persen}%` }} />
    </span>
  )
}

function BarisKasus({ k, maks }: { k: HitunganKasus; maks: number }) {
  return (
    <li className="border-t border-neutral-200 py-2 first:border-0 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-kecil min-w-0 flex-1 font-bold text-ink dark:text-white">{k.label}</span>
        <span className="t-kecil shrink-0 tabular-nums font-black text-brand-dark">{k.jumlah}×</span>
      </div>
      <div className="mt-1"><Bilah nilai={k.jumlah} maks={maks} /></div>
      {/* Kapan terakhir keluar ikut ditampilkan: kasus yang sepuluh kali muncul
          namun terakhir tujuh tahun lalu berbeda artinya dari yang muncul lima
          kali dan tiga di antaranya dua tahun terakhir. */}
      {/* Sistemnya ikut ditulis. Kasus yang sama kadang tercatat di bawah dua
          sistem berbeda pada periode yang berbeda — GNAPS pernah masuk kolom
          Ginjal dan pernah masuk kolom Gastrointestinal. Menyembunyikan
          sistemnya membuat pemisahan itu tampak seperti kekeliruan hitung,
          padahal ia keadaan sumbernya. */}
      <div className="t-mikro mt-1 text-neutral-500">
        {k.sistem.split(',')[0]} · terakhir {k.periode[0]}
        {k.periode.length > 1 && ` · ${k.periode.length} periode`}
      </div>
    </li>
  )
}

export function OsceUkmppd() {
  const [sistem, setSistem] = useState<string | null>(null)
  const [cari, setCari] = useState('')

  const semua = useMemo(() => hitungKasus(), [])
  const perSistem = useMemo(() => ringkasPerSistem(), [])
  const total = useMemo(() => ringkasSeluruh(), [])
  const periode = useMemo(() => periodeTerurut(), [])

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    let d = semua
    if (sistem) d = d.filter((k) => k.sistem === sistem)
    if (q) d = d.filter((k) => k.label.toLowerCase().includes(q) || k.kunci.includes(q))
    return d.slice(0, 120)
  }, [semua, sistem, cari])

  const maks = tampil.length ? tampil[0].jumlah : 1

  return (
    <div className="fluid mx-auto max-w-3xl">
      <div className="j-grup px-fluid pb-6">
        <section>
          <h1 className="t-judul font-black text-ink dark:text-white">Stasiun OSCE UKMPPD</h1>
          <p className="t-kecil mt-1 leading-relaxed text-neutral-600 dark:text-neutral-300">
            {total.stasiun} stasiun dari {total.periode} periode ujian, Februari 2016 sampai 2026.
          </p>

          <div className="angka-fluid mt-3">
            <div className="kaca rounded-2xl p-3">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Stasiun</div>
              <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{total.stasiun}</div>
            </div>
            <div className="kaca rounded-2xl p-3">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Kasus beda</div>
              <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{total.ragam}</div>
            </div>
            <div className="kaca rounded-2xl p-3">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Muncul ≥3×</div>
              <div className="t-angka font-black leading-none tabular-nums text-brand-dark">{total.berulang}</div>
            </div>
          </div>

          {/* Peringatan yang menempel pada angkanya, bukan disembunyikan. */}
          <p className="t-kecil mt-3 rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-3 leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            {total.sekali} dari {total.ragam} kasus ({Math.round((total.sekali / total.ragam) * 100)}%) hanya pernah
            muncul <strong>satu kali</strong>. Angka di halaman ini berguna untuk menentukan urutan belajar, dan tidak
            berguna untuk menebak soal. Tidak ada yang dapat meramalkan stasiun berikutnya dari daftar ini — termasuk
            aplikasi ini.
          </p>
        </section>

        <section>
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Per sistem</h2>
          <p className="t-kecil mb-2 leading-snug text-neutral-400">
            Makin banyak ragamnya, makin sulit ditebak — dan makin perlu dikuasai secara prinsip, bukan dihafal.
          </p>
          <div className="geser-aman">
            {perSistem.map((s) => (
              <button
                key={s.sistem}
                type="button"
                onClick={() => setSistem(sistem === s.sistem ? null : s.sistem)}
                aria-pressed={sistem === s.sistem}
                className={`flex min-h-[112px] flex-col justify-between rounded-3xl p-3 text-left transition ${
                  sistem === s.sistem ? 'bg-brand text-white' : 'kaca'
                }`}
              >
                <span className={`t-mikro font-black uppercase tracking-wide ${sistem === s.sistem ? 'text-white' : 'text-neutral-500'}`}>
                  {s.sistem.split(',')[0]}
                </span>
                <span className={`t-angka font-black leading-none tabular-nums ${sistem === s.sistem ? 'text-white' : 'text-ink dark:text-white'}`}>
                  {s.stasiun}
                </span>
                <span className={`t-kecil ${sistem === s.sistem ? 'text-white/80' : 'text-neutral-500'}`}>
                  {s.ragam} kasus beda · {s.sekali} sekali muncul
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">
              {sistem ? sistem : 'Semua sistem'}
            </h2>
            {sistem && (
              <button
                type="button"
                onClick={() => setSistem(null)}
                className="t-mikro min-h-[40px] shrink-0 rounded-full bg-neutral-100 px-3 font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
              >
                Tampilkan semua
              </button>
            )}
          </div>

          <label htmlFor="osce-cari" className="sr-only">Cari kasus</label>
          <input
            id="osce-cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kasus — misalnya GNAPS, tifoid, syok…"
            className="t-sedang mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />

          <ul className="mt-2">
            {tampil.map((k) => <BarisKasus key={k.sistem + k.kunci} k={k} maks={maks} />)}
          </ul>
          {tampil.length === 0 && (
            <p className="t-kecil mt-3 text-neutral-500">Tidak ada kasus yang cocok dengan pencarian itu.</p>
          )}
          {tampil.length === 120 && (
            <p className="t-mikro mt-2 text-neutral-500">Ditampilkan 120 teratas. Persempit dengan pencarian.</p>
          )}
        </section>

        <section>
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Periode tercatat</h2>
          <p className="t-kecil mt-1 leading-snug text-neutral-500">
            {periode.slice(0, 8).join(' · ')}
            {periode.length > 8 && ` · dan ${periode.length - 8} periode lainnya`}
          </p>
          <p className="t-mikro mt-2 leading-relaxed text-neutral-500">
            Sumbernya rekap yang dikumpulkan dari peserta ujian, bukan terbitan resmi panitia. Sebagian periode tercatat
            lebih rinci daripada yang lain, dan satu periode ({RIWAYAT_OSCE.length > 0 ? 'Agustus 2016' : ''}) memang
            tidak memiliki data. Ketidaklengkapan itu disebutkan supaya tidak dibaca sebagai ketiadaan soal.
          </p>
        </section>
      </div>
    </div>
  )
}

export default OsceUkmppd
