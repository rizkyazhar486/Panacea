// Regresi: publishDataUpdate membuka BroadcastChannel; di Node kanal itu menahan
// event loop sehingga berkas uji (nextgen-auth-and-recovery) tidak pernah keluar
// dan `npm run uji` macet di CI. Proses anak harus keluar sendiri, cepat.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const modul = pathToFileURL(join(akar, 'src/lib/dataSync.ts')).href

function jalankan(kode: string) {
  return spawnSync(process.execPath, [...process.execArgv, '--input-type=module', '-e', kode], {
    cwd: akar, timeout: 20_000, encoding: 'utf8',
  })
}

console.log('data-sync-no-hang')

// Positif: kanal nyata dibuka lalu proses keluar dengan status 0 tanpa timeout.
const r = jalankan(`
  if (typeof BroadcastChannel === 'undefined') throw new Error('perlu BroadcastChannel Node')
  const m = await import(${JSON.stringify(modul)})
  m.publishDataUpdate(['health'], 'uji')
  console.log('published')
`)
assert.equal(r.error, undefined, `proses anak macet/galat: ${r.error?.message ?? ''}`)
assert.equal(r.signal, null, 'proses anak dibunuh timeout (kanal menahan event loop)')
assert.equal(r.status, 0, r.stderr)
assert.match(r.stdout, /published/)
console.log('  ✔ keluar_sendiri_setelah_publish_dengan_kanal_nyata')

// Negatif berpasangan: kanal yang TIDAK di-unref memang menahan proses —
// membuktikan uji di atas mendeteksi kondisi macet, bukan lulus kebetulan.
const n = spawnSync(process.execPath, ['--input-type=module', '-e', `new BroadcastChannel('x'); console.log('open')`], {
  cwd: akar, timeout: 3_000, encoding: 'utf8',
})
assert.equal(n.signal, 'SIGTERM', 'kanal tanpa unref harus menahan proses hingga timeout')
console.log('  ✔ kontrol_negatif_kanal_tanpa_unref_menahan_proses')

console.log('data-sync-no-hang: PASS')
