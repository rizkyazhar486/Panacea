// Pengelompokan tab Body Exposure.
//
// Barisnya sudah tumbuh menjadi tiga puluh tab dalam satu penggulung mendatar.
// Luberan halamannya memang sudah diperbaiki, tetapi itu menyelesaikan masalah
// tata letak, bukan masalah manusia: tiga puluh keping dalam satu jalur berarti
// menemukan sesuatu menuntut menggulir buta melewati dua puluh nama yang tidak
// dicari. Di layar 390 piksel, hanya empat atau lima yang terlihat sekaligus.
//
// Yang PENTING pada berkas ini bukan daftarnya, melainkan perilaku
// cadangannya. Tab-tab baru ditambahkan terus-menerus, kadang oleh beberapa
// agen sekaligus, dan tab yang ditambahkan tanpa kelompok TIDAK BOLEH hilang
// dari antarmuka. Ia jatuh ke kelompok terakhir, dan sebuah uji menjaga itu --
// permukaan yang lenyap diam-diam karena sebuah peta lupa diperbarui adalah
// persis kegagalan sunyi yang berulang kali ditemukan di repositori ini.

export const KELOMPOK_LAIN = 'More'

/** Urutan kelompok seperti yang ditampilkan. */
export const URUTAN_KELOMPOK: readonly string[] = [
  'Explore',
  'Physiology',
  'Systems',
  'Clinical',
  'Reference',
  KELOMPOK_LAIN,
] as const

/**
 * Kunci tab -> kelompok.
 *
 * Kunci, bukan label: label adalah antarmuka dan diterjemahkan, kunci adalah
 * data dan tidak. Memetakan lewat label akan putus pada bahasa kedua.
 */
export const KELOMPOK_TAB: Readonly<Record<string, string>> = {
  // Melihat tubuh dan menggerakkannya.
  'layers': 'Explore',
  'muscles': 'Explore',
  'workout-sim': 'Explore',
  'organs': 'Explore',
  'simulator': 'Explore',
  'cari': 'Explore',

  // Yang dihitung dan dijalankan.
  'physiology': 'Physiology',
  'ventilasi': 'Physiology',
  'hemodinamik': 'Physiology',
  'nefron': 'Physiology',
  'asam-basa': 'Physiology',
  'farmakodinamik': 'Physiology',
  'sel': 'Physiology',

  // Sistem anatomi yang bisa ditunjuk pada model.
  'kerangka': 'Systems',
  'arteri': 'Systems',
  'limfe': 'Systems',
  'kelenjar-saluran': 'Systems',
  'wilayah-abdomen': 'Systems',
  'biomekanika': 'Systems',

  // Penalaran klinis dan tindakan.
  'lokalisasi': 'Clinical',
  'cardio': 'Clinical',
  'spesialisasi': 'Clinical',
  'bedah': 'Clinical',
  'diseases': 'Clinical',
  'drugs': 'Clinical',

  // Rujukan dan alat yang lebih dalam.
  'molekul': 'Reference',
  'genomik': 'Reference',
  'presisi': 'Reference',
  'mesin': 'Reference',
  'reference': 'Reference',
}

/**
 * Kelompok sebuah tab, dengan cadangan yang disengaja.
 *
 * Tab yang belum dipetakan tetap tampil, di kelompok terakhir. Alternatifnya --
 * menyembunyikannya sampai seseorang ingat memperbarui peta ini -- akan membuat
 * fitur yang sudah selesai tidak terjangkau tanpa satu pun galat.
 */
export function kelompokUntuk(kunci: string): string {
  return KELOMPOK_TAB[kunci] ?? KELOMPOK_LAIN
}

/** Kelompok yang benar-benar berisi tab, dalam urutan tampilan. */
export function kelompokTerpakai(kunciTab: readonly string[]): string[] {
  const ada = new Set(kunciTab.map(kelompokUntuk))
  return URUTAN_KELOMPOK.filter((k) => ada.has(k))
}
