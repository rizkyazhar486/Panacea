import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { compareContact } from './compare-blender-gait-contact.mjs'

const native = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_contact_blender_reproduction.json', 'utf8'))
const official = () => Object.fromEntries(native.assets.map(asset => [asset.source, {
  schema: 'panacea-foot-contact/v2', source_sha256: asset.source_sha256,
  clips: structuredClone(asset.clips),
}]))

test('matching source-bound measurements and small cross-library float differences pass', () => {
  const reference = official()
  const male = reference['public/bodyexposure/adult_male.rig_rom.glb']
  male.clips.WALK.floor_m += 0.00005
  male.clips.WALK.heelPlantar.slide_max_mm += 0.01
  male.clips.WALK.heelPlantar.common_forward_speed_m_s += 0.0001
  const result = compareContact(native, reference)
  assert.ok(result.metric_pairs > 0)
  assert.ok(result.slide_mm > 0)
})

test('changed source, absent stance, phase window, and excessive slip difference fail closed', () => {
  const source = 'public/bodyexposure/adult_male.rig_rom.glb'
  const cases = [
    [report => { report[source].source_sha256 = 'forged' }, /unmatched source-bound/],
    [report => { report[source].clips.WALK.heelPlantar.phases_by_side.L = [] }, /phase windows/],
    [report => { report[source].clips.WALK.heelPlantar.slide_max_mm += 0.021 }, /difference exceeds/],
    [report => { report[source].clips.WALK.heelPlantar.slide_max_mm = NaN }, /difference exceeds/],
    [report => { report[source].clips.RUN.heelPlantar.slide_rms_mm = 0 }, /invented no-stance metric/],
    [report => { delete report[source].clips.RUN }, /missing RUN report/],
  ]
  for (const [mutate, reason] of cases) {
    const reference = official()
    mutate(reference)
    assert.throws(() => compareContact(native, reference), reason)
  }
})
