// Protein nyata resolusi residu: ubiquitin manusia (PDB 1UBI). Jejak Cα, diputar
// dengan seret/slider, diwarnai anotasi HELIX/SHEET penyimpan; validasi dihitung
// langsung dari berkas. Struktur rujukan eksperimen — bukan protein pasien.
import { useEffect, useMemo, useState } from 'react'
import { parsePdb, urutanSatuHuruf, type Struktur } from '../lib/molekul/struktur'
import { periksaTulangPunggung, kiralitas, TANDA_L, bentrokan, sasa } from '../lib/molekul/validasi'

const WARNA = { helix: '#f472b6', sheet: '#facc15', loop: '#94a3b8' } as const

export function PanelUbiquitin() {
  const [s, setS] = useState<Struktur | null>(null)
  const [galat, setGalat] = useState('')
  const [sudut, setSudut] = useState(30)
  const [sorot, setSorot] = useState<number | null>(48)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}molekul/1ubi.pdb`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text() }).then((t) => setS(parsePdb(t))).catch(() => setGalat('Structure file could not be loaded.'))
  }, [])
  const r = s?.rantai[0]
  const ringkas = useMemo(() => {
    if (!r) return null
    const b = periksaTulangPunggung(r), k = kiralitas(r), sa = sasa(r, 48)
    let tot = 0; for (const v of sa.values()) tot += v
    return { pencilan: b.pencilan.length, ukuran: b.jumlahUkuran, L: k.filter((x) => x.volume !== null && Math.sign(x.volume) === TANDA_L).length, nonGly: k.length, kontak: bentrokan(r).length, sasa: Math.round(tot), sasaRes: sa }
  }, [r])
  const titik = useMemo(() => {
    if (!r) return []
    const ca = r.residu.map((x) => ({ res: x, a: x.atom.find((y) => y.nama === 'CA')! })).filter((x) => x.a)
    const c = ca.reduce((m, x) => [m[0] + x.a.x / ca.length, m[1] + x.a.y / ca.length, m[2] + x.a.z / ca.length], [0, 0, 0])
    const th = (sudut * Math.PI) / 180
    return ca.map(({ res, a }) => {
      const x = a.x - c[0], y = a.y - c[1], z = a.z - c[2]
      return { res, X: x * Math.cos(th) + z * Math.sin(th), Y: -y, Z: -x * Math.sin(th) + z * Math.cos(th) }
    })
  }, [r, sudut])
  if (galat) return <p className="text-[11px] text-amber-300">{galat}</p>
  if (!s || !r || !ringkas) return <p className="text-[11px] text-white/50" role="status">Loading PDB 1UBI…</p>
  const skala = 7, W = 300, H = 220
  const pilih = sorot !== null ? r.residu.find((x) => x.seq === sorot) : undefined
  return (
    <section className="dark rounded-[20px] border border-white/10 bg-black/45 p-3 text-white" aria-label="Human ubiquitin at residue resolution" data-panel-ubiquitin>
      <h3 className="text-xs font-black">Human ubiquitin · 76 residues · PDB {s.idPdb}</h3>
      <p className="text-[10px] font-bold text-emerald-200/80" data-sumber-struktur>experimental X-ray {s.resolusiA} Å · UniProt {s.dbref[0]?.aksesi} · reference structure, not patient-specific</p>
      <svg viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} className="mt-2 w-full touch-none rounded-lg border border-white/10 bg-black/40" role="img" aria-label="C-alpha trace"
        onPointerMove={(e) => { if (e.buttons) setSudut((v) => (v + e.movementX) % 360) }} data-jejak-ca>
        {titik.slice(1).map((p, i) => {
          const q = titik[i]
          return <line key={p.res.seq} x1={q.X * skala} y1={q.Y * skala} x2={p.X * skala} y2={p.Y * skala} stroke={WARNA[p.res.ss]} strokeWidth={p.res.ss === 'loop' ? 2 : 4} strokeLinecap="round" opacity={0.55 + 0.45 * ((p.Z + 20) / 40)} />
        })}
        {titik.map((p) => (
          <circle key={`c${p.res.seq}`} cx={p.X * skala} cy={p.Y * skala} r={p.res.seq === sorot ? 5 : 1.6} fill={p.res.seq === sorot ? '#22d3ee' : WARNA[p.res.ss]} onClick={() => setSorot(p.res.seq)} data-residu={p.res.seq} />
        ))}
      </svg>
      <input type="range" min={0} max={359} value={Math.round((sudut + 360) % 360)} onChange={(e) => setSudut(Number(e.target.value))} aria-label="Rotate structure" className="mt-1 w-full" />
      <p className="text-[10px] text-white/70" data-residu-terpilih>
        {pilih ? `${pilih.nama} ${pilih.seq} · ${pilih.ss} · ${Math.round(ringkas.sasaRes.get(pilih.seq) ?? 0)} Å² exposed` : 'Tap a residue'}
      </p>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 text-[10px] text-white/70" data-validasi-struktur>
        <dt>Backbone vs Engh & Huber</dt><dd className="tabular-nums">{ringkas.pencilan} outliers / {ringkas.ukuran}</dd>
        <dt>L-chirality</dt><dd className="tabular-nums">{ringkas.L}/{ringkas.nonGly}</dd>
        <dt>Mild contacts (&lt;0.8 Å)</dt><dd className="tabular-nums">{ringkas.kontak}</dd>
        <dt>Solvent-accessible</dt><dd className="tabular-nums">{ringkas.sasa} Å²</dd>
      </dl>
      <p className="mt-1 break-all font-mono text-[9px] text-white/45">{urutanSatuHuruf(r)}</p>
    </section>
  )
}

export default PanelUbiquitin
