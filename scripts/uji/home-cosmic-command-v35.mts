import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('public/home-cosmic-command-v35.css', 'utf8')
const index = readFileSync('index.html', 'utf8')
const executableCss = css.replace(/\/\*[\s\S]*?\*\//g, '')

assert.match(index, /home-widget-dark-v31\.css[^\n]*\n\s*<link rel="stylesheet" href="\/home-cosmic-command-v35\.css/, 'cosmic command must load after the final widget-dark guard')
assert.match(index, /home-cosmic-command-v35\.css[^\n]*\n\s*<link rel="stylesheet" href="\/welcome-revitalization-v28\.css/, 'welcome layer ordering must remain unchanged after the Home-only layer')

for (const marker of [
  '.home-odyssey-hero',
  '.home-orbit-core',
  '.home-primary-action',
  '.home-signal-card',
  '.home-action-card',
  'pmd-low-memory',
  'prefers-reduced-motion',
]) assert.ok(css.includes(marker), `safe cosmic command marker missing: ${marker}`)

for (const forbidden of [
  'panacea-home-backdrop',
  'widget-instrument',
  'widget-instrument-loading',
  'instrument-empty',
  'home-loading-card',
]) assert.ok(!executableCss.includes(forbidden), `v35 must not override protected wallpaper/widget surface: ${forbidden}`)

assert.ok(!/url\(/.test(executableCss), 'v35 must not introduce or replace wallpaper/media assets')
assert.ok(!/(^|[},]\s*)canvas(?:[\s.#:[>+~,{]|$)/im.test(executableCss), 'v35 must not style a canvas rendering surface')
assert.ok(!/(^|[\s,{])(?:\.|#)?webgl(?:[\s.#:[>+~,{]|$)/im.test(executableCss), 'v35 must not style a WebGL-specific rendering surface')
assert.ok(!/@import\b/i.test(executableCss), 'v35 must not pull in external rendering or media layers')

console.log('Home cosmic command v35: hero/action-only visuals; wallpaper and widget safety layers remain authoritative')
