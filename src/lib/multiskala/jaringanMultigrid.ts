// Modul jaringan alternatif: keseimbangan mekanik −∇·(E ∇w) = beban diselesaikan
// dengan multigrid geometrik pada grid simpul 33×33, dipasangkan ke grid sel 24×16
// modul lain lewat interpolasi bilinier (antar-resolusi). Regangan = |∇w|.
// SIMULASI ILUSTRATIF (model skalar/antiplane, bukan elastisitas 3D katup).
import { medanBaru, type KontrakKemampuan, type Medan } from './kernelKopling.ts'
import { selesaikan } from './multigrid.ts'
import { bebanAwal, type ParamContoh } from './contohKatupJaringan.ts'

const N = 33

function sampel(v: Float64Array, w: number, h: number, x: number, y: number) {
  // (x,y) dalam [0,1]² -> pusat sel grid w×h
  const fx = Math.min(w - 1, Math.max(0, x * w - 0.5)), fy = Math.min(h - 1, Math.max(0, y * h - 0.5))
  const i0 = Math.floor(fx), j0 = Math.floor(fy), i1 = Math.min(i0 + 1, w - 1), j1 = Math.min(j0 + 1, h - 1), a = fx - i0, b = fy - j0
  return (1 - a) * (1 - b) * v[j0 * w + i0] + a * (1 - b) * v[j0 * w + i1] + (1 - a) * b * v[j1 * w + i0] + a * b * v[j1 * w + i1]
}

export interface StatusMg { siklus: number; residualRelatif: number }

export function modulJaringanMultigrid(p: ParamContoh): KontrakKemampuan<{ beban: Float64Array; terakhir: StatusMg | null }> {
  return {
    id: 'tissue.mechanics.multigrid', versi: '1', skala: 'tissue', dt: 10,
    produces: [{ nama: 'tissue.strain', satuan: 'strain' }, { nama: 'tissue.stiffness', satuan: 'kPa' }],
    consumes: [{ nama: 'cellular.activation', satuan: 'fraction' }],
    awal: () => ({ beban: bebanAwal(p), terakhir: null }),
    step: (s, masuk) => {
      const a = masuk['cellular.activation']
      const E: Medan = medanBaru('tissue.stiffness', 'kPa', p.lebar, p.tinggi)
      for (let i = 0; i < E.nilai.length; i++) { E.nilai[i] = p.e0kPa * (1 + p.gamma * a.nilai[i]); E.sigma[i] = p.e0kPa * p.gamma * a.sigma[i] }
      // Ke grid simpul multigrid (domain satuan, sisi luar terjepit w=0).
      const k = new Float64Array(N * N), f = new Float64Array(N * N)
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = i / (N - 1), y = j / (N - 1)
        k[j * N + i] = sampel(E.nilai, p.lebar, p.tinggi, x, y)
        f[j * N + i] = sampel(s.beban, p.lebar, p.tinggi, x, y)
      }
      const hasil = selesaikan({ n: N, h: 1 / (N - 1), k }, f, 1e-8)
      const w = hasil.u
      // Kembali ke grid sel: |∇w| di pusat sel (beda hingga pada grid simpul).
      const eps = medanBaru('tissue.strain', 'strain', p.lebar, p.tinggi)
      for (let j = 0; j < p.tinggi; j++) for (let i = 0; i < p.lebar; i++) {
        const X = ((i + 0.5) / p.lebar) * (N - 1), Y = ((j + 0.5) / p.tinggi) * (N - 1)
        const i0 = Math.min(N - 2, Math.floor(X)), j0 = Math.min(N - 2, Math.floor(Y))
        const gx = (w[j0 * N + i0 + 1] - w[j0 * N + i0] + w[(j0 + 1) * N + i0 + 1] - w[(j0 + 1) * N + i0]) / 2 * (N - 1)
        const gy = (w[(j0 + 1) * N + i0] - w[j0 * N + i0] + w[(j0 + 1) * N + i0 + 1] - w[j0 * N + i0 + 1]) / 2 * (N - 1)
        const c = j * p.lebar + i
        eps.nilai[c] = Math.hypot(gx, gy)
        // Ketidakpastian orde satu: w ∝ 1/E  ->  σε ≈ ε · σE/E.
        eps.sigma[c] = eps.nilai[c] * (E.sigma[c] / E.nilai[c])
      }
      return { state: { beban: s.beban, terakhir: { siklus: hasil.siklus, residualRelatif: hasil.residualRelatif } }, keluaran: [eps, E] }
    },
  }
}

// ── Slot korektor residual terlatih (gaya HMgNO) ────────────────────────────
// Operator saraf (FNO/DeepONet/GNO) belum dilatih di repo ini — tidak ada backend
// pelatihan. Slot ini ada agar korektor nyata dapat dipasang kelak; sampai itu,
// mode hibrida GAGAL TERTUTUP, dan tidak ada korektor identitas yang menyamar.
export interface KorektorResidual {
  id: string
  versi: string
  /** Wajib: identitas artefak terlatih (hash bobot) + data latih; tanpa ini ditolak. */
  artefak: { sha256: string; dataLatih: string; metrikValidasi: Record<string, number> }
  koreksi: (uRendah: Float64Array, residual: Float64Array, konteks: Readonly<Record<string, Float64Array>>) => Float64Array
}

const korektor = new Map<string, KorektorResidual>()

export function daftarkanKorektor(k: KorektorResidual) {
  if (!/^[0-9a-f]{64}$/.test(k.artefak?.sha256 ?? '')) throw new Error('trained corrector must declare its weight artefact sha256')
  if (!k.artefak.dataLatih?.trim()) throw new Error('trained corrector must declare its training data provenance')
  if (!Object.keys(k.artefak.metrikValidasi ?? {}).length) throw new Error('trained corrector must declare validation metrics')
  korektor.set(k.id, k)
}

export function ambilKorektor(id: string): KorektorResidual {
  const k = korektor.get(id)
  if (!k) throw new Error(`no trained residual corrector registered for ${id}; hybrid (HMgNO-style) mode is unavailable`)
  return k
}
