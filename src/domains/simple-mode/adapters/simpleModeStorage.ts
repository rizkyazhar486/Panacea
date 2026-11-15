// Satu-satunya tempat I/O untuk Layar Sederhana. Penyimpanan bisa kosong/melempar
// (jendela privat, data diblokir): bacaan gagal = mati, tulisan gagal = dilaporkan.
//
// Layar pertama dan "teks & tombol besar" adalah SATU pilihan bagi orang yang kesulitan: memilih layar sederhana
// tanpa ikut membesarkan halaman tujuannya hanya memindahkan masalah satu ketukan. Karena itu pilihan ini juga
// menyalakan mode sederhana yang sudah ada (lib/theme: kelas `.simple-mode`, teks 19px, target 48px).
import { getSimpleMode, setSimpleMode } from '../../../lib/theme'
import { parseSimpleStart, serializeSimpleStart, SIMPLE_MODE_STORAGE_KEY } from '../engine/simpleModePreference'

export function readSimpleStart(): boolean {
  try { return parseSimpleStart(localStorage.getItem(SIMPLE_MODE_STORAGE_KEY)) } catch { return false }
}

/**
 * true bila KEDUANYA tersimpan; false bila penyimpanan menolak. Saat gagal, keadaan sebelumnya dipulihkan
 * (kelas di <html> dan kedua kunci): UI tidak boleh berpura-pura berhasil, dan tidak boleh meninggalkan separuh pilihan.
 */
export function writeSimpleStart(on: boolean): boolean {
  const sebelumnyaMulai = readSimpleStart()
  const sebelumnyaBesar = getSimpleMode()
  try {
    localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, serializeSimpleStart(on))
    setSimpleMode(on)
    if (readSimpleStart() === on && getSimpleMode() === on) return true
  } catch { /* jatuh ke pemulihan */ }
  try { localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, serializeSimpleStart(sebelumnyaMulai)) } catch { /* ignore */ }
  setSimpleMode(sebelumnyaBesar)
  return false
}
