// Validasi langganan Web Push. Klien mengirim PushSubscription.toJSON() ({ endpoint, expirationTime, keys: { p256dh, auth } });
// objek apa pun selain itu dulu disimpan apa adanya tanpa batas, sehingga satu akun bisa menggembungkan berkas data.
// Murni: tanpa DOM/jaringan. Gagal-tertutup; hanya kolom yang dikenal yang dipertahankan.

export const MAKS_ENDPOINT = 2048
export const MAKS_KUNCI = 256
export const MAKS_LANGGANAN_PER_AKUN = 20

export interface LanggananPush { endpoint: string; expirationTime: number | null; keys: { p256dh: string; auth: string } }

const teksSah = (nilai: unknown, maks: number): nilai is string => typeof nilai === 'string' && nilai.length > 0 && nilai.length <= maks

export function validasiLanggananPush(masukan: unknown): LanggananPush {
  if (!masukan || typeof masukan !== 'object' || Array.isArray(masukan)) throw new Error('subscription must be an object')
  const m = masukan as Record<string, unknown>
  if (!teksSah(m.endpoint, MAKS_ENDPOINT)) throw new Error('subscription endpoint is missing or too long')
  let alamat: URL
  try { alamat = new URL(m.endpoint) } catch { throw new Error('subscription endpoint must be a valid URL') }
  if (alamat.protocol !== 'https:') throw new Error('subscription endpoint must use https')
  const kunci = m.keys as Record<string, unknown> | undefined
  if (!kunci || typeof kunci !== 'object' || !teksSah(kunci.p256dh, MAKS_KUNCI) || !teksSah(kunci.auth, MAKS_KUNCI)) throw new Error('subscription keys are missing or invalid')
  const kedaluwarsa = m.expirationTime
  if (kedaluwarsa !== undefined && kedaluwarsa !== null && (typeof kedaluwarsa !== 'number' || !Number.isFinite(kedaluwarsa))) throw new Error('subscription expirationTime must be a number or null')
  return { endpoint: m.endpoint, expirationTime: typeof kedaluwarsa === 'number' ? kedaluwarsa : null, keys: { p256dh: kunci.p256dh, auth: kunci.auth } }
}

/** Daftar baru setelah menambah satu langganan: endpoint yang sama menggantikan (kunci terbaru), dan paling banyak MAKS terbaru yang dipertahankan. */
export function tambahkanLangganan(daftar: readonly LanggananPush[], baru: LanggananPush): LanggananPush[] {
  return [...daftar.filter((s) => s.endpoint !== baru.endpoint), baru].slice(-MAKS_LANGGANAN_PER_AKUN)
}
