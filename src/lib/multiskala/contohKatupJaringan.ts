// Contoh kopling tiga skala, DUA ARAH (SIMULASI ILUSTRATIF, parameter tak terkalibrasi):
//
//   molekul:  okupansi ligan θ = L / (L + Kd_eff),   Kd_eff = Kd0 · exp(−α·ε)
//             (Kd mekanosensitif: regangan jaringan ε mengubah afinitas — ke BAWAH)
//   sel:      aktivasi a,  da/dt = k_on·(θ + β·ε)·(1 − a) − k_off·a      (ke ATAS dari θ)
//   jaringan: kekakuan E = E0·(1 + γ·a);  regangan ε = σ_beban / E, dihaluskan
//             satu langkah Jacobi dengan tetangga                         (ke ATAS dari a)
//   ε lalu kembali ke molekul dan sel -> umpan balik tertutup.
//
// Ketidakpastian (1-SD) dirambatkan dengan metode delta (turunan orde satu);
// Kd0 membawa ketidakpastian parameter relatif σ_Kd0. Korelasi spasial diabaikan.
//
// Bentuk persamaan standar (isoterm Langmuir/Hill n=1, kinetika aktivasi orde
// satu, Hooke linier). ANGKA-ANGKANYA ILUSTRATIF: bukan parameter katup aorta
// terukur, bukan prediksi pasien, bukan klaim kebaruan.
import { medanBaru, type KontrakKemampuan, type Medan } from './kernelKopling.ts'

export interface ParamContoh {
  lebar: number; tinggi: number
  ligandMaksUM: number            // gradien konsentrasi ligan kiri->kanan (µM)
  kd0UM: number; sigmaKd0Rel: number; alfa: number
  kOn: number; kOff: number; beta: number
  e0kPa: number; gamma: number
  bebanMaksKPa: number            // beban puncak di tengah (profil Gauss)
  hubungkanKeBawah: boolean       // false = matikan ε -> molekul/sel (uji dua arah)
  ambangPerhalusSigma: number
}

export const PARAM_ILUSTRATIF: ParamContoh = {
  lebar: 24, tinggi: 16, ligandMaksUM: 2, kd0UM: 1, sigmaKd0Rel: 0.2, alfa: 8,
  kOn: 0.02, kOff: 0.01, beta: 1.5, e0kPa: 50, gamma: 3, bebanMaksKPa: 12,
  hubungkanKeBawah: true, ambangPerhalusSigma: 0.045,
}

export const STATUS_KEBENARAN = 'simulated · illustrative uncalibrated parameters · not patient-specific · not a clinical prediction' as const

const idx = (x: number, y: number, w: number) => y * w + x

export function bebanAwal(p: ParamContoh): Float64Array {
  const b = new Float64Array(p.lebar * p.tinggi)
  const cx = (p.lebar - 1) / 2, cy = (p.tinggi - 1) / 2, s = Math.max(p.lebar, p.tinggi) / 4
  for (let y = 0; y < p.tinggi; y++) for (let x = 0; x < p.lebar; x++) b[idx(x, y, p.lebar)] = p.bebanMaksKPa * Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s)))
  return b
}

export function modulMolekul(p: ParamContoh): KontrakKemampuan<{ ligand: Float64Array }> {
  return {
    id: 'molecular.binding', versi: '1', skala: 'molecular', dt: 1,
    produces: [{ nama: 'molecular.occupancy', satuan: 'fraction' }],
    consumes: [{ nama: 'tissue.strain', satuan: 'strain' }],
    awal: () => {
      const L = new Float64Array(p.lebar * p.tinggi)
      for (let y = 0; y < p.tinggi; y++) for (let x = 0; x < p.lebar; x++) L[idx(x, y, p.lebar)] = p.ligandMaksUM * (x + 0.5) / p.lebar
      return { ligand: L }
    },
    step: (s, masuk) => {
      const eps = masuk['tissue.strain']
      const out = medanBaru('molecular.occupancy', 'fraction', p.lebar, p.tinggi)
      for (let i = 0; i < out.nilai.length; i++) {
        const e = p.hubungkanKeBawah ? eps.nilai[i] : 0, se = p.hubungkanKeBawah ? eps.sigma[i] : 0
        const L = s.ligand[i], kd = p.kd0UM * Math.exp(-p.alfa * e)
        const theta = L / (L + kd)
        const dThetaDKd = -L / (L + kd) ** 2
        const dThetaDEps = dThetaDKd * (-p.alfa * kd)
        out.nilai[i] = theta
        out.sigma[i] = Math.sqrt((dThetaDEps * se) ** 2 + (dThetaDKd * kd * p.sigmaKd0Rel) ** 2)
      }
      return { state: s, keluaran: [out] }
    },
    mintaPerhalus: (_s, keluar) => {
      const o = keluar[0]
      const sel: number[] = []
      for (let i = 0; i < o.sigma.length; i++) if (o.sigma[i] > p.ambangPerhalusSigma) sel.push(i)
      return sel
    },
  }
}

