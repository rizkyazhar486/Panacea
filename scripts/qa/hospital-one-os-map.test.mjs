import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const url = new URL('../../governance/HOSPITAL_ONE_OS_ACCEPTANCE.json', import.meta.url)
const plan = JSON.parse(readFileSync(url, 'utf8'))

test('hospital One OS roadmap is explicitly proposed, never self-accepted', () => {
  assert.equal(plan.schema_version, 1)
  assert.equal(plan.status, 'NOT_ACCEPTED')
  assert.equal(plan.evidence_level, 'E0_PROPOSED')
  assert.equal(plan.production_ready, false)
  assert.equal(plan.clinical_validation_claim, false)
  assert.equal(plan.implemented_claim, false)
  assert.ok(plan.current_wedge.includes('outpatient'))
})

test('role source is exact and unimplemented privileges remain explicit non-claims', () => {
  assert.deepEqual([...plan.account_roles].sort(),
    ['pasien', 'dokter', 'kontributor', 'verifikator', 'perawat', 'lab', 'admin', 'owner'].sort())
  assert.match(plan.role_mismatch_to_reconcile, /six roles.*eight/)
  for (const deniedClaim of ['researcher_can_access_phi', 'student_can_access_patient_chart',
    'admin_can_sign_care', 'nurse_can_sign_as_doctor']) {
    assert.ok(plan.explicit_not_assumed.includes(deniedClaim))
  }
})

test('work items have unique acyclic dependencies and falsifiable evidence gates', () => {
  const ids = new Set(plan.work_items.map((item) => item.id))
  assert.equal(ids.size, plan.work_items.length)
  assert.ok(ids.size >= 10)
  const items = new Map(plan.work_items.map((item) => [item.id, item]))
  const phases = new Set()
  const traversed = new Set()
  const visiting = new Set()
  function visit(id) {
    assert.ok(items.has(id), 'unknown work dependency: ' + id)
    assert.ok(!visiting.has(id), 'dependency cycle at ' + id)
    if (traversed.has(id)) return
    visiting.add(id)
    for (const dep of items.get(id).depends_on) visit(dep)
    visiting.delete(id)
    traversed.add(id)
  }
  for (const item of plan.work_items) {
    assert.match(item.id, /^HOSP-G[0-5]-[A-Z0-9]+$/)
    assert.equal(item.status, 'NOT_AUDITED')
    assert.equal(item.evidence_level, 'E0')
    assert.deepEqual(item.evidence_refs, [])
    assert.ok(item.required_negative_controls.length >= 2)
    assert.ok(item.required_evidence.length >= 3)
    assert.ok(item.actor_personas.length > 0)
    phases.add(item.phase)
    visit(item.id)
  }
  assert.deepEqual([...phases].sort(), ['G0','G1','G2','G3','G4','G5'])
})

test('program begins with one clinical wedge and stages dependent hospital expansion', () => {
  const get = (id) => plan.work_items.find((item) => item.id === id)
  assert.ok(get('HOSP-G0-EPISODE').depends_on.includes('HOSP-G0-ROLE'))
  assert.ok(get('HOSP-G1-NURSE').depends_on.includes('HOSP-G0-EPISODE'))
  assert.ok(get('HOSP-G2-ADT').depends_on.includes('HOSP-G1-OPS'))
  assert.ok(get('HOSP-G3-RESEARCH').depends_on.includes('HOSP-G0-ROLE'))
  assert.ok(get('HOSP-G4-AGENT').depends_on.includes('HOSP-G0-ROLE'))
  assert.ok(get('HOSP-G5-PILOT').depends_on.includes('HOSP-G4-INTEROP'))
})
