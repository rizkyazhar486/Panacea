import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Gerbang ledger penerimaan Alpha (governance/ALPHA_ACCEPTANCE_LEDGER.json = sumber kebenaran; docs/alpha/*.md dihasilkan darinya).
// Aturan: hanya VERIFIED yang berkredit dan wajib berbukti; status harus dari kosakata; id unik; kriteria tidak boleh berkurang dari
// baseline (45) setelah penambahan F1/F2 supaya persentase tidak naik karena penyebut diperkecil; dokumen Markdown harus sinkron dengan JSON.
const BASELINE_TOTAL = 45
// F1/F2 are owner-approved extension IDs. A replacement criterion must not masquerade as the 45-item scope.
const REQUIRED_EXTENSIONS = new Map([
  ['F1', 'Task 44 — Full User Journey Acceptance'],
  ['F2', 'Task 45 — UI/UX Optimization & Polishing Acceptance'],
])
const JSON_PATH = new URL('../../governance/ALPHA_ACCEPTANCE_LEDGER.json', import.meta.url)
const MD_PATH = new URL('../../docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md', import.meta.url)

type Penundaan = { decision: string; phase: string; previousStatus: string; stillRequired: string }
type Kriteria = { id: string; pillar: string; criterion: string; acceptance: string; status: string; evidence: string[]; owner: string; note: string; deferral?: Penundaan }
type KebijakanPenundaan = { decision: string; decidedBy: string; allowedIds: string[]; targetPhase: string; requiredBeforeClinicalUse: boolean; preserved: string }
type Ledger = { version: number; approvedBy: string; scope: string[]; weightPolicy: string; baseline: { mainSha: string; date: string; note: string }; statuses: string[]; criteria: Kriteria[]; deferralPolicy?: KebijakanPenundaan }

export const STATUS_DITUNDA = 'DEFERRED_TO_CLINICAL_VALIDATION'

export function auditLedger(l: Ledger): { masalah: string[]; terverifikasi: number; total: number; aktif: number; ditunda: number; persen: number } {
  const masalah: string[] = []
  const ids = new Set<string>()
  for (const c of l.criteria) {
    if (ids.has(c.id)) masalah.push(`id ganda: ${c.id}`)
    ids.add(c.id)
    if (!l.statuses.includes(c.status)) masalah.push(`status tidak dikenal pada ${c.id}: ${c.status}`)
    if (c.status === 'VERIFIED' && (!Array.isArray(c.evidence) || c.evidence.length === 0 || c.evidence.some((e) => typeof e !== 'string' || e.trim() === ''))) masalah.push(`VERIFIED tanpa bukti: ${c.id}`)
    if (!c.acceptance || c.acceptance.trim() === '') masalah.push(`kriteria tanpa syarat penerimaan: ${c.id}`)
    // Penundaan hanya sah bila: status ditunda, id diizinkan kebijakan pemilik, dan alasan/fase/syarat-tersisa tercatat. Penunda tidak pernah VERIFIED.
    if (c.status === STATUS_DITUNDA) {
      const k = l.deferralPolicy
      if (!k || !Array.isArray(k.allowedIds) || !k.allowedIds.includes(c.id)) masalah.push(`penundaan tanpa izin kebijakan pemilik: ${c.id}`)
      const d = c.deferral
      if (!d || [d.decision, d.phase, d.previousStatus, d.stillRequired].some((v) => typeof v !== 'string' || v.trim() === '')) masalah.push(`penundaan tanpa catatan lengkap: ${c.id}`)
    } else if (c.deferral) masalah.push(`catatan penundaan pada kriteria yang tidak ditunda: ${c.id}`)
  }
  if (l.deferralPolicy) {
    const k = l.deferralPolicy
    if (k.requiredBeforeClinicalUse !== true) masalah.push('kebijakan penundaan wajib mempertahankan validasi klinis sebelum penggunaan klinis nyata')
    for (const id of k.allowedIds) if (!l.criteria.some((c) => c.id === id)) masalah.push(`kebijakan penundaan menyebut id yang tidak ada: ${id}`)
  }
  if (l.criteria.length < BASELINE_TOTAL) masalah.push(`kriteria berkurang di bawah baseline ${BASELINE_TOTAL}: ${l.criteria.length}`)
  for (const [id, title] of REQUIRED_EXTENSIONS) {
    const extension = l.criteria.find((c) => c.id === id)
    if (!extension) masalah.push(`ekstensi wajib hilang: ${id}`)
    else if (extension.criterion !== title) masalah.push(`identitas ekstensi berubah: ${id}`)
  }
  const terverifikasi = l.criteria.filter((c) => c.status === 'VERIFIED').length
  const total = l.criteria.length
  // Penyebut Alpha aktif mengecualikan kriteria yang SAH ditunda; kriteria tetap tercatat dan `total` tetap menjaga baseline 45.
  const ditunda = l.criteria.filter((c) => c.status === STATUS_DITUNDA && l.deferralPolicy?.allowedIds.includes(c.id)).length
  const aktif = total - ditunda
  return { masalah, terverifikasi, total, aktif, ditunda, persen: aktif === 0 ? 0 : Math.round((1000 * terverifikasi) / aktif) / 10 }
}

export function renderLedger(l: Ledger): string {
  const a = auditLedger(l)
  const pillars = [...new Set(l.criteria.map((c) => c.pillar))]
  const hitung = (s: string) => l.criteria.filter((c) => c.status === s).length
  const out: string[] = []
  out.push('# Alpha acceptance ledger', '')
  out.push('> Dihasilkan dari `governance/ALPHA_ACCEPTANCE_LEDGER.json` (jangan edit tangan; jalankan `UPDATE_LEDGER=1 node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/alpha-ledger.mts`).', '')
  out.push(`**Alpha engineering completion: ${a.terverifikasi} / ${a.aktif} = ${a.persen}%** (baseline main \`${l.baseline.mainSha.slice(0, 9)}\`, ${l.baseline.date}).`, '')
  if (a.ditunda > 0 && l.deferralPolicy) {
    const ids = l.criteria.filter((c) => c.status === STATUS_DITUNDA).map((c) => c.id).join(', ')
    out.push(`Ditunda ke fase ${l.deferralPolicy.targetPhase}: ${a.ditunda} (${ids}); total kriteria tercatat ${a.total}. Kriteria ditunda **tidak** berstatus VERIFIED dan **bukan** tervalidasi klinis. ${l.deferralPolicy.decision} (${l.deferralPolicy.decidedBy}).`, '')
  }
  out.push(`Disetujui: ${l.approvedBy}. ${l.baseline.note}`, '')
  out.push('## Kebijakan penghitungan', '', l.weightPolicy, '')
  out.push('Persentase tidak mengalahkan gerbang yang gagal: Alpha engineering tidak dinyatakan 100% sebelum seluruh gerbang wajib aktif lulus. Alpha engineering 100% BUKAN validasi klinis: validasi dan persetujuan klinis tetap wajib pada fase Clinical Validation sebelum fungsi pendukung keputusan klinis dipakai untuk keputusan klinis nyata.', '')
  if (l.deferralPolicy) out.push(`Pelestarian: ${l.deferralPolicy.preserved}`, '')
  out.push('## Lingkup Alpha (disetujui)', '', ...l.scope.map((s) => `- ${s}`), '')
  out.push('## Ringkasan status', '', '| Status | Jumlah |', '|---|---|', ...l.statuses.map((s) => `| ${s} | ${hitung(s)} |`), '')
  for (const p of pillars) {
    const rows = l.criteria.filter((c) => c.pillar === p)
    out.push(`## ${p} (${rows.filter((c) => c.status === 'VERIFIED').length} / ${rows.length})`, '', '| ID | Kriteria | Syarat penerimaan | Status | Pemilik | Bukti / catatan |', '|---|---|---|---|---|---|')
    for (const c of rows) out.push(`| ${c.id} | ${c.criterion} | ${c.acceptance} | ${c.status} | ${c.owner || '-'} | ${[...c.evidence, c.note].filter(Boolean).join('; ') || '-'} |`)
    out.push('')
  }
  return out.join('\n') + '\n'
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const l = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as Ledger
  if (process.env.UPDATE_LEDGER === '1') { writeFileSync(MD_PATH, renderLedger(l)); console.log('alpha-ledger: dokumen ditulis') }
  const a = auditLedger(l)
  assert.deepEqual(a.masalah, [], `ledger Alpha bermasalah: ${a.masalah.join('; ')}`)
  assert.equal(readFileSync(MD_PATH, 'utf8'), renderLedger(l), 'docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md tidak sinkron dengan JSON (jalankan UPDATE_LEDGER=1)')

  // Negatif (berpasangan): salinan yang sama kecuali satu perubahan harus gagal dengan alasan bernama.
  const salin = (): Ledger => JSON.parse(JSON.stringify(l)) as Ledger
  const v = l.criteria.find((c) => c.status === 'VERIFIED')!
  let x = salin(); x.criteria.find((c) => c.id === v.id)!.evidence = []
  assert.ok(auditLedger(x).masalah.includes(`VERIFIED tanpa bukti: ${v.id}`), 'VERIFIED tanpa bukti lolos')
  x = salin(); x.criteria.find((c) => c.id === v.id)!.evidence = ['  ']
  assert.ok(auditLedger(x).masalah.includes(`VERIFIED tanpa bukti: ${v.id}`), 'bukti kosong spasi lolos')
  x = salin(); x.criteria[0].status = 'DONE'
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('status tidak dikenal')), 'status tak dikenal lolos')
  x = salin(); x.criteria[1].id = x.criteria[0].id
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('id ganda')), 'id ganda lolos')
  x = salin(); x.criteria.pop()
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('kriteria berkurang')), 'penghapusan kriteria (penyebut diperkecil) lolos')
  // Negatif: replacing the new 44/45 criteria with arbitrary IDs/titles cannot preserve false denominator credit.
  x = salin(); x.criteria.find((c) => c.id === 'F1')!.id = 'Z44'
  assert.ok(auditLedger(x).masalah.includes('ekstensi wajib hilang: F1'), 'F1 diganti identitas tanpa diketahui')
  x = salin(); x.criteria.find((c) => c.id === 'F2')!.criterion = 'Unrelated task'
  assert.ok(auditLedger(x).masalah.includes('identitas ekstensi berubah: F2'), 'F2 diganti judul tanpa diketahui')
  x = salin(); x.criteria[0].acceptance = ''
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('kriteria tanpa syarat penerimaan')), 'kriteria tanpa syarat lolos')
  x = salin(); x.criteria.find((c) => c.status === 'REPORTED')!.status = 'VERIFIED'
  assert.notEqual(renderLedger(x), readFileSync(MD_PATH, 'utf8'), 'promosi status tanpa memperbarui dokumen tidak terdeteksi sinkronisasi')
  // Positif: kriteria boleh DITAMBAH (penyebut naik) tanpa pelanggaran.
  x = salin(); x.criteria.push({ ...x.criteria[0], id: 'Z1' })
  assert.deepEqual(auditLedger(x).masalah, [], 'penambahan kriteria dianggap pelanggaran')
  // Persentase mengikuti hitungan: REPORTED/NOT_CHECKED tidak berkredit.
  assert.equal(a.terverifikasi, l.criteria.filter((c) => c.status === 'VERIFIED').length)
  // Penyebut kini AKTIF (total dikurangi yang sah ditunda, arahan pemilik 2026-10-16); asersi persen lama terhadap total diganti dan diuji di blok penundaan.

  // --- penundaan ke Clinical Validation (keputusan pemilik 2026-10-16) ---
  assert.equal(a.ditunda, l.criteria.filter((c) => c.status === STATUS_DITUNDA).length, 'ditunda sah = ditunda tercatat')
  assert.equal(a.aktif, a.total - a.ditunda, 'penyebut aktif = total - ditunda')
  assert.equal(a.persen, a.aktif === 0 ? 0 : Math.round((1000 * a.terverifikasi) / a.aktif) / 10, 'persen memakai penyebut aktif')
  assert.ok(l.criteria.filter((c) => c.status === STATUS_DITUNDA).every((c) => c.status !== 'VERIFIED'), 'penunda tidak pernah VERIFIED')
  assert.equal(l.criteria.find((c) => c.id === 'C6')!.status, STATUS_DITUNDA, 'C6 ditunda sesuai arahan pemilik')
  // negatif: hanya id yang diizinkan kebijakan yang boleh ditunda (mencegah menyembunyikan kriteria sulit dari penyebut)
  x = salin(); x.criteria.find((c) => c.id === 'D7')!.status = STATUS_DITUNDA; x.criteria.find((c) => c.id === 'D7')!.deferral = x.criteria.find((c) => c.id === 'C6')!.deferral
  assert.ok(auditLedger(x).masalah.includes('penundaan tanpa izin kebijakan pemilik: D7'), 'menunda kriteria lain lolos')
  assert.equal(auditLedger(x).ditunda, 1, 'kriteria tak sah ditunda tidak dikeluarkan dari penyebut')
  // negatif: tanpa kebijakan, tanpa catatan, catatan basi
  x = salin(); delete x.deferralPolicy
  assert.ok(auditLedger(x).masalah.includes('penundaan tanpa izin kebijakan pemilik: C6'), 'penundaan tanpa kebijakan lolos')
  assert.equal(auditLedger(x).aktif, auditLedger(x).total, 'tanpa kebijakan penyebut tidak mengecil')
  x = salin(); delete x.criteria.find((c) => c.id === 'C6')!.deferral
  assert.ok(auditLedger(x).masalah.includes('penundaan tanpa catatan lengkap: C6'), 'penundaan tanpa catatan lolos')
  x = salin(); x.criteria.find((c) => c.id === 'C6')!.deferral!.stillRequired = ' '
  assert.ok(auditLedger(x).masalah.includes('penundaan tanpa catatan lengkap: C6'), 'syarat tersisa kosong lolos')
  x = salin(); x.criteria.find((c) => c.id === 'D7')!.deferral = x.criteria.find((c) => c.id === 'C6')!.deferral
  assert.ok(auditLedger(x).masalah.includes('catatan penundaan pada kriteria yang tidak ditunda: D7'), 'catatan penundaan basi lolos')
  x = salin(); x.deferralPolicy!.requiredBeforeClinicalUse = false
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('kebijakan penundaan wajib mempertahankan validasi klinis')), 'kebijakan yang menghapus validasi klinis lolos')
  x = salin(); x.deferralPolicy!.allowedIds.push('ZZ')
  assert.ok(auditLedger(x).masalah.includes('kebijakan penundaan menyebut id yang tidak ada: ZZ'), 'id kebijakan fiktif lolos')
  // negatif: menunda tidak mengurangi jumlah kriteria (baseline tetap dijaga), dan promosi ditunda -> VERIFIED tanpa bukti ditolak
  x = salin(); x.criteria.find((c) => c.id === 'C6')!.status = 'VERIFIED'
  assert.ok(auditLedger(x).masalah.includes('VERIFIED tanpa bukti: C6'), 'ditunda dipromosikan ke VERIFIED tanpa bukti lolos')
  assert.ok(auditLedger(x).masalah.includes('catatan penundaan pada kriteria yang tidak ditunda: C6'), 'catatan penundaan tertinggal setelah promosi lolos')
  assert.equal(a.total, l.criteria.length); assert.ok(a.total >= BASELINE_TOTAL, 'total kriteria tetap >= baseline meski ada yang ditunda')
  console.log(`alpha-ledger: ${a.terverifikasi}/${a.aktif} = ${a.persen}% (aktif; ${a.ditunda} ditunda ke Clinical Validation, total ${a.total}; kredit hanya VERIFIED berbukti); sabotase gagal dengan nama`)
}
