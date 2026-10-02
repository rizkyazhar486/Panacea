// Mesin lokalisasi lesi neurologis.
//
// Pertanyaan yang dijawab: dari pola defisit yang DIJELASKAN, di mana satu lesi
// tunggal harus berada supaya pola itu muncul?
//
// Ini keterampilan klinis paling tua di neurologi dan satu-satunya bagian
// "mendeteksi lesi" yang boleh dikerjakan perangkat lunak pendidikan: ia
// menalar dari anatomi lintasan, bukan dari citra seseorang.
//
// BATAS, dan ini bukan basa-basi:
//
//   * Masukannya adalah pola defisit yang DIKETIK, bukan pasien. Tidak ada
//     pencitraan, tidak ada pemeriksaan, tidak ada rekam medis.
//   * Keluarannya adalah tempat yang KONSISTEN SECARA ANATOMIS, bukan
//     diagnosis. "Medula kiri" bukan jawaban atas "apa penyakitnya".
//   * Model ini menganggap SATU lesi. Banyak penyakit saraf tidak begitu.
//     Bila tidak ada tempat tunggal yang menjelaskan semuanya, itu dilaporkan
//     apa adanya, bukan dipaksakan ke tempat terbaik.
//
// CARA KERJANYA, dan kenapa begitu: sindrom bernama TIDAK ditulis di berkas
// ini. Yang ditulis hanya di mana setiap lintasan menyilang. Sindrom klasik
// -- Brown-Sequard, Wallenberg, Weber -- harus JATUH SENDIRI dari aturan
// penyilangan itu. Uji pendampingnya memeriksa persis itu. Kalau sindromnya
// dihafalkan di sini, mesin ini hanya tabel pencarian yang menyamar.

export type Sisi = 'kiri' | 'kanan'

/** Urut dari rostral ke kaudal. Urutan ini dipakai untuk menalar penyilangan. */
export type TingkatLesi =
  | 'korteks'
  | 'kapsula-interna'
  | 'midbrain'
  | 'pons'
  | 'medula'
  | 'medula-spinalis'

export const TINGKAT: TingkatLesi[] = [
  'korteks', 'kapsula-interna', 'midbrain', 'pons', 'medula', 'medula-spinalis',
]

export const NAMA_TINGKAT: Record<TingkatLesi, string> = {
  'korteks': 'Cortex',
  'kapsula-interna': 'Internal capsule',
  'midbrain': 'Midbrain',
  'pons': 'Pons',
  'medula': 'Medulla',
  'medula-spinalis': 'Spinal cord',
}

/**
 * Modalitas yang dimodelkan. Sengaja sedikit: tiga lintasan panjang yang
 * penyilangannya berbeda tempat, ditambah tanda saraf kranial. Justru
 * perbedaan tempat menyilang itulah yang membuat lokalisasi mungkin.
 */
export type Modalitas =
  /** Kortikospinal. Menyilang di piramis medula, di perbatasan medula-spinalis. */
  | 'motorik'
  /** Spinotalamikus. Menyilang DI DALAM medula spinalis, 1-2 segmen dari masuknya. */
  | 'nyeri-suhu'
  /** Kolumna dorsalis-lemniskus medialis. Menyilang di medula. */
  | 'getar-posisi'

export type Wilayah = 'wajah' | 'badan'

export interface Temuan {
  modalitas: Modalitas
  /** Sisi TUBUH tempat defisit terlihat. */
  sisi: Sisi
  wilayah: Wilayah
}

/** Tanda saraf kranial selalu ipsilateral bila nukleus atau fasikulusnya kena. */
export interface TemuanSarafKranial {
  /** Angka saraf kranial, 3-12. */
  saraf: number
  sisi: Sisi
}

const lawan = (s: Sisi): Sisi => (s === 'kiri' ? 'kanan' : 'kiri')

// Pengenal internal memakai bahasa Indonesia; kalimat alasan dibaca pengguna
// dan karena itu harus bahasa Inggris. Keduanya dipisah di sini, bukan dengan
// menerjemahkan pengenalnya -- pengenal adalah data, bukan teks antarmuka.
const KATA_SISI: Record<Sisi, string> = { kiri: 'left', kanan: 'right' }
const KATA_MODALITAS: Record<Modalitas, string> = {
  'motorik': 'weakness',
  'nyeri-suhu': 'pain and temperature loss',
  'getar-posisi': 'vibration and position loss',
}

