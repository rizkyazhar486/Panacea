// Riwayat lab pribadi → FHIR R4, dan izin pasien untuk dokter.
//
// Kode: HANYA dari registry terverifikasi (mcp/verifiedTerminologyRegistry).
// Satu jenis lab diberi LOINC bila analit DAN satuannya persis sama. Selain
// itu Observation membawa teks saja — lebih jujur daripada kode tebakan.
// hs-CRP sengaja TIDAK dipetakan ke 1988-5 (CRP biasa): pemeriksaannya beda.
//
// Asal data: angka ini disalin pasien dari lembar hasil lab, BUKAN diterima
// dari laboratorium. Itu ditandai di meta.tag dan note setiap Observation.
//
// Izin: pasien memberi akses baca ke satu dokter (email) untuk waktu terbatas.
// Dokter hanya membaca lewat id izin yang menyebut dirinya, belum kedaluwarsa,
// belum dicabut, dan perannya dokter terverifikasi. Setiap baca dicatat.

import { randomBytes, createHash } from 'node:crypto'
import { VERIFIED_METRIC_TERMS, LOINC_SYSTEM, UCUM_SYSTEM, OBS_CATEGORY_SYSTEM } from './mcp/verifiedTerminologyRegistry.js'
import type { LogLab } from './labLog.js'

export const SISTEM_ASAL = 'https://panaceamed.id/fhir/CodeSystem/data-origin'
/** Identitas stabil butir lab: `<jenis>/<id butir>`, dipakai untuk mengaitkan tinjauan klinisi. */
export const SISTEM_ENTRI = 'https://panaceamed.id/fhir/NamingSystem/lab-entry'

/** jenis lab aplikasi → [kunci registry, satuan aplikasi yang harus sama]. */
const PETA: Record<string, [string, string]> = {
  hba1c: ['hba1c', '%'],
  gdp: ['glukosaPuasaMgdL', 'mg/dL'],
  hdl: ['hdl', 'mg/dL'],
  tg: ['trigliserida', 'mg/dL'],
  kreatinin: ['kreatininMgdL', 'mg/dL'],
  sgot: ['ast', 'U/L'],
  sgpt: ['alt', 'U/L'],
  albumin: ['albuminGdL', 'g/dL'],
  mcv: ['mcv', 'fL'],
  rdw: ['rdw', '%'],
  alp: ['alp', 'U/L'],
  wbc: ['wbc', '10*3/uL'],
  limfosit: ['limfositPersen', '%'],
}

/** Nama & satuan tampilan untuk jenis yang tidak berkode (teks saja). */
const TEKS: Record<string, [string, string]> = {
  apob: ['ApoB', 'mg/dL'], ldl: ['LDL cholesterol', 'mg/dL'], egfr: ['eGFR (as reported)', 'mL/min/1.73m2'],
  tsh: ['TSH', 'mIU/L'], vitd: ['Vitamin D (25-OH)', 'ng/mL'], b12: ['Vitamin B12', 'pg/mL'],
  ferritin: ['Ferritin', 'ng/mL'], hb: ['Hemoglobin', 'g/dL'], crp: ['hs-CRP', 'mg/L'],
}

export function kodeUntuk(jenis: string) {
  const p = PETA[jenis]
  if (!p) return null
  const t = VERIFIED_METRIC_TERMS.find((x) => x.key === p[0] && x.system === LOINC_SYSTEM)
  if (!t || t.ucum !== p[1]) return null // gagal tertutup bila registry berubah
  return t
}

