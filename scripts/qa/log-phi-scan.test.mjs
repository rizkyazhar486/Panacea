import test from 'node:test'
import assert from 'node:assert/strict'
import { pindaiBarisLog, pindaiBerkas, pindaiServer } from './log-phi-scan.mjs'

test('menolak_email_mentah_di_template_log', () => {
  assert.equal(pindaiBarisLog("console.log(`[x] user ${email} masuk`)"), 'email')
})
test('menerima_email_yang_dipseudonimkan', () => {
  assert.equal(pindaiBarisLog("console.log(`[x] ${penandaLog(config.jwtSecret, email)} masuk`)"), null)
})
test('menolak_pengenal_sebagai_argumen_terpisah', () => {
  assert.equal(pindaiBarisLog("console.warn('[x] gagal', user.phone)"), 'user.phone')
})
test('menerima_teks_statis_yang_menyebut_email', () => {
  assert.equal(pindaiBarisLog("console.log('  Email:        off (set RESEND_API_KEY)')"), null)
})
test('menerima_pesan_galat_tanpa_pengenal', () => {
  assert.equal(pindaiBarisLog("console.log('[pubmed] error:', (e as Error).message)"), null)
})
test('mengabaikan_baris_tanpa_console', () => {
  assert.equal(pindaiBarisLog('const email = u.email'), null)
})
test('menolak_nama_pasien_lewat_properti_dan_sufiks', () => {
  assert.equal(pindaiBarisLog('console.log(`x ${patientName}`)'), 'patientName')
  assert.equal(pindaiBarisLog('console.log(`x ${u.name}`)'), 'u.name')
})
test('menerima_nama_koleksi_telanjang', () => {
  assert.equal(pindaiBarisLog('console.error(`[store] archive ${nama} failed:`, e.message)'), null)
})
test('melaporkan_nomor_baris', () => {
  const t = pindaiBerkas('a.ts', "ok()\nconsole.error(`bad ${diagnosis}`)")
  assert.deepEqual(t, [{ berkas: 'a.ts', baris: 2, ekspresi: 'diagnosis' }])
})
test('server_src_tidak_mencatat_pengenal_mentah', () => {
  assert.deepEqual(pindaiServer(), [])
})
