import { useEffect, useState } from 'react'
import { api, type AnatomyImage, type ImageKind } from '../../lib/api'
import { clinicalForOrgan, labsForOrgan, AUDIENCES, type Audience } from '../../lib/organClinical'
import { penjelasanOrgan } from '../../lib/organExplain'
import { SISTEM_FISIOLOGI } from '../../lib/physiology'
import { ORGAN_FOCUS } from '../../lib/organFocus'
import type { AnatomyLayer } from '../../components/Body3D'
import OrganClinicalPanel from './OrganClinicalPanel'
import { modelForFocus, modelIlustrasi, ILUSTRASI } from '../../lib/organModels'
import OrganModel3D from '../../components/OrganModel3D'

// ─────────────────────────────────────────────────────────────────────────────
// BERKAS LENGKAP SATU STRUKTUR — seluruh lapis pengetahuan dalam SATU aliran.
//
// Sebelum ini isinya benar tapi TERSEBAR: anatomi di satu tab, fisiologi di tab
// lain, histologi & patologi di galeri gambar yang terpisah lagi, penyakitnya
// di tab ketiga. Semuanya ada, tapi mempelajari SATU organ berarti berpindah
// empat kali dan menyusun sendiri hubungannya di kepala. Itu bukan kompilasi,
// itu penyimpanan.
//
// Di sini urutannya mengikuti cara organ benar-benar dipelajari, dari bentuk ke
// tindakan:
//
//   Anatomi -> Histologi -> Fisiologi -> Radiologi -> Patologi
//           -> Penyakit (bawaan & didapat) -> Pemeriksaan -> Obat -> Edukasi
//
// Tiap bagian memuat gambar NYATA-nya sendiri dengan ragam yang benar
// (histologi meminta mikrograf, radiologi meminta rontgen/CT/MRI), sehingga
// gambar tidak lagi berdiri sebagai galeri lepas melainkan berada di dalam
// bagian yang membutuhkannya.
//
// Tingkat pembaca berlaku untuk SELURUH berkas sekaligus: satu pilihan, dan
// seluruh halaman menyesuaikan kedalamannya.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  organKey: string
  organLabel: string
  onLocate?: (keywords: string[], layer: AnatomyLayer['key']) => void
}

