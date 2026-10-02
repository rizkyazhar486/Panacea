// Graf modular SINTETIS (bukan data konektom manusia): k komunitas, rapat di dalam,
// jarang antar-komunitas, PRNG deterministik. Untuk menguji AMG pada graf, bukan
// untuk klaim neuroanatomi apa pun.
import { dariTriplet, type CSR } from './amgAgregasi.ts'

export const STATUS_GRAF_SINTETIS = 'synthetic modular graph · not human connectome data' as const

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Laplacian graf + δI (Laplacian "ter-grounding" agar SPD). */
export function laplacianModular(komunitas = 8, ukuran = 60, pDalam = 0.25, pAntar = 0.004, delta = 1e-2, seed = 7): { A: CSR; label: Int32Array; tepi: number } {
  const n = komunitas * ukuran, rnd = mulberry32(seed)
  const label = new Int32Array(n).map((_, i) => Math.floor(i / ukuran))
  const deg = new Float64Array(n)
  const tri: [number, number, number][] = []
  let tepi = 0
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (rnd() < (label[i] === label[j] ? pDalam : pAntar)) { const w = 0.5 + rnd(); tri.push([i, j, -w], [j, i, -w]); deg[i] += w; deg[j] += w; tepi++ }
  }
  for (let i = 0; i < n; i++) tri.push([i, i, deg[i] + delta])
  return { A: dariTriplet(n, tri), label, tepi }
}
