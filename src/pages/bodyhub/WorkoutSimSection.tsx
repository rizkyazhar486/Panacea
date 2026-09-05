import { useEffect, useState } from 'react'
import { LATIHAN, nodesForExercise, groupsForExercise, PERAN_LABEL, type Latihan, type Peran } from '../../lib/exerciseMuscles'
import { api, type AnatomyImage } from '../../lib/api'

// Simulator latihan. Lihat src/lib/exerciseMuscles.ts untuk kenapa peran otot
// dan fase gerakan yang ditonjolkan, bukan sekadar "otot dada menyala".

interface Props {
  /** Menyorot simpul otot pada figur 3D, dan menyalakan lapisan ototnya. */
  onHighlight: (nodeNames: string[]) => void
  /** Menyetel tempo kontraksi figur 3D, repetisi per menit. 0 mematikan. */
  onTempo: (repsPerMinute: number) => void
}

const WARNA: Record<Peran, string> = {
  utama: 'bg-brand/15 text-brand',
  sinergis: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  stabilisator: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
}

/** Foto peragaan NYATA, bukan gambar garis. */
function FotoLatihan({ nama }: { nama: string }) {
  const [img, setImg] = useState<AnatomyImage[] | null>(null)
  useEffect(() => {
    let batal = false
    setImg(null)
    api.anatomyImages(nama, 'exercise')
      .then((r) => { if (!batal) setImg(r.images) })
      .catch(() => { if (!batal) setImg([]) })
    return () => { batal = true }
  }, [nama])

  if (img === null) return <p className="text-xs text-neutral-500">Loading demonstration photos…</p>
  if (!img.length) {
    return (
      <p className="text-xs leading-relaxed text-neutral-500">
        No freely-licensed demonstration photo found for this movement. Nothing is drawn in its place — a wrong
        picture of a lift teaches the wrong position.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {img.slice(0, 4).map((i) => (
        <figure key={i.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
          <img src={i.url} alt={i.title} loading="lazy" className="h-28 w-full bg-white object-contain" />
          {/* Lisensi & pembuat WAJIB tampil — syarat CC. */}
          <figcaption className="p-1.5">
            <a href={i.sourcePage} target="_blank" rel="noreferrer" className="block truncate text-[9.5px] text-neutral-400 underline">
              {i.artist} · {i.license}
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function WorkoutSimSection({ onHighlight, onTempo }: Props) {
  const [aktif, setAktif] = useState<Latihan | null>(null)
  const [jalan, setJalan] = useState(false)
  // Fase yang sedang ditampilkan, digerakkan pemasa sesuai tempo latihannya.
  const [fase, setFase] = useState<'konsentrik' | 'eksentrik'>('konsentrik')

  // Menyorot otot untuk fase yang sedang berjalan. Pada fase konsentrik
  // penggerak utama dan sinergis yang menyala; pada eksentrik penggerak utama
  // saja, karena di situlah ia memanjang di bawah beban dan itulah yang ingin
  // diperlihatkan.
  useEffect(() => {
    if (!aktif) { onHighlight([]); onTempo(0); return }
    const n = nodesForExercise(aktif)
    onHighlight(fase === 'konsentrik' ? [...n.utama, ...n.sinergis] : n.utama)
    // Repetisi per menit dari total tempo satu repetisi.
    const detik = aktif.tempo[0] + aktif.tempo[1]
    onTempo(jalan ? Math.round(60 / detik) : 0)
    // onHighlight/onTempo stabil dari induknya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, fase, jalan])

  // Pemasa fase memakai tempo latihannya sendiri — eksentrik memang lebih
  // lama, dan menyamakan keduanya akan mengajarkan irama yang salah.
  useEffect(() => {
    if (!aktif || !jalan) return
    const ms = (fase === 'konsentrik' ? aktif.tempo[0] : aktif.tempo[1]) * 1000
    const id = setTimeout(() => setFase((f) => (f === 'konsentrik' ? 'eksentrik' : 'konsentrik')), ms)
    return () => clearTimeout(id)
  }, [aktif, jalan, fase])

  const grup = aktif ? groupsForExercise(aktif) : null

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-neutral-400">
        Pick a movement. Its muscles light up on the figure above by ROLE, and the animation runs the two phases at
        the movement’s own tempo — the lowering phase is deliberately slower, because that is how it is actually
        performed and where most of the adaptation happens.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {LATIHAN.map((l) => (
          <button
            key={l.id}
            onClick={() => { setAktif(aktif?.id === l.id ? null : l); setFase('konsentrik') }}
            className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${
              aktif?.id === l.id
                ? 'border-brand bg-brand text-white'
                : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
            }`}
          >
            {l.nama}
          </button>
        ))}
      </div>

      {aktif && grup && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setJalan(!jalan)}
              className={`min-h-[34px] rounded-full px-4 text-xs font-bold transition ${
                jalan ? 'bg-brand text-white' : 'border border-brand text-brand'
              }`}
            >
              {jalan ? '❚❚ Pause' : '▶ Run the movement'}
            </button>
            <span className="text-[11px] text-neutral-400">
              {aktif.pola} · {aktif.tempo[0]}s up / {aktif.tempo[1]}s down
            </span>
          </div>

          {jalan && (
            <div className={`rounded-xl p-2.5 transition-colors ${
              fase === 'konsentrik' ? 'bg-brand/10' : 'bg-amber-50 dark:bg-amber-500/10'
            }`}>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
                {fase === 'konsentrik' ? 'Concentric — lifting' : 'Eccentric — lowering'}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink dark:text-white">
                {fase === 'konsentrik' ? aktif.konsentrik : aktif.eksentrik}
              </p>
            </div>
          )}

          {(['utama', 'sinergis', 'stabilisator'] as Peran[]).map((p) =>
            grup[p].length ? (
              <div key={p}>
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${WARNA[p]}`}>
                    {PERAN_LABEL[p].label}
                  </span>
                  <span className="text-xs font-bold text-ink dark:text-white">{grup[p].join(', ')}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{PERAN_LABEL[p].jelas}</p>
              </div>
            ) : null,
          )}

          <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-500/10">
            <div className="t-mikro font-bold uppercase tracking-wide text-red-600">What goes wrong</div>
            <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{aktif.kesalahan}</p>
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Real demonstration</div>
            <p className="mt-0.5 mb-1.5 text-[11px] text-neutral-400">
              Photographs of people performing the movement, not drawn figures — joint angles are the thing worth
              seeing, and a line drawing cannot show them honestly.
            </p>
            <FotoLatihan nama={aktif.nama} />
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutSimSection
