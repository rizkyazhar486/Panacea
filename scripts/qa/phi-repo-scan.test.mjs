// E4: pemindai PHI repo. Positif/negatif/batas pada pola, logika daftar-izin, dan pemindaian repo nyata terhadap daftar izin.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pindaiTeks, bandingkan, pindaiRepo, muatDaftarIzin, BERKAS_FIXTURE, daftarBerkas, BATAS_PINDAI_KARAKTER, ringkasKegagalanTanpaPHI, refBerkasAman } from './phi-repo-scan.mjs'

const jenis = (t) => pindaiTeks(t).map((x) => `${x.jenis}:${x.nilai}`)

test('mendeteksi_nik_berstruktur_sah_laki_dan_perempuan', () => {
  assert.deepEqual(jenis('nik 3171011505900001 selesai'), ['nik:3171011505900001'])          // DKI, tgl 15
  assert.deepEqual(jenis('nik 3171015505900001'), ['nik:3171015505900001'])                  // tgl 55 = perempuan tgl 15
})
test('menolak_16_digit_yang_bukan_struktur_nik', () => {
  assert.deepEqual(jenis('3171011513900001'), [], 'bulan 13 bukan NIK')
  assert.deepEqual(jenis('3171013205900001'), [], 'tanggal 32 bukan NIK')
  assert.deepEqual(jenis('0171011505900001'), [], 'provinsi 01 bukan NIK')
  assert.deepEqual(jenis('9571011505900001'), [], 'provinsi 95 bukan NIK')
})
test('batas_nik_tepat_15_dan_17_digit_bukan_nik', () => {
  assert.deepEqual(jenis('317101150590000'), [], '15 digit')
  assert.deepEqual(jenis('31710115059000012'), [], '17 digit tidak boleh terpotong menjadi NIK')
  assert.deepEqual(jenis('0.3171011505900001'), [], 'bagian dari desimal')
})
test('batas_provinsi_11_dan_94_diterima_10_dan_95_ditolak', () => {
  assert.deepEqual(jenis('1101011505900001'), ['nik:1101011505900001'])
  assert.deepEqual(jenis('9401011505900001'), ['nik:9401011505900001'])
  assert.deepEqual(jenis('1001011505900001'), [])
})
test('mendeteksi_ponsel_nyata_dan_membiarkan_pola_buatan', () => {
  assert.deepEqual(jenis('hubungi 081377745521'), ['ponsel:081377745521'])
  assert.deepEqual(jenis('+6281377745521 / 6281377745521'), ['ponsel:+6281377745521', 'ponsel:6281377745521'])
  assert.deepEqual(jenis('081234567890'), [], 'urutan 12345678 = buatan')
  assert.deepEqual(jenis('080000000000'), [], 'digit berulang = buatan')
})
test('ponsel_terlalu_pendek_atau_bagian_dari_angka_lebih_panjang_bukan_temuan', () => {
  assert.deepEqual(jenis('08137774'), [])
  assert.deepEqual(jenis('1081377745521'), [], 'didahului digit')
  assert.deepEqual(jenis('0.81377745521'), [])
})
test('email_domain_sintetis_dibiarkan_domain_nyata_ditandai', () => {
  for (const ok of ['a@example.com', 'a@x.test', 'pasien@localhost.test', 'u@x.id', 'n@email.com', 'a@b.id']) assert.deepEqual(jenis(ok), [], ok)
  assert.deepEqual(jenis('budi.santoso@rsudharapan.go.id'), ['email:budi.santoso@rsudharapan.go.id'])
  assert.deepEqual(jenis('X@Gmail.com'), ['email:x@gmail.com'], 'huruf besar dinormalkan')
})
test('sintaks_python_atau_kode_bukan_email', () => {
  assert.deepEqual(jenis('(o.matrix_world@x.co)[:]'), [], 'operator @ matriks, domain sintetis x.co')
  assert.deepEqual(jenis('np.dot(a, b)@c'), [])
})
test('daftar_izin_mengizinkan_hanya_yang_cocok_jenis_dan_nilai', () => {
  const t = [{ berkas: 'a.ts', jenis: 'email', nilai: 'a@gmail.com' }, { berkas: 'b.ts', jenis: 'ponsel', nilai: '081377745521' }]
  const izin = [{ jenis: 'email', nilai: 'A@gmail.com', alasan: 'email operasional pemilik' }]
  const r = bandingkan(t, izin)
  assert.deepEqual(r.takTerdaftar.map((x) => x.nilai), ['081377745521'], 'yang tak terdaftar tetap gagal')
  assert.deepEqual(r.usang, [])
  assert.equal(bandingkan(t, [{ jenis: 'ponsel', nilai: 'a@gmail.com', alasan: 'jenis salah, nilai sama' }]).takTerdaftar.length, 2, 'jenis harus cocok')
})
test('entri_usang_dan_tanpa_alasan_ditolak', () => {
  const izin = [{ jenis: 'email', nilai: 'hilang@gmail.com', alasan: 'dulu ada di berkas lama' }, { jenis: 'email', nilai: 'a@gmail.com', alasan: 'ok' }]
  const r = bandingkan([{ berkas: 'a.ts', jenis: 'email', nilai: 'a@gmail.com' }], izin)
  assert.deepEqual(r.usang.map((x) => x.nilai), ['hilang@gmail.com'])
  assert.deepEqual(r.tanpaAlasan.map((x) => x.nilai), ['a@gmail.com'], 'alasan "ok" < 10 karakter')
})
test('entri_berpasangan_berkas_hanya_cocok_pada_berkas_itu', () => {
  const t = [{ berkas: 'a.ts', jenis: 'email', nilai: 'a@gmail.com' }, { berkas: 'b.ts', jenis: 'email', nilai: 'a@gmail.com' }]
  const r = bandingkan(t, [{ jenis: 'email', nilai: 'a@gmail.com', berkas: 'a.ts', alasan: 'hanya di a.ts yang disengaja' }])
  assert.deepEqual(r.takTerdaftar.map((x) => x.berkas), ['b.ts'])
})
test('repo_nyata_tanpa_temuan_tak_terdaftar_dan_tanpa_entri_usang', () => {
  const r = bandingkan(pindaiRepo(), muatDaftarIzin())
  assert.equal(r.takTerdaftar.length, 0, 'jumlah PHI tak terdaftar harus nol (jangan cetak nilainya ke CI)')
  assert.equal(r.usang.length, 0, 'jumlah allowlist usang harus nol (jangan cetak nilainya ke CI)')
  assert.equal(r.tanpaAlasan.length, 0, 'jumlah allowlist tanpa alasan harus nol (jangan cetak nilainya ke CI)')
})
test('deterministik_dua_kali_jalan_identik', () => {
  const first = pindaiRepo(), second = pindaiRepo()
  assert.equal(first.length, second.length, 'same count without exposing matched values')
  assert.equal(createHash('sha256').update(JSON.stringify(first)).digest('hex'), createHash('sha256').update(JSON.stringify(second)).digest('hex'), 'same findings, compare digests rather than printing identifiers')
})
test('berkas_sintetis_dengan_phi_disuntikkan_terdeteksi_oleh_pindaiRepo', () => {
  const t = pindaiRepo(['f.txt'], () => 'pasien 3171011505900001 telp 081377745521 mail ani@rsharapan.id')
  assert.deepEqual(t.map((x) => x.jenis).sort(), ['email', 'nik', 'ponsel'])
  assert.equal(bandingkan(t, muatDaftarIzin()).takTerdaftar.length, 3, 'tidak ada di daftar izin ⇒ gagal')
})
test('pengecualian_fixture_terkunci_dan_berkas_lain_tetap_dipindai', () => {
  assert.deepEqual(BERKAS_FIXTURE, ['scripts/qa/phi-repo-scan.test.mjs', 'governance/PHI_SCAN_ALLOWLIST.json'], 'daftar pengecualian tidak boleh melebar diam-diam')
  for (const f of BERKAS_FIXTURE) assert.ok(!daftarBerkas().includes(f), `${f} dikecualikan`)
  assert.ok(daftarBerkas().includes('scripts/qa/phi-repo-scan.mjs'), 'pemindai sendiri tetap dipindai')
  assert.ok(daftarBerkas().includes('server/src/config.ts'), 'kode produk tetap dipindai')
  assert.ok(daftarBerkas().some((f) => /^scripts\/qa\/.+\.test\.mjs$/.test(f) && !BERKAS_FIXTURE.includes(f)), 'berkas uji lain tetap dipindai (pengecualian path persis, bukan awalan)')
})

