// Pengukur trafik yang DIMULAI server (fetch keluar), per host.
//
// Render menangguhkan workspace gratis karena kuota bandwidth; dasbornya menyebut
// sebagian besar trafik "service-initiated", bukan respons HTTP ke pengguna. Tanpa
// angka per host, penyebabnya hanya bisa ditebak. Modul ini mengukur, tidak mengubah
// perilaku: fetch asli tetap dipanggil dengan argumen yang sama dan hasilnya diteruskan.
//
// Yang dicatat hanya NAMA HOST, jumlah permintaan, byte badan permintaan yang diketahui
// dan byte respons dari header content-length. Tidak pernah jalur, query string, header
// atau badan (token dan data pasien bisa ada di sana). Badan respons tidak dibaca: respons
// tanpa content-length dihitung terpisah sebagai "tanpaPanjang", tidak ditebak ukurannya.
// Trafik di luar fetch (driver MongoDB, Web Push bila tidak memakai fetch) TIDAK terukur.

export interface CatatanHost { permintaan: number; byteKirim: number; byteTerima: number; tanpaPanjang: number }
export type Meter = Map<string, CatatanHost>

export function buatMeter(): Meter { return new Map() }

const angkaSah = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0

export function catatTrafik(meter: Meter, host: string, byteKirim: number | null, byteTerima: number | null): void {
  if (typeof host !== 'string' || !host) return
  const c = meter.get(host) ?? { permintaan: 0, byteKirim: 0, byteTerima: 0, tanpaPanjang: 0 }
  c.permintaan += 1
  if (angkaSah(byteKirim)) c.byteKirim += byteKirim
  if (angkaSah(byteTerima)) c.byteTerima += byteTerima
  else c.tanpaPanjang += 1
  meter.set(host, c)
}

/** Host dari argumen fetch; null bila tidak dapat diurai (tidak pernah melempar). */
export function hostDari(input: unknown): string | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as { url?: unknown })?.url
    if (typeof raw !== 'string') return null
    return new URL(raw).host || null
  } catch { return null }
}

/** Ukuran badan permintaan bila jenisnya dapat diukur tanpa membacanya; selain itu null. */
export function ukuranBadan(body: unknown): number | null {
  if (body == null) return 0
  if (typeof body === 'string') return Buffer.byteLength(body)
  if (body instanceof ArrayBuffer) return body.byteLength
  if (ArrayBuffer.isView(body)) return body.byteLength
  return null
}

export function panjangRespons(res: { headers?: { get?: (k: string) => string | null } } | null | undefined): number | null {
  const v = res?.headers?.get?.('content-length')
  if (v == null || !/^\d+$/.test(v)) return null
  return Number(v)
}

type FetchFn = (input: any, init?: any) => Promise<any>

/** Bungkus fetch: memanggil `asli` apa adanya dan mencatat trafik; kegagalan jaringan tetap dilempar ulang. */
export function bungkusFetch(asli: FetchFn, meter: Meter): FetchFn {
  return async (input, init) => {
    const host = hostDari(input)
    const kirim = ukuranBadan(init?.body)
    try {
      const res = await asli(input, init)
      if (host) catatTrafik(meter, host, kirim, panjangRespons(res))
      return res
    } catch (e) {
      if (host) catatTrafik(meter, host, kirim, 0)
      throw e
    }
  }
}

export interface BarisRingkasan extends CatatanHost { host: string }

/** Host teratas menurut total byte terukur (seri: lebih banyak permintaan dulu, lalu nama host). */
export function ringkasanTrafik(meter: Meter, batas = 10): BarisRingkasan[] {
  const n = Number.isInteger(batas) && batas > 0 ? batas : 10
  return [...meter.entries()]
    .map(([host, c]) => ({ host, ...c }))
    .sort((a, b) => (b.byteKirim + b.byteTerima) - (a.byteKirim + a.byteTerima) || b.permintaan - a.permintaan || a.host.localeCompare(b.host))
    .slice(0, n)
}
