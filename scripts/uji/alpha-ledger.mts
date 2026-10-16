import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Gerbang ledger penerimaan Alpha (governance/ALPHA_ACCEPTANCE_LEDGER.json = sumber kebenaran; docs/alpha/*.md dihasilkan darinya).
// Aturan: hanya VERIFIED yang berkredit dan wajib berbukti; status harus dari kosakata; id unik; kriteria tidak boleh berkurang dari
// baseline (45) setelah penambahan F1/F2 supaya persentase tidak naik karena penyebut diperkecil; dokumen Markdown harus sinkron dengan JSON.
// Pengecualian tunggal yang disetujui pemilik: kriteria berstatus DEFERRED_TO_CLINICAL_VALIDATION (tinjauan klinis formal di luar lingkup Alpha)
// tetap tercatat (45 catatan), tidak pernah VERIFIED, dan keluar dari penyebut AKTIF hanya bila membawa catatan penundaan lengkap
// (siapa memutuskan, kapan, rujukan, fase tujuan, dan syarat asli yang dipertahankan). Penundaan tanpa catatan itu gagal.
const DEFERRED = 'DEFERRED_TO_CLINICAL_VALIDATION'
const BASELINE_TOTAL = 45
// F1/F2 are owner-approved extension IDs. A replacement criterion must not masquerade as the 45-item scope.
const REQUIRED_EXTENSIONS = new Map([
  ['F1', 'Task 44 — Full User Journey Acceptance'],
  ['F2', 'Task 45 — UI/UX Optimization & Polishing Acceptance'],
])
const JSON_PATH = new URL('../../governance/ALPHA_ACCEPTANCE_LEDGER.json', import.meta.url)
const MD_PATH = new URL('../../docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md', import.meta.url)

type Penundaan = { decidedBy: string; decidedOn: string; reference: string; targetPhase: string; originalAcceptance: string }
type Kriteria = { id: string; pillar: string; criterion: string; acceptance: string; status: string; evidence: string[]; owner: string; note: string; deferral?: Penundaan }
type Ledger = { version: number; approvedBy: string; scope: string[]; weightPolicy: string; baseline: { mainSha: string; date: string; note: string }; statuses: string[]; criteria: Kriteria[] }

const penundaanLengkap = (d: unknown): d is Penundaan => !!d && typeof d === 'object' && (['decidedBy', 'decidedOn', 'reference', 'targetPhase', 'originalAcceptance'] as const).every((k) => typeof (d as Record<string, unknown>)[k] === 'string' && ((d as Record<string, string>)[k]).trim() !== '')

export function auditLedger(l: Ledger): { masalah: string[]; terverifikasi: number; total: number; aktif: number; ditunda: number; persen: number } {
  const masalah: string[] = []
  const ids = new Set<string>()
  for (const c of l.criteria) {
    if (ids.has(c.id)) masalah.push(`id ganda: ${c.id}`)
    ids.add(c.id)
    if (!l.statuses.includes(c.status)) masalah.push(`status tidak dikenal pada ${c.id}: ${c.status}`)
    if (c.status === 'VERIFIED' && (!Array.isArray(c.evidence) || c.evidence.length === 0 || c.evidence.some((e) => typeof e !== 'string' || e.trim() === ''))) masalah.push(`VERIFIED tanpa bukti: ${c.id}`)
    if (!c.acceptance || c.acceptance.trim() === '') masalah.push(`kriteria tanpa syarat penerimaan: ${c.id}`)
    if (c.status === DEFERRED && !penundaanLengkap(c.deferral)) masalah.push(`penundaan tanpa catatan lengkap: ${c.id}`)
    if (c.status !== DEFERRED && c.deferral !== undefined) masalah.push(`catatan penundaan pada kriteria yang tidak ditunda: ${c.id}`)
  }
  if (l.criteria.length < BASELINE_TOTAL) masalah.push(`kriteria berkurang di bawah baseline ${BASELINE_TOTAL}: ${l.criteria.length}`)
  for (const [id, title] of REQUIRED_EXTENSIONS) {
    const extension = l.criteria.find((c) => c.id === id)
    if (!extension) masalah.push(`ekstensi wajib hilang: ${id}`)
    else if (extension.criterion !== title) masalah.push(`identitas ekstensi berubah: ${id}`)
  }
  const terverifikasi = l.criteria.filter((c) => c.status === 'VERIFIED').length
  const total = l.criteria.length
  // Penyebut aktif: hanya penundaan yang sah (berstatus DEFERRED DAN bercatatan lengkap) yang keluar; yang tidak sah tetap dihitung.
  const ditunda = l.criteria.filter((c) => c.status === DEFERRED && penundaanLengkap(c.deferral)).length
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
  out.push(`**Alpha completion: ${a.terverifikasi} / ${a.aktif} = ${a.persen}%** (baseline main \`${l.baseline.mainSha.slice(0, 9)}\`, ${l.baseline.date}).`, '')
  if (a.ditunda > 0) out.push(`Penyebut aktif ${a.aktif} = ${a.total} kriteria tercatat − ${a.ditunda} ditunda ke fase Clinical Validation (lihat bagian di bawah). Kriteria yang ditunda tidak VERIFIED, tidak berkredit, dan tidak divalidasi secara klinis.`, '')
  out.push(`Disetujui: ${l.approvedBy}. ${l.baseline.note}`, '')
  out.push('## Kebijakan penghitungan', '', l.weightPolicy, '')
  out.push('Persentase tidak mengalahkan gerbang yang gagal: Alpha tidak dinyatakan 100% sebelum seluruh gerbang aktif lulus. Tinjauan klinis formal di luar lingkup Alpha (keputusan pemilik); selesainya Alpha rekayasa BUKAN validasi klinis, dan validasi klinis tetap wajib sebelum fungsi apa pun dipakai untuk keputusan klinis nyata.', '')
  out.push('## Lingkup Alpha (disetujui)', '', ...l.scope.map((s) => `- ${s}`), '')
  out.push('## Ringkasan status', '', '| Status | Jumlah |', '|---|---|', ...l.statuses.map((s) => `| ${s} | ${hitung(s)} |`), '')
  const ditundaSah = l.criteria.filter((c) => c.status === DEFERRED && penundaanLengkap(c.deferral))
  if (ditundaSah.length > 0) {
    out.push('## Ditunda ke Clinical Validation (tidak dihitung, tidak VERIFIED)', '', '| ID | Kriteria | Diputuskan oleh | Tanggal | Rujukan | Fase tujuan | Syarat asli (dipertahankan) |', '|---|---|---|---|---|---|---|')
    for (const c of ditundaSah) out.push(`| ${c.id} | ${c.criterion} | ${c.deferral!.decidedBy} | ${c.deferral!.decidedOn} | ${c.deferral!.reference} | ${c.deferral!.targetPhase} | ${c.deferral!.originalAcceptance} |`)
    out.push('')
  }
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
  // Persentase mengikuti hitungan: REPORTED/NOT_CHECKED/DEFERRED tidak berkredit; penyebut = kriteria aktif (tanpa penundaan sah).
  assert.equal(a.terverifikasi, l.criteria.filter((c) => c.status === 'VERIFIED').length)
  assert.equal(a.aktif, a.total - a.ditunda); assert.equal(a.persen, Math.round((1000 * a.terverifikasi) / a.aktif) / 10)
  assert.ok(l.criteria.length >= BASELINE_TOTAL, 'semua catatan tetap ada: penundaan tidak menghapus kriteria')

  // Penundaan klinis (keputusan pemilik): hanya sah bila lengkap; tidak pernah berkredit; tidak bisa dipakai untuk mengecilkan penyebut diam-diam.
  const cobaTunda = (id: string, deferral?: Partial<Penundaan>): Ledger => { const y = salin(); const c = y.criteria.find((k) => k.id === id)!; c.status = DEFERRED; if (deferral !== undefined) c.deferral = { decidedBy: 'Owner', decidedOn: '2026-10-17', reference: 'ref', targetPhase: 'Clinical Validation', originalAcceptance: 'asli', ...deferral } as Penundaan; return y }
  const target = l.criteria.find((c) => c.status === 'REPORTED')!.id
  x = cobaTunda(target)
  assert.ok(auditLedger(x).masalah.includes(`penundaan tanpa catatan lengkap: ${target}`), 'penundaan tanpa catatan lolos'); assert.equal(auditLedger(x).aktif, a.aktif, 'penundaan tanpa catatan tidak mengecilkan penyebut')
  for (const k of ['decidedBy', 'decidedOn', 'reference', 'targetPhase', 'originalAcceptance'] as const) {
    x = cobaTunda(target, { [k]: '  ' }); assert.ok(auditLedger(x).masalah.includes(`penundaan tanpa catatan lengkap: ${target}`), `catatan penundaan dengan ${k} kosong lolos`); assert.equal(auditLedger(x).aktif, a.aktif, `${k} kosong tidak mengecilkan penyebut`)
    x = cobaTunda(target, { [k]: 5 as unknown as string }); assert.ok(auditLedger(x).masalah.includes(`penundaan tanpa catatan lengkap: ${target}`), `catatan penundaan dengan ${k} bukan teks lolos`)
  }
  x = cobaTunda(target, {}); const ok = auditLedger(x)
  assert.deepEqual(ok.masalah, []); assert.equal(ok.ditunda, auditLedger(l).ditunda + 1); assert.equal(ok.aktif, a.aktif - 1, 'penundaan sah keluar dari penyebut aktif'); assert.equal(ok.terverifikasi, a.terverifikasi, 'penundaan tidak pernah menambah kredit'); assert.equal(ok.total, a.total, 'catatan tidak dihapus')
  x = cobaTunda(target, {}); x.criteria.find((k) => k.id === target)!.evidence = ['bukti rekayasa']; assert.equal(auditLedger(x).terverifikasi, a.terverifikasi, 'penundaan dengan bukti rekayasa tetap bukan VERIFIED')
  x = salin(); x.criteria.find((k) => k.id === v.id)!.deferral = { decidedBy: 'o', decidedOn: 'd', reference: 'r', targetPhase: 't', originalAcceptance: 'a' }
  assert.ok(auditLedger(x).masalah.includes(`catatan penundaan pada kriteria yang tidak ditunda: ${v.id}`), 'catatan penundaan pada kriteria VERIFIED lolos')
  assert.ok(renderLedger(cobaTunda(target, {})).includes(`${a.terverifikasi} / ${a.aktif - 1} =`), 'dokumen memakai penyebut aktif yang baru')
  console.log(`alpha-ledger: ${a.terverifikasi}/${a.aktif} = ${a.persen}% (kredit hanya VERIFIED berbukti; ${a.ditunda} ditunda ke Clinical Validation, ${a.total} catatan); sabotase gagal dengan nama`)
}
