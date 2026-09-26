// Galat API membawa status + ID korelasi server; pesan lama dipertahankan.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { galatDariRespons, GalatApi } from '../../src/lib/galatApi.ts'
const g = galatDariRespons(500, { error: 'internal_error', requestId: 'abcdef12-3456' }, null)
assert.ok(g instanceof Error && g instanceof GalatApi); assert.equal(g.message, 'internal_error'); assert.equal(g.status, 500); assert.equal(g.requestId, 'abcdef12-3456')
assert.equal(galatDariRespons(502, 'bukan objek', null).message, 'HTTP 502', 'badan tak terurai: pesan HTTP status seperti dulu')
assert.equal(galatDariRespons(500, {}, 'hdr-12345678').requestId, 'hdr-12345678', 'header diutamakan')
assert.equal(galatDariRespons(500, { requestId: '<script>alert(1)</script>' }, null).requestId, null, 'ID tidak sah dibuang')
assert.match(readFileSync('server/src/index.ts', 'utf8'), /exposedHeaders: \['X-Request-Id'\]/, 'CORS harus mengekspos X-Request-Id')
assert.match(readFileSync('src/components/FeatureErrorBoundary.tsx', 'utf8'), /error instanceof GalatApi && error\.requestId/, 'batas galat menampilkan referensi permintaan')
console.log('galat-api: lulus')
