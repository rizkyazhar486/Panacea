import { useMemo, useState } from 'react'
import {
  cariTubuh, cakupanTubuh, pasangan, namaTampil, INDEKS_TUBUH,
  type StrukturTubuh, type SaringTubuh,
} from '../../lib/bodySearch'
import { WILAYAH } from '../../lib/dissection'

// ─────────────────────────────────────────────────────────────────────────────
// MENEMUKAN SATU STRUKTUR DI ANTARA 2.587.
//
// Sampai sekarang satu-satunya cara menemukan struktur pada model tubuh adalah
// mengetuknya. Artinya struktur DI DALAM tubuh — justru yang paling ingin
// dicari orang — praktis tidak dapat ditemukan: ia tertutup lapisan di atasnya
// dan tidak ada daftar yang bisa dibuka.
//
// Daftar di sini dibangkitkan langsung dari berkas geometrinya, jadi setiap
// hasil pencarian PASTI menuju ke sesuatu yang benar-benar bisa disorot. Hasil
// yang tidak menuju ke mana-mana lebih buruk daripada hasil kosong: ia membuat
// pengguna mengira strukturnya ada dan sedang gagal ditampilkan.
// ─────────────────────────────────────────────────────────────────────────────

const LAPISAN: Array<{ k: StrukturTubuh['l']; label: string }> = [
  { k: 'skeletal', label: 'Bone' },
  { k: 'muscular', label: 'Muscle' },
  { k: 'cardiovascular', label: 'Vessel' },
  { k: 'nervous', label: 'Nerve' },
  { k: 'visceral', label: 'Organ' },
  { k: 'lymphoid', label: 'Lymphatic' },
  { k: 'surface', label: 'Surface' },
]

export interface StructureFinderProps {
  /** Menyorot struktur pada model tubuh, memakai nama persis di dalam berkas. */
  onSorot: (nama: string[]) => void
  /** Menyalakan lapisan yang memuat struktur itu; tanpa ini sorotan tak terlihat. */
  onLapisan: (lapisan: StrukturTubuh['l']) => void
}

export function StructureFinder({ onSorot, onLapisan }: StructureFinderProps) {
  const [kueri, setKueri] = useState('')
  const [saring, setSaring] = useState<SaringTubuh>({})
  const [dipilih, setDipilih] = useState<StrukturTubuh | null>(null)
  const cakupan = useMemo(() => cakupanTubuh(), [])
  const hasil = useMemo(() => cariTubuh(kueri, saring, 60), [kueri, saring])

  function pilih(s: StrukturTubuh) {
    setDipilih(s)
    // Lapisannya dinyalakan lebih dulu: menyorot struktur di lapisan yang
    // sedang dimatikan menghasilkan sorotan yang tidak terlihat, dan itu
    // terbaca sebagai kerusakan.
    onLapisan(s.l)
    onSorot(pasangan(s))
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-neutral-500">
        Every one of the {INDEKS_TUBUH.length.toLocaleString()} named structures in the model, read straight out of
        the geometry files. If a name is listed here it can be highlighted; if it is not listed, it genuinely is not
        in the model, and nothing is invented to fill the gap.
      </p>

      <input
        value={kueri}
        onChange={(e) => setKueri(e.target.value)}
        placeholder="Search — e.g. tibial artery, left femur, vagus"
        aria-label="Search structures"
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
      />

      <div className="flex flex-wrap gap-1.5">
        {LAPISAN.map((l) => (
          <button
            key={l.k}
            onClick={() => setSaring((s) => ({ ...s, lapisan: s.lapisan === l.k ? null : l.k }))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
              saring.lapisan === l.k ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {l.label} <span className="opacity-60">{cakupan[l.k] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WILAYAH.map((w) => (
          <button
            key={w.kunci}
            onClick={() => setSaring((s) => ({ ...s, wilayah: s.wilayah === w.kunci ? null : w.kunci }))}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold active:scale-95 ${
              saring.wilayah === w.kunci ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {dipilih && (
        <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
          <div className="text-sm font-black text-ink dark:text-ink">{namaTampil(dipilih)}</div>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            {LAPISAN.find((l) => l.k === dipilih.l)?.label} ·{' '}
            {WILAYAH.find((w) => w.kunci === dipilih.w)?.label ?? dipilih.w} ·{' '}
            {Math.round(dipilih.y * 100)}% of body height · {dipilih.t.toLocaleString()} triangles
          </div>
          {pasangan(dipilih).length > 1 && (
            <div className="mt-1 text-[11px] text-neutral-500">
              Paired structure — both sides highlighted together.
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        {hasil.map(({ struktur }) => (
          <button
            key={`${struktur.l}-${struktur.n}`}
            onClick={() => pilih(struktur)}
            className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left active:scale-[0.99] ${
              dipilih?.n === struktur.n && dipilih?.l === struktur.l
                ? 'bg-brand text-white'
                : 'bg-neutral-100/60 dark:bg-white/5'
            }`}
          >
            <span className="min-w-0 truncate text-[12px] font-semibold">{namaTampil(struktur)}</span>
            <span className={`shrink-0 text-[10px] font-bold ${dipilih?.n === struktur.n ? 'text-white/70' : 'text-neutral-500'}`}>
              {LAPISAN.find((l) => l.k === struktur.l)?.label}
            </span>
          </button>
        ))}
        {kueri.trim() && hasil.length === 0 && (
          <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
            Nothing in the model matches that. The model is detailed but not complete — fine nerve branches and
            individual ligaments are often not separate meshes in it.
          </p>
        )}
      </div>
    </div>
  )
}

export default StructureFinder
