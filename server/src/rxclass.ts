// Bank data obat — RxNorm & RxClass (NLM/NIH), gratis, tanpa kunci API.
//
// TENTANG DRUGBANK, karena itu yang diminta secara khusus.
//
// DrugBank TIDAK bisa dipakai di aplikasi ini. Bukan soal teknis:
//   - Basis data lengkapnya berlisensi komersial berbayar, bukan API terbuka.
//   - Berkas "DrugBank Open Data" yang gratis berlisensi CC BY-NC 4.0 —
//     NC = non-commercial. Aplikasi ini berjualan (lihat server/src/payments.ts,
//     Midtrans, isSubscriber), jadi ia komersial, dan mencantumkan sumber TIDAK
//     menyembuhkan larangan NC. Atribusi memenuhi syarat CC BY dan CC BY-SA;
//     ia tidak memberi izin yang memang tidak diberikan.
//   - NLM sendiri MENUTUP API interaksi obat RxNav pada Januari 2024 justru
//     karena perjanjian datanya dengan DrugBank berakhir (lihat catatan di
//     server/src/rxnorm.ts).
//
// Yang dipakai sebagai gantinya adalah sumber pemerintah AS yang berstatus
// domain publik dan boleh dipakai komersial tanpa syarat:
//   - RxNorm (NLM) — daftar zat aktif & produk. Inilah jawaban nyata untuk
//     "17.000 obat": `daftarSemuaZatAktif()` menarik SELURUH konsep zat aktif
//     RxNorm dalam satu permintaan, jumlahnya belasan ribu, bukan hasil
//     ketikan tangan.
//   - RxClass (NLM) — kelas obat dari MED-RT & DailyMed: MEKANISME KERJA,
//     EFEK FISIOLOGIS, kelas farmakologi, kelompok ATC, serta penyakit yang
//     "may_treat"/"may_prevent". Inilah yang membuat "obat ini bekerja di
//     mana" bisa dijawab dari data, bukan dari ingatan.
//   - openFDA / DailyMed — teks label resmi (dosis, cara pakai, peringatan);
//     sudah dipakai di server/src/drugInfo.ts.
const RXNAV = 'https://rxnav.nlm.nih.gov/REST'

export interface KelasObat {
  /** Pengenal kelas di sumbernya (mis. "N0000175565"). Data, bukan teks layar. */
  id: string
  nama: string
  /** MOA | PE | EPC | ATC1-4 | DISEASE, apa adanya dari RxClass. */
  jenis: string
  /** has_MoA | has_PE | has_EPC | may_treat | may_prevent | ... */
  relasi: string
  sumber: string
}

