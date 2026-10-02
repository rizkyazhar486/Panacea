// Validasi geometri & urutan terhadap standar terbitan — hanya MEMERIKSA, tidak memperbaiki.
//
// Rujukan:
// - Engh RA, Huber R. Acta Cryst A 1991;47:392-400 — panjang/sudut ikatan tulang
//   punggung (nilai & σ di bawah). Pencilan = |deviasi| > 4σ (kriteria MolProbity).
// - Bondi A. J Phys Chem 1964;68:441-451 — jari-jari van der Waals.
// - Shrake A, Rupley JA. J Mol Biol 1973;79:351-371 — luas permukaan terakses pelarut.
// - Word JM et al. J Mol Biol 1999;285:1735 — ambang tumpang-tindih 0,4 Å (di sana
//   dengan atom H; di sini atom berat saja, sehingga lebih longgar — didokumentasikan).
import { atomDari, TIGA_KE_SATU, urutanSatuHuruf, type Atom, type Rantai, type Struktur } from './struktur.ts'
import { dihedral, jarak, sudut, volumeBertanda, type V3 } from './geometri.ts'

export const ENGH_HUBER_1991 = {
  ikatan: { 'N-CA': [1.458, 0.019], 'CA-C': [1.525, 0.021], 'C-O': [1.231, 0.02], 'C-N': [1.329, 0.014] },
  sudut: { 'N-CA-C': [111.2, 2.8], 'CA-C-N': [116.2, 2.0], 'C-N-CA': [121.7, 1.8], 'CA-C-O': [120.1, 2.1], 'O-C-N': [122.7, 1.6] },
} as const

export const BONDI_1964: Readonly<Record<string, number>> = { C: 1.7, N: 1.55, O: 1.52, S: 1.8 }

const p = (a: Atom): V3 => [a.x, a.y, a.z]

export interface Pencilan { residu: string; ukuran: string; nilai: number; ideal: number; sigma: number; z: number }

export function periksaTulangPunggung(r: Rantai, ambangSigma = 4) {
  const pencilan: Pencilan[] = []
  const semua: { ukuran: string; z: number }[] = []
  const catat = (res: string, ukuran: string, nilai: number, [ideal, sigma]: readonly [number, number]) => {
    const z = (nilai - ideal) / sigma
    semua.push({ ukuran, z })
    if (Math.abs(z) > ambangSigma) pencilan.push({ residu: res, ukuran, nilai, ideal, sigma, z })
  }
  const E = ENGH_HUBER_1991
  r.residu.forEach((res, i) => {
    const N = atomDari(res, 'N'), CA = atomDari(res, 'CA'), C = atomDari(res, 'C'), O = atomDari(res, 'O')
    const lbl = `${res.nama}${res.seq}`
    if (N && CA) catat(lbl, 'N-CA', jarak(p(N), p(CA)), E.ikatan['N-CA'])
    if (CA && C) catat(lbl, 'CA-C', jarak(p(CA), p(C)), E.ikatan['CA-C'])
    if (C && O) catat(lbl, 'C-O', jarak(p(C), p(O)), E.ikatan['C-O'])
    if (N && CA && C) catat(lbl, 'N-CA-C', sudut(p(N), p(CA), p(C)), E.sudut['N-CA-C'])
    const nx = r.residu[i + 1]
    const Nn = nx && atomDari(nx, 'N'), CAn = nx && atomDari(nx, 'CA')
    // Ikatan peptida hanya bila residu berurutan dan jaraknya memang ikatan (<2 Å; celah rantai dilewati).
    if (C && Nn && nx.seq === res.seq + 1 && jarak(p(C), p(Nn)) < 2) {
      catat(lbl, 'C-N', jarak(p(C), p(Nn)), E.ikatan['C-N'])
      if (CA) catat(lbl, 'CA-C-N', sudut(p(CA), p(C), p(Nn)), E.sudut['CA-C-N'])
      if (O) catat(lbl, 'O-C-N', sudut(p(O), p(C), p(Nn)), E.sudut['O-C-N'])
      if (CAn) catat(lbl, 'C-N-CA', sudut(p(C), p(Nn), p(CAn)), E.sudut['C-N-CA'])
    }
    if (CA && C && O) catat(lbl, 'CA-C-O', sudut(p(CA), p(C), p(O)), E.sudut['CA-C-O'])
  })
  const rmsZ = Math.sqrt(semua.reduce((s, x) => s + x.z * x.z, 0) / (semua.length || 1))
  return { jumlahUkuran: semua.length, pencilan, rmsZ }
}

