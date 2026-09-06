import { useMemo, useState } from 'react'
import CardioAtlas3D from '../../components/CardioAtlas3D'
import { FLOW_PATHS, alirStenosis, strukturJalur } from '../../lib/cardioFlow'
import {
  CARDIO_CONDITIONS, kondisiUntukStruktur, strukturKondisi, type CardioCondition,
} from '../../lib/cardioPathology'
import { CARDIO_BY_NAME, CARDIO_PARTS } from '../../lib/cardioAtlas.gen'
import { SKDI_DISEASE_LIST } from '../../lib/skdiDiseaseList'
import { drugsForCondition } from '../../lib/drugTargets'

// ─────────────────────────────────────────────────────────────────────────────
// RUANG KARDIOVASKULAR — patologi yang ditunjukkan di tempatnya.
//
// Alur yang ditawarkan halaman ini ada dua arah, dan keduanya sama pentingnya:
//
//   dari PENYAKIT ke tempat  : pilih "infark anterior", LAD menyala di figur.
//   dari TEMPAT ke penyakit  : sentuh satu pembuluh, keluar semua yang bisa
//                              salah di sana.
//
// Arah kedua itulah yang hilang dari hampir semua bahan belajar: pembuluh
// digambar, penyakit ditulis, dan menghubungkannya diserahkan kepada pembaca.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Membuka berkas klinis lengkap satu organ di Body Explorer. */
  onBukaOrgan?: (organKey: string) => void
  /** Keadaan yang langsung dibuka — dipakai saat datang dari pencarian atlas. */
  awal?: string | null
}

const KATEGORI: Array<{ key: CardioCondition['kategori'] | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'coronary', label: 'Coronary' },
  { key: 'valve', label: 'Valves' },
  { key: 'aorta', label: 'Aorta & arteries' },
  { key: 'venous', label: 'Veins' },
  { key: 'pulmonary', label: 'Pulmonary' },
  { key: 'cerebrovascular', label: 'Brain' },
  { key: 'renal', label: 'Renal' },
  { key: 'portal', label: 'Portal & gut' },
  { key: 'congenital', label: 'Congenital' },
]

const WILAYAH: Array<{ key: string | null; label: string }> = [
  { key: null, label: 'Whole circulation' },
  { key: 'heart', label: 'Heart' },
  { key: 'coronary', label: 'Coronaries' },
  { key: 'great', label: 'Great vessels' },
  { key: 'pulmonary', label: 'Pulmonary' },
  { key: 'head', label: 'Head & neck' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'leg', label: 'Legs' },
  { key: 'arm', label: 'Arms' },
]

