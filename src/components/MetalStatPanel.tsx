import type { Angka } from './PanelAngka'
import { Garis } from './PanelAngka'
import { NADA } from './PanelAngka'
import '../styles/metal.css'

// Versi berwarna dari PanelAngka, KHUSUS untuk halaman Fitness/Training —
// PanelAngka sendiri dipakai juga oleh Nutrition & Body Hub dan sengaja
// dibiarkan netral di sana. Angka dan artinya sama persis (dihitung oleh
// pemanggil, bukan di sini); yang berubah hanya kartunya.
const EMBOSS: Record<string, string> = {
  [NADA.netral]: 'metal-emboss',
  [NADA.baik]: 'metal-emboss-green',
  [NADA.perhatian]: 'metal-emboss-gold',
  [NADA.jantung]: 'metal-emboss-red',
  [NADA.biru]: 'metal-emboss', // no dedicated blue emboss yet; falls back to silver-white
}

const LINE_TONE: Record<string, string> = {
  [NADA.netral]: 'text-white/70',
  [NADA.baik]: 'text-emerald-300',
  [NADA.perhatian]: 'text-amber-300',
  [NADA.jantung]: 'text-rose-300',
  [NADA.biru]: 'text-sky-300',
}

export function MetalStatPanel({ angka, maks = 4 }: { angka: Angka[]; maks?: number }) {
  if (!angka.length) return null
  return (
    <div className="metal-forge flex gap-2 overflow-hidden rounded-2xl p-3">
      {angka.slice(0, maks).map((a) => (
        <div key={a.label} className="relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl bg-white/[0.05] p-2.5">
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-white/50">{a.label}</span>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-1">
            <span className={`text-[20px] font-black leading-none tabular-nums ${EMBOSS[a.nada] ?? 'metal-emboss'}`}>{a.nilai}</span>
            {a.satuan && <span className="truncate text-[9px] font-bold text-white/40">{a.satuan}</span>}
          </span>
          {a.deret && <Garis deret={a.deret} kelas={LINE_TONE[a.nada] ?? 'text-white/60'} />}
        </div>
      ))}
    </div>
  )
}
