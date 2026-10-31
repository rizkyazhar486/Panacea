import assert from 'node:assert/strict'
import { buatMeter, catatTrafik, hostDari, ukuranBadan, panjangRespons, bungkusFetch, ringkasanTrafik } from '../src/domains/observability/trafikKeluar.js'

const respons = (len: string | null) => ({ ok: true, headers: { get: (k: string) => (k === 'content-length' ? len : null) } })

// positif: host, byte kirim dan terima dijumlahkan per host
{
  const m = buatMeter()
  catatTrafik(m, 'site.api.espn.com', 0, 1200)
  catatTrafik(m, 'site.api.espn.com', 10, 800)
  assert.deepEqual(m.get('site.api.espn.com'), { permintaan: 2, byteKirim: 10, byteTerima: 2000, tanpaPanjang: 0 })
}
// negatif: ukuran tak diketahui/tidak sah tidak ditebak, dihitung sebagai tanpaPanjang
{
  const m = buatMeter()
  catatTrafik(m, 'h', null, null); catatTrafik(m, 'h', NaN, -1); catatTrafik(m, 'h', Infinity, Infinity)
  assert.deepEqual(m.get('h'), { permintaan: 3, byteKirim: 0, byteTerima: 0, tanpaPanjang: 3 })
  catatTrafik(m, '', 1, 1)
  assert.equal(m.size, 1, 'host kosong tidak dicatat')
}
// hostDari: hanya host, tanpa jalur/query; masukan rusak -> null tanpa melempar
assert.equal(hostDari('https://news.google.com/rss/x?token=rahasia'), 'news.google.com')
assert.equal(hostDari(new URL('https://a.b:8443/p')), 'a.b:8443')
assert.equal(hostDari({ url: 'https://c.d/x' }), 'c.d')
assert.equal(hostDari('bukan url'), null)
assert.equal(hostDari(undefined), null)
// ukuranBadan
assert.equal(ukuranBadan(undefined), 0)
assert.equal(ukuranBadan('héllo'), 6)
assert.equal(ukuranBadan(new Uint8Array(7)), 7)
assert.equal(ukuranBadan({ stream: true }), null)
// panjangRespons: batas format
assert.equal(panjangRespons(respons('0')), 0)
assert.equal(panjangRespons(respons('512')), 512)
assert.equal(panjangRespons(respons('-1')), null)
assert.equal(panjangRespons(respons('12abc')), null)
assert.equal(panjangRespons(respons(null)), null)
assert.equal(panjangRespons(null), null)

// bungkusFetch: argumen diteruskan apa adanya, hasil tidak diubah
{
  const m = buatMeter(); const dipanggil: unknown[] = []
  const res = respons('300')
  const f = bungkusFetch(async (i, o) => { dipanggil.push([i, o]); return res }, m)
  const init = { method: 'POST', body: 'abcd' }
  const hasil = await f('https://push.example/kirim?id=1', init)
  assert.equal(hasil, res)
  assert.deepEqual(dipanggil, [['https://push.example/kirim?id=1', init]])
  assert.deepEqual(m.get('push.example'), { permintaan: 1, byteKirim: 4, byteTerima: 300, tanpaPanjang: 0 })
}
// bungkusFetch: kegagalan jaringan tetap dilempar dan tercatat sebagai permintaan
{
  const m = buatMeter()
  const f = bungkusFetch(async () => { throw new Error('ECONNRESET') }, m)
  await assert.rejects(f('https://down.example/'), /ECONNRESET/)
  assert.deepEqual(m.get('down.example'), { permintaan: 1, byteKirim: 0, byteTerima: 0, tanpaPanjang: 0 })
}
// berpasangan: URL tak terurai tetap dipanggil, hanya tidak dicatat
{
  const m = buatMeter(); let n = 0
  await bungkusFetch(async () => { n++; return respons('5') }, m)('relatif/tanpa-host')
  assert.equal(n, 1); assert.equal(m.size, 0)
}
// ringkasan: urut total byte, seri -> permintaan -> nama; batas tidak sah -> 10
{
  const m = buatMeter()
  catatTrafik(m, 'b', 0, 100); catatTrafik(m, 'a', 0, 100); catatTrafik(m, 'a', 0, 0); catatTrafik(m, 'c', 0, 900)
  assert.deepEqual(ringkasanTrafik(m).map((r) => r.host), ['c', 'a', 'b'])
  assert.deepEqual(ringkasanTrafik(m, 1).map((r) => r.host), ['c'])
  assert.equal(ringkasanTrafik(m, 0).length, 3)
  assert.equal(ringkasanTrafik(m, 2.5).length, 3)
}
console.log('trafikKeluar: ok')
