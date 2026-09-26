// Mesin klasifikasi ISNCSCI (edukasi). Sumber tunggal: Kirshblum SC dkk.
// "International standards for neurological classification of spinal cord
// injury (Revised 2011)". J Spinal Cord Med 2011;34(6):535-46.
// PMID 22330108, PMC3232636, doi:10.1179/204577211X13207446293695.
//
// Revisi 2019 (Rupp R dkk., Top Spinal Cord Inj Rehabil 2021;27(2):1-22,
// doi:10.46292/sci2702-1) mengubah beberapa aturan (antara lain cakupan ZPP
// dan notasi non-SCI). Teks lengkapnya tidak dapat diakses saat ditulis, jadi
// perubahan itu SENGAJA tidak dikodekan dari ingatan: hasil ditandai "2011".
//
// Batas: mesin ini mengklasifikasikan pola pemeriksaan yang DIKETIK pengguna.
// Ia bukan diagnosis, tidak melihat pasien, dan gagal-tertutup: skor NT atau
// data yang hilang menghasilkan "tidak dapat ditentukan", bukan tebakan.

export const REVISI_ISNCSCI = '2011' as const
export const SUMBER_ISNCSCI = {
  sitasi: 'Kirshblum SC et al. J Spinal Cord Med 2011;34(6):535-46',
  pmid: '22330108', doi: '10.1179/204577211X13207446293695',
} as const

/** 28 dermatom kunci C2..S4-5 (urutan rostral → kaudal). */
export const DERMATOM = ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4-5'] as const
export type Segmen = typeof DERMATOM[number]
/** 10 miotom kunci (C5-T1, L2-S1) dan fungsi otot kuncinya menurut sumber. */
export const OTOT_KUNCI = {
  C5: 'Elbow flexors', C6: 'Wrist extensors', C7: 'Elbow extensors', C8: 'Finger flexors (middle finger, FDP)', T1: 'Small finger abductors',
  L2: 'Hip flexors', L3: 'Knee extensors', L4: 'Ankle dorsiflexors', L5: 'Long toe extensors', S1: 'Ankle plantar flexors',
} as const
export type Miotom = keyof typeof OTOT_KUNCI
export const MIOTOM = Object.keys(OTOT_KUNCI) as Miotom[]

export type SkorSensori = 0 | 1 | 2 | 'NT'
export type SkorMotor = 0 | 1 | 2 | 3 | 4 | 5 | '5*' | 'NT'
export interface Sisi { rabaan: Record<Segmen, SkorSensori>; tusukan: Record<Segmen, SkorSensori>; motor: Record<Miotom, SkorMotor> }
export interface Pemeriksaan {
  kanan: Sisi; kiri: Sisi
  /** Kontraksi anus volunter. */ vac: boolean | null
  /** Tekanan anal dalam. */ dap: boolean | null
  /** Ada defisit terdokumentasi sebelumnya (syarat AIS E). */ defisitSebelumnya?: boolean
}

/** Urutan penuh untuk level: C1 lalu 28 dermatom; 'INT' = utuh seluruhnya. */
const URUT: readonly string[] = ['C1', ...DERMATOM]
export type Level = string // 'C1'..'S4-5' | 'INT'
const idx = (l: Level) => (l === 'INT' ? URUT.length : URUT.indexOf(l))

export type Hasil<T> = { ok: true; nilai: T } | { ok: false; alasan: string }
const gagal = (alasan: string): { ok: false; alasan: string } => ({ ok: false, alasan })

const normalMotor = (g: SkorMotor) => g === 5 || g === '5*'
const angkaMotor = (g: SkorMotor): number => (g === '5*' ? 5 : g === 'NT' ? NaN : g)

/** Level sensori satu sisi: dermatom paling kaudal yang utuh (2) untuk raba DAN tusuk, dengan semua di atasnya utuh. */
export function levelSensori(s: Sisi): Hasil<Level> {
  for (let i = 0; i < DERMATOM.length; i++) {
    const d = DERMATOM[i], a = s.rabaan[d], b = s.tusukan[d]
    if (a === 'NT' || b === 'NT') return gagal(`${d} not testable — sensory level cannot be determined`)
    if (a < 2 || b < 2) return { ok: true, nilai: URUT[i] } // segmen di atasnya (C1 bila C2 abnormal)
  }
  return { ok: true, nilai: 'INT' }
}

