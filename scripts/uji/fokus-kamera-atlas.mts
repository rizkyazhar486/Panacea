// Fokus kamera atlas: matrixWorld dipaksa (three r185 tidak menghitung ulang untuk
// matrixAutoUpdate=false), permintaan fokus membuka atlas, status jujur.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const f = readFileSync('src/components/BodyAllSystems3D.tsx', 'utf8')
const proyeksi = f.slice(f.indexOf('function projectMatchedSourceMeshes'), f.indexOf('function disposeProjectedMaterials'))
const iAuto = proyeksi.indexOf('projected.matrixAutoUpdate = false'), iPaksa = proyeksi.indexOf('projected.updateMatrixWorld(true)'), iBatas = proyeksi.indexOf('bounds.expandByObject(projected)')
assert.ok(iAuto > 0 && iPaksa > iAuto && iBatas > iPaksa, 'batas proyeksi dihitung dari matrixWorld basi (kubus ±1): kamera seluruh tubuh salah bingkai')
const bingkai = f.slice(f.indexOf('function bingkaiMesh'), f.indexOf('function bingkaiMesh') + 600)
assert.match(bingkai, /mesh\.updateMatrixWorld\(true\)\n\s*const bounds = new THREE\.Box3\(\)\.setFromObject\(mesh, true\)/, 'bingkai struktur memakai matrixWorld basi: kamera nyaris tidak bergerak')
assert.match(f, /if \(!open\) \{ openAtlas\(\); return \}/, 'permintaan fokus tidak membuka atlas')
assert.match(f, /focusStatus\?\.attempted && focusStatus\.name === selectedStructureName/, 'status fokus tampil sebelum ada percobaan (klaim palsu)')
assert.match(f, /framed: Boolean\(focusApplierRef\.current\?\.\(tertunda\)\), attempted: true/)
assert.match(readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8'), /focusRequest=\{requestedStructure\}/)
console.log('fokus-kamera-atlas: matrixWorld dipaksa sebelum batas, atlas terbuka otomatis, status fokus hanya setelah percobaan nyata')