const NAMA_LESI: Record<string, string> = {
  occlusion: 'Occluded', stenosis: 'Narrowed', dilatation: 'Dilated', thrombus: 'Thrombus',
  incompetence: 'Leaking', shunt: 'Shunt', dissection: 'Dissected', hypertrophy: 'Hypertrophied',
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[32px] shrink-0 rounded-full border px-3 text-[11.5px] font-bold transition ${
        aktif
          ? 'border-brand bg-brand text-white'
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

export function CardioLab({ onBukaOrgan, awal = null }: Props) {
  const [kategori, setKategori] = useState<CardioCondition['kategori'] | 'all'>('all')
  const [kondisiId, setKondisiId] = useState<string | null>(awal)
  const [jalurId, setJalurId] = useState<string | null>('systemic')
  const [hr, setHr] = useState(72)
  const [wilayah, setWilayah] = useState<string | null>(null)
  const [struktur, setStruktur] = useState<string | null>(null)

  const kondisi = kondisiId ? CARDIO_CONDITIONS.find((k) => k.id === kondisiId) ?? null : null
  const jalur = jalurId ? FLOW_PATHS.find((j) => j.id === jalurId) ?? null : null

  const daftarKondisi = useMemo(
    () => CARDIO_CONDITIONS.filter((k) => kategori === 'all' || k.kategori === kategori),
    [kategori],
  )

  // Penyakit SKDI yang tertaut, LENGKAP DENGAN LEVEL KOMPETENSINYA — angka itu
  // yang menentukan sejauh mana seorang dokter umum harus bisa menanganinya
  // sendiri, jadi ia bagian dari isinya, bukan hiasan.
  const skdi = useMemo(() => {
    if (!kondisi) return []
    return kondisi.skdi.map((nama) => ({
      nama,
      entri: SKDI_DISEASE_LIST.find((e) => e.disease === nama) ?? null,
    }))
  }, [kondisi])

  const obatKondisi = useMemo(() => (kondisi ? drugsForCondition(kondisi.id) : []), [kondisi])

  const padaStruktur = struktur ? kondisiUntukStruktur(struktur) : []
  const bagianStruktur = struktur ? CARDIO_BY_NAME[struktur.toLowerCase()] : undefined

  function pilihKondisi(k: CardioCondition) {
    const sama = kondisiId === k.id
    setKondisiId(sama ? null : k.id)
    setStruktur(null)
    if (!sama) {
      if (k.jalur) setJalurId(k.jalur)
      // Wilayah dikembalikan ke seluruh sirkulasi: menyorot lesi di bagian
      // tubuh yang sedang disaring keluar akan tampak seperti tidak terjadi apa-apa.
      setWilayah(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-ink dark:text-white">Cardiovascular pathology</h2>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
          {CARDIO_PARTS.length} named vessels and heart structures cut from BodyParts3D. Pick a condition to light up
          the vessel that fails and the tissue that starves, or tap any vessel to see what goes wrong there.
        </p>
      </div>

      <CardioAtlas3D
        lesi={kondisi ? kondisi.lesi.map((l) => l.struktur) : []}
        hilir={kondisi ? kondisi.hilir : []}
        jalur={jalur}
        hr={hr}
        wilayah={wilayah}
        dipilih={struktur}
        onPilih={(n) => { setStruktur(n); if (n) setKondisiId(null) }}
      />

      {/* ── Aliran ─────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Follow the blood</div>
        <div className="-mx-1 mt-1.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <Chip aktif={jalurId === null} onClick={() => setJalurId(null)}>Off</Chip>
          {FLOW_PATHS.map((j) => (
            <Chip key={j.id} aktif={jalurId === j.id} onClick={() => setJalurId(j.id)}>{j.label}</Chip>
          ))}
        </div>
        {jalur && (
          <>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{jalur.ringkas}</p>
            <p className="mt-1 text-[10.5px] text-neutral-400">
              {strukturJalur(jalur).length} structures ·{' '}
              {jalur.oxygen === 'oxygenated' ? 'oxygen-rich (red)'
                : jalur.oxygen === 'portal' ? 'portal blood (violet)' : 'oxygen-poor (blue)'} ·{' '}
              {jalur.pulsatile ? 'pulsatile — flow surges in systole and nearly stops in diastole'
                : 'steady — venous return does not pulse'}
            </p>
            <label className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500">Heart rate</span>
              <input
                type="range" min={40} max={180} value={hr}
                onChange={(e) => setHr(Number(e.target.value))}
                className="min-h-[32px] flex-1 accent-brand"
              />
              <span className="w-16 text-right text-[11px] font-bold tabular-nums text-ink dark:text-white">{hr} bpm</span>
            </label>
          </>
        )}
      </section>

      {/* ── Penyaring wilayah ──────────────────────────────────────────────── */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {WILAYAH.map((w) => (
          <Chip key={w.label} aktif={wilayah === w.key} onClick={() => setWilayah(w.key)}>{w.label}</Chip>
        ))}
      </div>

      {/* ── Struktur yang disentuh ─────────────────────────────────────────── */}
      {struktur && (
        <section className="rounded-xl border border-brand/30 bg-brand/[0.04] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-brand">Structure</div>
              <h3 className="text-sm font-black text-ink dark:text-white">{struktur}</h3>
              {bagianStruktur && (
                <p className="mt-0.5 text-[10.5px] text-neutral-500">
                  {bagianStruktur.kind} · {bagianStruktur.region}
                </p>
              )}
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
                      {peran === 'lesi'
                        ? 'the lesion sits in this structure'
                        : 'this structure starves when that lesion occurs'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-neutral-500">
              No condition in this library is mapped to this structure yet.
            </p>
          )}
        </section>
      )}

      {/* ── Daftar keadaan ─────────────────────────────────────────────────── */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {KATEGORI.map((k) => (
          <Chip key={k.key} aktif={kategori === k.key} onClick={() => setKategori(k.key)}>{k.label}</Chip>
        ))}
      </div>

      <div className="space-y-1.5">
        {daftarKondisi.map((k) => (
          <button
            key={k.id}
            onClick={() => pilihKondisi(k)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
              kondisiId === k.id
                ? 'border-brand bg-brand/[0.05]'
                : 'border-neutral-200 dark:border-white/10'
            }`}
          >
            <span className="block text-xs font-bold text-ink dark:text-white">{k.label}</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{k.ringkas}</span>
          </button>
        ))}
      </div>

      {/* ── Berkas keadaan terpilih ────────────────────────────────────────── */}
      {kondisi && (
        <section className="space-y-2.5 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div>
            <h3 className="text-sm font-black text-ink dark:text-white">{kondisi.label}</h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">{kondisi.ringkas}</p>
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Where it goes wrong</div>
            <ul className="mt-1 space-y-1.5">
              {kondisi.lesi.map((l) => {
                const alir = l.derajat !== undefined ? alirStenosis(l.derajat) : null
                return (
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
                    {alir && (
                      // Angka ini bukan hiasan: ia menjawab kenapa stenosis berat
                      // pun bisa tanpa gejala saat duduk diam.
                      <p className="mt-1 rounded bg-white/70 p-1.5 text-[10.5px] leading-relaxed text-neutral-600 dark:bg-black/20 dark:text-neutral-300">
                        Resting flow <b>{Math.round(alir.istirahat * 100)}%</b> of normal · maximal flow{' '}
                        <b>{alir.maksimal.toFixed(2)}×</b> resting normal · flow reserve <b>{alir.cadangan}×</b>{' '}
                        (healthy ≈ 4×). {alir.istirahat > 0.95
                          ? 'Enough at rest, not enough on exertion.'
                          : 'Resting supply itself has now fallen.'}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {kondisi.hilir.length > 0 && (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-amber-500">What starves downstream</div>
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
            {strukturKondisi(kondisi).length} structures highlighted on the figure. Geometry: BodyParts3D 4.0
            (Database Center for Life Science, CC BY 4.0). Educational material, not a clinical decision tool.
          </p>
        </section>
      )}
    </div>
  )
}

export default CardioLab
