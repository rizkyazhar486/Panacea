import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

// Satu cara memuat berkas atlas, karena setiap cara lain sudah gagal diam-diam.
//
// Lima kegagalan berbeda ditemukan di repositori ini dalam satu rangkaian
// kerja, dan TIDAK SATU PUN melempar galat. Semuanya menghasilkan gambar yang
// meyakinkan dan kosong, atau gambar yang menyala di tempat yang keliru:
//
//   1. Berkas atlas terkompresi meshopt. Tanpa dekodernya, GLTFLoader menolak
//      berkasnya sama sekali. Terjadi dua kali: sekali saat panel ventilasi
//      dibangun, sekali lagi pada DigestiveFlow3D yang sudah masuk ke main.
//   2. GLTFLoader menyanitasi nama simpul, dan aturannya BERBEDA ANTAR VERSI
//      three. Mencocokkan dengan aturan yang salah mengikat nol mesh.
//   3. Titik pemisah dibuang, sehingga "Femur.l" dan "Femur.r" tiba dengan
//      nama yang sama dan hanya dibedakan akhiran angka yang urutannya tidak
//      dijamin apa pun. Sisi tidak bisa dipulihkan dari nama scene.
//   4. Nama yang tidak cocok dengan apa pun tidak menghasilkan galat.
//   5. Kegagalan memuat tanpa callback galat tidak muncul di mana pun.
//
// Modul ini menutup kelimanya di satu tempat: dekoder selalu terpasang, nama
// ASLI dipulihkan lewat parser.associations sebelum informasinya hilang, dan
// kegagalan memuat menjadi Promise yang ditolak alih-alih kesunyian.

export interface AtlasDimuat {
  scene: THREE.Group
  /**
   * Nama asli tiap objek, persis seperti di berkas -- spasi, titik, ".l"/".r"
   * utuh. Inilah satu-satunya identitas yang boleh dipakai untuk mencocokkan.
   */
  namaAsli: Map<THREE.Object3D, string>
}

/**
 * Nama asli sebuah objek, menelusuri ke induk bila perlu.
 *
 * Mesh dengan beberapa primitive dipecah loader menjadi beberapa Mesh anak di
 * bawah satu Group; anaknya tidak selalu punya association sendiri, sedangkan
 * induknya punya.
 */
export function namaAtlas(peta: Map<THREE.Object3D, string>, obj: THREE.Object3D): string {
  const langsung = peta.get(obj)
  if (langsung) return langsung
  const induk = obj.parent
  if (induk) {
    const dariInduk = peta.get(induk)
    if (dariInduk) return dariInduk
  }
  return obj.name
}

/**
 * Kunci pencocokan yang tahan terhadap aturan sanitasi mana pun.
 *
 * Dipakai hanya sebagai CADANGAN, untuk pemanggil yang terpaksa mencocokkan
 * nama scene. Bila nama asli tersedia, cocokkan dengan nama asli.
 */
export function kunciAtlas(nama: string): string {
  return nama.toLowerCase().replace(/_\d+$/, '').replace(/[^a-z0-9]/g, '')
}

let dipakaiBersama: GLTFLoader | null = null

function pemuat(): GLTFLoader {
  if (!dipakaiBersama) {
    dipakaiBersama = new GLTFLoader()
    dipakaiBersama.setMeshoptDecoder(MeshoptDecoder)
  }
  return dipakaiBersama
}

export interface OpsiMuat {
  /** Dipanggil dengan pecahan 0..1 saat berkasnya diunduh. */
  onKemajuan?: (pecahan: number) => void
}

/**
 * Muat satu berkas atlas dari public/anatomy.
 *
 * `berkas` adalah nama berkasnya saja, misalnya 'visceral.glb'. Promise-nya
 * DITOLAK saat gagal, jadi pemanggil yang lupa menanganinya akan melihat
 * unhandled rejection alih-alih kanvas kosong tanpa penjelasan.
 */
export function muatAtlas(berkas: string, opsi: OpsiMuat = {}): Promise<AtlasDimuat> {
  return new Promise((selesai, tolak) => {
    pemuat().load(
      `${import.meta.env.BASE_URL}anatomy/${berkas}`,
      (gltf) => {
        const simpul = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
        const namaAsli = new Map<THREE.Object3D, string>()
        gltf.scene.traverse((o) => {
          const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
          const idx = assoc?.nodes
          const nama = idx !== undefined ? simpul?.[idx]?.name : undefined
          if (nama) namaAsli.set(o, nama)
        })
        selesai({ scene: gltf.scene, namaAsli })
      },
      (ev) => {
        if (ev.total > 0) opsi.onKemajuan?.(ev.loaded / ev.total)
      },
      (e) => tolak(e instanceof Error ? e : new Error(`Gagal memuat ${berkas}`)),
    )
  })
}
