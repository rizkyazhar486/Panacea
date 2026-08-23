import { useSyncExternalStore } from 'react'
import { getLang, langgananBahasa, potretBahasa, type Lang } from './i18n'

/**
 * Membuat komponen menggambar ulang saat bahasanya berganti.
 *
 * Tanpa ini, mengganti bahasa hanya mengubah <html lang> dan memuat kamus —
 * sedangkan layar yang sedang terbuka tetap memakai kata-kata lama sampai
 * pemakainya kebetulan berpindah halaman. Yang terlihat: saklar bahasa yang
 * ditekan lalu "tidak berfungsi".
 */
export function useBahasa(): Lang {
  // Potretnya memuat nomor urut, supaya selesainya pemuatan kamus ikut
  // terhitung sebagai perubahan — lihat catatan pada potretBahasa().
  useSyncExternalStore(langgananBahasa, potretBahasa, () => 'en#0')
  return getLang()
}
