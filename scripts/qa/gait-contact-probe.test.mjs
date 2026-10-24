// R-D7-CONTACT: laporan penelitian kontak kaki tetap sah dan klaimnya tetap terbukti oleh data yang dikomit.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const r = JSON.parse(readFileSync(new URL('../../bodyexposure/qa_reports/gait_contact_probe.json', import.meta.url), 'utf8'))
const B = r.bodies

test('report is for the published rigs', () => {
  for (const body of ['adult_male', 'vhf_denver_ct_adult_female']) {
    const sha = createHash('sha256').update(readFileSync(new URL(`../../public/bodyexposure/${body}.rig_rom.glb`, import.meta.url))).digest('hex')
    assert.equal(B[body].sha256, sha, `${body}: regenerate gait_contact_probe.json for the current rig`)
  }
})

test('control: male landmarks equal the closest-vertex definition, so the method itself adds no offset', () => {
  for (const clip of ['WALK', 'RUN']) for (const s of ['L', 'R']) for (const g of ['calcaneus', 'forefoot']) {
    const x = B.adult_male.clips[clip].sides[s].groups[g]
    assert.equal(x.closest_vertex.min_height_mm, x.current_landmark.min_height_mm, `${clip} ${s} ${g}`)
  }
})

test('finding 1: female heel landmark matches the closest-vertex definition and reaches the floor (T-D7-04)', () => {
  for (const s of ['L', 'R']) {
    const c = B.vhf_denver_ct_adult_female.clips.WALK.sides[s].groups.calcaneus
    assert.ok(c.closest_vertex.min_height_mm < 15 && c.closest_vertex.stance_phases >= 1, `closest vertex reaches the window (${s})`)
    assert.ok(c.current_landmark.min_height_mm < 15 && c.current_landmark.stance_phases >= 1, `rig node reaches the window (${s})`)
    assert.equal(c.closest_vertex.min_height_mm, c.current_landmark.min_height_mm, `${s} calcaneus`)
  }
})

test('finding 2: RUN has no heel contact on either body, and male RUN lands on distal toe phalanges', () => {
  for (const body of ['adult_male', 'vhf_denver_ct_adult_female']) for (const s of ['L', 'R']) {
    const c = B[body].clips.RUN.sides[s].groups.calcaneus.closest_vertex
    assert.ok(c.min_height_mm >= 15 && c.stance_phases === 0, `${body} RUN ${s}: no calcaneus vertex within the window`)
  }
  for (const s of ['L', 'R']) {
    const owners = Object.keys(B.adult_male.clips.RUN.sides[s].lowest_structure_at_contact)
    assert.ok(owners.length > 0 && owners.every((o) => /DISTAL_PHALANX|INTERPHALANGEAL/.test(o)), `male RUN ${s} contact owners: ${owners}`)
  }
})
