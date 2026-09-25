// Catatan audit/klinis yang tergeser batas ukuran harus diarsipkan, bukan dihapus.
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const dir = mkdtempSync(join(tmpdir(), 'arsip-'))
process.env.PANACEA_DATA_FILE = join(dir, 'data.json')
const { addLabAudit, listLabAudit } = await import('../src/store.js')
for (let i = 0; i < 5003; i++) addLabAudit({ waktu: `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}Z`, pasienEmail: i < 3 ? 'lama@x' : 'baru@x', aktor: 'd@x', aksi: 'dibaca-dokter', izinId: `i${i}` })
assert.equal(listLabAudit('lama@x').length, 0, 'catatan tertua seharusnya keluar dari dokumen utama')
const f = join(dir, 'arsip', 'labAudit.jsonl')
assert.ok(existsSync(f), 'catatan audit yang tergeser DIHAPUS, tidak diarsipkan')
const baris = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
assert.deepEqual(baris.map((b) => b.c.izinId), ['i0', 'i1', 'i2'])
assert.ok(baris.every((b) => b.c.pasienEmail === 'lama@x' && b.diarsipkan))
console.log('arsipKlinis: audit yang tergeser batas diarsipkan append-only, tidak hilang')
