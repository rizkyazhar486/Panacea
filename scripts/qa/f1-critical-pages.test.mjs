// T-F1-01 / ENG-F1-03: inventaris halaman kritis F1 = cakupan skrip ketahanan, dan tiap rute punya halaman nyata (bukan 404).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { coverageFromScript, diffInventory, resolvesToPage, routerTable } from './f1-critical-pages.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const inventory = JSON.parse(read('../../governance/F1_CRITICAL_PAGES.json'))
const script = read('./user-journey-resilience.mjs')
const e2e = read('./user-journey-e2e.mjs')
const table = routerTable(read('../../src/main.tsx'))

test('inventaris sama persis dengan rute per peran yang dijalani skrip ketahanan', () => {
  assert.deepEqual(diffInventory(inventory.resilience, coverageFromScript(script)), [])
})

test('rute perjalanan dasar masih dijalani user-journey-e2e', () => {
  for (const r of inventory.baseJourney) assert.ok(e2e.includes(`'${r}'`), `${r} tidak lagi dijalani user-journey-e2e`)
})

test('setiap rute inventaris menuju halaman nyata di router, bukan 404', () => {
  const all = [...new Set([...Object.values(inventory.resilience).flat(), ...inventory.baseJourney])]
  assert.ok(all.length >= 10, 'inventaris tidak boleh kosong')
  const mati = all.filter((r) => !resolvesToPage(r, table))
  assert.deepEqual(mati, [], `rute inventaris tanpa halaman: ${mati.join(', ')}`)
})

test('unit: selisih inventaris terdeteksi dua arah dan inventaris sama tidak menghasilkan selisih', () => {
  const cov = { pasien: ['#/', '#/settings'] }
  assert.deepEqual(diffInventory({ pasien: ['#/', '#/settings'] }, cov), [])
  assert.deepEqual(diffInventory({ pasien: ['#/', '#/settings', '#/profile'] }, cov), ['pasien: #/profile ada di inventaris tetapi tidak dijalani skrip'])
  assert.deepEqual(diffInventory({ pasien: ['#/'] }, cov), ['pasien: #/settings dijalani skrip tetapi tidak ada di inventaris'])
  assert.deepEqual(diffInventory({}, cov), ['pasien: #/ dijalani skrip tetapi tidak ada di inventaris', 'pasien: #/settings dijalani skrip tetapi tidak ada di inventaris'])
})

test('unit: skrip tanpa format dikenal fail-closed (inventaris tak bisa lolos dengan cakupan kosong)', () => {
  assert.deepEqual(coverageFromScript(''), {})
  assert.deepEqual(coverageFromScript(undefined), {})
  assert.ok(diffInventory({ pasien: ['#/'] }, coverageFromScript('')).length > 0)
})

test('unit: rute tanpa Route jatuh ke 404; alias dihitung hanya bila targetnya halaman; siklus ditolak', () => {
  const src = `<Route path="/a" element={<A />} />
    <Route path="/old" element={<Navigate to="/a" replace />} />
    <Route path="/loop1" element={<Navigate to="/loop2" replace />} />
    <Route path="/loop2" element={<Navigate to="/loop1" replace />} />
    <Route path="/dangling" element={<Navigate to="/nowhere" replace />} />
    <Route path="*" element={<NotFound />} />`
  const t = routerTable(src)
  assert.equal(resolvesToPage('#/a', t), true)
  assert.equal(resolvesToPage('#/old', t), true, 'alias ke halaman nyata')
  assert.equal(resolvesToPage('#/a?view=x', t), true, 'query diabaikan')
  assert.equal(resolvesToPage('#/missing', t), false, 'tanpa Route = 404 (jalur "*" tidak dihitung)')
  assert.equal(resolvesToPage('#/dangling', t), false, 'alias ke rute tak ada')
  assert.equal(resolvesToPage('#/loop1', t), false, 'siklus alias')
  assert.equal(resolvesToPage('', t), false)
  assert.equal(resolvesToPage(undefined, t), false)
})

test('regresi: /all-features menuju halaman nyata; tanpa redirect rute itu jatuh ke 404', () => {
  assert.equal(resolvesToPage('#/all-features', table), true)
  const tanpa = new Map(table); tanpa.delete('/all-features')
  assert.equal(resolvesToPage('#/all-features', tanpa), false, 'pasangan: hanya redirect yang membuatnya hidup')
  assert.equal(resolvesToPage('#/semua-fitur', tanpa), true)
})
