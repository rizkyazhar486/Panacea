import { EYE_ATLAS_LAYER_ORDER, EYE_ATLAS_SOURCES, EYE_ORBIT_ATLAS, eyeAtlasCoverage } from '../../src/lib/eyeOrbitAtlas.ts'

let pass = 0, fail = 0
function ok(name: string, condition: boolean) {
  if (condition) { pass++; console.log('ok    ', name) }
  else { fail++; console.error('GAGAL ', name) }
}

const required = [
  'orbit','optic-canal','sof','globe','cornea','corneal-epithelium','bowman','corneal-stroma','descemet','corneal-endothelium','limbus','sclera',
  'anterior-chamber','posterior-chamber','trabecular-meshwork','schlemm','iris','pupil','ciliary-body','ciliary-muscle','choroid',
  'lens','lens-capsule','lens-epithelium','zonules','vitreous','retina','rpe','photoreceptors','bipolar-cells','ganglion-cells','macula','fovea','optic-disc',
  'optic-nerve','optic-chiasm','optic-tract','lgn','optic-radiations','primary-visual-cortex',
  'eom','superior-rectus','inferior-rectus','medial-rectus','lateral-rectus','superior-oblique','inferior-oblique','levator',
  'lacrimal-gland','lacrimal-drainage','ophthalmic-artery','central-retinal-artery','ciliary-arteries','ophthalmic-veins',
  'cn3','cn4','cn6','trigeminal-v1','ciliary-ganglion',
]

const ids = EYE_ORBIT_ATLAS.map((node) => node.id)
const coverage = eyeAtlasCoverage()
ok('contains all required macroscopic and microscopic eye/orbit structures', required.every((id) => ids.includes(id)))
ok('identifiers are globally unique', new Set(ids).size === ids.length)
ok('at least 12 anatomical layers are explicitly separated', coverage.layers >= 12 && EYE_ATLAS_LAYER_ORDER.length >= 12)
ok('atlas is source-backed node by node', coverage.sourceBacked)
ok('every node carries the educational/patient-specific boundary', coverage.bounded)
ok('source registry has multiple independent educational anchors', EYE_ATLAS_SOURCES.length >= 4)
ok('retinal cellular chain is represented', ['rpe','photoreceptors','bipolar-cells','ganglion-cells'].every((id) => ids.includes(id)))
ok('aqueous outflow chain is represented', ['ciliary-body','posterior-chamber','pupil','anterior-chamber','trabecular-meshwork','schlemm'].every((id) => ids.includes(id)))
ok('six extraocular muscles are represented separately', ['superior-rectus','inferior-rectus','medial-rectus','lateral-rectus','superior-oblique','inferior-oblique'].every((id) => ids.includes(id)))
ok('visual pathway extends retina to cortex', ['retina','optic-nerve','optic-chiasm','optic-tract','lgn','optic-radiations','primary-visual-cortex'].every((id) => ids.includes(id)))
ok('motor and sensory cranial pathways are separated', ['cn3','cn4','cn6','trigeminal-v1'].every((id) => ids.includes(id)))
ok('microstructures are never silently promised as native geometry', EYE_ORBIT_ATLAS.filter((n) => n.level === 'cell' || n.level === 'microstructure').every((n) => n.geometry !== 'native-or-source-match-required' || ['optic-disc','fovea'].includes(n.id)))

console.log(`\nEye/orbit atlas: ${pass} pass, ${fail} fail · ${coverage.nodes} nodes / ${coverage.layers} layers`)
if (fail) process.exitCode = 1
