// Menangkap `folds=open` dari tautan SEKALI saat aplikasi mulai, lalu mengingatnya untuk sesi
// ini. Membaca hash saat komponen mount rapuh: rute/komponen lain dapat menulis ulang hash
// sebelum lipatan dirender, dan lipatan yang seharusnya terbuka tetap tertutup.
const KEY = 'pmd.folds'

export interface SessionLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** `hash` berbentuk "#/body-explorer?folds=open". Murni agar bisa diuji. */
export function foldsForcedOpen(hash: string): boolean {
  const q = hash.indexOf('?')
  if (q < 0) return false
  return new URLSearchParams(hash.slice(q + 1)).get('folds') === 'open'
}

/** Catat preferensi bila tautan memintanya; kembalikan apakah lipatan harus terbuka. */
export function foldsOpenForSession(hash: string, storage: SessionLike | null): boolean {
  const fromLink = foldsForcedOpen(hash)
  if (!storage) return fromLink
  try {
    if (fromLink) storage.setItem(KEY, 'open')
    return fromLink || storage.getItem(KEY) === 'open'
  } catch {
    return fromLink // penyimpanan diblokir: tautan saja yang berlaku
  }
}

export function captureFoldsPreference(): void {
  if (typeof window === 'undefined') return
  let storage: SessionLike | null = null
  try { storage = window.sessionStorage } catch { storage = null }
  foldsOpenForSession(window.location.hash, storage)
}