export interface ProfilFarmakologi {
  nama: string
  rxcui: string
  /** Bagaimana ia bekerja pada tingkat molekul (MED-RT has_MoA). */
  mekanisme: KelasObat[]
  /** Apa yang ia lakukan pada faal tubuh (MED-RT has_PE). */
  efekFisiologis: KelasObat[]
  /** Kelas farmakologi mapan menurut FDA (DailyMed has_EPC). */
  kelasFarmakologi: KelasObat[]
  /** Kelompok ATC WHO — huruf pertamanya adalah kelompok ANATOMI. */
  atc: KelasObat[]
  /** Penyakit yang lazim diobati/dicegah (MED-RT). */
  indikasi: KelasObat[]
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

async function kelasMenurut(drugName: string, relaSource: string, relas?: string): Promise<KelasObat[]> {
  const params = new URLSearchParams({ drugName, relaSource })
  if (relas) params.set('relas', relas)
  const res = await fetch(`${RXNAV}/rxclass/class/byDrugName.json?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) return []
  const data = (await res.json()) as RxClassResp
  const out: KelasObat[] = []
  for (const item of data.rxclassDrugInfoList?.rxclassDrugInfo ?? []) {
    const c = item.rxclassMinConceptItem
    if (!c?.className || !c.classId) continue
    if (out.some((x) => x.id === c.classId)) continue
    out.push({
      id: c.classId,
      nama: c.className,
      jenis: c.classType ?? '',
      relasi: item.rela ?? '',
      sumber: item.relaSource ?? relaSource,
    })
  }
  return out
}

/**
 * Profil farmakologi satu obat: bagaimana ia bekerja, apa efeknya pada faal
 * tubuh, golongannya, dan untuk penyakit apa. Lima permintaan dijalankan
 * bersamaan; satu yang gagal tidak mengosongkan yang lain, karena profil
 * separuh masih berguna sedangkan galat total tidak.
 */
export async function profilFarmakologi(name: string): Promise<ProfilFarmakologi | null> {
  const q = name.trim()
  if (!q) return null
  const aman = (p: Promise<KelasObat[]>) => p.catch(() => [] as KelasObat[])
  const [mekanisme, efekFisiologis, kelasFarmakologi, atc, indikasi] = await Promise.all([
    aman(kelasMenurut(q, 'MEDRT', 'has_MoA')),
    aman(kelasMenurut(q, 'MEDRT', 'has_PE')),
    aman(kelasMenurut(q, 'DAILYMED', 'has_EPC')),
    aman(kelasMenurut(q, 'ATC')),
    aman(kelasMenurut(q, 'MEDRT', 'may_treat')),
  ])
  const adaIsi = mekanisme.length || efekFisiologis.length || kelasFarmakologi.length || atc.length || indikasi.length
  if (!adaIsi) return null

  let rxcui = ''
  try {
    const res = await fetch(`${RXNAV}/rxcui.json?name=${encodeURIComponent(q)}&search=1`, {
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const d = (await res.json()) as { idGroup?: { rxnormId?: string[] } }
      rxcui = d.idGroup?.rxnormId?.[0] ?? ''
    }
  } catch { /* rxcui hanya pelengkap */ }

  return { nama: q, rxcui, mekanisme, efekFisiologis, kelasFarmakologi, atc, indikasi }
}

export interface ZatAktif { rxcui: string; nama: string }

// Daftar lengkapnya besar (belasan ribu entri) dan praktis tidak berubah dari
// jam ke jam, jadi disimpan di memori proses. Tanpa ini tiap pembukaan halaman
// menarik ulang berkas beberapa megabyte dari NLM tanpa alasan.
let cacheZat: { data: ZatAktif[]; waktu: number } | null = null
const UMUR_CACHE = 12 * 60 * 60 * 1000

/**
 * SELURUH zat aktif yang dikenal RxNorm. Inilah bank data obatnya — jumlahnya
 * belasan ribu dan datang dari NLM, bukan dari daftar yang ditulis tangan.
 *
 * tty=IN adalah "ingredient" (zat aktif tunggal); PIN adalah "precise
 * ingredient" (bentuk garam/ester spesifik, mis. "metoprolol tartrate" di
 * samping "metoprolol"). Keduanya diambil karena resep nyata memakai
 * kedua-duanya.
 */
export async function daftarSemuaZatAktif(): Promise<ZatAktif[]> {
  if (cacheZat && Date.now() - cacheZat.waktu < UMUR_CACHE) return cacheZat.data
  const res = await fetch(`${RXNAV}/allconcepts.json?tty=IN+PIN`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`rxnorm_allconcepts_${res.status}`)
  const data = (await res.json()) as { minConceptGroup?: { minConcept?: Array<{ rxcui?: string; name?: string }> } }
  const daftar: ZatAktif[] = []
  const terlihat = new Set<string>()
  for (const c of data.minConceptGroup?.minConcept ?? []) {
    if (!c.rxcui || !c.name) continue
    const kunci = c.name.toLowerCase()
    if (terlihat.has(kunci)) continue
    terlihat.add(kunci)
    daftar.push({ rxcui: c.rxcui, nama: c.name })
  }
  daftar.sort((a, b) => a.nama.localeCompare(b.nama))
  cacheZat = { data: daftar, waktu: Date.now() }
  return daftar
}

/** Pencarian di dalam daftar lengkap itu — dipakai kotak cari di layar. */
export async function cariZatAktif(q: string, limit = 40): Promise<ZatAktif[]> {
  const kueri = q.trim().toLowerCase()
  const semua = await daftarSemuaZatAktif()
  if (!kueri) return semua.slice(0, limit)
  const mulai: ZatAktif[] = []
  const mengandung: ZatAktif[] = []
  for (const z of semua) {
    const n = z.nama.toLowerCase()
    if (n.startsWith(kueri)) mulai.push(z)
    else if (n.includes(kueri)) mengandung.push(z)
    if (mulai.length >= limit) break
  }
  return [...mulai, ...mengandung].slice(0, limit)
}
