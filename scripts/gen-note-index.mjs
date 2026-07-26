// Regenerates src/lib/skdiDiseaseNoteIndex.ts from the note and alias tables.
//
// The directory UI must know whether a disease has a note before it can draw the
// expand toggle. Answering that from the notes module itself forced a ~1 MB
// download on everyone who opened the tab, even if they never expanded a single
// entry. This index holds only the keys, so the notes are fetched lazily on the
// first expand.
//
//   npm run gen:note-index          rewrite the index
//   npm run gen:note-index -- --check   fail if it is stale (used in CI)

import { readFileSync, writeFileSync } from 'node:fs'

const NOTES = 'src/lib/skdiDiseaseNotes.ts'
const ALIASES = 'src/lib/skdiDiseaseNoteAliases.ts'
const OUT = 'src/lib/skdiDiseaseNoteIndex.ts'

/**
 * Top-level keys of an object literal, at exactly two spaces of indentation.
 *
 * Both quote styles must be handled: names containing an apostrophe — "Meniere's
 * disease", "Addison's disease" — are written with double quotes. An earlier
 * single-quote-only version of this regex silently dropped those five entries,
 * so their diseases lost the expand toggle even though the notes existed.
 */
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
const aliasKeys = topLevelKeys(readFileSync(ALIASES, 'utf8'))
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

// Coverage guard. Every row in the SKDI list that has a note must end up in the
// index — if parsing ever drops keys again, the count moves and this fails loudly
// instead of quietly removing toggles from the UI.
const listSource = readFileSync('src/lib/skdiDiseaseList.ts', 'utf8')
const listed = [...listSource.matchAll(/disease: '((?:[^'\\]|\\.)*)'/g)].map((m) =>
  m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
)
const keySet = new Set(keys)
const uncovered = [...new Set(listed.filter((d) => !keySet.has(d)))]
const covered = listed.length - listed.filter((d) => !keySet.has(d)).length
if (covered !== listed.length) {
  console.warn(
    `\n${covered}/${listed.length} SKDI rows have a note. Without one (${uncovered.length} distinct):\n` +
      uncovered.map((d) => `  - ${d}`).join('\n') +
      '\nThis is expected only if those diseases genuinely have no note written yet.\n',
  )
} else {
  console.log(`All ${listed.length} SKDI rows resolve to a note.`)
}

if (process.argv.includes('--check')) {
  const onDisk = readFileSync(OUT, 'utf8')
  if (onDisk !== contents) {
    console.error(
      `${OUT} is stale.\n` +
        `Expected ${keys.length} keys (${noteKeys.length} notes + ${aliasKeys.length} aliases).\n` +
        `Run: npm run gen:note-index`,
    )
    process.exit(1)
  }
  console.log(`${OUT} is up to date (${keys.length} keys).`)
} else {
  writeFileSync(OUT, contents)
  console.log(
    `Wrote ${OUT}: ${keys.length} keys (${noteKeys.length} notes + ${aliasKeys.length} aliases).`,
  )
}
