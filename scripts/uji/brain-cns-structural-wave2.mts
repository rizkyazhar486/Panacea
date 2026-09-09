import { BRAIN_CNS_STRUCTURAL_WAVE2, BRAIN_STRUCTURAL_REQUIRED_IDS, validateBrainCnsStructuralWave2 } from '../../src/lib/anatomy/brainCnsStructuralWave2.ts'
let pass=0,fail=0
function ok(name:string,condition:boolean){if(condition){pass++;console.log('ok    ',name)}else{fail++;console.error('GAGAL ',name)}}
const ids=BRAIN_CNS_STRUCTURAL_WAVE2.map(x=>x.id)
const domains=new Set(BRAIN_CNS_STRUCTURAL_WAVE2.map(x=>x.domain))
ok('validator has no errors',validateBrainCnsStructuralWave2().length===0)
ok('all required structural nodes exist',BRAIN_STRUCTURAL_REQUIRED_IDS.every(id=>ids.includes(id)))
ok('identifiers are unique',new Set(ids).size===ids.length)
ok('all structural domains represented',['cortical-landmark','deep-nucleus','white-matter-tract','brainstem-nucleus','cerebellar-structure','csf-cistern'].every(x=>domains.has(x as never)))
ok('internal capsule subdivisions represented',['anterior-limb-internal-capsule','genu-internal-capsule','posterior-limb-internal-capsule'].every(id=>ids.includes(id)))
ok('caudate subdivisions represented',['caudate-head','caudate-body','caudate-tail'].every(id=>ids.includes(id)))
ok('pallidal and nigral subdivisions represented',['gpe','gpi','substantia-nigra-pars-compacta','substantia-nigra-pars-reticulata'].every(id=>ids.includes(id)))
ok('brainstem nuclei represented',['red-nucleus','periaqueductal-gray','locus-coeruleus','nucleus-solitary-tract','inferior-olivary-nucleus'].every(id=>ids.includes(id)))
ok('CSF outlet structures represented',['foramen-monro','median-aperture','lateral-apertures','cisterna-magna'].every(id=>ids.includes(id)))
ok('all records remain reference-only and review-pending',BRAIN_CNS_STRUCTURAL_WAVE2.every(x=>x.geometryStatus==='reference-only'&&x.reviewStatus==='academic-review-pending'))
console.log(`\nBrain/CNS structural wave2: ${pass} pass, ${fail} fail · ${ids.length} structures`)
if(fail)process.exitCode=1