/**
 * Tingkat tempat nukleus setiap saraf kranial berada.
 *
 * Inilah yang membuat "temuan bersilang" bisa menunjuk tingkat: wajah
 * ipsilateral berarti nukleus, dan nukleusnya ada di satu tingkat tertentu.
 */
export const TINGKAT_SARAF_KRANIAL: Record<number, TingkatLesi> = {
  3: 'midbrain', 4: 'midbrain',
  5: 'pons', 6: 'pons', 7: 'pons', 8: 'pons',
  9: 'medula', 10: 'medula', 11: 'medula', 12: 'medula',
}

/**
 * Apakah `tingkat` berada DI BAWAH tempat lintasan `m` menyilang?
 *
 * Ini satu-satunya pengetahuan anatomis di berkas ini, dan segalanya yang lain
 * diturunkan darinya.
 *
 * Perumusannya sengaja "di bawah dekusasi", bukan "sudah menyilang". Versi
 * pertama memakai perumusan yang kedua dan salah arah: untuk lintasan MENURUN
 * seperti kortikospinal, serat yang sudah menyilang justru melayani sisi yang
 * SAMA dengan lesi, sementara untuk lintasan MENAIK yang belum menyilang juga
 * melayani sisi yang sama. Dua arah lintasan yang berlawanan memberi aturan
 * ipsi/kontra yang sama hanya bila patokannya letak lesi terhadap dekusasi --
 * dan itu tidak terlihat sampai uji hemiseksi korda gagal dengan sisi terbalik.
 */
function diBawahDekusasi(m: Modalitas, tingkat: TingkatLesi): boolean {
  switch (m) {
    case 'motorik':
      // Kortikospinal menurun dan menyilang di piramis, di perbatasan
      // medula-medula spinalis. Hanya korda yang berada di bawahnya.
      return tingkat === 'medula-spinalis'
    case 'getar-posisi':
      // Kolumna dorsalis menaik ipsilateral lalu menyilang sebagai serat
      // arkuata interna di medula. Korda berada di bawah dekusasinya.
      return tingkat === 'medula-spinalis'
    case 'nyeri-suhu':
      // Spinotalamikus menyilang di dalam korda satu-dua segmen dari tempat
      // masuk, jadi tidak ada tingkat yang dimodelkan di sini yang berada di
      // bawahnya.
      return false
  }
}

/**
 * Sisi TUBUH yang terkena bila lesi berada di `sisi` pada `tingkat`.
 *
 * Lesi di bawah dekusasi mengenai sisi yang sama; di atasnya, sisi seberang.
 */
export function sisiTerkena(m: Modalitas, tingkat: TingkatLesi, sisiLesi: Sisi): Sisi {
  return diBawahDekusasi(m, tingkat) ? sisiLesi : lawan(sisiLesi)
}

export interface KandidatLesi {
  tingkat: TingkatLesi
  sisi: Sisi
  /** Temuan yang dijelaskan tempat ini. */
  cocok: number
  /** Temuan yang TIDAK dijelaskan tempat ini. */
  tidakCocok: number
  /** Alasan, satu baris per temuan, supaya bisa diperiksa manusia. */
  alasan: string[]
}

export interface HasilLokalisasi {
  kandidat: KandidatLesi[]
  /** Benar bila tidak ada satu tempat pun yang menjelaskan seluruh temuan. */
  tidakAdaLesiTunggal: boolean
  catatan: string[]
}

/**
 * Cari tempat yang konsisten dengan seluruh temuan.
 *
 * Model MAJU lalu dibalik: untuk setiap tempat yang mungkin, ramalkan pola
 * defisit yang seharusnya muncul, lalu bandingkan dengan yang diamati. Tidak
 * ada pencocokan sindrom di mana pun.
 */
