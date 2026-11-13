// Pemeriksa daring ledger sitasi: mencocokkan ulang setiap entri ledger dengan NCBI E-utilities (esummary).
//
// Kenapa ada: gerbang offline (citation-ledger.mjs) hanya bisa memastikan sebuah pengenal TERCATAT dan cocok
// dengan konteksnya. Ia tidak bisa tahu apakah isi ledger itu sendiri benar. Skrip ini menutup celah itu: judul,
// penulis pertama, tahun, DOI, PMCID dan NBK setiap entri dibandingkan dengan apa yang NCBI kembalikan sekarang.
//
// Dijalankan di CI (.github/workflows/citation-ledger-online.yml). Permintaan hanya berisi daftar PMID dan nama
// alat generik; tidak ada data pengguna atau proyek yang dikirim.
// Kode keluar: 0 semua cocok · 1 ada entri yang tidak cocok · 2 tidak bisa diputuskan (NCBI tak terjangkau).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fold, LEDGER_PATH } from './citation-ledger.mjs'

export const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
const TOOL = 'citation-ledger-check'

/** Kata-kata sebuah judul/nama tanpa markup, tanda baca, dan dengan huruf-angka dipisah ("21st" = "21(st)"). */
export function tokens(text) {
  return fold(String(text ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' '))
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Judul dianggap sama bila kata-katanya sama. Judul panjang (8 kata atau lebih) boleh berbeda sedikit karena
 * markup (irisan/gabungan kata >= 0,8); judul pendek harus sama persis, karena satu kata berbeda = makalah lain.
 */
export function sameTitle(a, b) {
  const left = tokens(a)
  const right = tokens(b)
  if (left.length === 0 || right.length === 0) return false
  if (left.join(' ') === right.join(' ')) return true
  if (Math.min(left.length, right.length) < 8) return false
  const setLeft = new Set(left)
  const setRight = new Set(right)
  let shared = 0
  for (const word of setLeft) if (setRight.has(word)) shared += 1
  return shared / (setLeft.size + setRight.size - shared) >= 0.8
}

const yearOf = (text) => /\d{4}/.exec(String(text ?? ''))?.[0] ?? null

/** Bandingkan satu entri ledger dengan ringkasan NCBI untuk PMID itu. Mengembalikan daftar ketidakcocokan. */
export function compareEntry(entry, summary) {
  const out = []
  const fail = (rule, detail) => out.push({ rule, pmid: entry.pmid, message: `citation-ledger-online: ${rule}: PMID ${entry.pmid} — ${detail}` })
  if (!summary || typeof summary !== 'object' || summary.error || !summary.title) {
    fail('daring-tidak-ditemukan', `NCBI returned no record (${summary?.error ?? 'missing'})`)
    return out
  }
  if (!sameTitle(entry.title, summary.title)) fail('daring-judul-berbeda', `ledger says "${entry.title}", NCBI says "${summary.title}"`)
  const ledgerFirst = String(entry.authors ?? '').split(',')[0]
  const ncbiFirst = summary.sortfirstauthor || summary.authors?.[0]?.name || ''
  if (tokens(ledgerFirst).join(' ') !== tokens(ncbiFirst).join(' ')) fail('daring-penulis-berbeda', `ledger says first author "${ledgerFirst.trim()}", NCBI says "${ncbiFirst}"`)
  const isBook = typeof entry.book === 'string'
  // Bab buku (StatPearls) diperbarui terus; tahunnya bergerak, jadi tidak dibandingkan.
  if (!isBook && yearOf(entry.pubDate) !== yearOf(summary.pubdate)) fail('daring-tahun-berbeda', `ledger says ${yearOf(entry.pubDate)}, NCBI says "${summary.pubdate}"`)
  const aliases = (Array.isArray(summary.articleids) ? summary.articleids : []).map((item) => ({ type: String(item?.idtype ?? ''), value: String(item?.value ?? '') }))
  const listed = (pattern) => aliases.flatMap((item) => item.value.match(pattern) ?? [])
  const shown = JSON.stringify(aliases.map((item) => `${item.type}=${item.value}`))
  const ncbiDoi = aliases.find((item) => item.type === 'doi')?.value
  if (entry.doi && ncbiDoi && entry.doi.toLowerCase() !== ncbiDoi.toLowerCase()) fail('daring-doi-berbeda', `ledger says ${entry.doi}, NCBI says ${ncbiDoi}`)
  if (entry.pmcid && !listed(/PMC\d+/g).includes(entry.pmcid)) fail('daring-pmcid-berbeda', `ledger says ${entry.pmcid}, NCBI lists ${shown}`)
  if (entry.nbk && !listed(/NBK\d+/g).includes(entry.nbk)) fail('daring-nbk-berbeda', `ledger says ${entry.nbk}, NCBI lists ${shown}`)
  return out
}

/**
 * Periksa seluruh ledger. `fetchJson(url)` dan `sleep(ms)` disuntikkan (boundary jaringan dan waktu).
 * Kegagalan jaringan, 429 dan 5xx dicoba ulang; bila tetap gagal, PMID di batch itu dilaporkan "tidak bisa
 * diputuskan" — tidak pernah dianggap cocok.
 */
export async function verifyLedger({ ledger, fetchJson, sleep, batchSize = 100, attempts = 4 }) {
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : []
  const mismatches = []
  const inconclusive = []
  let checked = 0
  for (let start = 0; start < entries.length; start += batchSize) {
    const batch = entries.slice(start, start + batchSize)
    const url = `${ESUMMARY}?db=pubmed&retmode=json&tool=${TOOL}&id=${batch.map((entry) => entry.pmid).join(',')}`
    let body = null
    let reason = ''
    for (let attempt = 1; attempt <= attempts && body === null; attempt += 1) {
      try {
        const parsed = await fetchJson(url)
        if (parsed && typeof parsed === 'object' && parsed.result && typeof parsed.result === 'object') body = parsed
        else { reason = 'response had no result object'; break }
      } catch (error) {
        reason = `${error?.status ?? 'network'}: ${String(error?.message ?? error).slice(0, 120)}`
        const retryable = error?.status === undefined || error.status === 429 || error.status >= 500
        if (!retryable) break
        if (attempt < attempts) await sleep(1000 * 2 ** (attempt - 1))
      }
    }
    if (body === null) {
      for (const entry of batch) inconclusive.push({ pmid: entry.pmid, reason })
      continue
    }
    for (const entry of batch) {
      checked += 1
      mismatches.push(...compareEntry(entry, body.result[entry.pmid]))
    }
  }
  return { checked, mismatches, inconclusive }
}

export const exitCodeOf = (result) => (result.mismatches.length > 0 ? 1 : result.inconclusive.length > 0 ? 2 : 0)

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const ledger = JSON.parse(readFileSync(join(root, LEDGER_PATH), 'utf8'))
  const fetchJson = async (url) => {
    const response = await fetch(url, { headers: { 'user-agent': TOOL, accept: 'application/json' } })
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
    return response.json()
  }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const result = await verifyLedger({ ledger, fetchJson, sleep })
  for (const item of result.mismatches) console.error(item.message)
  if (result.inconclusive.length > 0) console.error(`citation-ledger-online: daring-tidak-terputuskan: ${result.inconclusive.length} entries could not be checked (${result.inconclusive[0].reason}) — this is NOT a pass`)
  console.log(`citation-ledger-online: ${result.checked}/${ledger.entries.length} entries re-resolved against NCBI, ${result.mismatches.length} mismatches, ${result.inconclusive.length} inconclusive`)
  process.exit(exitCodeOf(result))
}
