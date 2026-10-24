// Static guard for ENG-E4-02: a console statement must never receive request data, whatever the route group.
// The dynamic journey in logPrivacyHttp only proves the routes it exercises; this scan covers every handler in server/src.
// LIMIT: purely syntactic. It cannot see data copied into another variable first (`const b = req.body; console.log(b)`), so the
// dynamic journey stays the authority for routes it exercises.

const CONSOLE_CALL = /console\s*\.\s*(?:log|warn|error|info|debug|trace)\s*\(/g
// Request members that carry caller-supplied or secret data. `req.path`/`req.method` stay allowed.
const REQUEST_MEMBER = /\b(?:req|request)\s*\??\.\s*(?:body|query|params|headers|cookies|rawBody|url|originalUrl|socket)\b/
const BARE_REQUEST = /(?:^|[(,\s])(?:req|request)\s*(?:[,)]|$)/

/** Argument text of the console call opening at `open` (index of "("), or null when unbalanced. Strings are blanked, template `${}` kept as code. */
function callArguments(src: string, open: number): string | null {
  let depth = 0
  let out = ''
  for (let i = open; i < src.length; i++) {
    const c = src[i]!
    if (c === "'" || c === '"') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++
      out += "''"
      continue
    }
    if (c === '`') {
      out += '`'
      for (i++; i < src.length && src[i] !== '`'; i++) {
        if (src[i] === '\\') { i++; continue }
        if (src[i] === '$' && src[i + 1] === '{') {
          let d = 1
          i += 2
          out += ' ('
          for (; i < src.length && d > 0; i++) {
            if (src[i] === '{') d++
            else if (src[i] === '}') { d--; if (d === 0) break }
            out += src[i]
          }
          out += ') '
        }
      }
      out += '`'
      continue
    }
    if (c === '(') depth++
    if (c === ')') { depth--; if (depth === 0) return out.slice(1) }
    out += c
  }
  return null
}

export interface ConsoleRequestFinding { line: number; call: string }

/** Console statements in `source` whose arguments reference request data. An unbalanced call is reported rather than skipped (fail closed). */
export function consoleCallsWithRequestData(source: string): { scanned: number; findings: ConsoleRequestFinding[] } {
  const findings: ConsoleRequestFinding[] = []
  let scanned = 0
  for (const m of source.matchAll(CONSOLE_CALL)) {
    scanned++
    const open = (m.index ?? 0) + m[0].length - 1
    const args = callArguments(source, open)
    const line = source.slice(0, m.index).split('\n').length
    if (args === null) { findings.push({ line, call: 'unbalanced console call' }); continue }
    if (REQUEST_MEMBER.test(args) || BARE_REQUEST.test(args)) findings.push({ line, call: m[0].replace(/\s+/g, '') })
  }
  return { scanned, findings }
}