export function lokalisasi(
  temuan: Temuan[],
  sarafKranial: TemuanSarafKranial[] = [],
): HasilLokalisasi {
  const kandidat: KandidatLesi[] = []
  const catatan: string[] = []

  for (const tingkat of TINGKAT) {
    for (const sisi of ['kiri', 'kanan'] as Sisi[]) {
      let cocok = 0, tidakCocok = 0
      const alasan: string[] = []

      for (const t of temuan) {
        if (t.wilayah === 'wajah') {
          // Defisit wajah pada lintasan panjang menuntut nukleus atau lintasan
          // wajah di batang otak. Di atas batang otak, wajah dan badan kena
          // bersama-sama dan tidak memisahkan tingkat, jadi tidak dihitung
          // sebagai bukti pemisah di sini.
          const diBatang = tingkat === 'midbrain' || tingkat === 'pons' || tingkat === 'medula'
          if (!diBatang) {
            tidakCocok++
            alasan.push(
              `facial ${KATA_MODALITAS[t.modalitas]} on the ${KATA_SISI[t.sisi]} is not explained outside the brainstem`,
            )
            continue
          }
          // Nukleus saraf kranial bersifat ipsilateral.
          if (t.sisi === sisi) {
            cocok++
            alasan.push(
              `facial ${KATA_MODALITAS[t.modalitas]} is ipsilateral to a ${NAMA_TINGKAT[tingkat]} lesion`,
            )
          } else {
            tidakCocok++
            alasan.push(
              `facial ${KATA_MODALITAS[t.modalitas]} on the ${KATA_SISI[t.sisi]} would be ipsilateral, not contralateral`,
            )
          }
          continue
        }

        const diramalkan = sisiTerkena(t.modalitas, tingkat, sisi)
        if (diramalkan === t.sisi) {
          cocok++
          alasan.push(
            `${KATA_MODALITAS[t.modalitas]} on the ${KATA_SISI[t.sisi]} body follows from a `
            + `${KATA_SISI[sisi]} ${NAMA_TINGKAT[tingkat]} lesion`,
          )
        } else {
          tidakCocok++
          alasan.push(
            `${KATA_MODALITAS[t.modalitas]} would appear on the ${KATA_SISI[diramalkan]} body, `
            + `not the ${KATA_SISI[t.sisi]}`,
          )
        }
      }

      for (const sk of sarafKranial) {
        const tingkatNukleus = TINGKAT_SARAF_KRANIAL[sk.saraf]
        if (!tingkatNukleus) {
          catatan.push(`Cranial nerve ${sk.saraf} is not modelled.`)
          continue
        }
        if (tingkatNukleus === tingkat && sk.sisi === sisi) {
          cocok++
          alasan.push(`CN ${sk.saraf} nucleus sits in the ${NAMA_TINGKAT[tingkat]}, ipsilateral`)
        } else {
          tidakCocok++
          alasan.push(
            `CN ${sk.saraf} points to the ${NAMA_TINGKAT[tingkatNukleus]} on the ${KATA_SISI[sk.sisi]}`,
          )
        }
      }

      kandidat.push({ tingkat, sisi, cocok, tidakCocok, alasan })
    }
  }

  kandidat.sort((a, b) => (b.cocok - b.tidakCocok) - (a.cocok - a.tidakCocok) || b.cocok - a.cocok)
  const total = temuan.length + sarafKranial.filter((s) => TINGKAT_SARAF_KRANIAL[s.saraf]).length
  const tidakAdaLesiTunggal = kandidat.length === 0 || kandidat[0].cocok < total

  if (tidakAdaLesiTunggal && total > 0) {
    catatan.push(
      'No single site accounts for every finding. A multifocal process, or a finding recorded on the wrong side, both look like this.',
    )
  }

  return { kandidat, tidakAdaLesiTunggal, catatan }
}

/** Tempat terbaik, atau null bila tidak ada yang menjelaskan seluruhnya. */
export function tempatTerbaik(hasil: HasilLokalisasi): KandidatLesi | null {
  if (hasil.tidakAdaLesiTunggal) return null
  return hasil.kandidat[0] ?? null
}

/**
 * Yang TIDAK dimodelkan, disebutkan supaya tidak diam-diam dianggap tercakup.
 *
 * Daftar ini dipakai antarmuka sebagai batas yang terlihat, bukan disimpan
 * sebagai komentar yang hanya dibaca pengembang.
 */
export const DI_LUAR_MODEL: string[] = [
  'Upper motor neuron facial weakness, which spares the forehead and does not localise like a nucleus',
  'Cerebellar signs, which localise by a different route entirely',
  'Spinal level determination from a sensory level on the trunk',
  'Cortical signs such as aphasia, neglect and visual field loss',
  'Anything requiring imaging, examination or a patient',
]
