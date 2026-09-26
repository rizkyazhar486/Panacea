// Mode konferensi: panel yang sama diperbesar; skala terbatas, tidak memperkecil, tidak meluap.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { skalaPresentasi, LEBAR_PANEL_PRESENTASI as L } from '../../src/lib/ecmo/presentasi.ts'
assert.equal(skalaPresentasi(390), 1, 'ponsel: tanpa pembesaran')
assert.equal(skalaPresentasi(3840), 1.8, 'layar 4K: dibatasi 1,8×')
assert.ok(Math.abs(skalaPresentasi(1280) - (1280 - 32) / L) < 1e-12)
for (const w of [800, 1024, 1280, 1920]) assert.ok(L * skalaPresentasi(w) <= w - 32 + 1e-9, `panel muat di ${w}px`)
assert.equal(skalaPresentasi(NaN), 1)
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /data-ecmo-presentasi/); assert.match(ui, /e\.key === 'Escape'/, 'Escape harus keluar dari mode presenter')
assert.equal((ui.match(/<PanelEcmo|function PanelEcmo/g) ?? []).length, 1, 'tidak ada panel presentasi kedua (keadaan tunggal)')
console.log('ecmo-presentasi: lulus')
