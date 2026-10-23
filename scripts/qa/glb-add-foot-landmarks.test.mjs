// ENG-D7-03: rig publik membawa node landmark bernama yang diturunkan dari tulang sumber; metrik memakainya; perubahan GLB hanya node itu.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { splitGlb, joinGlb, withLandmarks, computeLandmarks, LANDMARK_PREFIX } from './glb-add-foot-landmarks.mjs'

const h = (b) => createHash('sha256').update(b).digest('hex')
const rec = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/rig_landmark_nodes.json', 'utf8'))
const file = (g) => `public/bodyexposure/${g}.rig_rom.glb`
const EXPECTED = { adult_male: ['BALL_L', 'BALL_R', 'HEEL_L', 'HEEL_R'], vhf_denver_ct_adult_female: ['HEEL_L', 'HEEL_R'] }

test('public rigs carry exactly the named landmark empties, parented to FOOT.L/R', () => {
  for (const [g, keys] of Object.entries(EXPECTED)) {
    const { json } = splitGlb(fs.readFileSync(file(g)))
    const nodes = json.nodes.map((n, i) => ({ ...n, i })).filter((n) => n.name?.startsWith(LANDMARK_PREFIX))
    assert.deepEqual(nodes.map((n) => n.name.slice(LANDMARK_PREFIX.length)).sort(), keys, `${g} landmark set`)
    for (const n of nodes) {
      const side = n.name.at(-1), parent = json.nodes.findIndex((p) => p.children?.includes(n.i))
      assert.equal(json.nodes[parent].name, `FOOT.${side}`, `${n.name} is a child of FOOT.${side}`)
      assert.equal(n.mesh, undefined, 'landmark is an empty, not geometry')
      assert.ok(n.translation.every(Number.isFinite) && n.translation.length === 3)
      assert.match(n.extras.note, /no toe joint/)
    }
  }
  // betina: tidak ada metatarsal I terpisah di sumber -> bola TIDAK ditebak
  assert.ok(!splitGlb(fs.readFileSync(file('vhf_denver_ct_adult_female'))).json.nodes.some((n) => n.name?.startsWith(`${LANDMARK_PREFIX}BALL`)))
})

test('the only change to each rig is the landmark nodes: stripping them restores the reviewed JSON and identical BIN', () => {
  for (const g of Object.keys(EXPECTED)) {
    const buf = fs.readFileSync(file(g)), a = rec.assets[g]
    assert.equal(h(buf), a.after_sha256, `${g} is the reviewed post-landmark file`)
    const stripped = withLandmarks(splitGlb(buf), {})
    assert.equal(h(JSON.stringify(stripped.json)), a.before_json_canonical_sha256, `${g} JSON without landmarks equals the pre-landmark JSON`)
    assert.equal(h(stripped.tail), a.bin_sha256, `${g} BIN chunk unchanged`)
  }
})

test('landmark nodes are up to date with their source bones (idempotent --check) and recompute identically', async () => {
  for (const g of Object.keys(EXPECTED)) {
    const r = spawnSync(process.execPath, ['scripts/qa/glb-add-foot-landmarks.mjs', file(g), '--check'], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.deepEqual(await computeLandmarks(fs.readFileSync(file(g))), rec.assets[g].landmarks)
  }
})

test('metrics consume the rig nodes and fail closed on a moved or missing landmark node', () => {
  const report = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_foot_contact_reproduction.adult_male.json', 'utf8'))
  assert.match(report.clips.WALK.heelCalcaneus.landmark.definition, /^rig node FOOT_LANDMARK_HEEL_<side>/)
  assert.match(report.clips.WALK.ballMT1.landmark.definition, /^rig node FOOT_LANDMARK_BALL_<side>/)
  const scratch = fs.mkdtempSync(path.join(tmpdir(), 'panacea-landmark-'))
  try {
    const glb = splitGlb(fs.readFileSync(file('adult_male')))
    const variant = (name, mutate) => { const j = structuredClone(glb.json); mutate(j); const p = path.join(scratch, `${name}.glb`); fs.writeFileSync(p, joinGlb({ ...glb, json: j })); return p }
    const run = (p) => spawnSync(process.execPath, ['scripts/qa/glb-foot-contact-reproduce.mjs', p], { encoding: 'utf8' })
    const moved = run(variant('moved', (j) => { j.nodes.find((n) => n.name === 'FOOT_LANDMARK_HEEL_L').translation[1] += 0.001 }))
    assert.notEqual(moved.status, 0); assert.match(moved.stderr, /FOOT_LANDMARK_HEEL_L is 1\.000 mm from its source vertex/); assert.equal(moved.stdout, '')
    const missing = run(variant('missing', (j) => { j.nodes.find((n) => n.name === 'FOOT_LANDMARK_BALL_R').name = 'SOMETHING_ELSE' }))
    assert.notEqual(missing.status, 0); assert.match(missing.stderr, /FOOT_LANDMARK_BALL_R missing while its source bone exists/)
    // pasangan positif: varian tanpa perubahan lolos
    assert.equal(run(variant('same', () => {})).status, 0)
  } finally { fs.rmSync(scratch, { recursive: true, force: true }) }
})
