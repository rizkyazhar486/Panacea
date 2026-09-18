import { useMemo, useRef, useState } from 'react'
import { cariTubuh, namaTampil, pasangan, type StrukturTubuh } from '../lib/bodySearch'
import { ANATOMY_LAYERS, type AnatomyLayer } from './Body3D'

// Kotak cari struktur, DI ATAS modelnya.
//
// Mesin pencarinya sudah ada sejak lama di lib/bodySearch dan indeksnya memuat
// nama-nama yang benar-benar berada di dalam berkas geometri. Yang tidak ada
// adalah jalan masuknya dari layar tempat modelnya berdiri: pencariannya
// tinggal di tab lain, jadi menemukan sesuatu berarti meninggalkan gambar yang
// sedang dilihat.
//
// SATU HAL YANG MEMBEDAKAN INI DARI KOTAK CARI BIASA. Struktur yang ditemukan
// hampir selalu berada di sistem yang sedang DIMATIKAN -- itu sebabnya orang
// mencarinya, bukan mengetuknya. Memilih hasil karena itu ikut menyalakan
// sistemnya. Tanpa itu, pencarian yang berhasil tetap berakhir dengan layar
// yang tidak berubah, dan pemakainya menyimpulkan strukturnya tidak ada.

export interface CariStrukturCepatProps {
  /** Sistem yang sedang terlihat; hasil di luar ini ditandai. */
  lapisanAktif: Set<AnatomyLayer['key']>
  /** Menyalakan sistem sebuah struktur sebelum menyorotnya. */
  onNyalakanLapisan: (kunci: AnatomyLayer['key']) => void
  /** Menyorot struktur (dan pasangan kiri/kanannya) di dalam model. */
  onSorot: (namaMentah: string[], label: string) => void
}

const LABEL_LAPISAN = new Map(ANATOMY_LAYERS.map((l) => [l.key, l.label]))

export function CariStrukturCepat({ lapisanAktif, onNyalakanLapisan, onSorot }: CariStrukturCepatProps) {
  const [kueri, setKueri] = useState('')
  const [buka, setBuka] = useState(false)
  const masukanRef = useRef<HTMLInputElement | null>(null)

  // Hanya satu baris per struktur: indeksnya menyimpan kiri dan kanan sebagai
  // dua entri, dan menampilkan keduanya membuat setiap hasil tampak dobel.
  const hasil = useMemo(() => {
    if (kueri.trim().length < 2) return []
    const terlihat = new Set<string>()
    const keluar: StrukturTubuh[] = []
    for (const h of cariTubuh(kueri, {}, 60)) {
      const kunci = `${h.struktur.b}|${h.struktur.l}`
      if (terlihat.has(kunci)) continue
      terlihat.add(kunci)
      keluar.push(h.struktur)
      if (keluar.length >= 8) break
    }
    return keluar
  }, [kueri])

  function pilih(s: StrukturTubuh) {
    if (!lapisanAktif.has(s.l)) onNyalakanLapisan(s.l)
    onSorot(pasangan(s), namaTampil(s))
    setKueri('')
    setBuka(false)
    masukanRef.current?.blur()
  }

  return (
    <div className="relative">
      <input
        ref={masukanRef}
        type="search"
        value={kueri}
        onChange={(e) => { setKueri(e.target.value); setBuka(true) }}
        onFocus={() => setBuka(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setKueri(''); setBuka(false); masukanRef.current?.blur() }
          if (e.key === 'Enter' && hasil.length > 0) pilih(hasil[0])
        }}
        placeholder="Find a structure"
        aria-label="Find a structure"
        className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white/95 px-3 text-sm font-semibold text-ink shadow-sm backdrop-blur dark:border-white/15 dark:bg-black/60 dark:text-white"
      />

      {buka && kueri.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-white/15 dark:bg-[#0b0f14]">
          {hasil.length === 0 ? (
            <p className="p-3 text-[11.5px] leading-relaxed text-neutral-500">
              No structure with that name is in the geometry. Nothing is suggested instead — a result that leads
              nowhere reads as a structure that exists and failed to draw.
            </p>
          ) : (
            <ul>
              {hasil.map((s) => {
                const mati = !lapisanAktif.has(s.l)
                return (
                  <li key={`${s.b}|${s.l}`}>
                    <button
                      type="button"
                      onClick={() => pilih(s)}
                      className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left hover:bg-neutral-50 dark:hover:bg-white/5"
                    >
                      <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink dark:text-neutral-100">
                        {namaTampil(s)}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                        {LABEL_LAPISAN.get(s.l) ?? s.l}{mati && ' · off'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