export function modulSel(p: ParamContoh): KontrakKemampuan<{ a: Float64Array; sa: Float64Array }> {
  return {
    id: 'cellular.activation', versi: '1', skala: 'cellular', dt: 5,
    produces: [{ nama: 'cellular.activation', satuan: 'fraction' }],
    consumes: [{ nama: 'molecular.occupancy', satuan: 'fraction' }, { nama: 'tissue.strain', satuan: 'strain' }],
    awal: () => ({ a: new Float64Array(p.lebar * p.tinggi), sa: new Float64Array(p.lebar * p.tinggi) }),
    step: (s, masuk, dt) => {
      const th = masuk['molecular.occupancy'], eps = masuk['tissue.strain']
      const a = new Float64Array(s.a.length), sa = new Float64Array(s.a.length)
      for (let i = 0; i < a.length; i++) {
        const e = p.hubungkanKeBawah ? eps.nilai[i] : 0, se = p.hubungkanKeBawah ? eps.sigma[i] : 0
        const dorong = p.kOn * (th.nilai[i] + p.beta * e)
        const baru = s.a[i] + dt * (dorong * (1 - s.a[i]) - p.kOff * s.a[i])
        a[i] = Math.min(1, Math.max(0, baru))
        const jA = 1 - dt * (dorong + p.kOff)
        sa[i] = Math.sqrt((jA * s.sa[i]) ** 2 + (p.kOn * (1 - s.a[i]) * dt * th.sigma[i]) ** 2 + (p.kOn * p.beta * (1 - s.a[i]) * dt * se) ** 2)
      }
      const out: Medan = { nama: 'cellular.activation', satuan: 'fraction', lebar: p.lebar, tinggi: p.tinggi, nilai: a, sigma: sa }
      return { state: { a, sa }, keluaran: [out] }
    },
  }
}

export function modulJaringan(p: ParamContoh): KontrakKemampuan<{ beban: Float64Array }> {
  return {
    id: 'tissue.mechanics', versi: '1', skala: 'tissue', dt: 10,
    produces: [{ nama: 'tissue.strain', satuan: 'strain' }, { nama: 'tissue.stiffness', satuan: 'kPa' }],
    consumes: [{ nama: 'cellular.activation', satuan: 'fraction' }],
    awal: () => ({ beban: bebanAwal(p) }),
    step: (s, masuk) => {
      const a = masuk['cellular.activation']
      const E = medanBaru('tissue.stiffness', 'kPa', p.lebar, p.tinggi)
      const lokal = new Float64Array(E.nilai.length), sLokal = new Float64Array(E.nilai.length)
      for (let i = 0; i < E.nilai.length; i++) {
        E.nilai[i] = p.e0kPa * (1 + p.gamma * a.nilai[i])
        E.sigma[i] = p.e0kPa * p.gamma * a.sigma[i]
        lokal[i] = s.beban[i] / E.nilai[i]
        sLokal[i] = Math.abs(s.beban[i] / E.nilai[i] ** 2) * E.sigma[i]
      }
      const eps = medanBaru('tissue.strain', 'strain', p.lebar, p.tinggi)
      for (let y = 0; y < p.tinggi; y++) for (let x = 0; x < p.lebar; x++) {
        let jum = 0, n = 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, yy = y + dy
          if (xx < 0 || yy < 0 || xx >= p.lebar || yy >= p.tinggi) continue
          jum += lokal[idx(xx, yy, p.lebar)]; n++
        }
        const i = idx(x, y, p.lebar)
        eps.nilai[i] = 0.6 * lokal[i] + 0.4 * (jum / n)
        eps.sigma[i] = sLokal[i]
      }
      return { state: s, keluaran: [eps, E] }
    },
  }
}

export function regangAwal(p: ParamContoh): Medan {
  const b = bebanAwal(p)
  const m = medanBaru('tissue.strain', 'strain', p.lebar, p.tinggi)
  for (let i = 0; i < b.length; i++) m.nilai[i] = b[i] / p.e0kPa
  return m
}

export function modulContoh(p: ParamContoh = PARAM_ILUSTRATIF) {
  return [modulMolekul(p), modulSel(p), modulJaringan(p)]
}
