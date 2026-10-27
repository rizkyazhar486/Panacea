import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { transformSync } from 'esbuild'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'

const { deriveEdenUniversalAcceptanceBridge } = await loadTypeScriptSubject(fileURLToPath(new URL(
  '../../src/domains/clinical-operations/model/careContinuityProjection.ts', import.meta.url,
)))
const { terapkanSimpanRekam } = await loadTypeScriptSubject(fileURLToPath(new URL(
  '../../server/src/domains/clinical-records/rekamKlinis.ts', import.meta.url,
)))
const source = readFileSync(new URL('../../src/pages/clinical/CareEpisode.tsx', import.meta.url), 'utf8')
const parsed = ts.createSourceFile('CareEpisode.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const component = parsed.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name?.text === 'EdenUniversalAcceptanceSection')
assert.ok(component, 'actual language component must exist')
const compiled = transformSync(component.getText(parsed) + '\nglobalThis.Subject = EdenUniversalAcceptanceSection', {
  loader: 'tsx', format: 'iife', jsx: 'transform', jsxFactory: 'h',
}).code

// Jalankan handler TSX produksi dengan adapter hook/elemen kecil; ini bukan bukti DOM atau browser.
function mount(props) {
  const states = []
  let index = 0
  const context = {
    deriveEdenUniversalAcceptanceBridge,
    useMemo: fn => fn(),
    useState: initial => {
      const slot = index++
      if (!(slot in states)) states[slot] = initial
      return [states[slot], next => { states[slot] = typeof next === 'function' ? next(states[slot]) : next }]
    },
    Badge: 'Badge',
    h: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
  }
  runInNewContext(compiled, context)
  const render = () => { index = 0; return context.Subject(props) }
  return { render }
}
function elements(node) {
  if (!node || typeof node !== 'object') return []
  return [node, ...node.children.flatMap(elements)]
}
function click(tree, label) {
  const button = elements(tree).find(node => node.type === 'button' && node.children.join('') === label)
  assert.ok(button, `actual ${label} button must exist`)
  button.props.onClick()
}

const episode = { id: 'synthetic-episode', title: 'Synthetic follow-up', stages: [], edenLanguagePreference: 'id' }
const signed = {
  id: 'synthetic-record', patientId: 'synthetic-patient', careEpisodes: [episode],
  signedAt: '2026-10-27T08:00:00.000Z', signedBy: 'Synthetic clinician', signedById: 'synthetic-clinician',
  updatedAt: '2026-10-27T08:00:00.000Z',
}
const clock = new Date('2026-10-27T08:01:00.000Z')

for (const clinician of [false, true]) {
  test(`language and literacy controls preserve signed clinical content (clinician=${clinician})`, () => {
    let record = structuredClone(signed)
    let saves = 0
    const original = JSON.stringify(record)
    const view = mount({ episode: record.careEpisodes[0], onChange: next => {
      saves++
      // Jalur simpan yang sama mengirim rekam penuh dan updatedAt baru ke penjaga server.
      record = terapkanSimpanRekam(record, { ...record, careEpisodes: [next], updatedAt: clock.toISOString() }, {
        id: 'synthetic-actor', nama: 'Synthetic actor', klinisi: clinician,
      }, clock).rekam
    } })
    let tree = view.render()
    assert.equal(tree.props['data-eden-lang'], 'id')
    click(tree, 'English')
    tree = view.render()
    assert.equal(tree.props['data-eden-lang'], 'en', 'language still changes in the display')
    assert.equal(record.signedAt, signed.signedAt, 'display preference must preserve clinician signature')
    click(tree, 'Mode: Hangat/Warm')
    tree = view.render()
    assert.equal(tree.props['data-eden-literacy'], 'clinical_structured')
    click(tree, 'Bahasa Indonesia')
    assert.equal(view.render().props['data-eden-lang'], 'id')
    assert.equal(saves, 0, 'display controls must not send clinical-record writes')
    assert.equal(JSON.stringify(record), original, 'all signed content and timestamps remain identical')
  })

  test(`real clinical edits still invalidate the old signature (clinician=${clinician})`, () => {
    const result = terapkanSimpanRekam(signed, {
      ...signed, careEpisodes: [{ ...episode, title: 'Changed clinical follow-up' }], updatedAt: clock.toISOString(),
    }, { id: 'synthetic-actor', nama: 'Synthetic actor', klinisi: clinician }, clock)
    assert.equal(result.rekam.signedAt, undefined)
    assert.equal(result.rekam.signedById, undefined)
    assert.ok(result.arsip, 'prior signed content remains archived')
  })
}

test('stored language preference remains readable without migrating clinical data', () => {
  const view = mount({ episode: { ...episode, edenLanguagePreference: 'en' } })
  assert.equal(view.render().props['data-eden-lang'], 'en')
})