/**
 * Level motor satu sisi. Otot kunci: level = otot terendah bernilai ≥3 dengan
 * semua otot di atasnya 5. Segmen tanpa miotom yang dapat diuji (C1-C4,
 * T2-L1, S2-S5): diasumsikan sama dengan sensori (utuh bila dermatomnya utuh).
 */
export function levelMotor(s: Sisi): Hasil<Level> {
  for (let i = 1; i < URUT.length; i++) {
    const seg = URUT[i] as Segmen
    if (seg in OTOT_KUNCI) {
      const g = s.motor[seg as Miotom]
      if (g === 'NT') return gagal(`${seg} key muscle not testable — motor level cannot be determined`)
      if (normalMotor(g)) continue
      return { ok: true, nilai: angkaMotor(g) >= 3 ? seg : URUT[i - 1] }
    }
    const a = s.rabaan[seg], b = s.tusukan[seg]
    if (a === 'NT' || b === 'NT') return gagal(`${seg} not testable — motor level cannot be presumed from sensation`)
    if (a < 2 || b < 2) return { ok: true, nilai: URUT[i - 1] }
  }
  return { ok: true, nilai: 'INT' }
}

export interface Klasifikasi {
  revisi: typeof REVISI_ISNCSCI
  sensori: { kanan: Level; kiri: Level }
  motor: { kanan: Level; kiri: Level }
  nli: Level
  lengkap: boolean
  /** 'tidak-berlaku' = utuh tanpa defisit sebelumnya: skala AIS tidak dipakai. */
  ais: 'A' | 'B' | 'C' | 'D' | 'E' | 'tidak-berlaku'
  alasanAis: string
  /** Hanya AIS A; lainnya 'NA'. */
  zpp: { sensoriKanan: Level; sensoriKiri: Level; motorKanan: Level; motorKiri: Level } | 'NA'
  skor: { uemsKanan: number; uemsKiri: number; lemsKanan: number; lemsKiri: number; rabaan: number; tusukan: number } | null
}

const S45: Segmen = 'S4-5'