/**
 * Kiralitas Cα: tanda volume (N−CA)·[(C−CA)×(CB−CA)]. Tanda untuk asam amino-L
 * ditetapkan dari struktur eksperimen berlabel L (lihat gerbang); glisin akiral.
 */
export function kiralitas(r: Rantai) {
  return r.residu.filter((res) => res.nama !== 'GLY').map((res) => {
    const N = atomDari(res, 'N'), CA = atomDari(res, 'CA'), C = atomDari(res, 'C'), CB = atomDari(res, 'CB')
    return { residu: `${res.nama}${res.seq}`, volume: N && CA && C && CB ? volumeBertanda(p(CA), p(N), p(C), p(CB)) : null }
  })
}
/**
 * Asam amino-L memberi volume POSITIF untuk urutan (N, C, CB) di sekitar CA.
 * Ditetapkan dari data, bukan ingatan: pada 1UBI (ubiquitin sintetis dari asam
 * amino-L) 70/70 residu non-glisin bertanda positif; cermin koordinat membalik
 * semuanya (lihat gerbang). Tebakan awal (negatif) salah dan dikoreksi oleh data.
 */
export const TANDA_L = 1

export function phiPsi(r: Rantai) {
  return r.residu.map((res, i) => {
    const pr = r.residu[i - 1], nx = r.residu[i + 1]
    const N = atomDari(res, 'N'), CA = atomDari(res, 'CA'), C = atomDari(res, 'C')
    const Cp = pr && pr.seq === res.seq - 1 ? atomDari(pr, 'C') : undefined
    const Nn = nx && nx.seq === res.seq + 1 ? atomDari(nx, 'N') : undefined
    return {
      residu: `${res.nama}${res.seq}`, ss: res.ss,
      phi: Cp && N && CA && C ? dihedral(p(Cp), p(N), p(CA), p(C)) : null,
      psi: N && CA && C && Nn ? dihedral(p(N), p(CA), p(C), p(Nn)) : null,
    }
  })
}

// Jaringan ikatan kovalen dari jarak (≤1,9 Å; ≤2,1 Å bila melibatkan S).
function grafKovalen(atom: Atom[]) {
  const tetangga = atom.map(() => [] as number[])
  const sel = new Map<string, number[]>()
  const kunci = (a: Atom) => `${Math.floor(a.x / 2.2)},${Math.floor(a.y / 2.2)},${Math.floor(a.z / 2.2)}`
  atom.forEach((a, i) => sel.set(kunci(a), [...(sel.get(kunci(a)) ?? []), i]))
  atom.forEach((a, i) => {
    const [cx, cy, cz] = kunci(a).split(',').map(Number)
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (const j of sel.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) {
      if (j <= i) continue
      const batas = a.elemen === 'S' || atom[j].elemen === 'S' ? 2.1 : 1.9
      if (jarak(p(a), p(atom[j])) <= batas) { tetangga[i].push(j); tetangga[j].push(i) }
    }
  })
  return tetangga
}

