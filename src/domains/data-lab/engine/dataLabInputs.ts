/**
 * Masukan Data Lab Advanced. Halaman memakai `Number(x) || 0` untuk PhenoAge, rasio omega, dan kurva suplemen: kolom kosong
 * menjadi 0 diam-diam. PhenoAge juga menyalin rumus Levine 2018 secara inline dengan koefisien dibulatkan dan CRP dalam mg/L
 * (rumus terbitan memakai ln CRP dalam mg/dL), sehingga hasilnya berbeda dari mesin kanonik `lib/longevity.phenoAge` yang
 * sudah memvalidasi rentang dan satuan. Modul ini memberi halaman satu jalur: teks kolom → validasi → mesin kanonik.
 * Rentang adalah kewajaran masukan, bukan batas diagnostik.
 */
import { konversi, phenoAge, type HasilPhenoAge } from '../../../lib/longevity'

export type Hasil<T> = { ok: true; data: T } | { ok: false; alasan: string }

const angka = (t: unknown): number => (typeof t === 'string' && t.trim() !== '' ? Number(t) : Number.NaN)

export const PHENOAGE_KOLOM = [
  { key: 'usia', label: 'Chronological age' },
  { key: 'albuminGL', label: 'Albumin (g/L)' },
  { key: 'kreatininUmolL', label: 'Creatinine (µmol/L)' },
  { key: 'glukosaMmolL', label: 'Glucose (mmol/L)' },
  { key: 'crpMgL', label: 'CRP (mg/L)' },
  { key: 'limfositPersen', label: 'Lymphocyte %' },
  { key: 'mcvFL', label: 'MCV (fL)' },
  { key: 'rdwPersen', label: 'RDW (%)' },
  { key: 'alpUL', label: 'Alk. Phosphatase (U/L)' },
  { key: 'wbcRibu', label: 'WBC (1000/µL)' },
] as const
export type KolomPhenoAge = (typeof PHENOAGE_KOLOM)[number]['key']
export type TeksPhenoAge = Record<KolomPhenoAge, string>

/** Kolom kosong atau bukan angka = hilang (bukan 0). CRP diubah mg/L → mg/dL; rentang dan rumus dari `lib/longevity`. */
export function hitungPhenoAgeDariTeks(t: TeksPhenoAge): Hasil<HasilPhenoAge> {
  const nilai = {} as Record<KolomPhenoAge, number>
  const hilang: string[] = []
  for (const { key, label } of PHENOAGE_KOLOM) {
    const n = angka(t?.[key])
    if (Number.isFinite(n)) nilai[key] = n
    else hilang.push(label)
  }
  if (hilang.length) return { ok: false, alasan: `Missing or not a number: ${hilang.join('; ')}` }
  return phenoAge({
    usia: nilai.usia, albuminGL: nilai.albuminGL, kreatininUmolL: nilai.kreatininUmolL, glukosaMmolL: nilai.glukosaMmolL,
    crpMgdL: konversi.crpMgLKeMgdL(nilai.crpMgL), limfositPersen: nilai.limfositPersen, mcvFL: nilai.mcvFL,
    rdwPersen: nilai.rdwPersen, alpUL: nilai.alpUL, wbcRibu: nilai.wbcRibu,
  })
}

export const OMEGA = { omega6Mg: { min: 0, max: 100_000 }, omega3Mg: { min: 0.001, max: 50_000 } } as const
export interface HasilOmega { ratio: number; pita: 'Favorable' | 'Moderate' | 'High (pro-inflammatory tilt)'; nada: 'brand' | 'low' | 'critical' }

/** Rasio omega-6:omega-3 (mg/hari). Omega-3 harus > 0: sebelumnya kosong menjadi 0 dan penyebut dipaksa 1 ("12000 : 1"). */
export function rasioOmega(o6: string, o3: string): Hasil<HasilOmega> {
  const a = angka(o6)
  const b = angka(o3)
  if (!Number.isFinite(a) || a < OMEGA.omega6Mg.min || a > OMEGA.omega6Mg.max) return { alasan: `Omega-6: ${OMEGA.omega6Mg.min} to ${OMEGA.omega6Mg.max} mg/day`, ok: false }
  if (!Number.isFinite(b) || b < OMEGA.omega3Mg.min || b > OMEGA.omega3Mg.max) return { alasan: `Omega-3: ${OMEGA.omega3Mg.min} to ${OMEGA.omega3Mg.max} mg/day`, ok: false }
  const ratio = a / b
  const pita = ratio <= 4 ? { pita: 'Favorable', nada: 'brand' } as const : ratio <= 10 ? { pita: 'Moderate', nada: 'low' } as const : { pita: 'High (pro-inflammatory tilt)', nada: 'critical' } as const
  return { ok: true, data: { ratio, ...pita } }
}

export const SUPLEMEN = { doseMg: { min: 0.001, max: 20_000 }, jam: { min: 0, max: 24 }, paruhJam: { min: 0.1, max: 500 }, nama: { max: 40 } } as const
export interface TeksSuplemen { nama: string; doseMg: string; jam: string; paruhJam: string }
export interface Suplemen { name: string; doseMg: number; timeHour: number; halfLifeH: number }

/** `masalah` dikunci per kolom (nama, doseMg, jam, paruhJam). Waktu paruh kosong dulu menjadi 1 jam diam-diam. */
export function periksaSuplemen(t: TeksSuplemen): { ok: true; nilai: Suplemen } | { ok: false; masalah: Partial<Record<keyof TeksSuplemen, string>> } {
  const masalah: Partial<Record<keyof TeksSuplemen, string>> = {}
  const nama = typeof t?.nama === 'string' ? t.nama.trim() : ''
  if (!nama) masalah.nama = 'Name: required'
  else if (nama.length > SUPLEMEN.nama.max) masalah.nama = `Name: at most ${SUPLEMEN.nama.max} characters`
  const cek = (k: 'doseMg' | 'jam' | 'paruhJam', label: string, r: { min: number; max: number }) => {
    const n = angka(t?.[k])
    if (!Number.isFinite(n)) masalah[k] = `${label}: enter a number`
    else if (n < r.min || n > r.max) masalah[k] = `${label}: ${r.min} to ${r.max}`
    return n
  }
  const dose = cek('doseMg', 'Dose (mg)', SUPLEMEN.doseMg)
  const jam = cek('jam', 'Hour taken', SUPLEMEN.jam)
  const paruh = cek('paruhJam', 'Half-life (h)', SUPLEMEN.paruhJam)
  if (Object.keys(masalah).length) return { ok: false, masalah }
  return { ok: true, nilai: { name: nama, doseMg: dose, timeHour: jam, halfLifeH: paruh } }
}
