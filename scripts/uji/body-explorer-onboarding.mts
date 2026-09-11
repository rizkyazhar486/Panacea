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
ok('alur Explore tersedia', src.includes('1 · Explore'))
ok('alur Inspect tersedia', src.includes('2 · Inspect'))
ok('alur Go deeper tersedia', src.includes('3 · Go deeper'))
ok('pengguna diberi tahu tidak wajib memakai semua tab', src.includes('You do not need to use every tab'))
ok('mental model Explore/Learn/Advanced tersedia', src.includes('Explore: Layers') && src.includes('Learn: Physiology') && src.includes('Advanced: Cardio'))

console.log(`\nBody Explorer onboarding: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
