import assert from 'node:assert/strict'
import { hitungRcv, nilaiPerubahan, Z_RCV_95 } from '../../src/domains/lab-interpretation/engine/referenceChangeValue.ts'

// Golden Fraser 1989: CVa=3, CVi=4 -> CV gabungan 5 -> RCV = √2·1,96·5 = 13,859%.
// Nilai CV di sini adalah fixture aritmetika, BUKAN klaim variasi analit nyata.
const V = { cvAnalitikPersen: 3, cvIntraIndividuPersen: 4, sumber: 'fixture-uji' }

function menerima_rcv_golden() {
  const r = hitungRcv(V)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.ok(Math.abs(r.rcvSimetrisPersen - 13.8593) < 1e-3, `simetris ${r.rcvSimetrisPersen}`)
  // Log-normal: σ=√ln(1,0025)=0,049969; f=1,96·√2·σ=0,138506 -> +14,856% / −12,934%.
  assert.ok(Math.abs(r.rcvNaikPersen - 14.8557) < 5e-3, `naik ${r.rcvNaikPersen}`)
  assert.ok(Math.abs(r.rcvTurunPersen - -12.9342) < 5e-3, `turun ${r.rcvTurunPersen}`)
  assert.ok(r.rcvNaikPersen > -r.rcvTurunPersen, 'log-normal harus asimetris')
}

function menolak_input_tidak_valid() {
  const alasan = (v: any, z?: number) => { const r = hitungRcv(v, z); return r.ok ? 'ok' : r.alasan }
  assert.equal(alasan({ ...V, cvAnalitikPersen: -1 }), 'cv-tidak-valid')
  assert.equal(alasan({ ...V, cvIntraIndividuPersen: NaN }), 'cv-tidak-valid')
  assert.equal(alasan({ ...V, cvIntraIndividuPersen: Infinity }), 'cv-tidak-valid')
  assert.equal(alasan({ ...V, cvAnalitikPersen: '3' }), 'cv-tidak-valid')
  assert.equal(alasan({ ...V, sumber: '  ' }), 'sumber-kosong')
  assert.equal(alasan(V, 0), 'z-tidak-valid')
  assert.equal(alasan(V, NaN), 'z-tidak-valid')
  assert.equal(alasan(V), 'ok') // pasangan: hanya kondisi di atas yang menolak
}

function batas_cv_nol_diterima() {
  const r = hitungRcv({ ...V, cvAnalitikPersen: 0, cvIntraIndividuPersen: 0 })
  assert.ok(r.ok && r.rcvSimetrisPersen === 0 && r.rcvNaikPersen === 0)
}

function menilai_perubahan_di_batas() {
  const r = hitungRcv(V)
  assert.ok(r.ok)
  if (!r.ok) return
  const dari = 100
  const tepat = dari * (1 + r.rcvNaikPersen / 100)
  assert.equal(nilaiPerubahan(dari, tepat * 0.999, V), 'dalam-rcv')
  assert.equal(nilaiPerubahan(dari, tepat * 1.001, V), 'melebihi-rcv')
  assert.equal(nilaiPerubahan(dari, dari * (1 + r.rcvTurunPersen / 100) * 0.999, V), 'melebihi-rcv')
  assert.equal(nilaiPerubahan(dari, dari * (1 + r.rcvTurunPersen / 100) * 1.001, V), 'dalam-rcv')
  assert.equal(nilaiPerubahan(100, 100, V), 'dalam-rcv')
}

function nilai_perubahan_fail_closed() {
  assert.equal(nilaiPerubahan(0, 10, V), 'tidak-diketahui')
  assert.equal(nilaiPerubahan(-5, 10, V), 'tidak-diketahui')
  assert.equal(nilaiPerubahan(10, NaN, V), 'tidak-diketahui')
  assert.equal(nilaiPerubahan(10, 20, { ...V, sumber: '' }), 'tidak-diketahui')
  assert.equal(nilaiPerubahan(10, 20, V, -1), 'tidak-diketahui')
  assert.equal(nilaiPerubahan(10, 20, V, Z_RCV_95), 'melebihi-rcv') // pasangan valid
}

function deterministik() {
  assert.deepEqual(hitungRcv(V), hitungRcv(V))
}

for (const t of [menerima_rcv_golden, menolak_input_tidak_valid, batas_cv_nol_diterima, menilai_perubahan_di_batas, nilai_perubahan_fail_closed, deterministik]) {
  t()
  console.log(`ok ${t.name}`)
}