export function klasifikasiIsncsci(p: Pemeriksaan): Hasil<Klasifikasi> {
  const sk = levelSensori(p.kanan), si = levelSensori(p.kiri), mk = levelMotor(p.kanan), mi = levelMotor(p.kiri)
  for (const h of [sk, si, mk, mi]) if (!h.ok) return h
  const L = { sk: (sk as { nilai: Level }).nilai, si: (si as { nilai: Level }).nilai, mk: (mk as { nilai: Level }).nilai, mi: (mi as { nilai: Level }).nilai }
  const nli = [L.sk, L.si, L.mk, L.mi].reduce((a, b) => (idx(b) < idx(a) ? b : a))

  // Langkah 4: lengkap bila VAC = tidak, semua skor sensori S4-5 = 0, dan DAP = tidak.
  if (p.vac === null || p.dap === null) return gagal('Anal examination (VAC and DAP) not recorded — completeness cannot be determined')
  const sakral = [p.kanan.rabaan[S45], p.kanan.tusukan[S45], p.kiri.rabaan[S45], p.kiri.tusukan[S45]]
  if (sakral.includes('NT')) return gagal('S4-5 not testable — completeness cannot be determined')
  const sensoriSakral = sakral.some((x) => x !== 0) || p.dap
  const lengkap = !p.vac && !sensoriSakral

  const semuaNormal = nli === 'INT'
  let ais: Klasifikasi['ais']; let alasanAis: string
  if (semuaNormal) {
    ais = p.defisitSebelumnya ? 'E' : 'tidak-berlaku'
    alasanAis = p.defisitSebelumnya ? 'All tested segments normal after documented prior deficits.' : 'Neurologically intact on this exam: the AIS does not apply without a documented injury.'
  } else if (lengkap) {
    ais = 'A'; alasanAis = 'No sacral sparing: VAC absent, S4-5 light touch and pin prick 0, DAP absent.'
  } else {
    // Motor tidak lengkap: VAC, ATAU sparing sensori sakral + fungsi motor >3 level di bawah level motor sisi itu.
    const motorJauh = (s: Sisi, lv: Level) => MIOTOM.some((m) => idx(m) > idx(lv) + 3 && angkaMotor(s.motor[m] as Exclude<SkorMotor, 'NT'>) > 0)
    const motorTakLengkap = p.vac || (sensoriSakral && (motorJauh(p.kanan, L.mk) || motorJauh(p.kiri, L.mi)))
    if (!motorTakLengkap) {
      ais = 'B'; alasanAis = 'Sacral sensory sparing without motor function more than three levels below the motor level (key muscles only; non-key muscles are not entered here).'
    } else {
      const bawah = MIOTOM.filter((m) => idx(m) > idx(nli)).flatMap((m) => [p.kanan.motor[m], p.kiri.motor[m]])
      if (bawah.length === 0) return gagal('No key muscles below the neurological level — C vs D cannot be determined')
      const kuat = bawah.filter((g) => angkaMotor(g as Exclude<SkorMotor, 'NT'>) >= 3).length
      ais = kuat * 2 >= bawah.length ? 'D' : 'C'
      alasanAis = `${p.vac ? 'Voluntary anal contraction present' : 'Sacral sensory sparing with motor function >3 levels below the motor level'}; ${kuat}/${bawah.length} key muscle functions below the NLI graded ≥3.`
    }
  }

  let zpp: Klasifikasi['zpp'] = 'NA'
  if (ais === 'A') {
    const zSens = (s: Sisi, lv: Level) => {
      let z = lv
      for (const d of DERMATOM) if (idx(d) > idx(lv) && ((s.rabaan[d] as number) > 0 || (s.tusukan[d] as number) > 0)) z = d
      return z
    }
    const zMot = (s: Sisi, lv: Level) => {
      let z = lv
      for (const m of MIOTOM) if (idx(m) > idx(lv) && angkaMotor(s.motor[m] as Exclude<SkorMotor, 'NT'>) > 0) z = m
      return z
    }
    zpp = { sensoriKanan: zSens(p.kanan, L.sk), sensoriKiri: zSens(p.kiri, L.si), motorKanan: zMot(p.kanan, L.mk), motorKiri: zMot(p.kiri, L.mi) }
  }

  // Skor: tidak dihitung bila ada satu pun NT (sesuai sumber).
  const semua = [p.kanan, p.kiri].flatMap((s) => [...Object.values(s.rabaan), ...Object.values(s.tusukan), ...Object.values(s.motor)])
  const jml = (xs: Array<SkorMotor | SkorSensori>) => xs.reduce<number>((a, x) => a + (x === '5*' ? 5 : (x as number)), 0)
  const atas: Miotom[] = ['C5', 'C6', 'C7', 'C8', 'T1'], bwh: Miotom[] = ['L2', 'L3', 'L4', 'L5', 'S1']
  const skor = semua.includes('NT') ? null : {
    uemsKanan: jml(atas.map((m) => p.kanan.motor[m])), uemsKiri: jml(atas.map((m) => p.kiri.motor[m])),
    lemsKanan: jml(bwh.map((m) => p.kanan.motor[m])), lemsKiri: jml(bwh.map((m) => p.kiri.motor[m])),
    rabaan: jml([...Object.values(p.kanan.rabaan), ...Object.values(p.kiri.rabaan)]),
    tusukan: jml([...Object.values(p.kanan.tusukan), ...Object.values(p.kiri.tusukan)]),
  }

  return { ok: true, nilai: { revisi: REVISI_ISNCSCI, sensori: { kanan: L.sk, kiri: L.si }, motor: { kanan: L.mk, kiri: L.mi }, nli, lengkap, ais, alasanAis, zpp, skor } }
}

/**
 * Pembangun sisi dari pola sederhana (untuk kasus latihan dan UI ringkas):
 * sensori utuh (2) sampai `utuhSampai`, lalu `bawah` untuk dermatom kaudal;
 * nilai motor per miotom diberikan eksplisit.
 */
export function sisiDariPola(utuhSampai: Level, bawah: 0 | 1, motor: Record<Miotom, SkorMotor>, ubah: Partial<Record<Segmen, SkorSensori>> = {}): Sisi {
  const r = {} as Record<Segmen, SkorSensori>
  for (const d of DERMATOM) r[d] = ubah[d] ?? (idx(d) <= idx(utuhSampai) ? 2 : bawah)
  return { rabaan: { ...r }, tusukan: { ...r }, motor: { ...motor } }
}

/** Nilai motor: 5 hingga (dan termasuk) `normalSampai`, lalu `sisa`, dengan pengecualian. */
export function motorDariPola(normalSampai: Level, sisa: SkorMotor, ubah: Partial<Record<Miotom, SkorMotor>> = {}): Record<Miotom, SkorMotor> {
  const m = {} as Record<Miotom, SkorMotor>
  for (const k of MIOTOM) m[k] = ubah[k] ?? (idx(k) <= idx(normalSampai) ? 5 : sisa)
  return m
}
