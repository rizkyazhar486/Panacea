// ICD-11 — klasifikasi penyakit resmi WHO.
//
// KENAPA ADA DUA JALUR DI BERKAS INI.
//
// ICD-11 TIDAK punya API publik tanpa kunci. WHO membuka datanya cuma-cuma,
// tapi lewat OAuth2 client credentials: akun didaftarkan sendiri di
// https://icd.who.int/icdapi, lalu client id & secret-nya dipasang sebagai
// variabel lingkungan. Itu gratis dan tanpa batas kuota untuk pemakaian
// normal — tapi tetap perlu didaftarkan satu kali oleh pemilik aplikasi,
// dan tidak ada jalan memutarnya.
//
// Karena kredensialnya bisa saja belum dipasang, ada jalur kedua yang selalu
// hidup: NLM Clinical Tables (ICD-10-CM, tanpa kunci, domain publik). Itu
// BUKAN ICD-11 dan tidak boleh disebut ICD-11 — jadi tiap hasil membawa
// penanda `sumber` sendiri, dan layarnya menampilkan penanda itu apa adanya.
// Lebih baik pengguna tahu ia sedang melihat ICD-10 daripada mengira sudah
// melihat ICD-11.
import { config } from './config.js'

const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token'
const ICD_BASE = 'https://id.who.int/icd/release/11'
// Rilis MMS (Mortality & Morbidity Statistics) — linearisasi ICD-11 yang
// dipakai untuk pengkodean klinis. "2024-01" adalah rilis stabil; dibiarkan
// eksplisit supaya kode yang ditampilkan tidak diam-diam berubah arti saat
// WHO menerbitkan rilis berikutnya.
const ICD_RELEASE = '2024-01'
const CLINICAL_TABLES = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search'

export interface IcdEntry {
  code: string
  title: string
  /** Bab / blok induknya kalau diketahui. */
  chapter?: string
  definition?: string
  /** URI entitas di WHO — tautan yang bisa diperiksa sendiri. */
  uri?: string
  /** Selalu ditampilkan. 'icd11' = WHO ICD-11 MMS; 'icd10cm' = jalur cadangan. */
  sumber: 'icd11' | 'icd10cm'
}

export const icd11Configured = Boolean(config.whoIcd.clientId && config.whoIcd.clientSecret)

// Token WHO berlaku ~1 jam. Disimpan di memori dan diperbarui lebih awal
// (60 detik sebelum kedaluwarsa) supaya tidak ada permintaan yang jatuh tepat
// di detik pergantian.
let cachedToken: { value: string; expiresAt: number } | null = null

async function whoToken(): Promise<string | null> {
  if (!icd11Configured) return null
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value
  const body = new URLSearchParams({
    client_id: config.whoIcd.clientId,
    client_secret: config.whoIcd.clientSecret,
    scope: 'icdapi_access',
    grant_type: 'client_credentials',
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) throw new Error(`who_token_${res.status}`)
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('who_token_kosong')
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max((data.expires_in ?? 3600) - 60, 60) * 1000,
  }
  return cachedToken.value
}

function whoHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Accept-Language': 'en',
    'API-Version': 'v2',
  }
}

/** Membuang tag <em> penanda kata-cocok yang disisipkan mesin cari WHO. */
function bersih(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

interface WhoSearchResp {
  destinationEntities?: Array<{
    id?: string
    theCode?: string
    title?: string
    chapter?: string
    score?: number
  }>
}

async function cariIcd11(q: string, limit: number): Promise<IcdEntry[]> {
  const token = await whoToken()
  if (!token) return []
  const url =
    `${ICD_BASE}/${ICD_RELEASE}/mms/search?q=${encodeURIComponent(q)}` +
    '&useFlexisearch=true&flatResults=true&highlightingEnabled=false'
  const res = await fetch(url, { headers: whoHeaders(token), signal: AbortSignal.timeout(11000) })
  if (!res.ok) throw new Error(`who_search_${res.status}`)
  const data = (await res.json()) as WhoSearchResp
  const out: IcdEntry[] = []
  for (const e of data.destinationEntities ?? []) {
    // Entitas tanpa kode adalah simpul pengelompokan, bukan diagnosis yang
    // bisa dikodekan — tidak berguna di daftar hasil.
    if (!e.theCode || !e.title) continue
    out.push({
      code: e.theCode,
      title: bersih(e.title),
      chapter: e.chapter ? bersih(e.chapter) : undefined,
      uri: e.id,
      sumber: 'icd11',
    })
    if (out.length >= limit) break
  }
  return out
}

interface ClinicalTablesResp extends Array<unknown> {
  0: number
  3: Array<[string, string]>
}

async function cariIcd10cm(q: string, limit: number): Promise<IcdEntry[]> {
  const url = `${CLINICAL_TABLES}?sf=code,name&terms=${encodeURIComponent(q)}&maxList=${limit}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) })
  if (!res.ok) throw new Error(`clinicaltables_${res.status}`)
  const data = (await res.json()) as ClinicalTablesResp
  const rows = Array.isArray(data[3]) ? data[3] : []
  return rows
    .filter((r) => Array.isArray(r) && r.length >= 2)
    .map(([code, name]) => ({ code, title: name, sumber: 'icd10cm' as const }))
}

/**
 * Pencarian diagnosis. Memakai ICD-11 kalau kredensial WHO terpasang, dan
 * jatuh ke ICD-10-CM kalau tidak — atau kalau WHO sedang tidak bisa dihubungi,
 * karena hasil yang benar dari klasifikasi terdahulu masih jauh lebih berguna
 * daripada layar kosong.
 */
export async function cariDiagnosis(q: string, limit = 20): Promise<IcdEntry[]> {
  const kueri = q.trim()
  if (!kueri) return []
  if (icd11Configured) {
    try {
      const hasil = await cariIcd11(kueri, limit)
      if (hasil.length) return hasil
    } catch {
      // jatuh ke jalur cadangan di bawah
    }
  }
  return cariIcd10cm(kueri, limit)
}

interface WhoEntity {
  '@id'?: string
  code?: string
  title?: { '@value'?: string }
  definition?: { '@value'?: string }
  parent?: string[]
}

/** Rincian satu entitas ICD-11 termasuk definisi resminya. */
export async function rincianIcd11(entityId: string): Promise<IcdEntry | null> {
  const token = await whoToken()
  if (!token) return null
  const id = entityId.replace(/^https?:\/\/id\.who\.int\/icd\/entity\//, '').replace(/[^0-9]/g, '')
  if (!id) return null
  const res = await fetch(`${ICD_BASE}/${ICD_RELEASE}/mms/${id}`, {
    headers: whoHeaders(token),
    signal: AbortSignal.timeout(11000),
  })
  if (!res.ok) return null
  const e = (await res.json()) as WhoEntity
  if (!e.title?.['@value']) return null
  return {
    code: e.code ?? '',
    title: bersih(e.title['@value']),
    definition: e.definition?.['@value'] ? bersih(e.definition['@value']) : undefined,
    uri: e['@id'],
    sumber: 'icd11',
  }
}