// fullUrl urn:uuid harus UUID RFC 4122 (#2009). UUID v5-gaya (SHA-1, berbasis
// nama) dari identitas butir: stabil antar-ekspor, jadi penerima dapat mengenali
// Observation yang sama tanpa duplikasi.
export function uuidStabil(nama: string): string {
  const h = createHash('sha1').update(`panaceamed:lab:${nama}`).digest()
  h[6] = (h[6] & 0x0f) | 0x50
  h[8] = (h[8] & 0x3f) | 0x80
  const x = h.subarray(0, 16).toString('hex')
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`
}

export function logKeBundelFhir(log: LogLab, pasienRef: string, dibuat: string) {
  const entry: { fullUrl: string; resource: Record<string, unknown> }[] = []
  for (const [jenis, daftar] of Object.entries(log)) {
    const t = kodeUntuk(jenis)
    const teks = TEKS[jenis]
    if (!t && !teks) continue // jenis tak dikenal tidak diekspor
    for (const b of daftar) {
      const id = `lab-${b.id}`
      entry.push({
        fullUrl: `urn:uuid:${uuidStabil(`${jenis}/${b.id}`)}`,
        resource: {
          resourceType: 'Observation',
          id,
          identifier: [{ system: SISTEM_ENTRI, value: `${jenis}/${b.id}` }],
          meta: { tag: [{ system: SISTEM_ASAL, code: 'patient-transcribed', display: 'Transcribed by the patient from a laboratory report' }] },
          status: 'final',
          category: [{ coding: [{ system: OBS_CATEGORY_SYSTEM, code: 'laboratory' }] }],
          code: t ? { coding: [{ system: LOINC_SYSTEM, code: t.code, display: t.display }], text: t.display } : { text: teks![0] },
          subject: { reference: pasienRef },
          effectiveDateTime: b.tanggal,
          valueQuantity: t ? { value: b.nilai, unit: t.unit, system: UCUM_SYSTEM, code: t.ucum } : { value: b.nilai, unit: teks![1] },
          ...(b.rujukanBawah != null || b.rujukanAtas != null ? {
            referenceRange: [{
              ...(b.rujukanBawah != null ? { low: t ? { value: b.rujukanBawah, unit: t.unit, system: UCUM_SYSTEM, code: t.ucum } : { value: b.rujukanBawah, unit: teks![1] } } : {}),
              ...(b.rujukanAtas != null ? { high: t ? { value: b.rujukanAtas, unit: t.unit, system: UCUM_SYSTEM, code: t.ucum } : { value: b.rujukanAtas, unit: teks![1] } } : {}),
              text: 'As printed on the laboratory report (patient-transcribed)',
            }],
          } : {}),
          note: [{ text: 'Patient-entered from a lab report; not received from the laboratory. Verify against the original report before clinical use.' }],
        },
      })
    }
  }
  // Provenance: Panaceamed merakit; sumbernya lembar hasil lab yang disalin pasien.
  if (entry.length) {
    entry.push({
      fullUrl: `urn:uuid:${uuidStabil(`provenance/${pasienRef}/${dibuat}`)}`,
      resource: {
        resourceType: 'Provenance',
        id: `lab-provenance`,
        target: entry.map((e) => ({ reference: `Observation/${(e.resource as { id: string }).id}` })),
        recorded: dibuat,
        agent: [{
          type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type', code: 'assembler', display: 'Assembler' }] }],
          who: { identifier: { system: 'https://panaceamed.id/fhir/identifier/software-agent', value: 'panaceamed' }, display: 'Panaceamed.id' },
        }, {
          type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type', code: 'enterer', display: 'Enterer' }] }],
          who: { reference: pasienRef },
        }],
        entity: [{ role: 'source', what: { display: 'Laboratory report transcribed by the patient' } }],
      },
    })
  }
  return { resourceType: 'Bundle', type: 'collection', timestamp: dibuat, total: entry.length, entry }
}

// ── Izin & audit ─────────────────────────────────────────────────────────
export interface IzinLab { id: string; pasienEmail: string; dokterEmail: string; dibuat: string; berakhir: string; dicabut?: string }
export interface AuditLab { waktu: string; pasienEmail: string; aktor: string; aksi: 'izin-dibuat' | 'izin-dicabut' | 'dibaca-dokter' | 'ditinjau-dokter' | 'rencana-harian'; izinId: string }

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/
export const HARI_MAKS = 90

export function buatIzin(pasienEmail: string, dokterEmailMentah: unknown, hariMentah: unknown, kini: Date): IzinLab {
  const dokterEmail = String(dokterEmailMentah ?? '').trim().toLowerCase()
  if (!EMAIL.test(dokterEmail)) throw new Error('enter the clinician email')
  if (dokterEmail === pasienEmail.toLowerCase()) throw new Error('you cannot share with yourself')
  const hari = Number(hariMentah)
  if (!Number.isInteger(hari) || hari < 1 || hari > HARI_MAKS) throw new Error(`access length must be 1–${HARI_MAKS} days`)
  return { id: randomBytes(12).toString('hex'), pasienEmail, dokterEmail, dibuat: kini.toISOString(), berakhir: new Date(kini.getTime() + hari * 864e5).toISOString() }
}

export function izinBerlaku(izin: IzinLab | undefined, dokterEmail: string, kini: Date): izin is IzinLab {
  return !!izin && !izin.dicabut && izin.dokterEmail === dokterEmail.toLowerCase() && Date.parse(izin.berakhir) > kini.getTime()
}

// ── Tinjauan klinisi & tindak lanjut ──────────────────────────────────────
// Ditulis dokter (clinician-authored), terpisah dari angka yang disalin pasien;
// tidak pernah mengubah hasil lab. Hanya lewat izin yang berlaku.
export interface TinjauanLab {
  id: string; izinId: string; pasienEmail: string; dokterEmail: string
  tes: string; ditinjau: string; catatan?: string; cekUlangSebelum?: string
}
export const MAKS_CATATAN = 500

export function buatTinjauan(izin: IzinLab, masukan: { tes?: unknown; catatan?: unknown; cekUlangSebelum?: unknown }, kini: Date): TinjauanLab {
  const tes = String(masukan?.tes ?? '').trim()
  if (!/^[a-z0-9_-]{1,32}$/.test(tes) || tes === '__proto__') throw new Error('choose the test you reviewed')
  const catatanMentah = masukan?.catatan == null ? '' : String(masukan.catatan).trim()
  if (catatanMentah.length > MAKS_CATATAN) throw new Error(`note must be ${MAKS_CATATAN} characters or fewer`)
  let cekUlangSebelum: string | undefined
  if (masukan?.cekUlangSebelum != null && masukan.cekUlangSebelum !== '') {
    const t = String(masukan.cekUlangSebelum)
    const hari = kini.toISOString().slice(0, 10)
    const maks = new Date(kini.getTime() + 2 * 365 * 864e5).toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00Z`))) throw new Error('invalid recheck date')
    if (t < hari || t > maks) throw new Error('recheck date must be between today and two years from now')
    cekUlangSebelum = t
  }
  return {
    id: randomBytes(12).toString('hex'), izinId: izin.id, pasienEmail: izin.pasienEmail, dokterEmail: izin.dokterEmail,
    tes, ditinjau: kini.toISOString(), ...(catatanMentah ? { catatan: catatanMentah } : {}), ...(cekUlangSebelum ? { cekUlangSebelum } : {}),
  }
}
