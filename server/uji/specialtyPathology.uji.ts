// Uji keterhubungan atlas spesialisasi.
//
// Tidak ada satu pun hal di bawah ini yang terlihat kalau salah: struktur yang
// salah ketik tidak pernah menyala, penyakit SKDI yang salah ketik menampilkan
// halaman kosong, dan modul tanpa struktur memuat berkas 0 byte. Semuanya
// tampil rapi. Hanya angka yang bisa membedakannya.

import {
  SYSTEM_CONDITIONS, strukturSistemTakDikenal, kondisiUntukModul,
  kondisiUntukStrukturSistem, strukturKondisiSistem,
} from '../../src/lib/specialtyPathology'
import { ATLAS_PARTS, ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'
import { SKDI_DISEASE_LIST } from '../../src/lib/skdiDiseaseList'
import { ORGAN_FOCUS } from '../../src/lib/organFocus'
import { existsSync, statSync } from 'node:fs'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

// ── Geometri ────────────────────────────────────────────────────────────────
const modul = Object.keys(ATLAS_MODULE_INFO)
ok('atlas memuat semua modul spesialisasi', modul.length >= 12, String(modul.length))
ok('tiap modul punya struktur', modul.every((m) => partsForModule(m).length > 0))
ok('setiap struktur punya garis tengah atau titik pusat',
  ATLAS_PARTS.every((p) => p.centroid.length === 3 && p.line.length >= 1))
for (const m of modul) {
  const berkas = new URL(`../../public/atlas/${m}.glb`, import.meta.url).pathname
  ok(`berkas ${m}.glb ada dan tidak kosong`, existsSync(berkas) && statSync(berkas).size > 10_000)
}

// ── Tautan ke struktur ──────────────────────────────────────────────────────
const hilang = strukturSistemTakDikenal()
ok('setiap struktur yang disebut patologi ada di modulnya', hilang.length === 0, hilang.join(' | '))

// ── Tautan ke korpus SKDI ───────────────────────────────────────────────────
const namaSkdi = new Set(SKDI_DISEASE_LIST.map((e: { disease: string }) => e.disease))
const skdiHilang = SYSTEM_CONDITIONS.flatMap((k) =>
  k.skdi.filter((n) => !namaSkdi.has(n)).map((n) => `${k.id}: ${n}`))
ok('setiap tautan penyakit SKDI benar-benar ada di daftarnya', skdiHilang.length === 0, skdiHilang.join(' | '))

// ── Tautan ke berkas organ ──────────────────────────────────────────────────
const kunciOrgan = new Set(ORGAN_FOCUS.map((o: { key: string }) => o.key))
const organHilang = SYSTEM_CONDITIONS.filter((k) => !kunciOrgan.has(k.organKey)).map((k) => `${k.id}: ${k.organKey}`)
ok('setiap keadaan menunjuk sasaran organ yang ada', organHilang.length === 0, organHilang.join(' | '))

// ── Bentuk data ─────────────────────────────────────────────────────────────
ok('id keadaan tidak kembar', new Set(SYSTEM_CONDITIONS.map((k) => k.id)).size === SYSTEM_CONDITIONS.length)
ok('setiap keadaan berada di modul yang dikenal', SYSTEM_CONDITIONS.every((k) => modul.includes(k.module)))
ok('setiap keadaan punya lesi, mekanisme, temuan, penunjang, dan tata laksana',
  SYSTEM_CONDITIONS.every((k) => k.lesi.length >= 1 && k.mekanisme.length > 120 &&
    k.temuan.length >= 2 && k.penunjang.length >= 1 && k.tata.length >= 2))
ok('derajat selalu antara 0 dan 1',
  SYSTEM_CONDITIONS.every((k) => k.lesi.every((l) => l.derajat === undefined || (l.derajat > 0 && l.derajat < 1))))

// Tiap modul harus benar-benar punya isi klinis; modul kosong adalah tab kosong.
for (const m of modul) {
  ok(`modul ${m} punya sedikitnya satu keadaan`, kondisiUntukModul(m).length >= 1,
    String(kondisiUntukModul(m).length))
}

// ── Arah pencarian yang dipakai pengguna ────────────────────────────────────
{
  const apx = kondisiUntukStrukturSistem('gastro', 'Appendix')
  ok('menyentuh apendiks memunculkan apendisitis',
    apx.some((x) => x.kondisi.id === 'appendicitis' && x.peran === 'lesi'))
  const ginjal = kondisiUntukStrukturSistem('nefrologi', 'Left kidney')
  ok('menyentuh ginjal memunculkan lebih dari satu keadaan', ginjal.length >= 3, String(ginjal.length))
  // Struktur bernama sama di modul berbeda tidak boleh saling bocor.
  const ginjalDiUro = kondisiUntukStrukturSistem('urogenital', 'Left kidney')
  ok('keadaan tidak bocor antar modul',
    ginjalDiUro.every((x) => x.kondisi.module === 'urogenital'))
}

ok('seluruh keadaan menyebut sedikitnya dua struktur',
  SYSTEM_CONDITIONS.every((k) => strukturKondisiSistem(k).length >= 2))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
