import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arahSinkron } from '../../src/lib/labSyncArah.ts'

// Riwayat lab dulu hanya di localStorage: ganti telepon = hilang. Sekarang
// disinkronkan ke akun ("yang terakhir menang" per log utuh), dan statusnya
// ditampilkan jujur: tanpa backend/sesi ia berkata "this device only".
assert.equal(arahSinkron(null, null, false), 'diam')
assert.equal(arahSinkron(null, null, true), 'dorong', 'log lokal pertama tidak pernah dikirim ke server')
assert.equal(arahSinkron(null, '2026-09-25T01:00:00Z', false), 'tarik', 'perangkat baru tidak mengambil riwayat dari akun')
assert.equal(arahSinkron('2026-09-25T02:00:00Z', '2026-09-25T01:00:00Z', true), 'dorong')
assert.equal(arahSinkron('2026-09-25T01:00:00Z', '2026-09-25T02:00:00Z', true), 'tarik', 'salinan server yang lebih baru (mis. penghapusan di perangkat lain) ditimpa')
assert.equal(arahSinkron('2026-09-25T01:00:00Z', '2026-09-25T01:00:00Z', true), 'diam')

const ui = readFileSync('src/components/UbinLab.tsx', 'utf8')
assert.match(ui, /pasangSinkronLab\(\)/, 'kartu lab tidak lagi menyalakan sinkronisasi')
assert.match(ui, /lokal: '· this device only'/, 'status "hanya di perangkat ini" hilang — tampilan bisa mengklaim tersimpan padahal tidak')
const sync = readFileSync('src/lib/labSync.ts', 'utf8')
assert.match(sync, /asal !== 'lokal'/, 'tarikan dari server memicu dorongan balik (putaran tak berujung)')
const srv = readFileSync('server/src/index.ts', 'utf8')
assert.match(srv, /app\.get\('\/api\/lab-log', requireAuth/, 'GET lab-log tanpa autentikasi')
assert.match(srv, /app\.put\('\/api\/lab-log', requireAuth/, 'PUT lab-log tanpa autentikasi')
assert.doesNotMatch(srv, /\/api\/lab-log\/:/, 'lab-log menerima id dari jalur — pintu IDOR')
console.log('lab-tersinkron: arah sinkron benar, status jujur, endpoint terautentikasi tanpa id di jalur')

// Coba ulang otomatis setelah gagal (dulu: tunggu perubahan berikutnya).
{
  const s = readFileSync('src/lib/labSync.ts', 'utf8')
  assert.match(s, /if \(s !== 'gagal'\) \{ percobaan = 0; return \}/, 'coba ulang berjalan juga saat belum login atau sudah tersinkron')
  assert.match(s, /addEventListener\('online'/, 'kembali online tidak memicu sinkron')
  assert.match(s, /JEDA_ULANG_MS = \[5_000, 15_000, 60_000, 300_000\]/, 'jadwal coba ulang berubah tanpa gate diperbarui')
}