test('E4: unreadable tracked file fails closed rather than being skipped', () => {
  assert.throws(() => pindaiRepo(['rahasia.ts'], () => { throw new Error('EACCES') }), /PHI scan gagal membaca berkas ref=[0-9a-f]{16}/)
})

test('E4: non-text reader result cannot certify a clean repository', () => {
  assert.throws(() => pindaiRepo(['kosong.ts'], () => undefined), /konten bukan teks: ref=[0-9a-f]{16}/)
})

test('E4: real-world source larger than old 2M boundary is scanned fully', () => {
  const contents = 'x'.repeat(2_000_001) + ' 3171011505900001'
  const found = pindaiRepo(['besar.ts'], () => contents)
  assert.deepEqual(found, [{ berkas: 'besar.ts', jenis: 'nik', nilai: '3171011505900001' }])
})

test('E4: pathological oversized content fails closed instead of silently passing', () => {
  assert.equal(BATAS_PINDAI_KARAKTER, 16_000_000)
  assert.throws(() => pindaiRepo(['terlalu-besar.ts'], () => 'x'.repeat(BATAS_PINDAI_KARAKTER + 1)), /tidak memeriksa berkas >16000000 karakter: ref=[0-9a-f]{16}/)
})

test('E4: scanner failures remain fail-closed without publishing matched PHI or filenames', () => {
  const filename = 'patients/name-and-081377745521.ts'
  const secret = 'budi.santoso@rsudharapan.go.id'
  const nik = '3171011505900001'
  const r = ringkasKegagalanTanpaPHI({
    takTerdaftar: [{ jenis: 'email', nilai: secret, berkas: filename }, { jenis: 'nik', nilai: nik, berkas: filename }],
    usang: [{ jenis: 'email', nilai: secret, berkas: filename }],
    tanpaAlasan: [{ jenis: 'email', nilai: secret, berkas: filename }],
  })
  assert.equal(r.length, 4)
  const log = r.join('\\n')
  for (const sensitive of [secret, nik, filename, '081377745521']) {
    assert.equal(log.includes(sensitive), false, 'PII must never be printed in CI errors')
  }
  assert.equal(r.filter(x => x.includes('nilai=[REDACTED]')).length, 4)
  assert.ok(log.includes('ref=' + refBerkasAman(filename)))
  assert.match(refBerkasAman(filename), /^[0-9a-f]{16}$/)
  const untrusted = ringkasKegagalanTanpaPHI({ usang: [{ jenis: secret, nilai: nik }] })
  assert.equal(untrusted[0].includes(secret), false, 'untrusted category must also be redacted')
  assert.match(untrusted[0], /jenis=unknown/)
  assert.throws(
    () => pindaiRepo([filename], () => { throw new Error(secret) }),
    e => e instanceof Error && !e.message.includes(secret) && !e.message.includes(filename) && /ref=[0-9a-f]{16}/.test(e.message),
    'read exceptions must not echo secret causes or sensitive filenames',
  )
})

