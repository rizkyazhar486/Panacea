// Ikatan segmen ventilasi ke mesh bronkus segmental yang benar-benar ADA.
//
// Parenkim per segmen TIDAK dikirim sebagai geometri: node "Apical segment of
// right lung (SI)" di visceral.glb hanyalah pivot berlabel tanpa mesh. Yang
// dikirim adalah BRONKUS segmentalnya, dua puluh buah, masing-masing sebagai
// mesh tersendiri.
//
// Itu justru objek yang benar untuk diwarnai di sini. Model resistensinya
// adalah resistensi JALAN NAPAS -- R sebanding 1/r^4 pada radius bronkus --
// jadi mewarnai bronkus memperlihatkan tempat perlambatan itu sebenarnya
// terjadi. Mewarnai parenkim akan berarti mengarang geometri yang tidak
// dikirim, dan gambar yang mengarang adalah gambar yang berbohong.
//
// Satu segmen boleh memetakan ke lebih dari satu mesh: paru kiri mengirim
// BVII dan BVIII terpisah plus satu varian anteromedial, sementara model
// ventilasi menyatukannya sebagai S7+8 seperti kebiasaan klinis.

export interface IkatanBronkus {
  /** id segmen di SEGMEN_VENTILASI. */
  segmen: string
  /** Nama node persis seperti di visceral.glb. */
  mesh: readonly string[]
}

export const BERKAS_BRONKUS = 'anatomy/visceral.glb'

export const IKATAN_BRONKUS: readonly IkatanBronkus[] = [
  { segmen: 'resp:segment:r-s1', mesh: ['Apical segmental bronchus of right lung (BI)'] },
  { segmen: 'resp:segment:r-s2', mesh: ['Posterior segmental bronchus of right lung (BII)'] },
  { segmen: 'resp:segment:r-s3', mesh: ['Anterior segmental bronchus of right lung (BIII)'] },
  { segmen: 'resp:segment:r-s4', mesh: ['Lateral segmental bronchus of right lung (BIV)'] },
  { segmen: 'resp:segment:r-s5', mesh: ['Medial segmental bronchus of right lung (BV)'] },
  { segmen: 'resp:segment:r-s6', mesh: ['Superior segmental bronchus of right lung (BVI)'] },
  { segmen: 'resp:segment:r-s7', mesh: ['Medial basal segmental bronchus of right lung (BVII)'] },
  { segmen: 'resp:segment:r-s8', mesh: ['Anterior basal segmental bronchus of right lung (BVIII)'] },
  { segmen: 'resp:segment:r-s9', mesh: ['Lateral basal segmental bronchus of right lung (BIX)'] },
  { segmen: 'resp:segment:r-s10', mesh: ['Posterior basal segmental bronchus of right lung (BX)'] },

  { segmen: 'resp:segment:l-s1-2', mesh: ['Apicoposterior segmental bronchus of left lung (BI+BII)'] },
  { segmen: 'resp:segment:l-s3', mesh: ['Anterior segmental bronchus of left lung (BIII)'] },
  { segmen: 'resp:segment:l-s4', mesh: ['Superior lingular segmental bronchus of left lung (BIV)'] },
  { segmen: 'resp:segment:l-s5', mesh: ['Inferior lingular segmental bronchus of left lung (BV)'] },
  { segmen: 'resp:segment:l-s6', mesh: ['Superior segmental bronchus of left lung (BVI)'] },
  {
    // S7+8 kiri disatukan secara klinis; atlas mengirim ketiga varian terpisah.
    segmen: 'resp:segment:l-s7-8',
    mesh: [
      'Medial basal segmental bronchus of left lung (BVII)',
      'Anterior basal segmental bronchus of left lung (BVIII)',
      '(Anteromedial basal segmental bronchus of left lung)',
    ],
  },
  { segmen: 'resp:segment:l-s9', mesh: ['Lateral basal segmental bronchus of left lung (BIX)'] },
  { segmen: 'resp:segment:l-s10', mesh: ['Posterior basal segmental bronchus of left lung (BX)'] },
] as const

/**
 * Kunci pencocokan yang tahan terhadap cara loader menulis ulang nama.
 *
 * Ini bukan detail kosmetik. GLTFLoader menyanitasi nama simpul, dan ATURANNYA
 * BERBEDA ANTAR VERSI: three r185 hanya mengganti spasi dengan garis bawah dan
 * MEMPERTAHANKAN tanda kurung, sementara penyanitas yang lebih tua di repo ini
 * juga membuang tanda kurung. Versi pertama modul ini memakai aturan yang lebih
 * tua, dan hasilnya nol bronkus berwarna -- tanpa satu pun pengecualian, tanpa
 * satu pun galat konsol. Sebuah viewer 3D gagal dengan sunyi.
 *
 * Karena itu kedua sisi dinormalkan alih-alih ditebak: huruf dan angka saja,
 * huruf kecil. Aturan penyanitas mana pun yang dipakai three besok, kuncinya
 * tetap sama. Injektivitasnya dijaga uji, jadi normalisasi ini tidak bisa
 * diam-diam menggabungkan dua bronkus jadi satu.
 */
export function kunciNama(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Peta kunci nama mesh -> id segmen, untuk pewarnaan saat menelusuri scene.
 *
 * Panggil dengan `kunciNama(mesh.name)`, bukan dengan nama mentah.
 */
export function petaMeshKeSegmen(): Map<string, string> {
  const peta = new Map<string, string>()
  for (const ikatan of IKATAN_BRONKUS) {
    for (const nama of ikatan.mesh) peta.set(kunciNama(nama), ikatan.segmen)
  }
  return peta
}
