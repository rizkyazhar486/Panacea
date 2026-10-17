import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Audit akses klinisi mengutip perilaku kode saat ini. Bila kode berubah, tes ini gagal dan dokumen harus diperbarui bersama keputusan pemilik;
// akses klinisi tidak boleh berubah diam-diam (peta Human-AI 17 Okt 2026, F1).
const baca = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
const DOK = baca('docs/alpha/F1_CLINICIAN_ACCESS_AUDIT.md')
export const KUTIPAN = [
  ['T1 dokter tanpa patientIds', 'server/src/modules/labResults/http/aktor.ts', "if (u.role === 'dokter') return { ...dasar, role: 'clinician', authorizedClinician: true }"],
  ['T1 model satu praktik', 'server/src/domains/clinical-records/aksesKlinis.ts', 'model satu praktik'],
  ['T2 owner dianggap klinisi di /api/clinical', 'server/src/domains/clinical-records/aksesKlinis.ts', "return pemilik || u.role === 'dokter' || u.role === 'owner'"],
  ['T2 owner bukan klinisi di lab', 'server/src/modules/labResults/http/aktor.ts', 'Owner BUKAN klinisi'],
  ['T3 audit baca tanpa pasien', 'server/src/index.ts', "addAudit(u, 'clinical.read')"],
  ['T4 second opinion semua tertunda', 'server/src/index.ts', "if (u.role === 'dokter' || u.role === 'owner') {\n    return res.json({ requests: listPendingSecondOpinions() })"],
  ['T4 pasien tanpa aiDraft', 'server/src/index.ts', 'listSecondOpinionsForPatient(u.email).map((s) => ({ ...s, aiDraft: undefined }))'],
  ['T5 lab-shares berbasis izin', 'server/src/index.ts', 'izinBerlaku(i, u.email, kini)'],
  ['T6 tenant satu konstanta', 'server/src/modules/labResults/service/labResultsService.ts', "export const TENANT_PRAKTIK = 'praktik'"],
  ['lab baca tenant-wide', 'server/src/modules/labResults/service/labResultsService.ts', 'return STAFF_READ.includes(a.role)'],
  ['lab tulis klinisi tanpa batas', 'server/src/modules/labResults/service/labResultsService.ts', 'klinisi dan admin tidak dibatasi di sini'],
  ['lab peran baca staf', 'server/src/modules/labResults/domain/definitions.ts', "['clinician', 'nurse', 'lab-staff', 'admin']"],
]

test('setiap_kutipan_perilaku_di_audit_masih_ada_di_sumbernya', () => {
  for (const [nama, berkas, potongan] of KUTIPAN) assert.ok(baca(berkas).includes(potongan), `${nama}: kutipan hilang dari ${berkas}; perbarui audit dan keputusan`)
})

test('kutipan_yang_diubah_satu_karakter_tidak_cocok', () => {
  const [, berkas, potongan] = KUTIPAN[0]
  assert.ok(!baca(berkas).includes(potongan.replace("'dokter'", "'dokterx'")))
})

test('dokumen_menyebut_semua_temuan_dan_semua_tes_terkait_ada', () => {
  for (const t of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']) assert.ok(DOK.includes(`| ${t} |`), `temuan ${t} hilang dari tabel`)
  for (const f of ['aksesKlinis.uji.ts', 'rbacKlinis.uji.ts', 'hasilLab.uji.ts', 'secondOpinionHttpRbac.uji.ts', 'labShareHttpRbac.uji.ts', 'staffRbacHttp.uji.ts']) {
    assert.ok(DOK.includes(f), `${f} tidak dirujuk`)
    assert.ok(baca(`server/uji/${f}`).length > 0, `${f} tidak ada di server/uji`)
  }
})

test('rekam_keputusan_kosong_dan_status_f1_tetap_reported_tanpa_klaim_verified', () => {
  const bagian = DOK.slice(DOK.indexOf('## 4. Rekam keputusan'), DOK.indexOf('## 5.'))
  const baris = bagian.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Keputusan') && !l.startsWith('|---'))
  assert.equal(baris.length, 7, `jumlah baris keputusan: ${baris.length}`)
  for (const l of baris) assert.match(l, /\| ______ \| ______ \|$|\| ______ \|$/, `rekam keputusan terisi: ${l.slice(0, 50)}`)
  assert.match(DOK, /F1 tetap REPORTED/)
  assert.ok(!/F1 (?:sudah|telah|adalah) VERIFIED/.test(DOK))
})
