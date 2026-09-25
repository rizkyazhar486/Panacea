import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { antrekan, bacaAntrean, kirimAtauAntre, kurasAntrean, type ButirAntrean } from '../../src/lib/antreanCekHarian.ts'

const toko = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } }
const butir = (id: string, tgl = '2026-09-25', plan = 'p1'): ButirAntrean => ({ clientId: `c${id}xxxxxxxx`, planId: plan, scheduledFor: tgl, authoredAt: '2026-09-25T08:00:00Z', answers: [] })
const putus = async () => { throw new TypeError('Failed to fetch') }
const tolak = async () => { throw new Error('no active daily check-in') }

// Jaringan gagal → diantre; server menolak → TIDAK diantre.
{ const s = toko(); assert.equal((await kirimAtauAntre(s, butir('1'), putus)).status, 'diantre'); assert.equal(bacaAntrean(s).length, 1) }
{ const s = toko(); const r = await kirimAtauAntre(s, butir('1'), tolak); assert.equal(r.status, 'ditolak'); assert.equal(bacaAntrean(s).length, 0, 'penolakan server ikut diantre — akan dikirim ulang tanpa akhir') }
// Satu laporan per rencana per hari.
{ const s = toko(); antrekan(s, butir('1')); antrekan(s, butir('2')); antrekan(s, butir('3', '2026-09-24')); assert.deepEqual(bacaAntrean(s).map((b) => b.clientId[1]), ['2', '3']) }
// Kuras: berhenti saat masih offline, butir tetap ada.
{ const s = toko(); antrekan(s, butir('1')); antrekan(s, butir('2', '2026-09-24'))
  const r = await kurasAntrean(s, putus); assert.deepEqual([r.terkirim, r.sisa], [0, 2]) }
// Kuras: online → semua terkirim dengan clientId yang sama (idempoten), ditolak dibuang & dilaporkan.
{ const s = toko(); antrekan(s, butir('1')); antrekan(s, butir('2', '2026-09-24', 'p2'))
  const dikirim: string[] = []
  const r = await kurasAntrean(s, async (b) => { dikirim.push(b.clientId); if (b.planId === 'p2') throw new Error('plan revoked') })
  assert.deepEqual([r.terkirim, r.ditolak, r.sisa], [1, ['plan revoked'], 0]); assert.deepEqual(dikirim, ['c1xxxxxxxx', 'c2xxxxxxxx']) }
// Penyimpanan rusak tidak membuat aplikasi jatuh.
{ const s = toko(); s.setItem('pmd_cek_harian_antre_v1', '{rusak'); assert.deepEqual(bacaAntrean(s), []) }

// Server: kirim ulang dengan clientId yang sama mengembalikan laporan lama, bukan membuat baru.
const idx = readFileSync('server/src/index.ts', 'utf8')
const rute = idx.slice(idx.indexOf("app.post('/api/care/reports'"), idx.indexOf('\napp.', idx.indexOf("app.post('/api/care/reports'") + 5))
assert.match(rute, /find\(\(l\) => l\.clientId === laporan\.clientId\)[\s\S]*if \(sama\) \{ res\.json\(sama\); return \}[\s\S]*addCareReport/, 'rute laporan tidak idempoten — antrean offline bisa menggandakan laporan')
const ui = readFileSync('src/components/CekHarian.tsx', 'utf8')
assert.match(ui, /addEventListener\('online'/, 'antrean tidak dikuras saat kembali online')
assert.match(ui, /not yet sent to your doctor/, 'jawaban yang masih diantre ditampilkan seolah sudah terkirim')
console.log('antrean-cek-harian: jaringan→antre, penolakan→tidak, idempoten via clientId, kuras saat online')
