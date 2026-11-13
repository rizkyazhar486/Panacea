// Gerbang ledger sitasi literatur — offline dan deterministik.
//
// Kenapa ada: pemeriksaan langsung ke PubMed (November 2026) menemukan 9 dari 71 PMID di modul edukasi dan
// fisiologi menunjuk ke makalah yang tidak berhubungan dengan klaimnya (mis. sitasi "Sunagawa 1983" memakai
// PMID sebuah makalah liposom). Sitasi yang salah di produk medis lebih buruk daripada tanpa sitasi.
//
// Tiga lapis, masing-masing menutup celah lapis lain:
//   1. cakupan  — setiap PMID / PMCID / NBK di src/ harus ada di ledger (atau di daftar utang yang hanya boleh
//                 menyusut);
//   2. ikatan   — konteks di sekitar sitasi harus menyebut penulis atau judul yang tercatat di ledger, sehingga
//                 pengenal yang tertukar gagal;
//   3. daring   — scripts/qa/citation-ledger-online.mjs (di CI) mencocokkan ulang isi ledger dengan NCBI, sehingga
//                 entri ledger karangan gagal.
// Batas yang jujur: lapis ikatan tidak bisa membedakan dua makalah dari penulis pertama yang sama.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const LEDGER_PATH = 'governance/LITERATURE_CITATION_LEDGER.json'
export const DEBT_PATH = 'governance/LITERATURE_CITATION_DEBT.json'

/** Baris konteks yang dibaca di sekitar sebuah sitasi: literal objek sitasi biasanya menaruh penulis di atas id. */
export const CONTEXT_BEFORE = 6
export const CONTEXT_AFTER = 3

