// Catatan audit/klinis yang tergeser batas ukuran harus diarsipkan, bukan dihapus.
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const dir = mkdtempSync(join(tmpdir(), 'arsip-'))
process.env.PANACEA_DATA_FILE = join(dir, 'data.json')
const { addLabAudit, listLabAudit, addAudit, getAudit } = await import('../src/store.js')
for (let i = 0; i < 5003; i++) addLabAudit({ waktu: `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}Z`, pasienEmail: i < 3 ? 'lama@x' : 'baru@x', aktor: 'd@x', aksi: 'dibaca-dokter', izinId: `i${i}` })
assert.equal(listLabAudit('lama@x').length, 0, 'catatan tertua seharusnya keluar dari dokumen utama')
const f = join(dir, 'arsip', 'labAudit.jsonl')
assert.ok(existsSync(f), 'catatan audit yang tergeser DIHAPUS, tidak diarsipkan')
const baris = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
assert.deepEqual(baris.map((b) => b.c.izinId), ['i0', 'i1', 'i2'])
assert.ok(baris.every((b) => b.c.pasienEmail === 'lama@x' && b.diarsipkan))
console.log('arsipKlinis: audit yang tergeser batas diarsipkan append-only, tidak hilang')

// Audit umum: batas 5000 adalah batas hot set, bukan izin membuang sejarah.
const syntheticUser = { id: 'audit-fixture-owner', email: 'audit-fixture-owner@localhost.test' }
for (let i = 0; i < 5003; i++) addAudit(syntheticUser as never, `action-${i}`, 'synthetic-target')
const hot = getAudit(5003)
assert.equal(hot.length, 5000, 'general audit hot set remains capped at 5000')
assert.equal(hot[0].action, 'action-5002', 'most recent entry remains first')
assert.equal(hot[4999].action, 'action-3', 'oldest resident entry is retained at cutoff')
const generalArchive = join(dir, 'arsip', 'audit.jsonl')
assert.ok(existsSync(generalArchive), 'evicted general audit entries must be archived, not deleted')
const generalRows = readFileSync(generalArchive, 'utf8').trim().split('\\n').map((line) => JSON.parse(line))
assert.deepEqual(generalRows.map((entry) => entry.c.action), ['action-0', 'action-1', 'action-2'], 'three oldest entries archived exactly once in order')
assert.ok(generalRows.every((entry) => entry.c.userId === syntheticUser.id && entry.diarsipkan), 'archive keeps actor and archive timestamp')
console.log('arsipKlinis: lab + general audits preserve evicted entries without changing the hot set')
