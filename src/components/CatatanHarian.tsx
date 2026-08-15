import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { kunciTanggal } from '../lib/ramalan'
import { hitungRangkaian, bacaRangkaian, PERINGATAN_RANGKAIAN } from '../lib/rangkaian'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan harian — satu layar, tiga pertanyaan, tanpa menggulir.
//
// MENGAPA TIGA. Sebuah catatan harian hanya berguna bila benar-benar diisi
// setiap hari, dan yang menentukan itu bukan kelengkapannya melainkan
// waktunya. Formulir dua belas pertanyaan diisi dengan sungguh-sungguh selama
// tiga hari, lalu diisi asal, lalu ditinggalkan; yang tersisa adalah data yang
// tampak lengkap padahal sudah tidak dapat dipercaya sejak hari keempat.
//
// TIDUR, TENAGA, DAN CATATAN BEBAS. Tidur karena ia satu-satunya masukan yang
// diminta tetapi belum pernah bisa diisi tanpa membuka halaman lain. Tenaga
// karena ia keluhan yang paling sering diucapkan dan tidak terukur oleh alat
// mana pun. Catatan bebas karena hal yang paling menjelaskan sebuah hari
// biasanya tidak berbentuk angka.
//
// KEMARIN BOLEH DIISI. Orang lupa mencatat lalu teringat besok paginya. Tanpa
// pilihan ini ia akan menuliskan tidur semalam ke tanggal yang keliru, dan data
// yang salah tanggal lebih buruk daripada data yang hilang karena ia tetap ikut
// dihitung model.
// ─────────────────────────────────────────────────────────────────────────────

const TENAGA = [
  { nilai: 1, label: 'Habis' },
  { nilai: 2, label: 'Lemas' },
  { nilai: 3, label: 'Biasa' },
  { nilai: 4, label: 'Segar' },
  { nilai: 5, label: 'Penuh' },
] as const

const HARI = 86400_000