test('E4: allowlist read and parse failures do not echo sensitive JSON, exceptions, or filesystem path', () => {
  const directory = mkdtempSync(join(tmpdir(), 'panacea-phi-allowlist-'))
  const file = join(directory, 'sensitive-identity@private.example.json')
  const secret = 'patient.privacy@hospital.example'
  try {
    const missing = file + '-missing'
    assert.throws(
      () => muatDaftarIzin(missing),
      (e) => e instanceof Error && /tidak dapat dibaca/.test(e.message) && !e.message.includes(missing),
      'missing file must fail closed with no path leak',
    )
    writeFileSync(file, '{ "entri": [ " ' + secret + '" }')
    assert.throws(
      () => muatDaftarIzin(file),
      (e) => e instanceof Error && /JSON tidak valid/.test(e.message) && !e.message.includes(secret) && !e.message.includes(file),
      'malformed JSON must not emit parser snippets or paths',
    )
    writeFileSync(file, 'null')
    assert.throws(() => muatDaftarIzin(file), /struktur tidak valid/, 'null root must fail closed')
    writeFileSync(file, '{"entri":[null]}')
    assert.throws(() => muatDaftarIzin(file), /struktur tidak valid/, 'null item must fail closed')
    writeFileSync(file, '{"entri":[{"jenis":"email","nilai":123,"alasan":"long enough reason"}]}')
    assert.throws(() => muatDaftarIzin(file), /struktur tidak valid/, 'malformed identifier must fail closed')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('E4: valid empty or scoped allowlist remains accepted', () => {
  const directory = mkdtempSync(join(tmpdir(), 'panacea-phi-allowlist-'))
  const file = join(directory, 'synthetic.json')
  try {
    writeFileSync(file, '{"entri":[]}')
    assert.deepEqual(muatDaftarIzin(file), [])
    const entry = { jenis: 'email', nilai: 'a@example.com', berkas: 'test.ts', alasan: 'synthetic fixture' }
    writeFileSync(file, JSON.stringify({ entri: [entry] }))
    assert.deepEqual(muatDaftarIzin(file), [entry])
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('E4: git listing errors never expose subprocess diagnostics', () => {
  const secret = 'private.person@hospital.example'
  const opaque = new Error('command failed: ' + secret)
  opaque.stderr = Buffer.from('secret path: ' + secret)
  opaque.stdout = Buffer.from('patient 3171011505900001')
  assert.throws(() => daftarBerkas(() => { throw opaque }), (error) =>
    error instanceof Error &&
    /gagal mendapatkan daftar berkas terlacak/.test(error.message) &&
    !error.message.includes(secret) &&
    !error.message.includes('3171011505900001') &&
    !('cause' in error),
    'subprocess output and error causes must never enter shared CI logs',
  )
})

test('E4: git listing rejects non-text output and does not silently mark a scan clean', () => {
  assert.throws(() => daftarBerkas(() => undefined), /daftar berkas bukan teks/)
  assert.throws(() => daftarBerkas(() => ({ toString: () => 'safe.ts' })), /daftar berkas bukan teks/)
})

test('E4: git listing keeps tracked scope and exact fixture exclusions after redaction', () => {
  const payload = Buffer.from([
    'server/src/config.ts', 'scripts/qa/additional.test.mjs',
    'public/logo-mark.png', 'node_modules/private.ts',
    'scripts/qa/phi-repo-scan.test.mjs', 'governance/PHI_SCAN_ALLOWLIST.json',
    'bodyexposure/secret.txt', 'src/main.tsx', '',
  ].join('\\0'))
  let invoked = 0
  const names = daftarBerkas((binary, args, opts) => {
    invoked++
    assert.equal(binary, 'git')
    assert.deepEqual(args, ['ls-files', '-z'])
    assert.ok(opts.cwd)
    return payload
  })
  assert.equal(invoked, 1)
  assert.deepEqual(names, ['server/src/config.ts', 'scripts/qa/additional.test.mjs', 'src/main.tsx'])
  assert.equal(pindaiRepo(names, (name) => name === 'src/main.tsx' ? 'contact 3171011505900001' : 'safe').length, 1, 'tracked code still scanned')
})
