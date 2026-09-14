// Muatan GLB yang tiba SESUDAH komponennya dilepas.
//
// CACATNYA TIDAK PERNAH TERLIHAT DI LAYAR, dan itulah sebabnya ia bertahan.
//
// GLTFLoader.load() bersifat asinkron. Berkas atlas di repositori ini
// berukuran megabyte, jadi pada telepon yang jaringannya biasa saja jeda
// antara permintaan dan callback-nya berlangsung beberapa detik. Bila dalam
// jeda itu pemakainya berpindah tab -- atau React memasang lalu melepas
// komponen dua kali, yang memang dilakukannya di mode ketat -- maka:
//
//   1. cleanup effect sudah berjalan dan sudah membuang renderer-nya;
//   2. callback-nya tetap dipanggil, karena tidak ada yang membatalkannya;
//   3. geometri hasil parse ditambahkan ke scene yang sudah mati;
//   4. TIDAK ADA LAGI yang akan membuangnya -- cleanup-nya sudah lewat.
//
// Hasilnya buffer GPU yang hidup sampai tab-nya ditutup. Tidak ada galat,
// tidak ada peringatan, dan layarnya tampak baik-baik saja karena komponennya
// memang sudah tidak terlihat.
//
// Berkas ini menyediakan satu benda kecil yang membuat pembatalan itu ADA,
// dan membuang muatan yang terlanjur tiba alih-alih membiarkannya menggantung.

import type { Object3D } from 'three'

export interface PenjagaMuatan {
  /** Benar selama komponennya masih hidup. */
  readonly hidup: boolean
  /** Dipanggil dari cleanup effect. Sesudah ini setiap muatan ditolak. */
  lepas(): void
  /**
   * Gerbang untuk callback GLTFLoader.
   *
   * Mengembalikan false bila komponennya sudah dilepas -- DAN membuang
   * muatan yang sudah terlanjur diparse, karena pemanggilnya tidak akan
   * pernah mendapat kesempatan lain untuk melakukannya.
   */
  terima(akar: Object3D | null | undefined): boolean
}

/**
 * Membuang geometri dan material sebuah subtree.
 *
 * Dipakai HANYA untuk muatan yang tiba sesudah pelepasan, yaitu muatan yang
 * dipastikan tidak dipakai siapa pun: ia belum pernah dipasang ke scene mana
 * pun yang hidup. Untuk subtree yang masih terpasang, pemiliknya yang
 * membuang, bukan berkas ini.
 */
export function buangSubtree(akar: Object3D): number {
  let jumlah = 0
  akar.traverse((o) => {
    const m = o as Object3D & {
      isMesh?: boolean
      geometry?: { dispose?: () => void }
      material?: { dispose?: () => void } | { dispose?: () => void }[]
    }
    if (!m.isMesh) return
    if (m.geometry?.dispose) { m.geometry.dispose(); jumlah++ }
    const b = m.material
    if (Array.isArray(b)) for (const x of b) x?.dispose?.()
    else b?.dispose?.()
  })
  return jumlah
}

export function penjagaMuatan(): PenjagaMuatan {
  let hidup = true
  return {
    get hidup() { return hidup },
    lepas() { hidup = false },
    terima(akar) {
      if (hidup) return true
      // Tiba terlambat. Membuangnya di sini adalah satu-satunya kesempatan
      // yang tersisa; membiarkannya berarti buffer GPU tanpa pemilik.
      if (akar) buangSubtree(akar)
      return false
    },
  }
}
