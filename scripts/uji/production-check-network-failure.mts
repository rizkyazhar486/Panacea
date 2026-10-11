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
assert.ok(http.report.network.dns?.length >= 1, 'DNS literal IP harus tercatat lolos sebelum kegagalan http')
for (const r of [dns, http]) assert.ok(!r.report.findings.some((f: { msg: string }) => /lulus|pass|ok/i.test(f.msg)), 'laporan gagal tidak boleh memuat klaim lulus')
console.log('production-check-network-failure: DNS dan koneksi gagal = exit 2 dengan tahap yang benar, tanpa hasil peramban atau klaim lulus')
