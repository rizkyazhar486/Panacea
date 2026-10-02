import type { Role } from '../lib/types'

export type NavPengaturan = { to: string; label: string; group: string; roles: Role[] }

/**
 * Dipakai layar "Atur Fitur" agar daftarnya berasal dari sumber yang sama
 * dengan menu. Daftar terpisah yang ditulis ulang pasti akan tertinggal.
 *
 * Deklarasinya di sini (bukan di Shell.tsx) supaya lib/ dan komponen kecil bisa
 * membacanya tanpa mengimpor Shell, yang memutus siklus Shell -> PencarianGlobal
 * -> Shell dan lib -> components. Shell yang MENGISI array ini saat dimuat.
 */
export const NAV_UNTUK_PENGATURAN: NavPengaturan[] = []
