// Bank data obat berbasis RxNorm + RxClass (NLM/NIH).
//
// RxClass API dapat dipakai tanpa lisensi API, tetapi relasi kelas yang
// dikembalikan berasal dari beberapa source vocabulary (mis. MED-RT,
// DailyMed, ATC). Karena itu Panacea mempertahankan `relaSource` pada setiap
// hasil dan TIDAK menganggap seluruh class relation mempunyai satu blanket
// licence/provenance. RxNorm/RxClass dipakai untuk normalisasi dan konteks
// farmakologi; hasilnya bukan rekomendasi terapi pasien.
const RXNAV = 'https://rxnav.nlm.nih.gov/REST'
const MAX_DRUG_QUERY_LENGTH = 160
const MAX_CLASS_RESULTS = 100
const MAX_SEARCH_RESULTS = 100
const UMUR_CACHE_VERSI = 12 * 60 * 60 * 1000

type FetchLike = typeof fetch
type VersionedRelaSource = 'MEDRT' | 'ATC'

function normalizeDrugQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_DRUG_QUERY_LENGTH)
}

function clampSearchLimit(value: number): number {
  if (!Number.isFinite(value)) return 40
  return Math.max(1, Math.min(MAX_SEARCH_RESULTS, Math.trunc(value)))
}

export interface KelasObat {
  /** Pengenal kelas di namespace sumbernya (mis. MED-RT/ATC). */
  id: string
  nama: string
  /** MOA | PE | EPC | ATC1-4 | DISEASE, apa adanya dari RxClass. */
  jenis: string
  /** has_MoA | has_PE | has_EPC | may_treat | ... */
  relasi: string
  /** Source vocabulary relation dari RxClass (mis. MEDRT, DAILYMED, ATC). */
  sumber: string
}

export interface ProfilFarmakologi {
  nama: string
  rxcui: string
  /** Relasi mechanism-of-action yang dikembalikan MED-RT/RxClass. */
  mekanisme: KelasObat[]
  /** Relasi physiologic-effect yang dikembalikan MED-RT/RxClass. */
  efekFisiologis: KelasObat[]
  /** Established pharmacologic class dari DailyMed/RxClass bila tersedia. */
  kelasFarmakologi: KelasObat[]
  /** Kelas ATC yang dikembalikan RxClass bila tersedia. */
  atc: KelasObat[]
  /** Relasi `may_treat` dari MED-RT; konteks referensi, bukan indikasi pasien. */
  indikasi: KelasObat[]
  /**
   * Versi relation-source yang dilaporkan RxClass untuk sumber yang memang
   * mempunyai version identifier. DailyMed sengaja tidak diberi versi palsu:
   * NLM mendokumentasikan class-member DailyMed sebagai rolling update tanpa
   * version number yang diasosiasikan.
   */
  versiSumber: Partial<Record<VersionedRelaSource, string>>
}

interface RxClassResp {
  rxclassDrugInfoList?: {
    rxclassDrugInfo?: Array<{
      minConcept?: { rxcui?: string; name?: string }
      rxclassMinConceptItem?: { classId?: string; className?: string; classType?: string }
      rela?: string
      relaSource?: string
    }>
  }
}

let cacheVersiSumber: Partial<Record<VersionedRelaSource, { nilai: string; waktu: number }>> = {}

async function versiRelaSource(
  source: VersionedRelaSource,
  fetchImpl: FetchLike,
): Promise<string> {
  const useRuntimeCache = fetchImpl === fetch
  const cached = cacheVersiSumber[source]
  if (useRuntimeCache && cached && Date.now() - cached.waktu < UMUR_CACHE_VERSI) return cached.nilai

  try {
    const res = await fetchImpl(`${RXNAV}/rxclass/version/${source}.json`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return ''
    const data = (await res.json()) as { relaSourceVersion?: unknown }
    const nilai = typeof data.relaSourceVersion === 'string'
      ? data.relaSourceVersion.replace(/\s+/g, ' ').trim().slice(0, 80)
      : ''
    if (useRuntimeCache && nilai) cacheVersiSumber[source] = { nilai, waktu: Date.now() }
    return nilai
  } catch {
    // Versi adalah provenance tambahan. Kegagalan endpoint versi tidak boleh
    // menghapus relation slices yang sudah valid; absence tetap eksplisit.
    return ''
  }
}

async function kelasMenurut(
  drugName: string,
  relaSource: string,
  relas: string | undefined,
  fetchImpl: FetchLike,
): Promise<KelasObat[]> {
  const q = normalizeDrugQuery(drugName)
  if (!q) return []
  const params = new URLSearchParams({ drugName: q, relaSource })
  if (relas) params.set('relas', relas)
  const res = await fetchImpl(`${RXNAV}/rxclass/class/byDrugName.json?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) return []
  const data = (await res.json()) as RxClassResp
  const items = Array.isArray(data.rxclassDrugInfoList?.rxclassDrugInfo)
    ? data.rxclassDrugInfoList?.rxclassDrugInfo ?? []
    : []
  const out: KelasObat[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const c = item.rxclassMinConceptItem
    const id = typeof c?.classId === 'string' ? c.classId.trim() : ''
    const nama = typeof c?.className === 'string' ? c.className.trim() : ''
    if (!id || !nama) continue
    const sumber = typeof item.relaSource === 'string' && item.relaSource.trim()
      ? item.relaSource.trim()
      : relaSource
    const key = `${sumber}|${id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id,
      nama,
      jenis: typeof c?.classType === 'string' ? c.classType.trim() : '',
      relasi: typeof item.rela === 'string' ? item.rela.trim() : '',
      sumber,
    })
    if (out.length >= MAX_CLASS_RESULTS) break
  }
  return out
}

