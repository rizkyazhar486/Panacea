// ─────────────────────────────────────────────────────────────────────────────
// EKSPOR FHIR R4 — supaya data yang tersimpan di sini bisa keluar.
//
// Aplikasi kesehatan yang datanya tidak bisa dibawa pergi adalah kandang, bukan
// alat. Berkas ini membangun Bundle FHIR R4 yang bisa dibaca sistem lain: klinik
// dengan rekam medis elektronik, aplikasi SMART on FHIR, atau sekadar arsip
// pribadi yang masih terbaca sepuluh tahun lagi.
//
// SATU ATURAN YANG MENENTUKAN SELURUH ISI BERKAS INI: kode LOINC hanya
// dituliskan untuk pengukuran yang kodenya benar-benar diketahui. Kode LOINC
// yang salah lebih berbahaya daripada tidak ada kode sama sekali — sistem
// penerima akan memasukkan angkanya ke baris yang keliru tanpa satu pun
// peringatan, dan kesalahannya baru terlihat ketika seseorang mengambil
// keputusan klinis darinya.
//
// Karena itu skor turunan (PhenoAge, FIB-4, eGFR, umur biologis) TIDAK memakai
// LOINC. Semuanya diberi kode sistem lokal yang jelas-jelas milik aplikasi ini,
// sehingga penerima tahu persis bahwa angka itu berasal dari sini dan bukan
// dari pemeriksaan baku.
// ─────────────────────────────────────────────────────────────────────────────

export interface Kuantitas { value: number; unit: string; system: string; code: string }
export interface Koding { system: string; code: string; display: string }
export interface PengenalFhir { system: string; value: string }

export interface Observasi {
  resourceType: 'Observation'
  id: string
  identifier?: PengenalFhir[]
  status: 'final'
  category: Array<{ coding: Koding[] }>
  code: { coding: Koding[]; text: string }
  subject: { reference: string }
  effectiveDateTime: string
  valueQuantity: Kuantitas
  note?: Array<{ text: string }>
}

export interface Pasien {
  resourceType: 'Patient'
  id: string
  name?: Array<{ text: string }>
  gender?: 'male' | 'female'
  birthDate?: string
}

export interface SumberEksporFhir {
  /** URI namespace yang menetapkan identitas sumber, mis. vendor/device registry. */
  identifierSystem: string
  /** Identitas sumber di namespace tersebut; tidak boleh kosong. */
  identifierValue: string
  display?: string
}

export interface ProvenansFhir {
  resourceType: 'Provenance'
  id: string
  target: Array<{ reference: string }>
  occurredDateTime: string
  recorded: string
  agent: Array<{
    type: Array<{ coding: Koding[] }>
    who: { identifier: PengenalFhir; display?: string }
  }>
  entity: Array<{
    role: 'source'
    what: { identifier: PengenalFhir; display?: string }
  }>
}

export interface Bundel {
  resourceType: 'Bundle'
  type: 'collection'
  timestamp: string
  entry: Array<{ fullUrl: string; resource: Observasi | Pasien | ProvenansFhir }>
}

const LOINC = 'http://loinc.org'
const UCUM = 'http://unitsofmeasure.org'
const KATEGORI = 'http://terminology.hl7.org/CodeSystem/observation-category'
const TIPE_PELAKU_PROVENANS = 'http://terminology.hl7.org/CodeSystem/provenance-participant-type'
const SISTEM_AGEN_PANACEA = 'https://panaceamed.id/fhir/identifier/software-agent'
const SISTEM_PENGENAL_EKSPOR = 'https://panaceamed.id/fhir/identifier/export-observation'
/** Sistem kode milik aplikasi ini, untuk angka yang memang tidak punya padanan baku. */
export const SISTEM_LOKAL = 'https://panaceamed.id/fhir/CodeSystem/derived'

export interface Ukuran {
  /** Kunci internal — bukan kode, tidak pernah dikirim keluar sebagai kode. */
  kunci: string
  loinc?: string
  display: string
  satuan: string
  /** Kode UCUM; berbeda dari satuan yang dibaca manusia. */
  ucum: string
  kategori: 'vital-signs' | 'laboratory' | 'survey'
  catatan?: string
}

