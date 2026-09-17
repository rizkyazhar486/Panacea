import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('Home health surface is a data instrument instead of nested AI dashboard cards', async () => {
  const health = await source('src/components/HomeHealthBrief.tsx')

  assert.doesNotMatch(health, /liquid-glass|liquid-spectral-edge/)
  assert.doesNotMatch(health, /Good morning|Good afternoon|Good evening/)
  assert.doesNotMatch(health, /blur-3xl|bg-violet-500|bg-cyan-400/)
  assert.match(health, /data-panacea-instrument-strip/)
})

test('Home capability surface is search-first and not a gradient card mosaic', async () => {
  const deck = await source('src/components/HomeCommandDeck.tsx')

  assert.doesNotMatch(deck, /live capabilities|Welcome,/)
  assert.doesNotMatch(deck, /featureSurface\(|bg-gradient-to-/)
  assert.doesNotMatch(deck, /shadow-\[0_14px_42px/)
  assert.match(deck, /data-panacea-command-surface/)
  assert.match(deck, /data-panacea-direct-launch/)
})

test('Assistive Touch opens as an orb-anchored spatial control rather than a generic panel', async () => {
  const fab = await source('src/components/FabNavigasi.tsx')

  assert.doesNotMatch(fab, /Context commands/)
  assert.doesNotMatch(fab, />⚙</)
  assert.doesNotMatch(fab, /bg-white\/66|dark:bg-neutral-900\/62/)
  assert.match(fab, /data-panacea-assistive-orbit/)
  assert.match(fab, /data-panacea-assistive-action/)
})

test('Home widget bridge does not reintroduce a boxed light header on the dark canvas', async () => {
  const css = await source('src/styles/rel-widget-rumah.css')

  assert.doesNotMatch(css, /Canvas 86%/)
  assert.doesNotMatch(css, /widget-instrument-head-v5[\s\S]*background:/)
})