/** Galeri gambar untuk satu bagian. Dimuat saat bagiannya dibuka saja. */
function Galeri({ term, kind, kosongTeks }: { term: string; kind: ImageKind; kosongTeks: string }) {
  const [images, setImages] = useState<AnatomyImage[] | null>(null)
  useEffect(() => {
    let batal = false
    setImages(null)
    api.anatomyImages(term, kind)
      .then((r) => { if (!batal) setImages(r.images) })
      .catch(() => { if (!batal) setImages([]) })
    return () => { batal = true }
  }, [term, kind])

  if (images === null) return <p className="text-xs text-neutral-500">Loading images…</p>
  if (!images.length) return <p className="text-xs text-neutral-500">{kosongTeks}</p>
  return (
    <div className="grid grid-cols-2 gap-2">
      {images.slice(0, 4).map((img) => (
        <figure key={img.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
          <img src={img.url} alt={img.title} loading="lazy" className="h-28 w-full bg-white object-contain" />
          {/* Lisensi & pembuat WAJIB tampil — syarat CC, bukan hiasan. */}
          <figcaption className="p-1.5">
            <div className="line-clamp-2 text-[10.5px] font-semibold text-ink dark:text-white">{img.title}</div>
            <a href={img.sourcePage} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[9.5px] text-neutral-400 underline">
              {img.artist} · {img.license}
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

/** Satu bagian berkas. Tertutup secara bawaan kecuali yang pertama, supaya
 *  halaman tetap ringkas walau isinya lengkap. */
function Bagian({
  judul, sub, terbukaAwal = false, children,
}: { judul: string; sub?: string; terbukaAwal?: boolean; children: React.ReactNode }) {
  const [buka, setBuka] = useState(terbukaAwal)
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-white/10">
      <button onClick={() => setBuka(!buka)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink dark:text-white">{judul}</span>
          {sub && <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{sub}</span>}
        </span>
        <span className={`shrink-0 text-neutral-400 transition-transform ${buka ? 'rotate-90' : ''}`}>›</span>
      </button>
      {buka && <div className="space-y-2.5 border-t border-neutral-100 p-3 dark:border-white/5">{children}</div>}
    </section>
  )
}

function Blok({ judul, isi }: { judul: string; isi?: string }) {
  if (!isi) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{isi}</p>
    </div>
  )
}

function Daftar({ judul, isi }: { judul: string; isi?: string[] }) {
  if (!isi?.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <ul className="mt-0.5 space-y-0.5">
        {isi.map((x, i) => (
          <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="shrink-0 text-neutral-400">·</span><span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OrganDossier({ organKey, organLabel, onLocate }: Props) {
  const [audience, setAudience] = useState<Audience>('student')
  const penjelasan = penjelasanOrgan(organKey)
  const fokus = ORGAN_FOCUS.find((o) => o.key === organKey)
  const { penyakit, obat } = clinicalForOrgan(organKey)
  const labs = labsForOrgan(organKey)
  // Fisiologi dicocokkan lewat lapisan 3D organ ini — jantung & pembuluh ke
  // fisiologi kardiovaskular, paru ke pernapasan, dan seterusnya.
  const fisiologi = SISTEM_FISIOLOGI.find((f) =>
    (organKey === 'heart' && f.key === 'cardiovascular') ||
    (organKey === 'lungs' && f.key === 'respiratory') ||
    (organKey === 'kidneys' && f.key === 'urinary') ||
    (['stomach', 'small-intestine', 'large-intestine', 'liver', 'pancreas', 'gallbladder'].includes(organKey) && f.key === 'digestive') ||
    (['thyroid', 'adrenal', 'pituitary'].includes(organKey) && f.key === 'endocrine') ||
    (['brain', 'spinal-cord', 'eye', 'ear', 'optic-pathway', 'inner-ear-nerve'].includes(organKey) && f.key === 'nervous-system') ||
    (['spleen', 'lymph-nodes'].includes(organKey) && f.key === 'lymphatic') ||
    (['ossicles', 'nasal-septum'].includes(organKey) && f.key === 'skeletal'),
  )
  const term = organLabel
  // Model organ tunggal beresolusi tinggi, kalau organ ini punya. Terpisah
  // dari figur tubuh utuh dan asalnya berbeda — lihat organModels.ts.
  const model = modelForFocus(organKey)
  // Ilustrasi selalu datang dari berkas /organs/<id>/, yang hanya dimiliki
  // model bangkitan AI. Saat organ ini memakai potongan BodyParts3D untuk 3D-nya,
  // ilustrasinya tetap dicari terpisah supaya tidak ikut hilang.
  const ilustrasi = modelIlustrasi(organKey)
  const [hotspot, setHotspot] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {/* Satu pilihan kedalaman untuk SELURUH berkas. */}
      <div>
        <div className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAudience(a.key)}
              className={`min-h-[32px] shrink-0 rounded-lg px-3 text-xs font-bold transition ${
                audience === a.key ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white' : 'text-neutral-500'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10.5px] text-neutral-400">
          {AUDIENCES.find((a) => a.key === audience)?.hint} — applies to the whole dossier below.
        </p>
      </div>

      <Bagian judul="1 · Anatomy" sub="What it is, and where it sits" terbukaAwal>
        {model && (
          <>
            <OrganModel3D organ={model} selected={hotspot} onSelect={setHotspot} />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-500">{model.scientificName}</span>
              {model.hotspots.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHotspot(hotspot === h.id ? null : h.id)}
                  className={`min-h-[28px] rounded-full border px-2 text-[10.5px] font-bold transition ${
                    hotspot === h.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
                  }`}
                >
                  {h.ta}
                </button>
              ))}
            </div>
            {/* Asal model dinyatakan di layar. Aplikasi kedokteran harus bisa
                mengatakan dari mana gambarnya datang, dan model bangkitan AI
                adalah pendekatan bentuk, bukan geometri terverifikasi. */}
            <p className="text-[10px] leading-relaxed text-neutral-400">
              {model.sumber === 'bodyparts3d' ? (
                <>
                  Detailed organ view — {model.jumlahBagian === 1 ? 'one named structure' : `${model.jumlahBagian} individually named structures`} cut from BodyParts3D 4.0
                  (Database Center for Life Science, CC BY 4.0), the same reference anatomy as the full-body figure
                  above. Real human reference geometry, not an artistic impression.
                </>
              ) : (
                <>
                  Detailed organ view — an AI-generated model (Tripo), used with the owner’s permission. It is a shape
                  approximation for recognising form and position, not verified anatomy. The full-body figure above uses
                  BodyParts3D, which is derived from real human data.
                </>
              )}
            </p>
            {ilustrasi && <div className="grid grid-cols-2 gap-2">
              {ILUSTRASI.map((il) => (
                <figure key={il.key} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
                  <img
                    src={`${import.meta.env.BASE_URL}organs/${ilustrasi.id}/${il.key}.webp`}
                    alt={`${ilustrasi.label} — ${il.label}`}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                  <figcaption className="p-1 text-center text-[10px] font-semibold text-neutral-500">{il.label}</figcaption>
                </figure>
              ))}
            </div>}
          </>
        )}
        {penjelasan ? (
          <>
            <Blok judul="Definition" isi={penjelasan.definisi} />
            <Daftar judul="What it does" isi={penjelasan.fungsi} />
            {penjelasan.fakta && <Daftar judul="Key numbers" isi={penjelasan.fakta} />}
          </>
        ) : (
          <p className="text-xs text-neutral-500">No written description for this structure yet.</p>
        )}
        {fokus && onLocate && (
          <button
            onClick={() => onLocate(fokus.keywords, fokus.layer)}
            className="rounded-full border border-brand px-2.5 py-1 text-[11px] font-bold text-brand"
          >
            Highlight on the 3D model →
          </button>
        )}
        <Galeri term={term} kind="anatomy" kosongTeks="No freely-licensed anatomy image found." />
      </Bagian>

      <Bagian judul="2 · Histology" sub="What it looks like down the microscope">
        <p className="text-[11px] leading-relaxed text-neutral-400">
          Tissue is microscopic, so there is no meaningful 3D model of it — stained sections are what is actually
          used to learn and to diagnose.
        </p>
        <Galeri term={term} kind="histology" kosongTeks="No freely-licensed micrograph found for this structure." />
      </Bagian>

      <Bagian judul="3 · Physiology" sub="How it works, at rest and under load">
        {fisiologi ? (
          <>
            <Blok judul="Function" isi={fisiologi.fungsi} />
            {audience !== 'awam' && <Daftar judul="Mechanism" isi={fisiologi.proses} />}
            {audience !== 'awam' && <Blok judul="What controls it" isi={fisiologi.regulasi} />}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Rest</span>
                <span className="t-mikro font-bold uppercase tracking-wide text-brand">Exercise</span>
              </div>
              {fisiologi.angka.map((n) => (
                <div key={n.label} className="flex items-baseline justify-between gap-2 border-b border-neutral-100 py-1 last:border-0 dark:border-white/5">
                  <span className="min-w-0 flex-1 text-[11px] text-neutral-500">{n.label}</span>
                  <span className="shrink-0 text-[11px] font-bold text-ink dark:text-white">{n.rest}</span>
                  {n.exercise && <span className="shrink-0 text-[11px] font-bold text-brand">{n.exercise}</span>}
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-brand/5 p-2.5 dark:bg-brand/10">
              <div className="t-mikro font-bold uppercase tracking-wide text-brand">Under exercise</div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink dark:text-white">{fisiologi.saatOlahraga}</p>
            </div>
          </>
        ) : penjelasan ? (
          <Blok judul="How it works" isi={penjelasan.caraKerja} />
        ) : (
          <p className="text-xs text-neutral-500">No physiology written for this structure yet.</p>
        )}
      </Bagian>

      <Bagian judul="4 · Radiology" sub="How it appears on X-ray, CT and MRI">
        <p className="text-[11px] leading-relaxed text-neutral-400">
          The 3D model above can be rendered in each modality, but those are renderings. These are real radiographs
          and scan slices — the appearance you actually have to recognise, artefacts and all.
        </p>
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Radiograph</div>
          <Galeri term={term} kind="xray" kosongTeks="No freely-licensed radiograph found." />
        </div>
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">CT</div>
          <Galeri term={term} kind="ct" kosongTeks="No freely-licensed CT image found." />
        </div>
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">MRI</div>
          <Galeri term={term} kind="mri" kosongTeks="No freely-licensed MRI found." />
        </div>
      </Bagian>

      <Bagian judul="5 · Pathology" sub="What disease does to the tissue">
        <Galeri term={term} kind="pathology" kosongTeks="No freely-licensed pathology image found for this structure." />
      </Bagian>

      <Bagian
        judul="6 · Diseases"
        sub={`${penjelasan?.bawaan.length ?? 0} congenital · ${penyakit.length} acquired, with full clinical notes`}
      >
        {/* Catatan penyakitnya dirender UTUH di sini — bukan tautan ke halaman
            lain. Inilah yang dimaksud "digabung": isi Med Study Hub berada di
            dalam berkas organnya, pada tingkat kedalaman yang sama. */}
        <OrganClinicalPanel organKey={organKey} organLabel={organLabel} onLocate={onLocate} audienceLuar={audience} />
      </Bagian>

      <Bagian judul="7 · Investigations" sub="What to order, and what each one answers">
        {labs.length ? (
          <ul className="space-y-1">
            {labs.map((l) => (
              <li key={l.nama} className="rounded-lg bg-neutral-50 p-2 dark:bg-white/5">
                <div className="text-xs font-bold text-ink dark:text-white">{l.nama}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{l.untuk}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500">
            No organ-specific investigation list written yet. Investigations are still ordered by indication in the
            AI-EMR, from the history and examination.
          </p>
        )}
      </Bagian>

      <Bagian judul="8 · Pharmacotherapy" sub={`${obat.length} drugs used for conditions of this structure`}>
        {obat.length ? (
          <div className="space-y-1">
            {obat.map((o) => (
              <div key={o.nama} className="rounded-lg bg-neutral-50 p-2 dark:bg-white/5">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-xs font-bold text-ink dark:text-white">{o.nama}</span>
                  {o.eml && <span className="rounded-full bg-brand/10 px-1.5 text-[10px] font-bold text-brand">WHO essential</span>}
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-500">{o.kelas} · {o.untuk}</p>
                {audience !== 'awam' && o.dosis.length > 0 && o.dosis.map((d, i) => (
                  <p key={i} className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    <span className="font-bold">{d.keluhan}: </span>{d.dosis}
                  </p>
                ))}
                {audience !== 'awam' && o.catatan && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">{o.catatan}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">No drugs mapped to this structure yet.</p>
        )}
        <p className="text-[10.5px] leading-relaxed text-neutral-400">
          Doses come from the curated SKDI corpus and are shown only where that corpus records one. Nothing here is
          calculated for an individual patient.
        </p>
      </Bagian>

      {penjelasan && (
        <Bagian judul="9 · Education" sub="What to tell the patient, in plain words">
          <Blok judul="In one sentence" isi={penjelasan.definisi} />
          <Daftar judul="What it does for you" isi={penjelasan.fungsi} />
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Written for the person, not the chart. Switch the level to “Public” at the top and the whole dossier
            follows.
          </p>
        </Bagian>
      )}
    </div>
  )
}

export default OrganDossier
