// Cross-library numerical parity of independent Blender and Three.js D7 reports.
// Tolerances are measured evaluation differences, not gait acceptance limits.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const kinds = ['heel', 'toe', 'heelPlantar', 'toePlantar', 'sole']
const lengthToleranceM = 0.0001
const slideToleranceMm = 0.02
const speedToleranceMps = 0.0002

function same(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}: structural mismatch`)
}
function near(actual, expected, tolerance, label) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || Math.abs(actual - expected) >= tolerance) {
    throw new Error(`${label}: difference exceeds ${tolerance}`)
  }
  return Math.abs(actual - expected)
}

export function compareContact(native, officialBySource) {
  if (native?.schema_version !== 1 || !Array.isArray(native.assets) || native.assets.length !== 2) throw new Error('invalid Blender report')
  const seen = new Set()
  const differences = { floor_m: 0, speed_m_s: 0, slide_mm: 0, metric_pairs: 0 }
  for (const asset of native.assets) {
    if (seen.has(asset.source)) throw new Error('duplicate native source')
    seen.add(asset.source)
    const official = officialBySource[asset.source]
    if (official?.schema !== 'panacea-foot-contact/v2' || official.source_sha256 !== asset.source_sha256) throw new Error(`unmatched source-bound report: ${asset.source}`)
    for (const clip of ['WALK', 'RUN']) {
      const a = asset.clips?.[clip], b = official.clips?.[clip]
      if (!a || !b) throw new Error(`missing ${clip} report: ${asset.source}`)
      same(a.frames, b.frames, `${clip} frames`)
      same(a.loop_closed_duplicate_end_frame_dropped, b.loop_closed_duplicate_end_frame_dropped, `${clip} loop`)
      differences.floor_m = Math.max(differences.floor_m, near(a.floor_m, b.floor_m, lengthToleranceM, `${clip} floor`))
      for (const kind of kinds) {
        const left = a[kind], right = b[kind]
        if (!left || !right) throw new Error(`missing ${clip} ${kind}`)
        same(left.phases_by_side, right.phases_by_side, `${clip} ${kind} phase windows`)
        same(left.stance_phases, right.stance_phases, `${clip} ${kind} phase count`)
        if (!left.stance_phases) {
          if ('slide_rms_mm' in left || 'slide_rms_mm' in right) throw new Error(`${clip} ${kind}: invented no-stance metric`)
          continue
        }
        same(left.stance_frames, right.stance_frames, `${clip} ${kind} frame count`)
        differences.speed_m_s = Math.max(differences.speed_m_s, near(left.common_forward_speed_m_s, right.common_forward_speed_m_s, speedToleranceMps, `${clip} ${kind} speed`))
        for (const field of ['slide_rms_mm', 'slide_max_mm']) {
          differences.slide_mm = Math.max(differences.slide_mm, near(left[field], right[field], slideToleranceMm, `${clip} ${kind} ${field}`))
        }
        differences.metric_pairs += 1
      }
    }
  }
  if (Object.keys(officialBySource).length !== seen.size) throw new Error('unexpected source-bound report')
  return differences
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 5) throw new Error('usage: compare-blender-gait-contact.mjs NATIVE MALE_V2 FEMALE_V2')
  const [native, male, female] = process.argv.slice(2).map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
  const bySource = {
    'public/bodyexposure/adult_male.rig_rom.glb': male,
    'public/bodyexposure/vhf_denver_ct_adult_female.rig_rom.glb': female,
  }
  console.log(JSON.stringify(compareContact(native, bySource), null, 2))
}
