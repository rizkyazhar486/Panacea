// The cockpit's "work helper" box (src/core/panaceamedCenturyWave100Engine.mjs) writes a short guide for whatever
// the visitor typed. It must render that text as text, never as HTML, and must not compute or invent doses,
// infusion rates, test results or billing codes. The guide's own code is lifted from the rendered page and run
// against a minimal fake DOM, so the test exercises the real emitted script, not a copy of it.
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { renderInteractiveWave95CockpitHtml } from '../../src/core/panaceamedCenturyWave100Engine.mjs'

const html = renderInteractiveWave95CockpitHtml()
const START = "const archSel = document.getElementById('public-archetype-selector');"
const END = "archSel.addEventListener('change'"

function guideSource() {
  const from = html.indexOf(START)
  const to = html.indexOf(END, from)
  assert.ok(from >= 0 && to > from, 'the guide code is present in the rendered cockpit')
  return html.slice(from, to)
}

function fakeDom() {
  const created = []
  const make = (tag) => {
    const node = {
      tag, value: '', children: [], own: '',
      get textContent() { return this.own + this.children.map((c) => (typeof c === 'string' ? c : c.textContent)).join('') },
      set textContent(v) { this.own = String(v); this.children = [] },
      set innerHTML(_) { throw new Error('innerHTML was assigned') },
      append(...items) { this.children.push(...items) },
      appendChild(item) { this.children.push(item); return item },
      replaceChildren(...items) { this.own = ''; this.children = items },
    }
    return node
  }
  const ids = ['public-archetype-selector', 'custom-user-name', 'custom-weight', 'custom-bp-sys', 'custom-glucose', 'persona-tier-selector', 'work-helper-output', 'panacea-score-display']
  const byId = new Map(ids.map((id) => [id, make('input')]))
  const document = {
    getElementById: (id) => byId.get(id) ?? null,
    createElement: (tag) => { created.push(tag); return make(tag) },
  }
  return { document, byId, created }
}

function runGuide({ name, weight = '72', sys = '120', glucose = '92', mode }) {
  const { document, byId, created } = fakeDom()
  const context = vm.createContext({ document })
  vm.runInContext(`${guideSource()}\nthis.evaluate = evaluatePublicUserInBrowser;`, context)
  byId.get('custom-user-name').value = name
  byId.get('custom-weight').value = weight
  byId.get('custom-bp-sys').value = sys
  byId.get('custom-glucose').value = glucose
  byId.get('persona-tier-selector').value = mode
  context.evaluate()
  const out = byId.get('work-helper-output')
  return { out, text: out.textContent, created }
}

const MODES = ['LAYPERSON_AWAM', 'CAREGIVER_FAMILY', 'MEDICAL_STUDENT_KOAS', 'ATTENDING_CLINICIAN', 'PRINCIPAL_SCIENTIST']

test('menulis_panduan_setiap_mode_sebagai_node_teks', () => {
  for (const mode of MODES) {
    const { out, created } = runGuide({ name: 'Ana', mode })
    assert.ok(out.children.length >= 2, `${mode}: heading and at least one row`)
    assert.equal(out.children[0].tag, 'strong', `${mode}: heading first`)
    assert.match(out.children[0].textContent, /— Ana/, `${mode}: heading names the visitor`)
    assert.deepEqual([...new Set(created)].sort(), ['div', 'strong'], `${mode}: only strong/div elements are created`)
  }
})

test('nama_berisi_markup_tetap_teks_bukan_elemen', () => {
  const name = '<img src=x onerror=alert(1)>'
  for (const mode of MODES) {
    const { text, created } = runGuide({ name, mode })
    assert.ok(text.includes(name), `${mode}: the typed text is shown verbatim`)
    assert.ok(!created.includes('img'), `${mode}: no element is made from the typed text`)
  }
  // Twin: the same guide with a plain name differs only in the name.
  const plain = runGuide({ name: 'Ana', mode: 'LAYPERSON_AWAM' }).text
  const marked = runGuide({ name, mode: 'LAYPERSON_AWAM' }).text
  assert.equal(marked.replace(name, 'Ana'), plain)
})

test('tidak_menghitung_dosis_laju_infus_atau_nilai_karangan', () => {
  const dose = /\b\d+(?:[.,]\d+)?\s*(?:mg|mL|mcg)(?!\/dL)\b/
  for (const mode of MODES) {
    const { text } = runGuide({ name: 'Ana', weight: '72', sys: '146', glucose: '138', mode })
    assert.doesNotMatch(text, dose, `${mode}: no amount of a drug or fluid`)
    assert.doesNotMatch(text, /mL\/jam|Carboplatin \d|FFR = |sFlt-1\/PlGF = |Koding JKN: [A-Z]|Δ = /, `${mode}: no invented result or code`)
  }
  assert.match(runGuide({ name: 'Ana', mode: 'CAREGIVER_FAMILY' }).text, /takaran tidak dihitung otomatis/)
  assert.match(runGuide({ name: 'Ana', mode: 'ATTENDING_CLINICIAN' }).text, /tidak dihitung otomatis — keputusan dan tanda tangan tetap pada klinisi/)
  assert.match(runGuide({ name: 'Ana', mode: 'ATTENDING_CLINICIAN' }).text, /belum ditinjau klinisi/)
})

test('ambang_tensi_140_dan_gula_126_tepat_di_batas', () => {
  const lay = (sys, glucose) => runGuide({ name: 'Ana', sys, glucose, mode: 'LAYPERSON_AWAM' }).text
  assert.match(lay('139', '92'), /Tensi \(139 mmHg\):\s*Di bawah ambang tinggi 140 mmHg\./)
  assert.match(lay('140', '92'), /Tensi \(140 mmHg\):\s*Agak tinggi/)
  assert.match(lay('120', '125'), /Gula Darah \(125 mg\/dL\):\s*Di bawah ambang 126 mg\/dL\./)
  assert.match(lay('120', '126'), /Gula Darah \(126 mg\/dL\):\s*Di atas 126 mg\/dL/)
  // A low value is not called safe or well controlled.
  assert.doesNotMatch(lay('70', '40'), /\baman\b|Terkendali/)
})

test('skrip_kokpit_tidak_menulis_innerHTML', () => {
  assert.doesNotMatch(guideSource(), /\.innerHTML\s*=/)
  assert.match(guideSource(), /replaceChildren\(/)
})
