// Panel kopling multi-skala (SIMULASI ILUSTRATIF). Menjalankan kernel kopling di
// peramban atas permintaan dan menampilkan tiga medan (molekul -> sel -> jaringan)
// serta perbandingan dengan kopling ke-bawah dimatikan. Bukan prediksi pasien.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Prosa } from './Prosa'
import { jalankanKopling, rantaiProvenans, rerata, type HasilJalan, type Medan } from '../lib/multiskala/kernelKopling'
import { modulContoh, PARAM_ILUSTRATIF, regangAwal, STATUS_KEBENARAN } from '../lib/multiskala/contohKatupJaringan'

const T_AKHIR = 600

function jalankan(hubungkanKeBawah: boolean): HasilJalan {
  const p = { ...PARAM_ILUSTRATIF, hubungkanKeBawah }
  return jalankanKopling(modulContoh(p), T_AKHIR, [regangAwal(p)])
}

function PetaPanas({ medan, judul, min, maks, perhalus }: { medan: Medan; judul: string; min: number; maks: number; perhalus?: ReadonlySet<number> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const sx = c.width / medan.lebar, sy = c.height / medan.tinggi
    for (let y = 0; y < medan.tinggi; y++) for (let x = 0; x < medan.lebar; x++) {
      const i = y * medan.lebar + x
      const t = Math.min(1, Math.max(0, (medan.nilai[i] - min) / (maks - min || 1)))
      // Skala berurutan satu hue (gelap -> terang) agar terbaca di tema gelap.
      ctx.fillStyle = `hsl(190 70% ${12 + t * 60}%)`
      ctx.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy))
      if (perhalus?.has(i)) { ctx.strokeStyle = 'rgba(251,191,36,.9)'; ctx.lineWidth = 1; ctx.strokeRect(x * sx + 0.5, y * sy + 0.5, sx - 1, sy - 1) }
    }
  }, [medan, min, maks, perhalus])
  return (
    <figure className="min-w-0">
      <canvas ref={ref} width={240} height={160} className="h-auto w-full rounded-lg border border-white/10" aria-label={`${judul} heat map`} data-peta={medan.nama} />
      <figcaption className="mt-1 text-[10px] font-bold text-white/70">
        {judul}<br />mean <span className="tabular-nums" data-rerata={medan.nama}>{rerata(medan.nilai).toFixed(3)}</span> {medan.satuan}
        <span className="text-white/40"> ± {rerata(medan.sigma).toFixed(3)}</span>
      </figcaption>
    </figure>
  )
}

export function PanelKoplingMultiSkala() {
  const [hasil, setHasil] = useState<{ dua: HasilJalan; atas: HasilJalan } | null>(null)
  const [tampil, setTampil] = useState<'dua' | 'atas'>('dua')
  const [ms, setMs] = useState(0)
  const aktif = hasil?.[tampil]
  const perhalus = useMemo(() => new Set<number>(aktif?.perhalus[aktif.perhalus.length - 1]?.sel ?? []), [aktif])
  const rantai = useMemo(() => aktif ? rantaiProvenans(aktif, aktif.pesanTerakhir['tissue.stiffness'].provenans.id).slice(0, 4) : [], [aktif])

  return (
    <section className="dark rounded-[20px] border border-white/10 bg-black/45 p-3 text-white" aria-label="Multi-scale coupling simulation" data-kopling-multiskala>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-black">Multi-scale coupling · molecule → cell → tissue → back</h3>
          <p className="text-[10px] font-bold text-amber-200/80" data-status-kebenaran>{STATUS_KEBENARAN}</p>
        </div>
        <button type="button" className="min-h-11 rounded-full border border-cyan-300/30 px-4 text-[11px] font-black text-cyan-100"
          onClick={() => { const t0 = performance.now(); setHasil({ dua: jalankan(true), atas: jalankan(false) }); setMs(Math.round(performance.now() - t0)) }}>
          {hasil ? 'Run again' : `Run ${T_AKHIR} s simulation`}
        </button>
      </div>
      {aktif && (
        <>
          <div className="mt-2 flex gap-1" role="group" aria-label="Coupling direction">
            {([['dua', 'Two-way'], ['atas', 'Upward only']] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={tampil === k} onClick={() => setTampil(k)}
                className={`min-h-9 rounded-full px-3 text-[10px] font-black ${tampil === k ? 'bg-white text-black' : 'border border-white/15 text-white/70'}`}>{l}</button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <PetaPanas medan={aktif.pesanTerakhir['molecular.occupancy'].medan} judul="Ligand occupancy" min={0} maks={1} perhalus={perhalus} />
            <PetaPanas medan={aktif.pesanTerakhir['cellular.activation'].medan} judul="Cell activation" min={0} maks={1} />
            <PetaPanas medan={aktif.pesanTerakhir['tissue.stiffness'].medan} judul="Tissue stiffness" min={PARAM_ILUSTRATIF.e0kPa} maks={PARAM_ILUSTRATIF.e0kPa * (1 + PARAM_ILUSTRATIF.gamma)} />
          </div>
          <p className="mt-1 text-[10px] text-white/55">
            Amber: flagged for finer modelling · {aktif.jejak.length} messages · {ms} ms
          </p>
          <details className="mt-1 text-[10px] text-white/55">
            <summary className="cursor-pointer font-bold text-white/70">Provenance of the final stiffness field</summary>
            <ol className="mt-1 space-y-0.5 font-mono" data-rantai-provenans>
              {rantai.map((p) => <li key={p.id}>{p.id} · {p.modul} v{p.versi} · step {p.langkah} · t={p.waktu}s · parents {p.induk.length}</li>)}
            </ol>
            <Prosa kelas="mt-1">{'Equations: θ = L/(L+Kd·e^(−αε)); da/dt = k_on(θ+βε)(1−a) − k_off·a; E = E0(1+γa); ε = load/E (smoothed). Uncertainty by first-order (delta-method) propagation. Parameters are illustrative, not measured valve values.'}</Prosa>
          </details>
        </>
      )}
    </section>
  )
}

export default PanelKoplingMultiSkala