// Hanya kode LOINC yang diketahui. Yang ragu tidak dimasukkan ke daftar ini;
// ia turun ke daftar turunan di bawah dengan kode lokal.
export const UKURAN: Ukuran[] = [
  { kunci: 'weightKg', loinc: '29463-7', display: 'Body weight', satuan: 'kg', ucum: 'kg', kategori: 'vital-signs' },
  { kunci: 'heightCm', loinc: '8302-2', display: 'Body height', satuan: 'cm', ucum: 'cm', kategori: 'vital-signs' },
  { kunci: 'systolic', loinc: '8480-6', display: 'Systolic blood pressure', satuan: 'mmHg', ucum: 'mm[Hg]', kategori: 'vital-signs' },
  { kunci: 'diastolic', loinc: '8462-4', display: 'Diastolic blood pressure', satuan: 'mmHg', ucum: 'mm[Hg]', kategori: 'vital-signs' },
  { kunci: 'heartRate', loinc: '8867-4', display: 'Heart rate', satuan: 'beats/min', ucum: '/min', kategori: 'vital-signs' },
  { kunci: 'waistCm', loinc: '8280-0', display: 'Waist circumference at umbilicus', satuan: 'cm', ucum: 'cm', kategori: 'vital-signs' },
  { kunci: 'hba1c', loinc: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', satuan: '%', ucum: '%', kategori: 'laboratory' },
  { kunci: 'albuminGdL', loinc: '1751-7', display: 'Albumin [Mass/volume] in Serum or Plasma', satuan: 'g/dL', ucum: 'g/dL', kategori: 'laboratory' },
  { kunci: 'kreatininMgdL', loinc: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma', satuan: 'mg/dL', ucum: 'mg/dL', kategori: 'laboratory' },
  { kunci: 'glukosaPuasaMgdL', loinc: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma', satuan: 'mg/dL', ucum: 'mg/dL', kategori: 'laboratory' },
  { kunci: 'crpMgL', loinc: '1988-5', display: 'C reactive protein [Mass/volume] in Serum or Plasma', satuan: 'mg/L', ucum: 'mg/L', kategori: 'laboratory' },
  { kunci: 'limfositPersen', loinc: '736-9', display: 'Lymphocytes/100 leukocytes in Blood', satuan: '%', ucum: '%', kategori: 'laboratory' },
  { kunci: 'mcv', loinc: '787-2', display: 'MCV [Entitic volume] by Automated count', satuan: 'fL', ucum: 'fL', kategori: 'laboratory' },
  { kunci: 'rdw', loinc: '788-0', display: 'Erythrocyte distribution width [Ratio] by Automated count', satuan: '%', ucum: '%', kategori: 'laboratory' },
  { kunci: 'alp', loinc: '6768-6', display: 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma', satuan: 'U/L', ucum: 'U/L', kategori: 'laboratory' },
  { kunci: 'wbc', loinc: '6690-2', display: 'Leukocytes [#/volume] in Blood by Automated count', satuan: '10*3/uL', ucum: '10*3/uL', kategori: 'laboratory' },
  { kunci: 'ast', loinc: '1920-8', display: 'AST [Enzymatic activity/volume] in Serum or Plasma', satuan: 'U/L', ucum: 'U/L', kategori: 'laboratory' },
  { kunci: 'alt', loinc: '1742-6', display: 'ALT [Enzymatic activity/volume] in Serum or Plasma', satuan: 'U/L', ucum: 'U/L', kategori: 'laboratory' },
  // Trombosit di Indonesia ditulis 10^9/L dan di LOINC 10*3/uL. Keduanya
  // bernilai sama, jadi angkanya tidak diubah — hanya satuannya dinyatakan
  // dalam UCUM supaya penerima tidak menebak.
  {
    kunci: 'trombosit', loinc: '777-3', display: 'Platelets [#/volume] in Blood by Automated count',
    satuan: '10*3/uL', ucum: '10*3/uL', kategori: 'laboratory',
    catatan: 'Entered as ×10⁹/L, which is numerically identical to ×10³/µL',
  },
  { kunci: 'trigliserida', loinc: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma', satuan: 'mg/dL', ucum: 'mg/dL', kategori: 'laboratory' },
  { kunci: 'hdl', loinc: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma', satuan: 'mg/dL', ucum: 'mg/dL', kategori: 'laboratory' },
]

// Angka turunan. Tidak satu pun memakai LOINC, dan itu disengaja: masing-masing
// bergantung pada persamaan tertentu, sehingga menyamakannya dengan hasil
// pemeriksaan baku akan menyesatkan penerimanya.
export const TURUNAN: Ukuran[] = [
  {
    kunci: 'phenoAge', display: 'PhenoAge (Levine 2018)', satuan: 'years', ucum: 'a',
    kategori: 'survey', catatan: 'Derived in Panaceamed from the published Levine 2018 equation. Not a laboratory result and not LOINC-coded.',
  },
  {
    kunci: 'egfr', display: 'eGFR (CKD-EPI 2021, race-free)', satuan: 'mL/min/1.73m2', ucum: 'mL/min/{1.73_m2}',
    kategori: 'survey', catatan: 'Calculated with the 2021 race-free CKD-EPI equation. Locally coded because the calculating equation must travel with the number.',
  },
  {
    kunci: 'fib4', display: 'FIB-4 index', satuan: '{score}', ucum: '{score}',
    kategori: 'survey', catatan: 'Derived from age, AST, ALT and platelets (Sterling 2006).',
  },
  {
    kunci: 'vo2max', display: 'Estimated VO2max', satuan: 'mL/kg/min', ucum: 'mL/(kg.min)',
    kategori: 'survey', catatan: 'Estimated from resting and maximum heart rate (Uth 2004) — not measured by ergometry.',
  },
  {
    kunci: 'bioAge', display: 'Biological age (Panaceamed points model)', satuan: 'years', ucum: 'a',
    kategori: 'survey', catatan: 'Transparent points model whose weights are chosen by the author, not derived from research. Directional only.',
  },
]

const SEMUA = new Map([...UKURAN, ...TURUNAN].map((u) => [u.kunci, u]))

/** Tanggal FHIR: instant lengkap dengan zona waktu. */
export function waktuFhir(d: Date = new Date()): string {
  return d.toISOString()
}

let hitung = 0
function idBaru(kunci: string): string {
  hitung += 1
  return `${kunci}-${hitung}`
}

/** fullUrl urn:uuid HARUS benar-benar berisi UUID, bukan sekadar label lokal. */
function uuidBaru(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // Fallback hanya untuk runtime lama; UUID ini adalah identitas bundle, bukan token keamanan.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : ((r & 0x3) | 0x8)
    return v.toString(16)
  })
}

function fullUrlBaru(): string {
  return `urn:uuid:${uuidBaru()}`
}

function validasiSumber(sumber: SumberEksporFhir): SumberEksporFhir {
  const system = sumber.identifierSystem?.trim()
  const value = sumber.identifierValue?.trim()
  if (!system || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(system)) {
    throw new Error('FHIR provenance source identifierSystem must be an absolute URI')
  }
  if (!value) throw new Error('FHIR provenance source identifierValue must not be blank')
  return { identifierSystem: system, identifierValue: value, display: sumber.display?.trim() || undefined }
}

export interface MasukanEkspor {
  /** kunci → nilai. Nilai undefined, nol-berarti-kosong dan NaN dilewati. */
  nilai: Record<string, number | undefined>
  pasien?: { nama?: string; kelamin?: 'M' | 'F'; lahir?: string }
  waktu?: Date
  /** Bila diberikan, setiap observasi diberi identifier dan Bundle membawa Provenance FHIR R4. */
  sumber?: SumberEksporFhir
}

/**
 * Membangun Bundle FHIR R4 bertipe collection.
 *
 * Nilai yang tidak ada DILEWATI, tidak diisi nol. Nol adalah angka yang sah
 * dalam laboratorium; mengekspor kolom kosong sebagai nol mengubah "tidak
 * diperiksa" menjadi "hasilnya nol", dan penerima tidak punya cara membedakan.
 */
export function bangunBundel(m: MasukanEkspor): Bundel {
  hitung = 0
  const waktu = waktuFhir(m.waktu)
  const sumber = m.sumber ? validasiSumber(m.sumber) : undefined
  const idPasien = 'panaceamed-local'
  const entry: Bundel['entry'] = []

  const pasien: Pasien = { resourceType: 'Patient', id: idPasien }
  if (m.pasien?.nama) pasien.name = [{ text: m.pasien.nama }]
  if (m.pasien?.kelamin) pasien.gender = m.pasien.kelamin === 'F' ? 'female' : 'male'
  if (m.pasien?.lahir && /^\d{4}-\d{2}-\d{2}$/.test(m.pasien.lahir)) pasien.birthDate = m.pasien.lahir
  entry.push({ fullUrl: fullUrlBaru(), resource: pasien })

  for (const [kunci, nilai] of Object.entries(m.nilai)) {
    const u = SEMUA.get(kunci)
    if (!u) continue
    if (typeof nilai !== 'number' || !Number.isFinite(nilai)) continue

    const coding: Koding[] = u.loinc
      ? [{ system: LOINC, code: u.loinc, display: u.display }]
      : [{ system: SISTEM_LOKAL, code: u.kunci, display: u.display }]

    const obs: Observasi = {
      resourceType: 'Observation',
      id: idBaru(u.kunci),
      status: 'final',
      category: [{ coding: [{ system: KATEGORI, code: u.kategori, display: u.kategori }] }],
      code: { coding, text: u.display },
      subject: { reference: `Patient/${idPasien}` },
      effectiveDateTime: waktu,
      valueQuantity: { value: nilai, unit: u.satuan, system: UCUM, code: u.ucum },
    }
    if (u.catatan) obs.note = [{ text: u.catatan }]
    if (sumber) {
      obs.identifier = [{
        system: SISTEM_PENGENAL_EKSPOR,
        value: `${sumber.identifierSystem}|${sumber.identifierValue}|${u.kunci}|${waktu}`,
      }]
    }
    entry.push({ fullUrl: fullUrlBaru(), resource: obs })
  }

  if (sumber) {
    const target: Array<{ reference: string }> = []
    for (const e of entry) {
      if (e.resource.resourceType === 'Observation') target.push({ reference: `Observation/${e.resource.id}` })
    }
    if (target.length) {
      const provenans: ProvenansFhir = {
        resourceType: 'Provenance',
        id: idBaru('provenance'),
        target,
        occurredDateTime: waktu,
        recorded: waktu,
        agent: [{
          type: [{ coding: [{
            system: TIPE_PELAKU_PROVENANS,
            code: 'assembler',
            display: 'Assembler',
          }] }],
          who: {
            identifier: { system: SISTEM_AGEN_PANACEA, value: 'panaceamed' },
            display: 'Panaceamed.id',
          },
        }],
        entity: [{
          role: 'source',
          what: {
            identifier: { system: sumber.identifierSystem, value: sumber.identifierValue },
            display: sumber.display,
          },
        }],
      }
      entry.push({ fullUrl: fullUrlBaru(), resource: provenans })
    }
  }

  return { resourceType: 'Bundle', type: 'collection', timestamp: waktu, entry }
}

/** Berapa observasi yang benar-benar ada isinya — dipakai untuk memberi tahu pengguna sebelum ia mengunduh. */
export function ringkasBundel(b: Bundel): { observasi: number; berkode: number; lokal: number } {
  const obs = b.entry.filter((e) => e.resource.resourceType === 'Observation')
  const lokal = obs.filter((e) =>
    (e.resource as Observasi).code.coding.some((c) => c.system === SISTEM_LOKAL)).length
  return { observasi: obs.length, berkode: obs.length - lokal, lokal }
}

export function keJson(b: Bundel): string {
  return JSON.stringify(b, null, 2)
}
