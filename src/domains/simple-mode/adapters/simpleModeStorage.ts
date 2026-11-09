// Satu-satunya tempat I/O untuk Layar Sederhana. Penyimpanan bisa kosong/melempar
// (jendela privat, data diblokir): bacaan gagal = mati, tulisan gagal = dilaporkan.
import { parseSimpleStart, serializeSimpleStart, SIMPLE_MODE_STORAGE_KEY } from '../engine/simpleModePreference'

export function readSimpleStart(): boolean {
  try { return parseSimpleStart(localStorage.getItem(SIMPLE_MODE_STORAGE_KEY)) } catch { return false }
}

/** true bila tersimpan; false bila penyimpanan menolak (UI tidak boleh berpura-pura berhasil). */
export function writeSimpleStart(on: boolean): boolean {
  try { localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, serializeSimpleStart(on)); return readSimpleStart() === on } catch { return false }
}
