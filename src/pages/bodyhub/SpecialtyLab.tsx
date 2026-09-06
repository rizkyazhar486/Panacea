import { useMemo, useState } from 'react'
import AtlasViewer3D, { type PartMeta } from '../../components/AtlasViewer3D'
import { ATLAS_MODULE_INFO, partsForModule } from '../../lib/systemAtlas.gen'
import {
  kondisiUntukModul, kondisiUntukStrukturSistem, strukturKondisiSistem, type SystemCondition,
} from '../../lib/specialtyPathology'
import { SKDI_DISEASE_LIST } from '../../lib/skdiDiseaseList'
import { drugsForCondition } from '../../lib/drugTargets'

// ─────────────────────────────────────────────────────────────────────────────
// RUANG SPESIALISASI — patologi tiap bidang, di atas anatomi manusia nyata.
//
// Satu penampil, dua belas modul, dan aturan yang sama di semuanya: pilih
// penyakit dan strukturnya menyala, atau sentuh strukturnya dan penyakitnya
// yang muncul.
//
// Batas geometrinya dinyatakan di layar. BodyParts3D adalah rujukan laki-laki
// dewasa: tidak ada organ reproduksi perempuan, kelenjar tiroid, telinga
// tengah, maupun parenkim paru. Menyorot struktur pengganti supaya "ada yang
// menyala" berarti mengajarkan letak yang salah — lebih baik dikatakan.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onBukaOrgan?: (organKey: string) => void
}

/** Urutan tampil modul: mengikuti cara orang mencari, bukan abjad. */
const URUTAN = [
  'respirasi', 'paru', 'gastro', 'nefrologi', 'endokrin', 'tiroid', 'neurologi',
  'tht', 'telinga', 'mata', 'ortopedi', 'urogenital', 'obstetri', 'obgin',
  'imunologi', 'kulit',
] as const

// Keterangan per modul, termasuk ASAL GEOMETRINYA. Empat modul terakhir tidak
// berasal dari BodyParts3D versi human-atlas, dan itu dikatakan apa adanya —
// pembaca berhak tahu rujukan tubuh siapa yang sedang ia lihat.
const CATATAN_MODUL: Record<string, string> = {
  respirasi:
    'This module holds the airway tree, diaphragm and chest wall. For the lobes themselves and the pleura, open ' +
    'the Lungs & pleura module.',
  paru:
    'Geometry from Z-Anatomy (CC BY-SA 4.0), the same source as the full-body figure — five lobes, the pleural ' +
    'sac and the bronchial tree down to the lobar bronchi.',
  endokrin:
    'The thyroid and parathyroids have their own module (Thyroid & parathyroid), because their geometry comes ' +
    'from a different reference body and the two spaces must not be mixed.',
  tiroid: 'Geometry from Z-Anatomy (CC BY-SA 4.0): thyroid, all four parathyroids, laryngeal cartilages, trachea and oesophagus.',
  tht: 'The nose, pharynx and larynx. The middle and inner ear are in their own module (Middle & inner ear).',
  telinga:
    'Geometry from Z-Anatomy (CC BY-SA 4.0): the three ossicles, tympanic membrane, cochlea, vestibule and the ' +
    'cochlear, vestibular and chorda tympani nerves, inside the temporal bone.',
  obstetri:
    'This is the male reference pelvis — bone, pelvic floor and vessels, which is where obstetric mechanics happen. ' +
    'For the female organs themselves, open the Female pelvis module.',
  obgin:
    'Geometry from the HuBMAP Human Reference Atlas female reference body (CC BY 4.0): uterus, ovaries, uterine ' +
    'tubes, vagina, their ligaments, the bladder and the female bony pelvis.',
  imunologi: 'Bone marrow is shown at its major adult sites — femur, pelvis and sternum — since marrow itself has no separate mesh.',
  kulit: 'Skin is a single surface mesh; dermatological conditions are located by their pattern and distribution rather than by depth.',
}

