import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/components/ui.tsx', import.meta.url), 'utf8')

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) {
    lulus++
    console.log('ok    ', nama)
  } else {
    gagal++
    console.log('GAGAL ', nama)
  }
}

ok('guide hanya dipasang pada Body Explorer', src.includes("title === 'Body Explorer'"))
ok('guide memakai native details ringan', src.includes('data-testid="body-explorer-start-here"') && src.includes('<details'))
ok('guide dapat dibuka/tutup tanpa modal atau dependency baru', !src.includes('localStorage') && !src.includes('createPortal'))
// 4a24581 "refactor(body): simplify explorer onboarding guide" rewrote the
// three-step flow from static "N · Title" JSX headings + a separate
// paragraph-length reminder + an Explore/Learn/Advanced tag legend into one
// data-driven ['step', 'title', 'one-sentence copy'] array, per CLAUDE.md's
// "one concise sentence per widget/item" copy rule. Steps 1 and 3 were
// renamed (Explore -> Select, Go deeper -> Deepen); the "don't need every
// tab" idea now lives in step 3's own one-sentence copy instead of a
// separate reminder paragraph; the Explore/Learn/Advanced tag legend (a
// second, redundant navigation taxonomy) was dropped rather than kept as
// clutter alongside the three-step flow.
ok('alur Select tersedia', src.includes("['1', 'Select'"))
ok('alur Inspect tersedia', src.includes("['2', 'Inspect'"))
ok('alur Deepen tersedia', src.includes("['3', 'Deepen'"))
ok('pengguna diberi tahu perangkat lanjutan hanya dibuka saat dibutuhkan', src.includes('only when needed'))
ok('guide tidak lagi menduplikasi taksonomi Explore/Learn/Advanced di luar tiga langkah', !src.includes('Explore: Layers') && !src.includes('Learn: Physiology') && !src.includes('Advanced: Cardio'))

console.log(`\nBody Explorer onboarding: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