export function CatatanHarian() {
  const { state, setSleepLog, logWellness } = useStore()
  const [untukKemarin, setUntukKemarin] = useState(false)
  const [jam, setJam] = useState('')
  const [tenaga, setTenaga] = useState<number | null>(null)
  const [catatan, setCatatan] = useState('')
  const [tersimpan, setTersimpan] = useState(false)

  const tanggal = kunciTanggal(new Date(Date.now() - (untukKemarin ? HARI : 0)))

  /**
   * Hari dianggap tercatat bila ada catatan tidur ATAU catatan kesejahteraan.
   *
   * Keduanya, bukan salah satu: seseorang yang hanya mencatat tenaganya tetap
   * mencatat hari itu, dan menghitungnya sebagai hari kosong akan menghukum
   * orang yang memakai aplikasi ini persis seperti yang dimaksudkan.
   */
  const rangkaian = useMemo(() => {
    const dari = new Set<string>()
    for (const s of state.sleepLogs ?? []) if (s?.date) dari.add(s.date)
    for (const k of Object.keys(state.wellness ?? {})) dari.add(k)
    return hitungRangkaian([...dari])
  }, [state.sleepLogs, state.wellness])

  const adaIsi = jam.trim() !== '' || tenaga !== null || catatan.trim() !== ''

  function simpan() {
    if (!adaIsi) return
    const j = Number(jam.replace(',', '.'))
    if (Number.isFinite(j) && j > 0 && j <= 24) {
      setSleepLog(tanggal, Math.round(j * 10) / 10, false)
      logWellness(tanggal, { sleepHr: Math.round(j * 10) / 10 })
    }
    // Tenaga dan catatan disimpan sebagai bagian hari itu. Keduanya tidak
    // pernah dipakai sebagai masukan model mana pun — nilai yang dilaporkan
    // sendiri tidak dapat disamakan dengan nilai terukur, dan mencampurnya
    // akan membuat angka model tampak lebih pasti daripada yang sebenarnya.
    if (tenaga !== null || catatan.trim()) {
      logWellness(tanggal, {
        ...(tenaga !== null ? { tenaga } : {}),
        ...(catatan.trim() ? { catatan: catatan.trim().slice(0, 280) } : {}),
      })
    }
    setTersimpan(true)
    setJam(''); setTenaga(null); setCatatan('')
  }

  return (
    <section className="kaca rounded-3xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-sedang font-black text-ink dark:text-white">Catatan hari ini</h2>
        <button
          type="button"
          onClick={() => { setUntukKemarin((v) => !v); setTersimpan(false) }}
          aria-pressed={untukKemarin}
          className={`t-mikro min-h-[40px] shrink-0 rounded-full px-3 font-bold transition ${
            untukKemarin ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
        >
          {untukKemarin ? 'untuk kemarin' : 'untuk kemarin?'}
        </button>
      </div>

      {/* Rangkaian, beserta peringatan yang tidak boleh dipisahkan darinya. */}
      <p className="t-kecil mt-1 leading-snug text-neutral-600 dark:text-neutral-300">
        {bacaRangkaian(rangkaian)}
      </p>
      <p className="t-mikro mt-0.5 leading-snug text-neutral-500">{PERINGATAN_RANGKAIAN}</p>

      {rangkaian.total > 0 && (
        <div className="angka-fluid mt-3">
          <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Berturut</div>
            <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{rangkaian.berjalan}</div>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Terpanjang</div>
            <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{rangkaian.terpanjang}</div>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Seluruhnya</div>
            <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{rangkaian.total}</div>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="ch-jam" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
            Tidur semalam (jam)
          </label>
          <input
            id="ch-jam"
            value={jam}
            onChange={(e) => { setJam(e.target.value.replace(/[^\d.,]/g, '').slice(0, 4)); setTersimpan(false) }}
            inputMode="decimal"
            placeholder="7,5"
            className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div>
          <div className="t-mikro mb-1 font-bold uppercase tracking-wide text-neutral-500">Tenaga hari ini</div>
          {/* Lima tombol dalam satu baris, bukan flex-wrap.
              Dengan flex-wrap, tombol kelima terlempar ke baris sendiri pada
              layar 390 px -- terlihat di tangkapan layar, bukan diduga -- dan
              satu tombol yang berdiri sendiri selebar penuh terbaca sebagai
              pilihan yang berbeda jenis dari empat lainnya, padahal ia hanya
              ujung skala yang sama. Kisi lima kolom tidak pernah melipat; yang
              menyesuaikan adalah lebar tiap kolomnya. */}
          {/* Satu bidang tersegmen, bukan lima tombol berjarak.
              Dengan jarak antar tombol, pada 320 px tiap tombol tinggal 40 px
              kurang sedikit dan jatuh di bawah batas sasaran sentuh. Segmen
              yang bersebelahan tanpa celah memberi tiap pilihan ~50 px pada
              lebar yang sama -- tidak ada piksel yang terbuang menjadi jarak,
              dan tidak ada ketukan yang mendarat di antara dua pilihan. */}
          <div className="grid grid-cols-5 gap-0 rounded-xl bg-neutral-100 p-1 dark:bg-white/10">
            {TENAGA.map((t) => (
              <button
                key={t.nilai}
                type="button"
                onClick={() => { setTenaga(tenaga === t.nilai ? null : t.nilai); setTersimpan(false) }}
                aria-pressed={tenaga === t.nilai}
                // Tanpa bantalan mendatar: pada 320 px, bantalan 4 px di tiap
                // sisi menyisakan 32 px untuk kata selebar 33 px, dan dua dari
                // lima label terpotong -- terukur, bukan diduga. Jarak antar
                // tombol sudah dikerjakan oleh gap kisinya.
                className={`t-kecil min-h-[40px] min-w-0 rounded-lg text-center font-bold transition ${
                  tenaga === t.nilai ? 'bg-brand text-white' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ch-catatan" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
            Catatan (boleh dilewati)
          </label>
          <input
            id="ch-catatan"
            value={catatan}
            onChange={(e) => { setCatatan(e.target.value.slice(0, 280)); setTersimpan(false) }}
            placeholder="Begadang, sakit kepala, puasa…"
            className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={simpan}
          disabled={!adaIsi}
          className="t-sedang flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand font-black text-white transition disabled:opacity-40"
        >
          Simpan catatan {untukKemarin ? 'kemarin' : 'hari ini'}
        </button>

        {/* Tidak ada perayaan, tidak ada lencana — hanya keterangan bahwa
            simpanannya berhasil dan ke tanggal berapa ia masuk. */}
        {tersimpan && (
          <p className="t-kecil text-center text-brand-dark">Tersimpan untuk {tanggal}.</p>
        )}
      </div>
    </section>
  )
}

export default CatatanHarian
