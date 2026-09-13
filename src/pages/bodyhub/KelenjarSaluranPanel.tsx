import { lazy, Suspense, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  jalurKemih, strukturUntuk, STRUKTUR_KELENJAR, TIDAK_DIKIRIM_ATLAS,
} from '../../lib/anatomy/kelenjarSaluran'
import { langkahTurKelenjar, posisiTurKelenjar } from '../../lib/anatomy/kelenjarSaluranTour'

const KelenjarSaluran3D = lazy(() => import('./KelenjarSaluran3D').then((m) => ({ default: m.KelenjarSaluran3D })))

// Daftar di bawah bukan pelengkap penampil 3D, melainkan jalur yang SETARA:
// model tidak bisa dipakai dengan papan tombol, dan struktur yang hanya bisa
// dipilih dengan menunjuk berarti struktur yang tidak bisa dipilih sebagian
// orang sama sekali.

const ENDOKRIN = STRUKTUR_KELENJAR.filter((s) => s.sistem === 'endocrine')

export function KelenjarSaluranPanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const [turAktif, setTurAktif] = useState<'endocrine' | 'urinary'>('urinary')
  const struktur = terpilih ? strukturUntuk(terpilih) : undefined
  const kemih = jalurKemih()
  const posisiTur = useMemo(() => posisiTurKelenjar(turAktif, terpilih), [turAktif, terpilih])

  const pilihLangkahTur = (arah: -1 | 1) => {
    setTerpilih(langkahTurKelenjar(turAktif, terpilih, arah))
  }

  const tombol = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={terpilih === id}
      onClick={() => setTerpilih(terpilih === id ? null : id)}
      className={`rounded-xl border px-2.5 py-2 text-left text-[12px] font-bold leading-snug transition ${
        terpilih === id
          ? 'border-transparent bg-[#00BF63] text-white'
          : 'border-[var(--pelatih-garis,rgba(15,23,42,0.10))] text-neutral-700 dark:text-neutral-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Glands and the urinary tract</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The endocrine glands and the urinary path ship as real geometry in this atlas, so you can see
          where each one sits instead of reading a paragraph about it. Pick a structure to highlight it on
          the body and read what it secretes, or where it sits on the path urine takes.
        </Prosa>
      </div>

      <Suspense fallback={<div className="h-[320px] w-full rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]" />}>
        <KelenjarSaluran3D terpilih={terpilih} onPilih={setTerpilih} />
      </Suspense>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Guided 3D tour</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
              Step through source-backed structures while the same WebGL atlas highlights each exact mesh.
            </p>
          </div>
          <div role="group" aria-label="Guided tour system" className="flex gap-1">
            {(['urinary', 'endocrine'] as const).map((sistem) => (
              <button
                key={sistem}
                type="button"
                aria-pressed={turAktif === sistem}
                onClick={() => {
                  setTurAktif(sistem)
                  setTerpilih(langkahTurKelenjar(sistem, null, 1))
                }}
                className={`min-h-[36px] rounded-full border px-3 text-[11px] font-black transition ${
                  turAktif === sistem
                    ? 'border-transparent bg-[#00BF63] text-white'
                    : 'border-[var(--pelatih-garis,rgba(15,23,42,0.10))] text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {sistem === 'urinary' ? 'Urinary path' : 'Endocrine glands'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={() => pilihLangkahTur(-1)}
            className="min-h-[40px] rounded-xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] px-3 text-[12px] font-black text-neutral-700 dark:text-neutral-200"
          >
            Previous
          </button>
          <div aria-live="polite" className="min-w-[68px] text-center text-[11px] font-bold text-neutral-500">
            {posisiTur.indeks || '—'} / {posisiTur.jumlah}
          </div>
          <button
            type="button"
            onClick={() => pilihLangkahTur(1)}
            className="min-h-[40px] rounded-xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] px-3 text-[12px] font-black text-neutral-700 dark:text-neutral-200"
          >
            Next
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          Navigation only: the tour does not encode urine transit time, endocrine timing, secretion amount,
          organ motion, disease, treatment, or any measurement from a person.
        </p>
      </div>

      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Endocrine glands</div>
        <div role="group" aria-label="Endocrine glands" className="mt-1.5 grid grid-cols-2 gap-1.5">
          {ENDOKRIN.map((s) => tombol(s.id, s.label))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Urinary path, in order
        </div>
        <div role="group" aria-label="Urinary tract" className="mt-1.5 grid grid-cols-2 gap-1.5">
          {kemih.map((s) => tombol(s.id, `${s.urutanKemih}. ${s.label}`))}
        </div>
      </div>

      <div aria-live="polite" className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        {struktur ? (
          <>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              {struktur.sistem === 'endocrine' ? 'Principal secretions' : 'Role on the urinary path'}
            </div>
            <div className="mt-1 text-[14px] font-black text-ink dark:text-white">{struktur.label}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {struktur.letak}
            </p>
            <ul className="mt-2 space-y-1">
              {struktur.peran.map((p) => (
                <li key={p} className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">• {p}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Nothing selected. Choose one of the {STRUKTUR_KELENJAR.length} structures to highlight it on the
            model and see where it sits and what it does.
          </p>
        )}
      </div>

      {/* Ketiadaan dinyatakan, bukan ditutupi. Mencerminkan geometri atau
          menyorot tetangga akan menghasilkan gambar yang meyakinkan dan salah. */}
      <div className="rounded-2xl border border-dashed border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Not in this atlas</div>
        <ul className="mt-1.5 space-y-1">
          {TIDAK_DIKIRIM_ATLAS.map((t) => (
            <li key={t.label} className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              • {t.label}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
          These are named here rather than faked. Nothing on the model is mirrored, duplicated or stood in
          for by a neighbouring structure.
        </p>
      </div>

      <Prosa kelas="text-[11px] leading-relaxed text-neutral-500">
        Standard physiology only. This panel names what each gland secretes and what each part of the
        urinary tract does; it carries no doses, no reference ranges, no thresholds and no diagnosis, and
        it concludes nothing about any particular body. The model is one adult reference atlas — gland
        position, gland number (the parathyroids especially) and urethral length vary between people, and
        the geometry is not measured from anyone.
      </Prosa>
    </div>
  )
}
