#!/usr/bin/env node
// Menghitung struktur bernama di dalam setiap berkas atlas, lalu menuliskannya
// sebagai data.
//
// KENAPA DIHITUNG, BUKAN DIKETIK. Angka "2.234 bagian" pada layar atlas mana
// pun adalah klaim tentang isi berkasnya. Mengetiknya tangan berarti angka itu
// benar pada hari ditulis dan tidak ada yang tahu kapan ia mulai salah — geometri
// diganti, satu sistem diekspor ulang, dan layarnya tetap memamerkan angka lama.
//
// Berkas ini membaca GLB-nya sendiri: bongkahan JSON glTF, simpul yang benar-benar
// menunjuk ke mesh, dan namanya. Gerbang uji membaca ulang berkas yang sama dan
// menolak bila manifes ini tidak lagi cocok.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Simpul bantu bawaan Z-Anatomy yang bukan anatomi.
 *
 * "HOW TO ..." adalah papan petunjuk di dalam berkas aslinya. Menghitungnya
 * sebagai struktur akan menambah satu bagian tubuh yang tidak ada pada setiap
 * sistem.
 */
const BUKAN_ANATOMI = [/^HOW TO/i, /^Take a picture/i, /^Camera/i, /^Light/i, /^Empty/i]

export function namaStrukturDariGlb(buffer) {
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a binary glTF')
  let offset = 12
  let json = null
  while (offset < buffer.byteLength) {
    const panjang = dv.getUint32(offset, true)
    const jenis = dv.getUint32(offset + 4, true)
    if (jenis === 0x4e4f534a) {
      json = JSON.parse(new TextDecoder().decode(buffer.subarray(offset + 8, offset + 8 + panjang)))
      break
    }
    offset += 8 + panjang
  }
  if (!json) throw new Error('no JSON chunk')
  return (json.nodes ?? [])
    .filter((n) => n.mesh !== undefined && typeof n.name === 'string' && n.name.length > 0)
    .map((n) => n.name)
    .filter((n) => !BUKAN_ANATOMI.some((p) => p.test(n)))
}

export function hitungBerkas(relatif) {
  return namaStrukturDariGlb(readFileSync(join(akar, relatif))).length
}

const SISTEM = [
  ['surface', 'public/anatomy/surface.glb'],
  ['skeletal', 'public/anatomy/skeletal.glb'],
  ['muscular', 'public/anatomy/muscular.glb'],
  ['cardiovascular', 'public/anatomy/cardiovascular.glb'],
  ['nervous', 'public/anatomy/nervous.glb'],
  ['visceral', 'public/anatomy/visceral.glb'],
  ['lymphoid', 'public/anatomy/lymphoid.glb'],
]

export const SISTEM_ATLAS = SISTEM

if (process.argv[1] && process.argv[1].endsWith('jumlahAtlas.mjs')) {
  const per = {}
  for (const [kunci, berkas] of SISTEM) per[kunci] = hitungBerkas(berkas)
  const total = Object.values(per).reduce((a, b) => a + b, 0)
  const keluar = {
    _catatan:
      'Dihasilkan oleh scripts/bangun/jumlahAtlas.mjs dengan membaca berkas GLB-nya. Jangan disunting tangan; jalankan ulang skripnya.',
    sumber: 'Z-Anatomy (CC BY-SA 4.0), turunan BodyParts3D (CC BY-SA 2.1 JP). Lihat public/anatomy/CREDITS.txt.',
    perSistem: per,
    total,
  }
  writeFileSync(join(akar, 'src/data/jumlahAtlas.json'), `${JSON.stringify(keluar, null, 2)}\n`)
  console.log(`jumlahAtlas: ${total} struktur bernama`, per)
}
