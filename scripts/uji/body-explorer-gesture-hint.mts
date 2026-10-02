import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/components/ui.tsx', import.meta.url), 'utf8')
let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama) }
}

// 4a24581 "refactor(body): simplify explorer onboarding guide" condensed the
// verbose "Start here · 60-second guide" summary line ("Tap structure ·
// drag to rotate · pinch/scroll to zoom") into a one-sentence-per-step guide
// ("Tap · rotate · zoom · inspect" plus three short steps), matching
// CLAUDE.md's "one concise sentence per widget/item" copy rule. The gesture
// vocabulary still needs to be named, just not with the old literal phrasing.
ok('gesture hint names tap interaction', src.includes('Tap a body structure'))
ok('gesture hint names rotate interaction', /\bRotate\b/.test(src))
ok('gesture hint names zoom interaction', /\bzoom\b/i.test(src))
ok('help remains collapsed by default', !/data-testid="body-explorer-start-here"[^>]*\sopen(?:\s|>)/.test(src))

console.log(`\nBody Explorer gesture hint: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
