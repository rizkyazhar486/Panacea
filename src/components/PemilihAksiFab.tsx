import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { KATALOG_AKSI, MAKS_AKSI, alihkanAksi, ambilAksi, kembalikanBawaan } from '../lib/aksiFab'

// Pemilih tindakan tombol melayang.
//
// DIPASANG DI BODY LEWAT PORTAL, dengan alasan yang sudah pernah menjatuhkan
// lembar lain di aplikasi ini: pembungkus beranda memakai container-type, dan
// elemen dengan container-type menjadi containing block bagi keturunan
// position: fixed. Lembar yang dirender di dalamnya tidak menutupi layar
// melainkan kotak induknya.

export function PemilihAksiFab({ tutup }: { tutup: () => void }) {
  const [aktif, setAktif] = useState<string[]>(ambilAksi)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [tutup])

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-label="Choose button actions">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 p-4 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-ink dark:text-white">Button actions</h2>
            <p className="text-[11px] text-neutral-500">{aktif.length} of {MAKS_AKSI} slots used</p>
          </div>
          <button onClick={tutup} className="flex h-10 shrink-0 items-center rounded-full bg-neutral-100 px-4 text-[12px] font-bold text-ink dark:bg-white/10 dark:text-white">
            Done
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {KATALOG_AKSI.map((a) => {
              const nyala = aktif.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => setAktif(alihkanAksi(a.id))}
                  aria-pressed={nyala}
                  className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 text-left transition ${
                    nyala ? 'border-brand bg-brand-50/60 dark:bg-brand/10' : 'border-neutral-200 dark:border-white/10'
                  }`}
                >
                  <span aria-hidden className="text-[17px] leading-none">{a.ikon}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink dark:text-white">{a.label}</span>
                  {/* Pembedaan lewat LAMBANG, bukan warna saja. */}
                  <span className={`text-[13px] font-black ${nyala ? 'text-brand' : 'text-neutral-300 dark:text-neutral-600'}`}>
                    {nyala ? '✓' : '+'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-neutral-500">
            Fifteen slots across two horizontally-swiped menu pages; the last slot always holds this
            Edit button. If it's already full and you turn on a new one, the oldest selected is automatically
            dropped — so you never have to turn something off first.
          </p>
        </div>

        <div className="border-t border-neutral-200 p-3 dark:border-white/10">
          <button onClick={() => setAktif(kembalikanBawaan())} className="flex h-10 items-center text-[12px] font-bold text-neutral-500">
            Restore defaults
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PemilihAksiFab
