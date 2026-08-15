import { useMemo, useState } from 'react'
import { kunciTanggal } from '../lib/ramalan'
import { getWorkouts } from '../lib/workoutStore'
import { catatLatihanTangan, sesiTangan } from '../lib/latihanManual'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan latihan dengan tangan — bentuknya sengaja SAMA dengan catatan harian.
//
// Dua borang yang menanyakan hal serupa dengan tata letak berbeda memaksa
// pemakainya belajar dua kali, dan yang kedua tidak pernah benar-benar
// dipelajari. Urutannya sama: pilihan tanggal di kanan judul, isian, satu
// bidang tersegmen, lalu satu tombol simpan selebar penuh.
//
// EMPAT PERTANYAAN, dan tidak lebih. Nama, lama, berat yang dirasakan, dan
// jarak bila ada. Kalori TIDAK ditanyakan maupun dihitung: ia menuntut berat
// badan dan nilai MET, sehingga hasilnya adalah taksiran di atas taksiran di
// atas lama yang dilaporkan sendiri — dan angka semacam itu tidak layak
// dipajang berdampingan dengan angka terukur.
// ─────────────────────────────────────────────────────────────────────────────

const BERAT = [
  { nilai: 2, label: 'Ringan' },
  { nilai: 4, label: 'Sedang' },
  { nilai: 6, label: 'Berat' },
  { nilai: 8, label: 'Keras' },
  { nilai: 10, label: 'Habis' },
] as const

const HARI = 86400_000

export function CatatanLatihan() {
  const [untukKemarin, setUntukKemarin] = useState(false)
  const [nama, setNama] = useState('')
  const [menit, setMenit] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [jarak, setJarak] = useState('')
  const [pesan, setPesan] = useState('')
  const [versi, setVersi] = useState(0)

  const tanggal = kunciTanggal(new Date(Date.now() - (untukKemarin ? HARI : 0)))

  const ringkas = useMemo(() => {
    const w = getWorkouts()
    return { total: w.length, tangan: w.filter((x) => sesiTangan(x.id)).length }
    // versi ikut menjadi kebergantungan supaya daftarnya dibaca ulang setelah
    // satu sesi disimpan — tanpa itu ringkasannya tertinggal satu langkah.
  }, [versi])

  const bolehSimpan = menit.trim() !== '' && rpe !== null

  function simpan() {
    if (!bolehSimpan) return
    const hasil = catatLatihanTangan({
      nama,
      tanggal,
      menit: Number(menit.replace(',', '.')),
      rpe: rpe as number,
      jarakKm: jarak.trim() ? Number(jarak.replace(',', '.')) : undefined,
    })
    if (!hasil) { setPesan('Lama sesi belum masuk akal — isi dalam menit.'); return }
    setPesan(`Tersimpan untuk ${tanggal}.`)
    setNama(''); setMenit(''); setRpe(null); setJarak('')
    setVersi((v) => v + 1)
  }

  return (
    <section className="kaca rounded-3xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-sedang font-black text-ink dark:text-white">Catat latihan</h2>
        <button
          type="button"
          onClick={() => { setUntukKemarin((v) => !v); setPesan('') }}
          aria-pressed={untukKemarin}
          className={`t-mikro min-h-[40px] shrink-0 rounded-full px-3 font-bold transition ${
            untukKemarin ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
        >
          {untukKemarin ? 'untuk kemarin' : 'untuk kemarin?'}
        </button>
      </div>

      <p className="t-kecil mt-1 leading-snug text-neutral-600 dark:text-neutral-300">
        {ringkas.total === 0
          ? 'Belum ada sesi tersimpan. Satu sesi sudah cukup untuk mulai menghitung kebugaran.'
          : `${ringkas.total} sesi tersimpan${ringkas.tangan ? `, ${ringkas.tangan} di antaranya dicatat tangan` : ''}.`}
      </p>
      {/* Keterangan yang tidak boleh hilang: sesi tangan tidak punya denyut. */}
      <p className="t-mikro mt-0.5 leading-snug text-neutral-500">
        Sesi yang dicatat tangan tidak memiliki rekaman denyut jantung, sehingga bebannya ditaksir dari lama dan
        berat yang Anda rasakan — bukan diukur.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="cl-nama" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
            Latihan apa
          </label>
          <input
            id="cl-nama"
            value={nama}
            onChange={(e) => { setNama(e.target.value.slice(0, 40)); setPesan('') }}
            placeholder="Lari, futsal, angkat beban…"
            className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-fluid">
          <div>
            <label htmlFor="cl-menit" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Lama (menit)
            </label>
            <input
              id="cl-menit"
              value={menit}
              onChange={(e) => { setMenit(e.target.value.replace(/[^\d]/g, '').slice(0, 4)); setPesan('') }}
              inputMode="numeric"
              placeholder="45"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="cl-jarak" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Jarak (km, opsional)
            </label>
            <input
              id="cl-jarak"
              value={jarak}
              onChange={(e) => { setJarak(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6)); setPesan('') }}
              inputMode="decimal"
              placeholder="5,2"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="t-mikro mb-1 font-bold uppercase tracking-wide text-neutral-500">Seberapa berat terasa</div>
          <div className="grid grid-cols-5 gap-0 rounded-xl bg-neutral-100 p-1 dark:bg-white/10">
            {BERAT.map((b) => (
              <button
                key={b.nilai}
                type="button"
                onClick={() => { setRpe(rpe === b.nilai ? null : b.nilai); setPesan('') }}
                aria-pressed={rpe === b.nilai}
                className={`t-kecil min-h-[40px] min-w-0 rounded-lg text-center font-bold transition ${
                  rpe === b.nilai ? 'bg-brand text-white' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={simpan}
          disabled={!bolehSimpan}
          className="t-sedang flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand font-black text-white transition disabled:opacity-40"
        >
          Simpan sesi {untukKemarin ? 'kemarin' : 'hari ini'}
        </button>

        {pesan && <p className="t-kecil text-center text-brand-dark">{pesan}</p>}
      </div>
    </section>
  )
}

export default CatatanLatihan
