// Loop render bersama: berhenti saat offscreen/tersembunyi/konteks hilang/dibuang; tanpa frame menggantung.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mulaiLoopTerjaga, type DepLoop } from '../../src/lib/loopRenderTerjaga.ts'

function palsu() {
  let id = 0; const antre = new Map<number, () => void>(); let hidden = false
  let vis: (() => void) | null = null, io: ((t: boolean) => void) | null = null, lepasVis = 0, lepasIo = 0
  const dep: DepLoop = {
    requestFrame: (cb) => { antre.set(++id, cb); return id }, cancelFrame: (i) => { antre.delete(i) },
    tersembunyi: () => hidden,
    onVisibilitas: (cb) => { vis = cb; return () => { lepasVis++ } },
    amatiViewport: (_el, cb) => { io = cb; return () => { lepasIo++ } },
  }
  const tik = () => { const c = [...antre.values()]; antre.clear(); c.forEach((f) => f()) }
  return { dep, tik, antre, setHidden: (h: boolean) => { hidden = h; vis!() }, setTerlihat: (t: boolean) => io!(t), lepas: () => [lepasVis, lepasIo] }
}
const f = palsu(); let n = 0
const loop = mulaiLoopTerjaga({} as Element, () => n++, f.dep)
f.tik(); f.tik(); assert.equal(n, 2, 'loop berjalan saat terlihat'); assert.equal(f.antre.size, 1, 'tepat satu frame terjadwal')
f.setTerlihat(false); assert.equal(f.antre.size, 0, 'offscreen: tidak ada frame terjadwal'); f.tik(); assert.equal(n, 2)
f.setTerlihat(true); assert.equal(f.antre.size, 1, 'kembali terlihat: satu frame, tidak dobel'); f.setTerlihat(true); assert.equal(f.antre.size, 1)
f.setHidden(true); assert.equal(f.antre.size, 0, 'tab tersembunyi: berhenti'); f.setHidden(false); f.tik(); assert.equal(n, 3)
loop.kontekHilang(); assert.equal(f.antre.size, 0, 'konteks WebGL hilang: berhenti'); f.setTerlihat(true); assert.equal(f.antre.size, 0, 'tidak dilanjutkan setelah konteks hilang')
const g = palsu(); const l2 = mulaiLoopTerjaga({} as Element, () => {}, g.dep); l2.hentikan(); l2.hentikan()
assert.equal(g.antre.size, 0, 'dibuang: tanpa frame menggantung'); assert.deepEqual(g.lepas(), [1, 1], 'listener dilepas tepat sekali')
const PENGGUNA = [
  ...['Arteri3D', 'KelenjarSaluran3D', 'LesiNeuro3D', 'WilayahAbdomen3D', 'Kerangka3D', 'VentilasiBronkus3D', 'AlphaGenomeAtlas'].map((n) => `src/pages/bodyhub/${n}.tsx`),
  ...['Molecule3D', 'Medical3DFrontierLab', 'OrganModel3D', 'Pathway3D', 'PersonalBodyAvatar3D'].map((n) => `src/components/${n}.tsx`),
  ...['MicroPathologyComparator', 'BodyParts3DDeepAtlas', 'RealisticAnatomyAtlas', 'HighDefinitionCellAtlas', 'HraClinicalAtlas', 'CinematicCellGenomeExplorer', 'MicroPhysiologyExplorer', 'TissuePreview'].map((n) => `src/components/digital-twin/${n}.tsx`),
  'src/pages/discovery/SynapseMicro3DLab.tsx',
]
for (const nama of PENGGUNA) {
  const s = readFileSync(nama, 'utf8').replace(/window\.requestAnimationFrame\(fitVisible\)/, '')
  assert.match(s, /mulaiLoopTerjaga\(/, `${nama} harus memakai loop terjaga`); assert.doesNotMatch(s, /requestAnimationFrame/, `${nama}: loop RAF mentah tanpa penangguhan`)
  assert.match(s, /(loop|loopTerjaga)\.hentikan\(\)/, `${nama}: loop harus dihentikan saat dibuang`)
}
console.log('loop-render-terjaga: lulus')
