// A falha de rede/ambiente tidak boleh menjadi status aplikasi: exit 2 dengan tahap yang disebutkan, tanpa klaim "lulus" dalam laporan.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const run = (url: string) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-'))
  const r = spawnSync(process.execPath, ['scripts/qa/production-browser-check.mjs'], { encoding: 'utf8', env: { ...process.env, PROD_URL: url, OUT: out }, timeout: 60000 })
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'))
  fs.rmSync(out, { recursive: true, force: true })
  return { code: r.status, report, stderr: r.stderr }
}

const dns = run('https://host-yang-tidak-ada.invalid')
assert.equal(dns.code, 2, 'DNS gagal harus exit 2, bukan 0 atau 1')
assert.equal(dns.report.network.failed.stage, 'dns', 'tahap kegagalan DNS harus disebut')
assert.equal(dns.report.viewports.length, 0, 'tidak boleh ada hasil peramban setelah jaringan gagal')
assert.ok(dns.report.findings.some((f: { severity: string }) => f.severity === 'fail'))

const http = run('http://127.0.0.1:1')  // porta tertutup: DNS (literal IP) lolos, TLS dilewati (http), koneksi ditolak
assert.equal(http.code, 2)
assert.equal(http.report.network.failed.stage, 'http', 'tahap harus berbeda dari kasus DNS (pasangan: hanya tahap yang berbeda)')
assert.ok(http.report.network.dnsAddressCount >= 1, 'DNS literal IP harus tercatat lolos sebelum kegagalan http (jumlah, bukan alamat)')
assert.equal(dns.report.findings[0].category, 'network_dns', 'kategori DNS tetap terlapor tanpa pesan error mentah')
assert.equal(http.report.findings[0].category, 'network_http', 'kategori HTTP tetap terlapor tanpa pesan error mentah')
for (const r of [dns, http]) {
  assert.equal(Object.hasOwn(r.report.network, 'dns'), false, 'alamat DNS tidak boleh disimpan')
  assert.equal(Object.hasOwn(r.report.network.failed, 'error'), false, 'pesan error mentah tidak boleh disimpan')
  assert.ok(r.report.findings.every((f: { category: string; msg?: string }) => typeof f.category === 'string' && !Object.hasOwn(f, 'msg')), 'temuan tetap berjenis tanpa raw page/network text')
}
console.log('production-check-network-failure: DNS dan koneksi gagal = exit 2 dengan tahap yang benar, tanpa hasil peramban atau klaim lulus')