export function bentrokan(r: Rantai, ambangTumpang = 0.4) {
  const atom = r.residu.flatMap((x) => x.atom).filter((a) => a.elemen !== 'H')
  const tetangga = grafKovalen(atom)
  const hasil: { a: string; b: string; tumpang: number }[] = []
  for (let i = 0; i < atom.length; i++) {
    // atom dalam ≤3 ikatan dikecualikan (BFS kedalaman 3)
    const dekat = new Set<number>([i]); let depan = [i]
    for (let d = 0; d < 3; d++) { const baru: number[] = []; for (const u of depan) for (const v of tetangga[u]) if (!dekat.has(v)) { dekat.add(v); baru.push(v) }; depan = baru }
    for (let j = i + 1; j < atom.length; j++) {
      if (dekat.has(j)) continue
      const ri = BONDI_1964[atom[i].elemen], rj = BONDI_1964[atom[j].elemen]
      if (!ri || !rj) continue
      const d = jarak(p(atom[i]), p(atom[j]))
      // Pasangan polar N/O pada jarak ikatan-H (≥2,5 Å) bukan bentrokan: tanpa atom H
      // eksplisit, donor–akseptor wajar berjarak < jumlah jari-jari vdW.
      const polar = (e: string) => e === 'N' || e === 'O'
      if (polar(atom[i].elemen) && polar(atom[j].elemen) && d >= 2.5) continue
      const t = ri + rj - d
      if (t > ambangTumpang) hasil.push({ a: `${atom[i].resNama}${atom[i].resSeq}:${atom[i].nama}`, b: `${atom[j].resNama}${atom[j].resSeq}:${atom[j].nama}`, tumpang: t })
    }
  }
  return hasil
}

/** Ikatan-H tulang punggung (hanya jarak N···O ≤ 3,5 Å, |i−j| ≥ 3) — penyederhanaan, bukan DSSP. */
export function ikatanHTulangPunggung(r: Rantai, maks = 3.5) {
  const out: { donor: number; akseptor: number; d: number }[] = []
  for (const a of r.residu) for (const b of r.residu) {
    if (Math.abs(a.seq - b.seq) < 3 || a.nama === 'PRO') continue
    const N = atomDari(a, 'N'), O = atomDari(b, 'O')
    if (N && O) { const d = jarak(p(N), p(O)); if (d <= maks) out.push({ donor: a.seq, akseptor: b.seq, d }) }
  }
  return out
}

/** SASA Shrake–Rupley (probe 1,4 Å, atom berat, jari-jari Bondi), per residu dalam Å². */
export function sasa(r: Rantai, titikBola = 96, probe = 1.4) {
  const atom = r.residu.flatMap((x) => x.atom).filter((a) => BONDI_1964[a.elemen])
  const bola: V3[] = []
  const g = Math.PI * (3 - Math.sqrt(5))
  for (let k = 0; k < titikBola; k++) { const y = 1 - (2 * (k + 0.5)) / titikBola, rr = Math.sqrt(1 - y * y), t = g * k; bola.push([Math.cos(t) * rr, y, Math.sin(t) * rr]) }
  const perResidu = new Map<number, number>()
  for (const a of atom) {
    const R = BONDI_1964[a.elemen] + probe
    const tetangga = atom.filter((b) => b !== a && jarak(p(a), p(b)) < R + BONDI_1964[b.elemen] + probe)
    let terbuka = 0
    for (const s of bola) {
      const q: V3 = [a.x + s[0] * R, a.y + s[1] * R, a.z + s[2] * R]
      if (!tetangga.some((b) => jarak(q, p(b)) < BONDI_1964[b.elemen] + probe)) terbuka++
    }
    perResidu.set(a.resSeq, (perResidu.get(a.resSeq) ?? 0) + (4 * Math.PI * R * R * terbuka) / titikBola)
  }
  return perResidu
}

/** Konsistensi urutan: residu ATOM vs SEQRES, kode standar, cakupan DBREF. */
export function konsistensiUrutan(s: Struktur, r: Rantai) {
  const atomSeq = urutanSatuHuruf(r, 'atom'), seqres = urutanSatuHuruf(r, 'seqres')
  const nonStandar = r.residu.filter((x) => !TIGA_KE_SATU[x.nama]).map((x) => `${x.nama}${x.seq}`)
  const dbref = s.dbref.find((d) => d.rantai === r.id) ?? null
  const celah = r.residu.filter((x, i) => i > 0 && x.seq !== r.residu[i - 1].seq + 1).map((x) => x.seq)
  return {
    atomSeq, seqres, sama: atomSeq === seqres, nonStandar, celah, dbref,
    cakupanDbref: dbref ? r.residu.every((x) => x.seq >= dbref.mulai && x.seq <= dbref.akhir) : false,
  }
}