const DOI = /\b10\.\d{4,9}\/[^\s'"`,)\]]+/g
const ISBN = /\b97[89][\d-]{10,}\b/g
const PMCID = /\bPMC\d{4,9}\b/g
const NBK = /\bNBK\d{3,7}\b/g
const MENTIONS_PUBMED = /pmid|pubmed/i
const BARE_NUMBER = /(?<![\w.])\d{5,8}(?![\w])/g

/**
 * Semua pengenal literatur pada satu baris sumber. PMID hanya dicari pada baris yang menyebut PMID/PubMed, setelah
 * DOI, ISBN, PMCID dan NBK disingkirkan, supaya angka di dalam DOI tidak terbaca sebagai PMID.
 */
export function identifiersOnLine(line) {
  if (typeof line !== 'string' || line.length === 0) return []
  const found = []
  for (const id of line.match(PMCID) ?? []) found.push({ kind: 'pmcid', id })
  for (const id of line.match(NBK) ?? []) found.push({ kind: 'nbk', id })
  if (MENTIONS_PUBMED.test(line)) {
    const bare = line.replace(DOI, ' ').replace(ISBN, ' ').replace(PMCID, ' ').replace(NBK, ' ')
    for (const id of bare.match(BARE_NUMBER) ?? []) found.push({ kind: 'pmid', id })
  }
  return found
}

const GREEK = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', κ: 'kappa', μ: 'mu' }

/**
 * Huruf kecil tanpa diakritik, supaya "Farré" dan "Farre" sama; camelCase dipecah ("CoronaryBranch" menjadi dua
 * kata) dan huruf Yunani dieja ("β2" menjadi "beta 2"), supaya nama pengenal dan simbol ikut terbaca sebagai kata.
 */
export function fold(text) {
  return String(text ?? '')
    .replace(/[αβγδκμ]/g, (letter) => ` ${GREEK[letter]} `)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Kata yang terlalu umum di judul biomedis untuk membuktikan bahwa sebuah sitasi cocok dengan konteksnya.
const GENERIC_WORDS = new Set((
  'with from into that this than their they were have been also both some such when what upon over under after ' +
  'before about among along across through other others each more most many much very only same used uses using ' +
  'based between during these those which within without human humans study studies review reviews analysis ' +
  'effect effects role roles novel associated function functions functional disease diseases clinical patient ' +
  'patients health system systems mechanism mechanisms implications approach approaches method methods model ' +
  'models control regulation response responses factor factors changes level levels cell cells tissue tissues ' +
  'physiology pathophysiology pathogenesis management diagnosis treatment therapy evidence importance insights ' +
  'emerging state knowledge guide report statement update century relationship relationships measurement ' +
  'measurements assessment quantitative description application applications structure general adult adults ' +
  'children normal basic principles current recent advances perspective perspectives overview introduction part ' +
  'proposal formula medicine medical research'
).split(' '))

const singular = (word) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word)
const wordsOf = (text) => fold(text).match(/[a-z][a-z0-9]{3,}/g) ?? []

/**
 * Jangkar sebuah entri: nama keluarga penulis yang tercatat dan kata judul yang bermakna.
 * Nama keluarga pendek ("Cho", "Lee") terlalu mudah cocok secara kebetulan, jadi baru dihitung bersama inisialnya.
 */
export function anchorsOf(entry) {
  const surnames = []
  for (const raw of String(entry?.authors ?? '').split(',')) {
    const name = raw.trim()
    if (!name || /^et al\.?$/i.test(name)) continue
    const initials = /\s+([A-Z]{1,3})$/u.exec(name)?.[1] ?? ''
    const surname = fold(name.replace(/\s+[A-Z]{1,3}$/u, '')).trim()
    if (!/^[a-z][a-z' -]+$/.test(surname)) continue
    if (surname.length >= 4) surnames.push(surname)
    else if (initials) surnames.push(`${surname} ${initials.toLowerCase()}`)
  }
  const titleWords = [...new Set(wordsOf(entry?.title).filter((word) => !GENERIC_WORDS.has(word)).map(singular))]
  return { surnames, titleWords }
}

/**
 * Apakah konteks di sekitar sitasi memang membicarakan karya yang tercatat?
 * Lolos bila menyebut salah satu penulis tercatat, atau dua kata bermakna dari judul (satu bila judulnya hanya
 * punya satu). Konteks kosong tidak pernah lolos.
 */
export function bindingOf(entry, context) {
  const { surnames, titleWords } = anchorsOf(entry)
  const folded = fold(context)
  const present = new Set(wordsOf(folded).map(singular))
  const author = surnames.find((name) => new RegExp(`(?<![a-z0-9])${name.replace(/[-' ]/g, '[-\' ]')}(?![a-z0-9])`).test(folded)) ?? null
  const words = titleWords.filter((word) => present.has(word))
  const needed = Math.min(2, titleWords.length)
  return { ok: author !== null || (needed > 0 && words.length >= needed), author, words, needed }
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
function realDate(text) {
  const m = DATE.exec(String(text ?? ''))
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}
const filled = (value) => typeof value === 'string' && value.trim().length > 0

/** Periksa bentuk ledger. `today` (YYYY-MM-DD) disuntikkan: tanggal verifikasi tidak boleh di masa depan. */
export function validateLedger(ledger, { today } = {}) {
  const violations = []
  const fail = (rule, message) => violations.push({ rule, message: `citation-ledger: ${rule}: ${message}` })
  if (!ledger || typeof ledger !== 'object' || ledger.schemaVersion !== 1 || !Array.isArray(ledger.entries)) {
    fail('ledger-skema', 'ledger must be an object with schemaVersion 1 and an entries array')
    return violations
  }
  if (!realDate(today)) fail('ledger-skema', `today must be a real YYYY-MM-DD date, got ${JSON.stringify(today)}`)
  const seen = { pmid: new Set(), pmcid: new Set(), nbk: new Set() }
  let previous = -1
  for (const entry of ledger.entries) {
    const label = `PMID ${entry?.pmid}`
    if (!entry || typeof entry !== 'object' || !/^\d{1,8}$/.test(String(entry.pmid ?? '')) || typeof entry.pmid !== 'string') {
      fail('ledger-format-id', `pmid must be a string of 1 to 8 digits, got ${JSON.stringify(entry?.pmid)}`)
      continue
    }
    if (entry.pmcid !== undefined && !/^PMC\d{4,9}$/.test(String(entry.pmcid))) fail('ledger-format-id', `${label}: pmcid ${JSON.stringify(entry.pmcid)}`)
    if (entry.nbk !== undefined && !/^NBK\d{3,7}$/.test(String(entry.nbk))) fail('ledger-format-id', `${label}: nbk ${JSON.stringify(entry.nbk)}`)
    if (entry.doi !== undefined && !/^10\.\d{4,9}\/\S+$/.test(String(entry.doi))) fail('ledger-format-id', `${label}: doi ${JSON.stringify(entry.doi)}`)
    for (const kind of ['pmid', 'pmcid', 'nbk']) {
      if (entry[kind] === undefined) continue
      if (seen[kind].has(entry[kind])) fail('ledger-duplikat', `${kind} ${entry[kind]} is listed twice`)
      seen[kind].add(entry[kind])
    }
    const missing = []
    if (!filled(entry.authors)) missing.push('authors')
    if (!filled(entry.title)) missing.push('title')
    if (!filled(entry.source) && !filled(entry.book)) missing.push('source or book')
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(entry.pubDate ?? ''))) missing.push('pubDate')
    if (missing.length > 0) fail('ledger-entri-tidak-lengkap', `${label} lacks ${missing.join(', ')}`)
    if (!realDate(entry.verifiedOn)) fail('ledger-tanggal-verifikasi', `${label}: verifiedOn must be a real YYYY-MM-DD date`)
    else if (realDate(today) && entry.verifiedOn > today) fail('ledger-tanggal-verifikasi', `${label}: verifiedOn ${entry.verifiedOn} is after today ${today}`)
    if (Number(entry.pmid) <= previous) fail('ledger-urutan', `${label} is out of ascending PMID order`)
    previous = Number(entry.pmid)
  }
  return violations
}

/**
 * Audit sumber terhadap ledger dan daftar utang.
 * sources: [{ path, text }] · debt: { identifiers: ["pmid:123", "pmcid:PMC1", "nbk:NBK1"] }
 */
export function auditCitations({ sources, ledger, debt }) {
  const violations = []
  const fail = (rule, message, extra = {}) => violations.push({ rule, message: `citation-ledger: ${rule}: ${message}`, ...extra })
  const index = { pmid: new Map(), pmcid: new Map(), nbk: new Map() }
  for (const entry of ledger?.entries ?? []) {
    for (const kind of ['pmid', 'pmcid', 'nbk']) if (typeof entry?.[kind] === 'string') index[kind].set(entry[kind], entry)
  }
  const cited = new Set()
  const unlisted = new Map()
  let occurrences = 0
  for (const { path, text } of sources ?? []) {
    const lines = String(text ?? '').split('\n')
    // Per berkas: sebuah karya cukup diperkenalkan sekali (penulis atau judulnya disebut di dekat pengenalnya);
    // rujukan singkat berikutnya di berkas yang sama mewarisi perkenalan itu.
    const inFile = new Map()
    for (let i = 0; i < lines.length; i += 1) {
      for (const { kind, id } of identifiersOnLine(lines[i])) {
        occurrences += 1
        const key = `${kind}:${id}`
        const entry = index[kind].get(id)
        if (!entry) {
          if (!unlisted.has(key)) unlisted.set(key, `${path}:${i + 1}`)
          continue
        }
        cited.add(entry.pmid)
        const seen = inFile.get(entry.pmid) ?? { entry, key, line: i + 1, introduced: false }
        if (!seen.introduced) {
          const context = lines.slice(Math.max(0, i - CONTEXT_BEFORE), i + CONTEXT_AFTER + 1).join('\n')
          seen.introduced = bindingOf(entry, context).ok
        }
        inFile.set(entry.pmid, seen)
      }
    }
    for (const { entry, key, line, introduced } of inFile.values()) {
      if (!introduced) {
        fail('sitasi-tidak-cocok-konteks', `${path}:${line} cites ${key}, which the ledger records as "${entry.title}" by ${entry.authors} — no citation of it in this file names that work`, { path, line, id: key })
      }
    }
  }
  const owed = Array.isArray(debt?.identifiers) ? debt.identifiers : null
  if (owed === null) fail('utang-sitasi-skema', 'the debt file must hold an identifiers array')
  const owedSet = new Set(owed ?? [])
  for (const [key, where] of unlisted) {
    if (!owedSet.has(key)) fail('sitasi-tidak-terdaftar', `${where} cites ${key}, which is neither in the ledger nor in the debt list — resolve it against PubMed and add it to the ledger`, { id: key })
  }
  for (const key of owedSet) {
    if (!unlisted.has(key)) fail('utang-sitasi-basi', `${key} is in the debt list but is no longer an unverified citation — remove it so the list only shrinks`, { id: key })
  }
  if (owed && [...owed].sort().join('\n') !== owed.join('\n')) fail('utang-sitasi-skema', 'the debt list must be sorted and free of duplicates')
  for (const entry of ledger?.entries ?? []) {
    if (!cited.has(entry.pmid)) fail('ledger-entri-yatim', `PMID ${entry.pmid} is in the ledger but nothing under src/ cites it — remove the entry`, { id: `pmid:${entry.pmid}` })
  }
  return { violations, occurrences, cited: cited.size, unlisted: [...unlisted.keys()].sort() }
}

/** Baca semua berkas .ts/.tsx di bawah src/ (boundary I/O; fungsi di atas murni). */
export function readSources(root) {
  const out = []
  const walk = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, item.name)
      if (item.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(item.name) && !item.name.endsWith('.d.ts')) out.push({ path: relative(root, full).split(sep).join('/'), text: readFileSync(full, 'utf8') })
    }
  }
  walk(join(root, 'src'))
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}

