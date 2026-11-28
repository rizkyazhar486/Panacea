import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const rootCss = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
const v46Css = readFileSync(new URL('../../public/ui-iterations/panacea-control-grading-v46.css', import.meta.url), 'utf8')
const v48Css = readFileSync(new URL('../../public/ui-iterations/panacea-green-material-v48.css', import.meta.url), 'utf8')
const logo = readFileSync(new URL('../../src/components/ui/Logo.tsx', import.meta.url), 'utf8')

// 1. Container-wide `.dark .bg-white .text-ink` must never force black text inside dark-remapped containers.
assert.doesNotMatch(
  rootCss,
  /^\.dark\s+\.bg-white\s+\.text-ink\b/m,
  'src/index.css must scope dark white-surface text-ink overrides strictly to interactive controls',
)
assert.match(
  rootCss,
  /\.dark :is\(button, a, \[role='button'\]\)\.bg-white \.text-ink/,
  'interactive-only white+ink exception missing in src/index.css',
)

// 2. Wordmark must never fall back to bare `text-ink` or vanish in dark mode.
assert.match(logo, /text-neutral-950 dark:text-white/, 'Wordmark must stay high-contrast in both light and dark modes')
assert.doesNotMatch(logo, /onDark \? 'text-white' : 'text-ink'/, 'Wordmark must not use bare text-ink')

// 3. Button material overrides (v46 + v48) must exempt native CTA buttons so primary actions never turn flat charcoal.
for (const [label, css] of [
  ['panacea-control-grading-v46.css', v46Css],
  ['panacea-green-material-v48.css', v48Css],
] as const) {
  assert.match(css, /:not\(\[data-pmd-native='true'\]\)/, `${label} must exempt [data-pmd-native='true']`)
  assert.match(css, /:not\(\.cta-banner-btn\)/, `${label} must exempt .cta-banner-btn`)
  assert.match(css, /:not\(\.cta-atlas-btn\)/, `${label} must exempt .cta-atlas-btn`)
}

// 4. Anti-doodle & anti-bare-text-ink guards across the live landing sections.
const sec = (f: string) => readFileSync(new URL(`../../src/pages/landing/sections/${f}`, import.meta.url), 'utf8')
const hero = sec('HeroSection.tsx')
assert.doesNotMatch(hero, /<svg[^>]*viewBox/, 'HeroSection must render real Z-Anatomy assets, not cartoon SVG figures')
for (const name of ['HeroSection.tsx', 'FourDoorsSection.tsx', 'XRayBody.tsx', 'LandingHeader.tsx', 'LandingFooter.tsx']) {
  assert.doesNotMatch(sec(name), /\btext-ink\b/, `${name} must use explicit dark/light text classes, never bare text-ink`)
}

// 5. The old doodle landing (cartoon anatomy SVG, ECG squiggle odyssey, scroll cinematic, seven legacy sections) was
// deleted on owner direction; it must not come back as dead files.
for (const old of [
  'src/components/landing/HumanAnatomySvg.tsx',
  'src/components/landing/ScrollCinematic.tsx',
  'src/pages/landing/landingSvgs.tsx',
  'src/pages/landing/sections/ScienceOdysseySection.tsx',
  'src/pages/landing/sections/BrandFilmsSection.tsx',
]) assert.equal(existsSync(new URL(`../../${old}`, import.meta.url)), false, `${old} was deleted with the doodle landing and must not return`)

console.log('landing-dark-contrast-guard: OK (dark text-ink trap closed, live landing sections clean, doodle landing stays deleted)')
