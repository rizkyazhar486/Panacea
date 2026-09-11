import { BRAIN_CNS_MACRO_WAVE1, BRAIN_MACRO_REQUIRED_IDS, validateBrainCnsMacroWave1 } from '../../src/lib/anatomy/brainCnsMacroWave1.ts'

let pass=0, fail=0
function ok(name:string,condition:boolean){if(condition){pass++;console.log('ok    ',name)}else{fail++;console.error('GAGAL ',name)}}
const ids=BRAIN_CNS_MACRO_WAVE1.map(x=>x.id)
const domains=new Set(BRAIN_CNS_MACRO_WAVE1.map(x=>x.domain))
ok('macro validator has no errors',validateBrainCnsMacroWave1().length===0)
ok('all required structures exist',BRAIN_MACRO_REQUIRED_IDS.every(id=>ids.includes(id)))
ok('identifiers are unique',new Set(ids).size===ids.length)
ok('all macro domains represented',['cerebrum','diencephalon','basal-ganglia','limbic','brainstem','cerebellum','white-matter','ventricular-csf','meninges','vascular','cranial-nerves'].every(x=>domains.has(x as never)))
ok('all twelve cranial nerves represented',Array.from({length:12},(_,i)=>`cn${i+1}`).every(id=>ids.includes(id)))
ok('brainstem divisions represented',['midbrain','pons','medulla'].every(id=>ids.includes(id)))
ok('ventricular CSF chain represented',['lateral-ventricles','third-ventricle','cerebral-aqueduct','fourth-ventricle'].every(id=>ids.includes(id)))
ok('major deep nuclei represented',['caudate','putamen','globus-pallidus','subthalamic-nucleus','substantia-nigra','thalamus','hypothalamus'].every(id=>ids.includes(id)))
ok('major arterial trunks represented',['aca','mca','pca','basilar','vertebral-arteries'].every(id=>ids.includes(id)))
ok('all records remain educational and review-pending',BRAIN_CNS_MACRO_WAVE1.every(x=>x.reviewStatus==='academic-review-pending'&&x.boundary.includes('patient-specific anatomy')))
console.log(`\nBrain/CNS macro wave1: ${pass} pass, ${fail} fail · ${ids.length} structures`)
if(fail)process.exitCode=1
