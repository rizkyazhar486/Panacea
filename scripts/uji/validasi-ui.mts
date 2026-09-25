import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const ui = readFileSync('src/components/StudiValidasiKlinis.tsx', 'utf8')
// Buta: hanya pemimpin studi yang pernah memuat buku besar (berisi penilaian penilai lain).
assert.match(ui, /\{pemimpin && <button type="button" onClick=\{\(\) => void bukaLaporan/, 'tombol laporan (buku besar penuh) tampil untuk penilai biasa — kebutaan bocor')
assert.equal((ui.match(/api\.validationLedger\(\)/g) ?? []).length, 1)
// Laporan dihitung kernel dari buku besar, bukan dari angka server; rantai diverifikasi & ditampilkan.
assert.match(ui, /susunLaporan\(\(await api\.validationLedger\(\)\)\.ledger, id\)/)
assert.match(ui, /Audit chain: \{r\.rantai\.utuh \? 'intact' : `BROKEN/)
assert.match(ui, /No human assessments yet — nothing below is a result\./, 'laporan tanpa data manusia tidak menyatakannya')
// Keluaran sistem ditandai bukan tinjauan klinisi; identitas penilai tidak dikirim klien.
assert.match(ui, /System output \(derived, not clinician-reviewed\)/)
assert.doesNotMatch(ui, /penilai:\s*\{/, 'klien mengirim identitas penilai')
const hub = readFileSync('src/pages/ClinicalHub.tsx', 'utf8')
assert.match(hub, /\(account\?\.role === 'dokter' \|\| account\?\.isOwner\) && <StudiValidasiKlinis pemimpin=\{!!account\?\.isOwner\} \/>/)
console.log('validasi-ui: penilai buta, laporan dihitung kernel + rantai diverifikasi, keluaran ditandai bukan tinjauan, identitas dari server')