/**
 * Profil farmakologi satu obat dari source relations RxClass. Satu source yang
 * gagal tidak menghapus source lain, tetapi hasil parsial tetap membawa
 * `sumber` sehingga UI/engine tidak mengubahnya menjadi satu klaim homogen.
 */
export async function profilFarmakologi(
  name: string,
  fetchImpl: FetchLike = fetch,
): Promise<ProfilFarmakologi | null> {
  const q = normalizeDrugQuery(name)
  if (!q) return null
  const aman = (p: Promise<KelasObat[]>) => p.catch(() => [] as KelasObat[])
  const [mekanisme, efekFisiologis, kelasFarmakologi, atc, indikasi, versiMedrt, versiAtc] = await Promise.all([
    aman(kelasMenurut(q, 'MEDRT', 'has_MoA', fetchImpl)),
    aman(kelasMenurut(q, 'MEDRT', 'has_PE', fetchImpl)),
    aman(kelasMenurut(q, 'DAILYMED', 'has_EPC', fetchImpl)),
    aman(kelasMenurut(q, 'ATC', undefined, fetchImpl)),
    aman(kelasMenurut(q, 'MEDRT', 'may_treat', fetchImpl)),
    versiRelaSource('MEDRT', fetchImpl),
    versiRelaSource('ATC', fetchImpl),
  ])
  const adaIsi = mekanisme.length || efekFisiologis.length || kelasFarmakologi.length || atc.length || indikasi.length
  if (!adaIsi) return null

  let rxcui = ''
  try {
    const params = new URLSearchParams({ name: q, search: '1' })
    const res = await fetchImpl(`${RXNAV}/rxcui.json?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const d = (await res.json()) as { idGroup?: { rxnormId?: unknown } }
      const ids = Array.isArray(d.idGroup?.rxnormId) ? d.idGroup?.rxnormId : []
      const first = ids.find((id): id is string => typeof id === 'string' && /^\d+$/.test(id))
      rxcui = first ?? ''
    }
  } catch {
    // RXCUI hanya pelengkap; source-class profile yang sudah valid tetap berguna.
  }

  const versiSumber: ProfilFarmakologi['versiSumber'] = {}
  if (versiMedrt) versiSumber.MEDRT = versiMedrt
  if (versiAtc) versiSumber.ATC = versiAtc

  return { nama: q, rxcui, mekanisme, efekFisiologis, kelasFarmakologi, atc, indikasi, versiSumber }
}

export interface ZatAktif { rxcui: string; nama: string }

// Daftar ingredient cukup besar dan tidak perlu diambil ulang setiap render.
// Cache hanya dipakai untuk fetch runtime asli; injected test fetch tidak boleh
// mencemari cache proses produksi.
let cacheZat: { data: ZatAktif[]; waktu: number } | null = null
const UMUR_CACHE = 12 * 60 * 60 * 1000

/**
 * Konsep RxNorm dengan TTY IN/PIN. Ini adalah vocabulary identity/reference,
 * bukan daftar obat yang otomatis tepat untuk satu negara, formularium, atau
 * pasien tertentu.
 */
export async function daftarSemuaZatAktif(fetchImpl: FetchLike = fetch): Promise<ZatAktif[]> {
  const useRuntimeCache = fetchImpl === fetch
  if (useRuntimeCache && cacheZat && Date.now() - cacheZat.waktu < UMUR_CACHE) return cacheZat.data

  const res = await fetchImpl(`${RXNAV}/allconcepts.json?tty=IN+PIN`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`rxnorm_allconcepts_${res.status}`)
  const data = (await res.json()) as { minConceptGroup?: { minConcept?: unknown } }
  const concepts = Array.isArray(data.minConceptGroup?.minConcept) ? data.minConceptGroup?.minConcept : []
  const daftar: ZatAktif[] = []
  const terlihat = new Set<string>()
  for (const raw of concepts) {
    if (!raw || typeof raw !== 'object') continue
    const c = raw as { rxcui?: unknown; name?: unknown }
    const rxcui = typeof c.rxcui === 'string' ? c.rxcui.trim() : ''
    const nama = typeof c.name === 'string' ? c.name.replace(/\s+/g, ' ').trim() : ''
    if (!/^\d+$/.test(rxcui) || !nama) continue
    const kunci = nama.toLowerCase()
    if (terlihat.has(kunci)) continue
    terlihat.add(kunci)
    daftar.push({ rxcui, nama })
  }
  daftar.sort((a, b) => a.nama.localeCompare(b.nama))
  if (useRuntimeCache) cacheZat = { data: daftar, waktu: Date.now() }
  return daftar
}

/** Pencarian lokal di daftar ingredient RxNorm yang sudah dinormalisasi. */
export async function cariZatAktif(
  q: string,
  limit = 40,
  fetchImpl: FetchLike = fetch,
): Promise<ZatAktif[]> {
  const kueri = normalizeDrugQuery(q).toLowerCase()
  const batas = clampSearchLimit(limit)
  const semua = await daftarSemuaZatAktif(fetchImpl)
  if (!kueri) return semua.slice(0, batas)
  const mulai: ZatAktif[] = []
  const mengandung: ZatAktif[] = []
  for (const z of semua) {
    const n = z.nama.toLowerCase()
    if (n.startsWith(kueri)) mulai.push(z)
    else if (n.includes(kueri)) mengandung.push(z)
  }
  return [...mulai, ...mengandung].slice(0, batas)
}