// Sebutan sumber geometri, ditulis per SUMBER dan bukan disamakan untuk semua.
// Modul paru, tiroid, telinga dan panggul perempuan bukan berasal dari
// BodyParts3D, dan mencantumkan lisensi yang keliru pada karya orang lain
// bukan sekadar kurang rapi — ia melanggar syarat pemakaiannya.
const SUMBER: Record<string, string> = {
  'bodyparts3d': 'BodyParts3D 4.0 (Database Center for Life Science, CC BY 4.0)',
  'z-anatomy': 'Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D',
  'hra-female': 'HuBMAP Human Reference Atlas, female reference body (CC BY 4.0)',
}

const NAMA_LESI: Record<string, string> = {
  occlusion: 'Blocked', stenosis: 'Narrowed', dilatation: 'Enlarged', thrombus: 'Clot',
  incompetence: 'Failing', shunt: 'Shunt', dissection: 'Torn', hypertrophy: 'Thickened',
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[32px] shrink-0 rounded-full border px-3 text-[11.5px] font-bold transition ${
        aktif ? 'border-brand bg-brand text-white'
              : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

function Daftar({ judul, isi }: { judul: string; isi: string[] }) {
  if (!isi.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <ul className="mt-1 space-y-1">
        {isi.map((x) => (
          <li key={x} className="flex gap-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="text-neutral-400">·</span><span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SpecialtyLab({ onBukaOrgan }: Props) {
  const [modul, setModul] = useState<string>('respirasi')
  const [kondisiId, setKondisiId] = useState<string | null>(null)
  const [struktur, setStruktur] = useState<string | null>(null)

  const bagian = useMemo<PartMeta[]>(
    () => partsForModule(modul).map((p) => ({ name: p.name, kind: p.kind, group: p.kind })),
    [modul],
  )
  const daftar = useMemo(() => kondisiUntukModul(modul), [modul])
  const kondisi = kondisiId ? daftar.find((k) => k.id === kondisiId) ?? null : null
  const info = ATLAS_MODULE_INFO[modul]
  const asal = partsForModule(modul)[0]?.source ?? 'bodyparts3d'

  const skdi = useMemo(() => {
    if (!kondisi) return []
    return kondisi.skdi.map((nama) => ({
      nama,
      entri: SKDI_DISEASE_LIST.find((e) => e.disease === nama) ?? null,
    }))
  }, [kondisi])

  const obatKondisi = useMemo(() => (kondisi ? drugsForCondition(kondisi.id) : []), [kondisi])

  const padaStruktur = struktur ? kondisiUntukStrukturSistem(modul, struktur) : []

  function pilihModul(id: string) {
    setModul(id)
    setKondisiId(null)
    setStruktur(null)
  }

  function pilihKondisi(k: SystemCondition) {
    setKondisiId(kondisiId === k.id ? null : k.id)
    setStruktur(null)
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-ink dark:text-white">Specialty pathology atlas</h2>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
          Twelve fields, each on its own named anatomy cut from BodyParts3D. Pick a condition to light up the
          structure that fails and what suffers downstream, or tap any structure to see what goes wrong there.
        </p>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {URUTAN.filter((m) => ATLAS_MODULE_INFO[m]).map((m) => (
          <Chip key={m} aktif={modul === m} onClick={() => pilihModul(m)}>{ATLAS_MODULE_INFO[m].label}</Chip>
        ))}
      </div>

      <AtlasViewer3D
        berkas={`atlas/${modul}.glb`}
        bagian={bagian}
        lesi={kondisi ? kondisi.lesi.map((l) => l.struktur) : []}
        hilir={kondisi ? kondisi.hilir : []}
        dipilih={struktur}
        onPilih={(n) => { setStruktur(n); if (n) setKondisiId(null) }}
      />

      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        {info?.structures} named structures · {info?.kb} kB · {SUMBER[asal] ?? SUMBER['bodyparts3d']}.{' '}
        {CATATAN_MODUL[modul] ?? ''}
      </p>

      {struktur && (
        <section className="rounded-xl border border-brand/30 bg-brand/[0.04] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-brand">Structure</div>
              <h3 className="text-sm font-black text-ink dark:text-white">{struktur}</h3>
            </div>
            <button onClick={() => setStruktur(null)} className="shrink-0 text-[11px] font-bold text-neutral-500">Close</button>
          </div>
          {padaStruktur.length ? (
            <ul className="mt-2 space-y-1.5">
              {padaStruktur.map(({ kondisi: k, peran }) => (
                <li key={k.id}>
                  <button
                    onClick={() => pilihKondisi(k)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="block text-xs font-bold text-ink dark:text-white">{k.label}</span>
                    <span className="mt-0.5 block text-[10.5px] text-neutral-500">
                      {peran === 'lesi' ? 'the lesion sits in this structure'
                                        : 'this structure suffers when that lesion occurs'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-neutral-500">
              No condition in this module is mapped to this structure yet.
            </p>
          )}
        </section>
      )}

      <div className="space-y-1.5">
        {daftar.map((k) => (
          <button
            key={k.id}
            onClick={() => pilihKondisi(k)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
              kondisiId === k.id ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'
            }`}
          >
            <span className="block text-xs font-bold text-ink dark:text-white">{k.label}</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{k.ringkas}</span>
          </button>
        ))}
      </div>

      {kondisi && (
        <section className="space-y-2.5 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div>
            <h3 className="text-sm font-black text-ink dark:text-white">{kondisi.label}</h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">{kondisi.ringkas}</p>
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Where it goes wrong</div>
            <ul className="mt-1 space-y-1.5">
              {kondisi.lesi.map((l) => (
                <li key={l.struktur + l.jenis} className="rounded-lg bg-red-500/[0.06] p-2">
                  <button
                    onClick={() => setStruktur(l.struktur)}
                    className="block text-left text-xs font-bold text-ink dark:text-white"
                  >
                    {l.struktur}
                  </button>
                  <span className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-red-500">
                    {NAMA_LESI[l.jenis]}{l.derajat !== undefined ? ` ${Math.round(l.derajat * 100)}%` : ''}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{l.catatan}</p>
                </li>
              ))}
            </ul>
          </div>

          {kondisi.hilir.length > 0 && (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-amber-500">What suffers downstream</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {kondisi.hilir.map((h) => (
                  <button
                    key={h}
                    onClick={() => setStruktur(h)}
                    className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Mechanism</div>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{kondisi.mekanisme}</p>
          </div>

          <Daftar judul="What you find" isi={kondisi.temuan} />
          <Daftar judul="What confirms it" isi={kondisi.penunjang} />
          <Daftar judul="What you do" isi={kondisi.tata} />


          {obatKondisi.length > 0 && (
            <div>
              {/* Tautan balik ke ruang molekul: penyakit yang sedang dibuka
                  membawa serta obat yang melawannya, lengkap dengan target
                  molekulnya — supaya "diberi obat apa" dan "bekerja di mana"
                  tidak lagi menjadi dua halaman yang terpisah. */}
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Drugs used against this</div>
              <ul className="mt-1 space-y-1">
                {obatKondisi.map((d) => (
                  <li key={d.id} className="rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5">
                    <span className="text-[11.5px] font-bold text-ink dark:text-white">{d.katalog}</span>
                    <span className="ml-1 text-[10.5px] text-neutral-500">→ {d.target}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[10px] text-neutral-400">
                Open the Molecules tab to see any of these in 3D with its binding target.
              </p>
            </div>
          )}

          {skdi.length > 0 && (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">In the clinical library</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {skdi.map((s) => (
                  <span
                    key={s.nama}
                    className="rounded-full border border-neutral-200 px-2 py-1 text-[10.5px] font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
                  >
                    {s.nama}
                    {s.entri && <b className="ml-1 text-brand">SKDI {s.entri.level}</b>}
                  </span>
                ))}
              </div>
              {onBukaOrgan && (
                <button
                  onClick={() => onBukaOrgan(kondisi.organKey)}
                  className="mt-2 min-h-[36px] w-full rounded-xl bg-brand px-3 text-xs font-bold text-white"
                >
                  Open the full dossier for this organ
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-neutral-400">
            {strukturKondisiSistem(kondisi).length} structures highlighted on the figure. Educational material,
            not a clinical decision tool.
          </p>
        </section>
      )}
    </div>
  )
}

export default SpecialtyLab
