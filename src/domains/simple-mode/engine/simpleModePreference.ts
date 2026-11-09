// Preferensi tampilan murni (bukan data klinis): apakah Layar Sederhana jadi layar pertama.
// Gagal tertutup: hanya nilai persis '1' yang berarti aktif; apa pun selain itu = mati.
export const SIMPLE_MODE_STORAGE_KEY = 'panacea.simpleStart.v1'

export function parseSimpleStart(raw: unknown): boolean {
  return raw === '1'
}

export function serializeSimpleStart(on: boolean): string {
  return on === true ? '1' : '0'
}
