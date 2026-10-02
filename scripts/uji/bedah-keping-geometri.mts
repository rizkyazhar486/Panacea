import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  SURGICAL_PROCEDURES, SURGICAL_STRUCTURES_WITHOUT_GEOMETRY, alasanTanpaGeometri,
} from '../../src/lib/surgicalAtlas.ts'

// Antarmuka tidak boleh menampilkan dua hal berbeda secara identik.
//
// "Ureter" punya mesh dan bisa disorot pada model. "Recurrent laryngeal nerve"
// tidak dikirim sama sekali. Sampai sekarang keduanya digambar sebagai keping
// yang sama persis, di EMPAT permukaan bedah yang berbeda, sehingga pembacanya
// tidak punya cara untuk membedakan apa yang bisa ditunjuk dari apa yang hanya
// bisa disebut.
//
// Kegagalan yang dijaga di sini bukan "tandanya salah warna" melainkan SATU
// permukaan diperbaiki dan tiga lainnya tetap berbohong. Karena itu daftar
// permukaannya dibaca dari direktori, bukan ditulis tangan: permukaan bedah
// baru yang menggambar structuresAtRisk akan langsung ditagih.

const DIR = 'src/components/digital-twin'

const berkas = readdirSync(DIR).filter((f) => f.endsWith('.tsx'))
const penggambar = berkas.filter((f) => readFileSync(join(DIR, f), 'utf8').includes('structuresAtRisk'))
assert.ok(
  penggambar.length >= 4,
  `only ${penggambar.length} surfaces render structuresAtRisk; the scan is probably broken`,
)

// ── 1. Setiap permukaan memakai keping bersama ────────────────────────────
for (const f of penggambar) {
  const isi = readFileSync(join(DIR, f), 'utf8')
  assert.ok(
    isi.includes('KepingStrukturRisiko'),
    `${f} renders structuresAtRisk without the shared chip, so a structure with no geometry ` +
    'looks exactly like one that has it. Fixing one surface and leaving the others is the defect this guards.',
  )
}

// ── 2. Keping bersama benar-benar MENANDAI, dan menandai untuk pembaca layar ─
{
  const chip = readFileSync(join(DIR, 'KepingStrukturRisiko.tsx'), 'utf8')
  assert.ok(chip.includes('alasanTanpaGeometri'), 'the chip must ask the data, not keep its own list')
  assert.ok(chip.includes('sr-only'), 'the distinction must reach screen readers, not only sighted users')
  assert.ok(chip.includes('title='), 'the reason must be available on the chip itself')
  // Warna/opasitas saja tidak cukup: harus ada penanda yang bisa dicari.
  assert.ok(chip.includes('TANDA_TANPA_GEOMETRI'), 'the chip must carry a searchable marker attribute')
}

// ── 3. Jawaban helper harus sama dengan daftar yang dijaga gerbang lain ────
//
// Daftar itu sendiri sudah dijaga DUA ARAH terhadap berkas GLB oleh
// bedah-struktur-risiko.mts, jadi kalau helper ini setuju dengannya, ia tidak
// bisa menyimpang dari geometri yang benar-benar dikirim.
{
  for (const d of SURGICAL_STRUCTURES_WITHOUT_GEOMETRY) {
    assert.equal(alasanTanpaGeometri(d.structure), d.reason, `helper disagrees for "${d.structure}"`)
  }
  const semua = new Set<string>()
  for (const p of SURGICAL_PROCEDURES) for (const f of p.phases) for (const s of f.structuresAtRisk) semua.add(s)
  const ditandai = [...semua].filter((s) => alasanTanpaGeometri(s) !== null)
  const polos = [...semua].filter((s) => alasanTanpaGeometri(s) === null)
  assert.ok(ditandai.length > 0, 'nothing is marked; the helper is probably returning null for everything')
  assert.ok(polos.length > 0, 'everything is marked; the helper is probably returning a reason for everything')
  // Kontrol positif dan negatif dengan nama sungguhan.
  assert.ok(alasanTanpaGeometri('Recurrent laryngeal nerve'), 'a structure known to be absent must be marked')
  assert.equal(alasanTanpaGeometri('Ureter'), null, 'a structure known to be shipped must NOT be marked')
  assert.equal(alasanTanpaGeometri('Bukan struktur apa pun'), null, 'an unknown name must not invent a reason')

  console.log(
    `OK bedah-keping-geometri: ${penggambar.length} permukaan bedah memakai keping bersama; ` +
    `${ditandai.length} dari ${semua.size} struktur ditandai tanpa geometri dan ${polos.length} tampil polos, ` +
    'penandanya sampai ke pembaca layar, dan jawabannya terikat pada daftar yang dijaga terhadap berkas GLB.',
  )
}
