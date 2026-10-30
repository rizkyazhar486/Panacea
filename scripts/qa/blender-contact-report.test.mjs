import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const native = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_contact_blender_reproduction.json', 'utf8'))
const coordinates = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_coordinate_audit.json', 'utf8'))
const expected = {
  adult_male: {
    source: 'b2c7cb609a7cc52064de4b5526ddfd2d9e15b6b261dcf44652aa5e1e3c887dc9',
    walk: { heelPlantar: { L: ['22-25+0-4'], R: ['7-10'] }, toePlantar: { L: ['22-25+0-8'], R: ['8-17'] } },
    // T-D7-05: RUN forefoot contact comes from the labelled (derived) toe constraint
    run: { heelPlantar: { L: [], R: [] }, toePlantar: { L: [], R: ['7-9'] } },
  },
  vhf_denver_ct_adult_female: {
    source: '7ec5ae004e6dca96f93cbb85b297e32d6a1d128980cdaa4af42a1d51eb574e32',
    walk: { heelPlantar: { L: [], R: [] }, toePlantar: { L: [], R: [] } },
    run: { heelPlantar: { L: [], R: [] }, toePlantar: { L: [], R: [] } },
  },
}

test('independent Blender contact report is bound to the audited public sources and coordinate contract', () => {
  assert.equal(native.schema_version, 1)
  assert.deepEqual(native.coordinate_contract, { gltf_up: '+Y', gltf_anterior: '+Z', blender_up: '+Z', blender_anterior: '-Y', length_unit: 'metre', contact_window_m: 0.015, minimum_stance_frames: 3 })
  assert.equal(native.assets.length, 2)
  for (const asset of native.assets) {
    const name = asset.source.split('/').at(-1).replace('.rig_rom.glb', '')
    assert.equal(asset.source_sha256, expected[name].source)
    const original = coordinates.assets.find(item => item.source === asset.source)
    assert.ok(original)
    assert.equal(asset.decoded_sha256, original.decoded_sha256)
    for (const side of ['L', 'R']) {
      const rest = asset.rest_markers[side]
      assert.ok(rest.heel.position_gltf_m[2] < rest.toe.position_gltf_m[2], 'heel is posterior of toe in source rest')
      for (const marker of Object.values(rest)) {
        assert.equal(typeof marker.vertex, 'number')
        assert.ok(marker.position_gltf_m.every(Number.isFinite))
      }
    }
  }
})

test('WALK/RUN coverage and phase boundaries reproduce source-bound D7 evidence without inflating missing stance', () => {
  for (const asset of native.assets) {
    const name = asset.source.split('/').at(-1).replace('.rig_rom.glb', '')
    const walk = asset.clips.WALK, run = asset.clips.RUN
    assert.equal(walk.frames, 26)
    assert.equal(run.frames, 18)
    assert.equal(walk.loop_closed_duplicate_end_frame_dropped, true)
    assert.equal(run.loop_closed_duplicate_end_frame_dropped, true)
    for (const kind of ['heelPlantar', 'toePlantar']) {
      assert.deepEqual(walk[kind].phases_by_side, expected[name].walk[kind])
      const runPhases = expected[name].run[kind]
      assert.equal(run[kind].stance_phases, runPhases.L.length + runPhases.R.length)
      assert.deepEqual(run[kind].phases_by_side, runPhases)
    }
    for (const clip of [walk, run]) for (const kind of ['heel', 'toe', 'heelPlantar', 'toePlantar', 'sole']) {
      const result = clip[kind]
      if (result.stance_phases === 0) {
        assert.equal(result.slide_rms_mm, undefined)
        assert.equal(result.slide_max_mm, undefined)
      } else {
        assert.ok([result.slide_rms_mm, result.slide_max_mm, result.common_forward_speed_m_s].every(Number.isFinite))
        assert.ok(result.stance_frames >= result.stance_phases * 3)
      }
    }
  }
})

test('native numeric cross-check stays within measured Blender/Three evaluation difference', () => {
  const male = native.assets[0].clips.WALK
  // Source-bound T-D7-05 MTP re-rig (male b2c7cb60, female 7ec5ae00); 0.02 mm exceeds the observed 0.01094 mm
  // maximum comparison discrepancy, but is far below the research 15/30 mm limits.
  for (const [kind, rms, peak] of [
    ['heelPlantar', 7.731030802941662, 16.57895021713697],
    ['toePlantar', 8.809465808548133, 16.380974939110725],
  ]) {
    assert.ok(Math.abs(male[kind].slide_rms_mm - rms) < 0.02)
    assert.ok(Math.abs(male[kind].slide_max_mm - peak) < 0.02)
  }
  assert.ok(Math.abs(native.assets[1].clips.RUN.sole.slide_max_mm - 10.619113842646279) < 0.02)
})
