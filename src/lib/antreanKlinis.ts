// Antrean sinkron untuk tulisan klinis (pasien, rekam AI-EMR, vital, penunjang, edukasi).
//
// Sebelumnya setiap tulisan ke server memakai `.catch(() => {})`: bila gagal,
// klinisi tidak diberi tahu dan mengira catatan tersimpan. Sekarang:
// - galat JARINGAN → diantre di perangkat, dikirim ulang saat muat & saat online;
// - PENOLAKAN server (mis. 403 tanpa akses, 400) → tidak diantre (mengirim ulang
//   tidak mengubahnya), ditampilkan sebagai galat;
// - simpan rekam/edukasi (upsert) untuk pasien yang sama menggantikan versi antre
//   yang lebih lama; tambah vital/penunjang/pasien dideduplikasi server per id.
export type JenisOperasi = 'patient' | 'vital' | 'supportive' | 'record' | 'education'
export interface OperasiKlinis { opId: string; jenis: JenisOperasi; patientId: string; payload: unknown; dibuat: string }
export interface Penyimpan { getItem(k: string): string | null; setItem(k: string, v: string): void }
export type Kirim = (op: OperasiKlinis) => Promise<unknown>
export type TerimaBalasan = (op: OperasiKlinis, hasil: unknown) => void

export const KUNCI_ANTREAN_KLINIS = 'pmd_antrean_klinis_v1'
export const KUNCI_GALAT_KLINIS = 'pmd_galat_klinis_v1'
export const PERISTIWA_SINKRON = 'panacea:sinkron-klinis'
const UPSERT: readonly JenisOperasi[] = ['record', 'education']

export const galatJaringan = (e: unknown) => e instanceof TypeError

export function bacaAntrean(s: Penyimpan): OperasiKlinis[] {
  try { const v = JSON.parse(s.getItem(KUNCI_ANTREAN_KLINIS) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
const tulis = (s: Penyimpan, a: OperasiKlinis[]) => s.setItem(KUNCI_ANTREAN_KLINIS, JSON.stringify(a))

export function antrekan(s: Penyimpan, op: OperasiKlinis): void {
  const lama = bacaAntrean(s).filter((x) => !(UPSERT.includes(op.jenis) && x.jenis === op.jenis && x.patientId === op.patientId))
  tulis(s, [...lama, op])
}

export function catatGalat(s: Penyimpan, pesan: string | null): void {
  s.setItem(KUNCI_GALAT_KLINIS, pesan ? JSON.stringify({ pesan, waktu: new Date().toISOString() }) : '')
}
export function bacaGalat(s: Penyimpan): { pesan: string; waktu: string } | null {
  try { const v = s.getItem(KUNCI_GALAT_KLINIS); return v ? JSON.parse(v) : null } catch { return null }
}

export async function kirimAtauAntre(s: Penyimpan, op: OperasiKlinis, kirim: Kirim, terima?: TerimaBalasan): Promise<'terkirim' | 'diantre' | 'ditolak'> {
  try { const hasil = await kirim(op); terima?.(op, hasil); return 'terkirim' } catch (e) {
    if (galatJaringan(e)) { antrekan(s, op); return 'diantre' }
    catatGalat(s, `${op.jenis} for ${op.patientId}: ${(e as Error).message}`)
    return 'ditolak'
  }
}

/** Kirim ulang berurutan; berhenti pada galat jaringan pertama. Penolakan dibuang & dicatat. */
export async function kurasAntrean(s: Penyimpan, kirim: Kirim, terima?: TerimaBalasan): Promise<{ terkirim: number; ditolak: number; sisa: number }> {
  let terkirim = 0, ditolak = 0
  for (const op of bacaAntrean(s)) {
    try { const hasil = await kirim(op); terima?.(op, hasil); terkirim++ } catch (e) {
      if (galatJaringan(e)) break
      ditolak++; catatGalat(s, `${op.jenis} for ${op.patientId}: ${(e as Error).message}`)
    }
    tulis(s, bacaAntrean(s).filter((x) => x.opId !== op.opId))
  }
  return { terkirim, ditolak, sisa: bacaAntrean(s).length }
}
