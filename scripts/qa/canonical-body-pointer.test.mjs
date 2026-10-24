import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the component's actual pointer handlers with deterministic ray hits.
// This checks event admission and dispatch, not GPU rendering or hit geometry.
function harness(measuring = false) {
  const source = readFileSync(new URL('../../src/pages/CanonicalBody.tsx', import.meta.url), 'utf8')
  const start = source.indexOf('    let down:')
  const end = source.indexOf('    // ketuk ganda:', start)
  assert.ok(start >= 0 && end > start)
  const calls = { pick: 0, select: 0, measure: 0 }
  const structure = { visible: true, userData: { panacea_structure_id: 'fixture' }, parent: null }
  const context = {
    Math,
    renderer: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 600 }) } },
    ptr: { set() {} }, camera: {}, root: {}, motionRoot: {},
    ray: { setFromCamera() {}, intersectObject() { calls.pick++; return [{ object: structure, faceIndex: 0, point: {} }] } },
    motionOnRef: { current: false }, measuringRef: { current: measuring },
    structureAtFace: () => structure,
    select: () => { calls.select++ }, addMeasurePoint: () => { calls.measure++ },
  }
  const code = ts.transpileModule(source.slice(start, end) + '\n globalThis.handlers = { onDown, onUp, cancel: typeof onCancel === "function" ? onCancel : () => {} };',
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
  vm.runInNewContext(code, context)
  return { ...context.handlers, calls }
}
const event = (overrides = {}) => ({ button: 0, isPrimary: true, pointerId: 1, clientX: 100, clientY: 100, ...overrides })

test('primary mouse and touch taps select once, including the 6px boundary', () => {
  for (const pointerType of ['mouse', 'touch']) {
    const h = harness()
    h.onDown(event({ pointerType }))
    h.onUp(event({ pointerType, clientX: 106 }))
    assert.deepEqual(h.calls, { pick: 1, select: 1, measure: 0 })
    h.onUp(event({ pointerType, clientX: 106 }))
    assert.equal(h.calls.pick, 1, 'pointerup is consumed once')
  }
})
test('right button and secondary contacts cannot select or measure', () => {
  for (const measuring of [false, true]) {
    for (const overrides of [{ button: 2 }, { isPrimary: false }]) {
      const h = harness(measuring)
      h.onDown(event(overrides)); h.onUp(event(overrides))
      assert.deepEqual(h.calls, { pick: 0, select: 0, measure: 0 })
    }
  }
})
test('pointer cancellation and mismatched releases cannot pick', () => {
  const h = harness()
  h.onDown(event()); h.cancel(event()); h.onUp(event())
  assert.equal(h.calls.pick, 0)
  h.onDown(event()); h.onUp(event({ pointerId: 2 }))
  assert.equal(h.calls.pick, 0)
  h.onUp(event())
  assert.equal(h.calls.pick, 0, 'mismatched release consumes pending tap')
})
test('drag over threshold is consumed and a later fresh tap still works', () => {
  const h = harness(true)
  h.onDown(event()); h.onUp(event({ clientX: 107 })); h.onUp(event())
  assert.equal(h.calls.pick, 0)
  h.onDown(event()); h.onUp(event())
  assert.deepEqual(h.calls, { pick: 1, select: 0, measure: 1 })
})

test('cancellation listener is installed and removed with the viewer', () => {
  const source = readFileSync(new URL('../../src/pages/CanonicalBody.tsx', import.meta.url), 'utf8')
  assert.match(source, /addEventListener\('pointercancel', onCancel\)/)
  assert.match(source, /removeEventListener\('pointercancel', onCancel\)/)
})
