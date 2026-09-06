import {
  MEDICAL_3D_FRONTIER,
  MEDICAL_3D_TRUTH_RULES,
  medical3DFrontierSpec,
  relativeFlowIndex,
  relativePoiseuilleResistance,
} from '../../src/lib/medical3DFrontier'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('empat frontier 3D tersedia', MEDICAL_3D_FRONTIER.length === 4)
ok('id unik', new Set(MEDICAL_3D_FRONTIER.map((x) => x.id)).size === MEDICAL_3D_FRONTIER.length)
ok('setiap frontier punya boundary ilmiah', MEDICAL_3D_FRONTIER.every((x) => x.scientificBoundary.length > 70))
ok('setiap frontier punya target Astra', MEDICAL_3D_FRONTIER.every((x) => x.astraTarget.length > 70))
ok('setiap frontier punya integrasi', MEDICAL_3D_FRONTIER.every((x) => x.integrations.length >= 4))
ok('truth rules tersedia', MEDICAL_3D_TRUTH_RULES.length >= 6)

const hemo = medical3DFrontierSpec('hemodynamics-4d')
ok('hemodynamics boundary menolak klaim CFD palsu', /not CFD|CFD/i.test(hemo.scientificBoundary))
const neuro = medical3DFrontierSpec('neuro-tract-connectome')
ok('neuro boundary menolak tractography palsu', /tractography/i.test(neuro.scientificBoundary))
const embryo = medical3DFrontierSpec('embryology-morphogenesis')
ok('embryology menolak fetal assessment palsu', /fetal assessment/i.test(embryo.scientificBoundary))
const tme = medical3DFrontierSpec('tumor-immune-microenvironment')
ok('TME memerlukan provenance untuk patient-specific claim', /provenance/i.test(tme.scientificBoundary))

const r1 = relativePoiseuilleResistance(1)
const rHalf = relativePoiseuilleResistance(0.5)
ok('radius 1 memberi relative resistance 1', Math.abs(r1 - 1) < 1e-12)
ok('radius setengah memberi 16x resistance', Math.abs(rHalf - 16) < 1e-12)
ok('flow index naik jika pressure gradient naik', relativeFlowIndex(2, 1) > relativeFlowIndex(1, 1))
ok('flow index naik tajam jika radius naik', relativeFlowIndex(1, 1.2) > relativeFlowIndex(1, 1))

console.log(`\nMedical 3D Frontier: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
