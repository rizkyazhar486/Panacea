import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/components/ui.tsx', import.meta.url), 'utf8')
let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama) }
}

ok('gesture hint names tap interaction', src.includes('Tap structure'))
ok('gesture hint names rotate interaction', src.includes('drag to rotate'))
ok('gesture hint names zoom interaction', src.includes('pinch/scroll to zoom'))
ok('help remains collapsed by default', !/data-testid="body-explorer-start-here"[^>]*\sopen(?:\s|>)/.test(src))

console.log(`\nBody Explorer gesture hint: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
