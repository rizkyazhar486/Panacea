// public/ui-iterations/panacea-feature-spectrum-v48.js gives every link and route a palette from its href and label.
// It percent-decodes that text first; a bare "%" ("Battery 98%", "?q=100%") is not a valid escape, and the URIError
// it threw stopped each paint at the first such link — no later link painted, and `pmd-spectrum-ready` missing when
// that was the first paint — then threw again on each DOM change. The script runs here in a VM with the few DOM
// pieces it touches, so no browser is needed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const SOURCE = readFileSync(new URL('../../public/ui-iterations/panacea-feature-spectrum-v48.js', import.meta.url), 'utf8')

function element(attributes = {}) {
  return {
    attributes: { ...attributes },
    dataset: {},
    textContent: '',
    style: { values: {}, setProperty(name, value) { this.values[name] = value } },
    classList: { names: new Set(), add(name) { this.names.add(name) } },
    getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null },
    setAttribute(name, value) { this.attributes[name] = String(value) },
  }
}

/** Loads the script against `links` ([href, label] pairs) and `search`, then runs its first scheduled paint. */
function paint({ links, search = '' }) {
  class HTMLAnchorElement {}
  const anchors = links.map(([href, label]) => Object.assign(Object.create(HTMLAnchorElement.prototype), element({ href, 'aria-label': label })))
  const root = element()
  const frames = []
  const window = {
    location: { origin: 'https://panacea.test', pathname: '/', search },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length },
    addEventListener() {},
    dispatchEvent() {},
  }
  const document = {
    documentElement: root,
    readyState: 'complete',
    querySelectorAll: (selector) => (selector === 'a[href]' ? anchors : []),
    querySelector: () => null,
    addEventListener() {},
  }
  const context = vm.createContext({
    window, document, HTMLAnchorElement, URL,
    history: { pushState() {}, replaceState() {} },
    MutationObserver: class { observe() {} },
    Event: class { constructor(type) { this.type = type } },
  })
  vm.runInContext(SOURCE, context)
  assert.equal(frames.length, 1, 'the script schedules one paint once the document is ready')
  let error = null
  try { frames[0]() } catch (caught) { error = caught }
  return { anchors, root, error }
}

test('paints_every_link_when_a_label_holds_a_bare_percent_sign', () => {
  const { anchors, root, error } = paint({ links: [['/tubuh', 'Sleep score 98%'], ['/latihan', 'Training']] })
  assert.equal(error, null)
  assert.deepEqual(anchors.map((a) => a.dataset.pmdFeatureLink), ['true', 'true'], 'the link after the "%" label is painted too')
  assert.equal(anchors[0].dataset.pmdFeaturePalette, 'glacial-chrome', 'the label is still read as written: "sleep"')
  assert.equal(anchors[1].dataset.pmdFeaturePalette, 'aurora-sky')
  assert.equal(root.classList.names.has('pmd-spectrum-ready'), true)
})

test('twin_without_percent_sign_paints_the_same_way', () => {
  const { anchors, root, error } = paint({ links: [['/tubuh', 'Sleep score 98'], ['/latihan', 'Training']] })
  assert.equal(error, null)
  assert.deepEqual(anchors.map((a) => a.dataset.pmdFeaturePalette), ['glacial-chrome', 'aurora-sky'])
  assert.equal(root.classList.names.has('pmd-spectrum-ready'), true)
})

test('paints_the_route_when_its_query_holds_a_bare_percent_sign', () => {
  const { root, error } = paint({ links: [], search: '?q=100%' })
  assert.equal(error, null)
  assert.equal(root.dataset.pmdPalette, 'astral-chrome')
  assert.equal(root.classList.names.has('pmd-spectrum-ready'), true)
})

test('still_decodes_a_valid_escape_before_choosing_a_palette', () => {
  // "%63" is "c": only the decoded text says "clinical", which picks the clinical family.
  const { anchors, error } = paint({ links: [['/s?q=%63linical', '']] })
  assert.equal(error, null)
  assert.equal(anchors[0].dataset.pmdFeaturePalette, 'crimson-web')
  // Twin: the plain spelling picks the same family, so the escape and the text it stands for are read alike.
  assert.equal(paint({ links: [['/s?q=clinical', '']] }).anchors[0].dataset.pmdFeaturePalette, 'crimson-web')
})

test('skips_an_external_link_without_painting_it', () => {
  const { anchors, error } = paint({ links: [['https://elsewhere.test/a', 'Elsewhere 50%'], ['/latihan', 'Training']] })
  assert.equal(error, null)
  assert.equal(anchors[0].dataset.pmdFeatureLink, undefined, 'only same-origin links take a feature palette')
  assert.equal(anchors[1].dataset.pmdFeatureLink, 'true')
})
