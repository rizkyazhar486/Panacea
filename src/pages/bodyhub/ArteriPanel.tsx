import { useMemo, useState } from 'react'
import { Arteri3D } from './Arteri3D'
import {
  ARTERI, ARTERI_TIDAK_DIMUAT, BATAS_ARTERI,
  cabangDistal, kelompokArteri,
} from '../../lib/anatomy/wilayahArteri'

// Panel wilayah arteri.
//
// Modelnya boleh gagal — perangkat tanpa WebGL ada, dan orang yang memakai
// papan tombol atau pembaca layar tidak bisa menunjuk apa pun. Karena itu
// daftar di bawah bukan pelengkap gambar: ia jalur yang setara. Tiap arteri
// bisa dipilih dari sana, dan seluruh isi keterangan muncul sebagai teks.

export function ArteriPanel() {
  const [terpilih, setTerpilih] = useState<string | null>(null)
  const [terikat, setTerikat] = useState<number | null>(null)

  const arteri = useMemo(() => ARTERI.find((a) => a.id === terpilih) ?? null, [terpilih])
  const cabang = useMemo(() => (arteri ? cabangDistal(arteri) : []), [arteri])
  const kelompok = useMemo(() => kelompokArteri(), [])

  return (
    <section aria-label="Arterial territories" className="w-full max-w-full overflow-x-hidden">
      <h3 className="text-[15px] font-black text-ink dark:text-white">Arterial territories</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        Pick an artery to see it on the arterial tree, what it supplies, and everything the atlas
        models downstream of it.
      </p>

      <div className="mt-3">
        <Arteri3D terpilih={terpilih} onPilih={setTerpilih} onTerikat={setTerikat} />
      </div>

      {/* Keterangan arteri terpilih. */}
      <div className="mt-3 rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        {!arteri && (
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Nothing is selected yet. Choose an artery below, or tap one on the model.
          </p>
        )}
        {arteri && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h4 className="text-[14px] font-black text-ink dark:text-white">{arteri.label}</h4>
              <span className="text-[11px] text-neutral-500">{arteri.kelompok}</span>
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Territory supplied
            </p>
            <ul className="mt-1 list-disc pl-4 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">
              {arteri.wilayah.map((w) => <li key={w}>{w}</li>)}
            </ul>
            {arteri.catatan && (
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{arteri.catatan}</p>
            )}
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Branches distal to it in this atlas ({cabang.length})
            </p>
            {cabang.length === 0 ? (
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                This atlas models no named branch below this vessel. That is a limit of the file,
                not of the anatomy.
              </p>
            ) : (
              <ul className="mt-1 flex flex-wrap gap-1">
                {cabang.map((c) => (
                  <li key={c}
                    className="rounded-lg bg-white/70 px-2 py-1 text-[11px] leading-tight text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setTerpilih(null)}
              className="mt-3 rounded-xl px-2 py-1 text-[11px] font-bold text-[#00BF63] underline">
              Clear selection
            </button>
          </>
        )}
      </div>

      {/* Daftar adalah jalur setara, bukan pelengkap: arteri yang hanya bisa
          dipilih dengan menunjuk berarti arteri yang tidak bisa dipilih
          sebagian orang. */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Every artery in this atlas panel ({ARTERI.length})
        </p>
        {kelompok.map((k) => (
          <div key={k} className="mt-2">
            <p className="text-[11px] font-bold text-neutral-500">{k}</p>
            <div role="group" aria-label={k} className="mt-1 flex flex-wrap gap-1.5">
              {ARTERI.filter((a) => a.kelompok === k).map((a) => (
                <button key={a.id} type="button" aria-pressed={terpilih === a.id}
                  data-arteri-tombol={a.id}
                  onClick={() => setTerpilih(terpilih === a.id ? null : a.id)}
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold leading-tight transition ${
                    terpilih === a.id
                      ? 'bg-[#00BF63] text-white'
                      : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ketiadaan dinyatakan, bukan ditutupi. */}
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Not present in this atlas file
        </p>
        <ul className="mt-1 list-disc pl-4 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {ARTERI_TIDAK_DIMUAT.map((t) => (
            <li key={t.nama}><span className="font-bold">{t.nama}</span> — {t.keterangan}</li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          These vessels are named here rather than faked. Nothing is mirrored, substituted, or
          highlighted in their place.
        </p>
      </div>

      {/* Batas klinis. */}
      <div className="mt-4 rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          What this panel is, and is not
        </p>
        <ul className="mt-1 list-disc pl-4 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {BATAS_ARTERI.map((b) => <li key={b}>{b}</li>)}
        </ul>
        {terikat !== null && (
          <p className="mt-2 text-[11px] text-neutral-500">
            {terikat} of {ARTERI.length} arteries in this catalogue are bound to geometry in the
            loaded file.
          </p>
        )}
      </div>
    </section>
  )
}