export const readJson = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'))

// CLI: `node scripts/qa/citation-ledger.mjs` melaporkan; `--write-debt` menulis ulang daftar utang dari keadaan nyata.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const ledger = readJson(root, LEDGER_PATH)
  const sources = readSources(root)
  if (process.argv.includes('--write-debt')) {
    const { unlisted } = auditCitations({ sources, ledger, debt: { identifiers: [] } })
    const purpose = 'Literature identifiers under src/ that have NOT yet been resolved against PubMed. This list may only shrink: verify an identifier, add it to LITERATURE_CITATION_LEDGER.json, and remove it here. Nothing in this list is a verified citation.'
    const rows = []
    for (let i = 0; i < unlisted.length; i += 6) rows.push(`    ${unlisted.slice(i, i + 6).map((id) => JSON.stringify(id)).join(', ')}`)
    writeFileSync(join(root, DEBT_PATH), `{\n  "purpose": ${JSON.stringify(purpose)},\n  "identifiers": [\n${rows.join(',\n')}\n  ]\n}\n`)
    console.log(`citation-ledger: wrote ${unlisted.length} unverified identifiers to ${DEBT_PATH}`)
  } else {
    const today = new Date().toISOString().slice(0, 10)
    const debt = readJson(root, DEBT_PATH)
    const result = auditCitations({ sources, ledger, debt })
    const violations = [...validateLedger(ledger, { today }), ...result.violations]
    for (const v of violations) console.error(v.message)
    console.log(`citation-ledger: ${ledger.entries.length} verified works, ${result.occurrences} citations read, ${result.unlisted.length} identifiers still unverified, ${violations.length} violations`)
    process.exit(violations.length > 0 ? 1 : 0)
  }
}
