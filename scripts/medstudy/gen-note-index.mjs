// Regenerates src/lib/skdiDiseaseNoteIndex.ts from the main note and alias tables.
//
// The directory UI must know whether a disease has a note before it can draw the
// expand toggle. Answering that from the notes module itself forced a ~1 MB
// download on everyone who opened the tab, even if they never expanded a single
// entry. This index holds only the large-corpus keys. The small supplement is
// imported directly by the directory and is counted by the coverage guard below.
//
//   npm run gen:note-index
//   npm run gen:note-index -- --check

import { readFileSync, writeFileSync } from 'node:fs'

const NOTES = 'src/lib/skdiDiseaseNotes.ts'
const SUPPLEMENT = 'src/lib/skdiDiseaseNotesSupplement.ts'
const ALIASES = 'src/lib/skdiDiseaseNoteAliases.ts'
const OUT = 'src/lib/skdiDiseaseNoteIndex.ts'

/** Top-level object keys at exactly two spaces of indentation. */
function topLevelKeys(source) {
  const single = [...source.matchAll(/^ {2}'((?:[^'\\]|\\.)*)':/gm)].map((m) =>
    m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
  )
  const double = [...source.matchAll(/^ {2}"((?:[^"\\]|\\.)*)":/gm)].map((m) =>
    m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
  )
  return [...single, ...double]
}

const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const noteKeys = topLevelKeys(readFileSync(NOTES, 'utf8'))
const supplementKeys = topLevelKeys(readFileSync(SUPPLEMENT, 'utf8'))
const aliasKeys = topLevelKeys(readFileSync(ALIASES, 'utf8'))

// Keep the generated file limited to the large lazy-loaded corpus. The 16-entry
// supplement is small and imported directly, so putting it in this generated
// index would duplicate key ownership and force regeneration for every small
// correction to the supplement.
const keys = [...new Set([...noteKeys, ...aliasKeys])].sort()

const contents = `// GENERATED FILE — do not edit by hand.
//
// The disease directory needs to know WHICH diseases have a note before it can
// draw the expand toggle, but the notes themselves are ~1 MB. Loading them just
// to answer that yes/no question meant every visitor to the tab downloaded the
// whole corpus. This index carries only the keys (a few kB), so the notes module
// is fetched lazily the first time a user actually opens a disease.
//
// Regenerate with: npm run gen:note-index
// Drift check: npm run gen:note-index -- --check

export const SKDI_NOTE_KEYS: ReadonlySet<string> = new Set([
${keys.map((k) => `  ${quote(k)},`).join('\n')}
])
`

// Coverage guard includes the direct supplement even though its keys do not
// belong in the generated large-corpus index. This makes CI answer the question
// users actually care about: can every SKDI row open a real note?
const listSource = readFileSync('src/lib/skdiDiseaseList.ts', 'utf8')
const listed = [...listSource.matchAll(/disease: '((?:[^'\\]|\\.)*)'/g)].map((m) =>
  m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
)
const coverageSet = new Set([...keys, ...supplementKeys])
const uncovered = [...new Set(listed.filter((d) => !coverageSet.has(d)))]
const covered = listed.length - listed.filter((d) => !coverageSet.has(d)).length
if (covered !== listed.length) {
  console.warn(
    `\n${covered}/${listed.length} SKDI rows have a note. Without one (${uncovered.length} distinct):\n` +
      uncovered.map((d) => `  - ${d}`).join('\n') +
      '\nThis is expected only if those diseases genuinely have no note written yet.\n',
  )
} else {
  console.log(`All ${listed.length} SKDI rows resolve to a note (${supplementKeys.length} from supplement).`)
}

if (process.argv.includes('--check')) {
  const onDisk = readFileSync(OUT, 'utf8')
  if (onDisk !== contents) {
    console.error(
      `${OUT} is stale.\n` +
        `Expected ${keys.length} generated keys (${noteKeys.length} notes + ${aliasKeys.length} aliases); ` +
        `${supplementKeys.length} supplement keys are checked separately.\n` +
        `Run: npm run gen:note-index`,
    )
    process.exit(1)
  }
  console.log(`${OUT} is up to date (${keys.length} generated keys; ${supplementKeys.length} supplement keys).`)
} else {
  writeFileSync(OUT, contents)
  console.log(
    `Wrote ${OUT}: ${keys.length} generated keys (${noteKeys.length} notes + ${aliasKeys.length} aliases); ${supplementKeys.length} supplement keys checked separately.`,
  )
}
