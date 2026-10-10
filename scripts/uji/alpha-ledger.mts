import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Gerbang ledger penerimaan Alpha (governance/ALPHA_ACCEPTANCE_LEDGER.json = sumber kebenaran; docs/alpha/*.md dihasilkan darinya).
// Aturan: hanya VERIFIED yang berkredit dan wajib berbukti; status harus dari kosakata; id unik; kriteria tidak boleh berkurang dari
// baseline (43) supaya persentase tidak naik karena penyebut diperkecil; dokumen Markdown harus sinkron dengan JSON.
const BASELINE_TOTAL = 43
const JSON_PATH = new URL('../../governance/ALPHA_ACCEPTANCE_LEDGER.json', import.meta.url)
const MD_PATH = new URL('../../docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md', import.meta.url)

type Kriteria = { id: string; pillar: string; criterion: string; acceptance: string; status: string; evidence: string[]; owner: string; note: string }
type Ledger = { version: number; approvedBy: string; scope: string[]; weightPolicy: string; baseline: { mainSha: string; date: string; note: string }; statuses: string[]; criteria: Kriteria[] }

export function auditLedger(l: Ledger): { masalah: string[]; terverifikasi: number; total: number; persen: number } {
  const masalah: string[] = []
  const ids = new Set<string>()
  for (const c of l.criteria) {
    if (ids.has(c.id)) masalah.push(`id ganda: ${c.id}`)
    ids.add(c.id)
    if (!l.statuses.includes(c.status)) masalah.push(`status tidak dikenal pada ${c.id}: ${c.status}`)
    if (c.status === 'VERIFIED' && (!Array.isArray(c.evidence) || c.evidence.length === 0 || c.evidence.some((e) => typeof e !== 'string' || e.trim() === ''))) masalah.push(`VERIFIED tanpa bukti: ${c.id}`)
    if (!c.acceptance || c.acceptance.trim() === '') masalah.push(`kriteria tanpa syarat penerimaan: ${c.id}`)
  }
  if (l.criteria.length < BASELINE_TOTAL) masalah.push(`kriteria berkurang di bawah baseline ${BASELINE_TOTAL}: ${l.criteria.length}`)
  const terverifikasi = l.criteria.filter((c) => c.status === 'VERIFIED').length
  const total = l.criteria.length
  return { masalah, terverifikasi, total, persen: total === 0 ? 0 : Math.round((1000 * terverifikasi) / total) / 10 }
}

export function renderLedger(l: Ledger): string {
  const a = auditLedger(l)
  const pillars = [...new Set(l.criteria.map((c) => c.pillar))]
  const hitung = (s: string) => l.criteria.filter((c) => c.status === s).length
  const out: string[] = []
  out.push('# Alpha acceptance ledger', '')
  out.push('> Dihasilkan dari `governance/ALPHA_ACCEPTANCE_LEDGER.json` (jangan edit tangan; jalankan `UPDATE_LEDGER=1 node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/alpha-ledger.mts`).', '')
  out.push(`**Alpha completion: ${a.terverifikasi} / ${a.total} = ${a.persen}%** (baseline main \`${l.baseline.mainSha.slice(0, 9)}\`, ${l.baseline.date}).`, '')
  out.push(`Disetujui: ${l.approvedBy}. ${l.baseline.note}`, '')
  out.push('## Kebijakan penghitungan', '', l.weightPolicy, '')
  out.push('Persentase tidak mengalahkan gerbang yang gagal: Alpha tidak dinyatakan 100% sebelum seluruh gerbang wajib lulus, termasuk tinjauan klinis yang terpisah.', '')
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
  x = salin(); x.criteria[0].acceptance = ''
  assert.ok(auditLedger(x).masalah.some((m) => m.startsWith('kriteria tanpa syarat penerimaan')), 'kriteria tanpa syarat lolos')
  x = salin(); x.criteria.find((c) => c.status === 'REPORTED')!.status = 'VERIFIED'
  assert.notEqual(renderLedger(x), readFileSync(MD_PATH, 'utf8'), 'promosi status tanpa memperbarui dokumen tidak terdeteksi sinkronisasi')
  // Positif: kriteria boleh DITAMBAH (penyebut naik) tanpa pelanggaran.
  x = salin(); x.criteria.push({ ...x.criteria[0], id: 'Z1' })
  assert.deepEqual(auditLedger(x).masalah, [], 'penambahan kriteria dianggap pelanggaran')
  // Persentase mengikuti hitungan: REPORTED/NOT_CHECKED tidak berkredit.
  assert.equal(a.terverifikasi, l.criteria.filter((c) => c.status === 'VERIFIED').length)
  assert.equal(a.persen, Math.round((1000 * a.terverifikasi) / a.total) / 10)
  console.log(`alpha-ledger: ${a.terverifikasi}/${a.total} = ${a.persen}% (kredit hanya VERIFIED berbukti); sabotase gagal dengan nama`)
}
