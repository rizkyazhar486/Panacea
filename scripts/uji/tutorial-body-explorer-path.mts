import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/pages/Tutorial.tsx', import.meta.url), 'utf8')
let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama) }
}

ok('tutorial links directly to Body Explorer', src.includes("ke: '/body-explorer'"))
ok('tutorial starts in Anatomy view', src.includes('Start in Anatomy view'))
ok('tutorial recommends simple entry points', src.includes('Organs, Muscles, or Find structure'))
ok('tutorial tells users advanced labs are optional', src.includes('advanced labs only when you need them'))
ok('global guide no longer claims exactly six steps', !src.includes('Six steps'))

console.log(`\nTutorial Body Explorer path: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
