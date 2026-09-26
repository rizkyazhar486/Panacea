/**
 * Galat API yang membawa status HTTP dan ID korelasi server. Pesannya sama dengan
 * sebelumnya (kode galat server atau `HTTP <status>`), jadi pemanggil lama tetap
 * berfungsi; ID permintaan memungkinkan laporan pengguna dicocokkan dengan log server.
 */
export class GalatApi extends Error {
  constructor(message: string, readonly status: number, readonly requestId: string | null) {
    super(message)
    this.name = 'GalatApi'
  }
}
const POLA_ID_PERMINTAAN = /^[A-Za-z0-9._-]{8,64}$/
export function galatDariRespons(status: number, body: unknown, idHeader: string | null): GalatApi {
  const b = (body && typeof body === 'object' ? body : {}) as { error?: unknown; requestId?: unknown }
  const pesan = typeof b.error === 'string' && b.error ? b.error : `HTTP ${status}`
  const kandidat = idHeader ?? (typeof b.requestId === 'string' ? b.requestId : null)
  return new GalatApi(pesan, status, kandidat && POLA_ID_PERMINTAAN.test(kandidat) ? kandidat : null)
}
