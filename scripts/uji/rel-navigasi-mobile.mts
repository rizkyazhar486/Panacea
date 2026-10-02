import assert from 'node:assert/strict'
import { hitungScrollAgarTerlihat } from '../../src/lib/railViewport.ts'

const tetap = hitungScrollAgarTerlihat({
  viewportWidth: 240,
  scrollWidth: 500,
  itemLeft: 120,
  itemWidth: 70,
  currentScrollLeft: 60,
})
assert.equal(tetap, 60, 'target yang sudah terlihat tidak boleh membuat rail bergeser')

const kanan = hitungScrollAgarTerlihat({
  viewportWidth: 240,
  scrollWidth: 500,
  itemLeft: 300,
  itemWidth: 70,
  currentScrollLeft: 0,
})
assert.equal(kanan, 215, 'target yang terpotong di kanan harus dipusatkan')

const kiri = hitungScrollAgarTerlihat({
  viewportWidth: 240,
  scrollWidth: 500,
  itemLeft: 40,
  itemWidth: 70,
  currentScrollLeft: 200,
})
assert.equal(kiri, 0, 'target dekat awal harus diklem ke scroll 0')

const ujung = hitungScrollAgarTerlihat({
  viewportWidth: 240,
  scrollWidth: 500,
  itemLeft: 460,
  itemWidth: 60,
  currentScrollLeft: 0,
})
assert.equal(ujung, 260, 'target dekat akhir harus diklem ke scroll maksimum')

console.log('4 lulus, 0 gagal')
