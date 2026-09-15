import assert from 'node:assert/strict'
import { CARDIAC_HEMODYNAMICS_BOUNDARY,CARDIAC_HEMODYNAMICS_EVIDENCE,CARDIAC_PHASES,CARDIAC_TEACHING_RELATIONSHIPS,buildSyntheticPvLoop,simulateSyntheticCardiacHemodynamics } from '../../src/lib/cardiacHemodynamicsLab.ts'
assert.deepEqual(CARDIAC_PHASES.map(p=>p.id),['ventricular-filling','isovolumic-contraction','ejection','isovolumic-relaxation'])
assert.equal(CARDIAC_PHASES.filter(p=>p.mitralState==='open').length,1);assert.equal(CARDIAC_PHASES.filter(p=>p.aorticState==='open').length,1);assert.equal(CARDIAC_PHASES.filter(p=>p.volumeDirection==='fixed').length,2)
for(const expression of ['CO = HR × SV','SV = EDV − ESV','EF = (SV / EDV) × 100%'])assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some(r=>r.expression===expression))
const b={preload:.5,afterload:.5,contractility:.5,heartRate:.5,lusitropy:.5};for(const value of Object.values(simulateSyntheticCardiacHemodynamics(b)))assert.ok(value>=0&&value<=1)
assert.ok(simulateSyntheticCardiacHemodynamics({...b,preload:.9}).strokeVolumeSignal>simulateSyntheticCardiacHemodynamics({...b,preload:.1}).strokeVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({...b,afterload:.9}).strokeVolumeSignal<simulateSyntheticCardiacHemodynamics({...b,afterload:.1}).strokeVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({...b,contractility:.9}).endSystolicVolumeSignal<simulateSyntheticCardiacHemodynamics({...b,contractility:.1}).endSystolicVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({...b,heartRate:.9}).diastolicPerfusionOpportunity<simulateSyntheticCardiacHemodynamics({...b,heartRate:.1}).diastolicPerfusionOpportunity)
const loop=buildSyntheticPvLoop(b);assert.equal(loop.length,4);assert.equal(loop[0].volume,loop[1].volume);assert.equal(loop[2].volume,loop[3].volume);assert.ok(loop[0].volume>loop[2].volume)
assert.deepEqual(CARDIAC_HEMODYNAMICS_EVIDENCE.map(s=>s.pmid),['26436838','27598497','3276755']);assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY,/normalized synthetic signals/i);assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY,/does not measure or estimate patient/i)
console.log('cardiac hemodynamics lab: deterministic physiology and educational boundaries validated')
