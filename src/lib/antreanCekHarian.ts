// Antrean offline untuk cek harian. Jawaban yang gagal terkirim KARENA JARINGAN
// disimpan di perangkat dan dikirim ulang saat online; penolakan dari server
// (4xx: rencana dicabut, jawaban tak cocok) TIDAK diantre — pesannya
// ditampilkan, karena mengirim ulang tidak akan mengubah hasilnya.
// Setiap butir membawa clientId, sehingga server tidak menggandakan laporan
// bila respons pertama hilang di jalan.

export const KUNCI_ANTREAN = 'pmd_cek_harian_antre_v1'
export interface ButirAntrean {
  clientId: string; planId: string; scheduledFor: string; authoredAt: string
  answers: { questionId: string; value: boolean | number | string }[]
}
export interface Penyimpan { getItem(k: string): string | null; setItem(k: string, v: string): void }
export type Kirim = (b: ButirAntrean) => Promise<unknown>

/** fetch() melempar TypeError bila jaringan gagal; galat HTTP dari api.ts adalah Error biasa. */
export const galatJaringan = (e: unknown) => e instanceof TypeError

export function bacaAntrean(s: Penyimpan): ButirAntrean[] {
  try { const v = JSON.parse(s.getItem(KUNCI_ANTREAN) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
const tulis = (s: Penyimpan, a: ButirAntrean[]) => s.setItem(KUNCI_ANTREAN, JSON.stringify(a))

export function buatClientId(): string {
  const b = new Uint8Array(12); crypto.getRandomValues(b)
  return 'c' + [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Satu laporan per rencana per hari: butir baru menggantikan yang lama untuk hari itu. */
export function antrekan(s: Penyimpan, b: ButirAntrean): void {
  tulis(s, [...bacaAntrean(s).filter((x) => !(x.planId === b.planId && x.scheduledFor === b.scheduledFor)), b])
}

export type HasilKirim = { status: 'terkirim' } | { status: 'diantre' } | { status: 'ditolak'; pesan: string }

export async function kirimAtauAntre(s: Penyimpan, b: ButirAntrean, kirim: Kirim): Promise<HasilKirim> {
  try { await kirim(b); return { status: 'terkirim' } } catch (e) {
    if (galatJaringan(e)) { antrekan(s, b); return { status: 'diantre' } }
    return { status: 'ditolak', pesan: (e as Error).message }
  }
}

/** Kirim ulang semua butir berurutan. Berhenti di galat jaringan pertama (masih offline);
 *  butir yang ditolak server dibuang dan dilaporkan. */
export async function kurasAntrean(s: Penyimpan, kirim: Kirim): Promise<{ terkirim: number; ditolak: string[]; sisa: number }> {
  let terkirim = 0; const ditolak: string[] = []
  for (const b of bacaAntrean(s)) {
    try { await kirim(b); terkirim++ } catch (e) {
      if (galatJaringan(e)) break
      ditolak.push((e as Error).message)
    }
    tulis(s, bacaAntrean(s).filter((x) => x.clientId !== b.clientId))
  }
  return { terkirim, ditolak, sisa: bacaAntrean(s).length }
}
