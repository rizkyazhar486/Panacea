import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const baca = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
const DOK = baca('docs/alpha/F2_MANUAL_QA_CHECKLIST.md')
const rutePages = (src, nama) => {
  const m = src.match(new RegExp(`const ${nama} = \\[([^\\]]+)\\]`))
  assert.ok(m, `${nama} tidak ditemukan`)
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}
const dokumenRute = (t) => {
  const baris = t.split('\n').find((l) => l.startsWith('Rute berikut'))
  assert.ok(baris, 'baris rute tidak ditemukan')
  return [...baris.matchAll(/`(#\/[^`]*)`/g)].map((x) => x[1])
}

test('rute_di_dokumen_sama_persis_dengan_rute_yang_diaudit_keyboard', () => {
  assert.deepEqual(dokumenRute(DOK), rutePages(baca('scripts/qa/keyboard-audit.mjs'), 'PAGES'))
})

test('rute_yang_diaudit_kontras_dan_screenshot_sama_dengan_keyboard', () => {
  const kb = rutePages(baca('scripts/qa/keyboard-audit.mjs'), 'PAGES')
  assert.deepEqual(rutePages(baca('scripts/qa/screenshot-regresi.mjs'), 'PAGES'), kb)
  const kon = baca('scripts/qa/kontras-wcag.mjs').match(/KONTRAS_PAGES \|\| '([^']+)'/)[1].split(',')
  assert.deepEqual(kon, kb)
})

test('semua_kolom_hasil_penguji_kosong_dan_tidak_diisi_ai', () => {
  const baris = DOK.split('\n').filter((l) => /^\| [KSV]\d+ \|/.test(l))
  assert.ok(baris.length >= 20, `terlalu sedikit baris pemeriksaan: ${baris.length}`)
  for (const l of baris) {
    const sel = l.split('|').map((s) => s.trim()).filter((s) => s !== '')
    assert.equal(sel[sel.length - 1], '______', `kolom hasil terisi atau bukan kosong: ${l.slice(0, 60)}`)
  }
})

test('status_f2_tetap_reported_dan_ada_batas_alat', () => {
  assert.match(DOK, /F2 tetap REPORTED/)
  assert.match(DOK, /tidak dapat\*\* dicakup alat|TIDAK tercakup alat/)
  for (const butir of ['Escape pada dialog', 'urutan fokus yang bermakna', 'pemulihan fokus', '1.504']) assert.ok(DOK.includes(butir), `batas alat hilang: ${butir}`)
})
