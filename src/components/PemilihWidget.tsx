import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { WIDGETS, ambilWidget, alihkanWidget, simpanWidget, widgetBawaan } from '../lib/homeWidgets'

// ─────────────────────────────────────────────────────────────────────────────
// Pemilih widget beranda.
//
// MENGAPA DIPILIH SENDIRI, BUKAN DITEBAK. Aplikasi ini punya lebih dari seratus
// fitur, dan tidak ada susunan bawaan yang benar untuk semua orang: yang
// menghadapi ujian membutuhkan tatalaksana dan stasiun OSCE, yang berlatih
// membutuhkan kesegaran dan target, yang mengurus orang tuanya membutuhkan
// pengingat obat. Menebak berarti salah bagi sebagian besar; memilih sendiri
// tidak pernah salah.
//
// BAWAANNYA SENGAJA SEDIKIT. Beranda yang penuh sejak hari pertama membuat
// orang berhenti membacanya, dan sesudah itu widget yang benar-benar penting
// pun ikut tidak terbaca. Lima menyala di awal; sisanya menunggu dinyalakan.
//
// DIKELOMPOKKAN MENURUT KEBUTUHAN, BUKAN MENURUT ABJAD. Orang mencari widget
// dengan bertanya "saya sedang mengurus apa", bukan "namanya berawalan huruf
// apa" — karena itu judul kelompoknya adalah wilayah kehidupan, dan kelompok
// yang paling sering dibuka diletakkan lebih dahulu.
// ─────────────────────────────────────────────────────────────────────────────

export function PemilihWidget({ tutup }: { tutup: () => void }) {
  const [aktif, setAktif] = useState<string[]>(ambilWidget)
  const [cari, setCari] = useState('')

  // Tombol kembali menutup lembar ini, bukan meninggalkan halaman — itu yang
  // diharapkan orang ketika sebuah lapisan sedang terbuka di atas halaman.
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [tutup])

  const kelompok = useMemo(() => {
    const q = cari.toLowerCase().trim()
    const cocok = WIDGETS.filter((w) =>
      !q || `${w.label} ${w.ringkas} ${w.kategori}`.toLowerCase().includes(q),
    )
    const peta = new Map<string, typeof WIDGETS>()
    for (const w of cocok) {
      if (!peta.has(w.kategori)) peta.set(w.kategori, [])
      peta.get(w.kategori)!.push(w)
    }
    return [...peta.entries()]
  }, [cari])

  // ── DIPASANG DI BODY, BUKAN DI TEMPATNYA DIPANGGIL ────────────────────────
  //
  // Beranda dibungkus .fluid, dan .fluid memakai container-type: inline-size
  // supaya seluruh ukuran cqw di dalamnya mengukur lebar kolom, bukan lebar
  // layar. Efek sampingnya jarang disebut tetapi menentukan: elemen dengan
  // container-type menjadi CONTAINING BLOCK bagi keturunan position: fixed.
  // Akibatnya lembar ini tidak menutupi layar melainkan kotak beranda, dan
  // pada telepon ia berakhir terpotong atau di luar pandangan — terlihat
  // seperti tombol "Atur widget" yang tidak melakukan apa-apa.
  //
  // Uji otomatis sebelumnya lolos justru karena itu: ia mencari lembarnya di
  // pohon DOM dan menemukannya. Yang tidak diperiksa adalah apakah lembar itu
  // benar-benar menutupi layar. Kini itu yang diuji.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-label="Pilih widget beranda">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 p-4 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-ink dark:text-white">Widget beranda</h2>
            <p className="text-[11px] text-neutral-500">
              {aktif.length} dipilih dari {WIDGETS.length} fitur
            </p>
          </div>
          <button onClick={tutup} className="flex h-10 shrink-0 items-center rounded-full bg-neutral-100 px-4 text-[12px] font-bold text-ink dark:bg-white/10 dark:text-white">
            Selesai
          </button>
        </div>

        <div className="border-b border-neutral-200 p-3 dark:border-white/10">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari fitur…"
            aria-label="Cari fitur"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-ink placeholder:text-neutral-400 dark:border-white/15 dark:bg-white/10 dark:text-white"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {kelompok.map(([kategori, daftar]) => (
            <section key={kategori} className="mb-4">
              <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-neutral-500">{kategori}</h3>
              <div className="space-y-1.5">
                {daftar.map((w) => {
                  const nyala = aktif.includes(w.id)
                  return (
                    <button
                      key={w.id}
                      onClick={() => setAktif(alihkanWidget(w.id))}
                      aria-pressed={nyala}
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                        nyala
                          ? 'border-brand bg-brand-50/60 dark:bg-brand/10'
                          : 'border-neutral-200 dark:border-white/10'
                      }`}
                    >
                      <span aria-hidden className="text-[18px]">{w.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-ink dark:text-white">{w.label}</span>
                        <span className="block truncate text-[11px] text-neutral-500">{w.ringkas}</span>
                      </span>
                      {/* Keadaan nyala dibedakan lewat LAMBANG, bukan warna saja —
                          pembedaan yang hanya bersandar warna tidak sampai kepada
                          sebagian pembaca. */}
                      <span className={`shrink-0 text-[13px] font-black ${nyala ? 'text-brand' : 'text-neutral-300 dark:text-neutral-600'}`}>
                        {nyala ? '✓' : '+'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
          {kelompok.length === 0 && (
            <p className="py-6 text-center text-[13px] text-neutral-500">Tidak ada fitur yang cocok.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 p-3 dark:border-white/10">
          <button
            onClick={() => { const b = widgetBawaan(); simpanWidget(b); setAktif(b) }}
            className="flex h-10 items-center text-[12px] font-bold text-neutral-500"
          >
            Kembalikan bawaan
          </button>
          <button
            onClick={() => { simpanWidget([]); setAktif([]) }}
            className="flex h-10 items-center text-[12px] font-bold text-neutral-500"
          >
            Kosongkan semua
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PemilihWidget
