// Penghitung lalu lintas keluar yang DIPRAKARSAI SERVER (fetch ke vendor), per host.
//
// Mengapa: 5,4 GB dari kuota Render Oktober 2026 sebagian besar bukan dari HTTP masuk, dan sumber
// dominannya belum terbukti. Tanpa angka per integrasi, mengoptimalkan hanya menebak.
// Yang dicatat hanya host, jumlah panggilan, byte badan permintaan yang diketahui, dan status galat.
// Tidak pernah: path, query (bisa memuat kunci), header, badan.
export interface EgressHost { host: string; panggilan: number; bytesBadan: number; badanTakDiketahui: number; galat: number }

const MAKS_HOST = 100
const per = new Map<string, EgressHost>()

export function aturUlangEgressKeluar() { per.clear() }
export function ringkasanEgressKeluar(top = 8): EgressHost[] {
  return [...per.values()].sort((a, b) => b.bytesBadan - a.bytesBadan || b.panggilan - a.panggilan).slice(0, Math.max(0, top))
}

function hostDari(input: unknown): string {
  try {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as { url?: string })?.url ?? ''
    return new URL(u).host.toLowerCase() || '(tak dikenal)'
  } catch { return '(tak dikenal)' }
}
/** Ukuran badan bila dapat diketahui tanpa membaca stream; null = tidak diketahui (bukan nol). */
export function ukuranBadan(body: unknown): number | null {
  if (body == null) return 0
  if (typeof body === 'string') return Buffer.byteLength(body)
  if (body instanceof Uint8Array) return body.byteLength
  if (body instanceof ArrayBuffer) return body.byteLength
  if (body instanceof URLSearchParams) return Buffer.byteLength(body.toString())
  return null
}

export function bungkusFetch(asli: typeof fetch): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const host = hostDari(input)
    const kunci = per.has(host) || per.size < MAKS_HOST ? host : '(lainnya)'
    const e = per.get(kunci) ?? { host: kunci, panggilan: 0, bytesBadan: 0, badanTakDiketahui: 0, galat: 0 }
    per.set(kunci, e)
    e.panggilan++
    const b = ukuranBadan(init?.body)
    if (b === null) e.badanTakDiketahui++; else e.bytesBadan += b
    try {
      const r = await asli(input, init)
      if (!r.ok) e.galat++
      return r
    } catch (err) { e.galat++; throw err }
  }) as typeof fetch
}
