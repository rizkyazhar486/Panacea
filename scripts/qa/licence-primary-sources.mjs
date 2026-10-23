// ENG-D8-03: setiap kelas lisensi yang dipakai GLB publik wajib punya catatan sumber primer (URL, waktu ambil, SHA-256 isi yang dibaca).
// ICRP wajib berjenis 'owner-statement' (bukan lisensi terverifikasi). Tidak ada catatan yang boleh mengklaim izin hukum telah dibersihkan.
import { LICENCAS_CONHECIDAS } from '../../src/domains/body-exposure/engine/attributionCoverage.ts'

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, HEX = /^[0-9a-f]{64}$/
const CLAIMS = /\b(legally cleared|rights cleared|approved for redistribution|licen[cs]e verified for (?:our|panacea) use)\b/i

/** Kelas lisensi untuk satu string `panacea_license` (satu string bisa memuat lebih dari satu kelas). */
export const classesOf = (licence) => LICENCAS_CONHECIDAS.filter((k) => k.aliases.some((a) => licence.includes(a))).map((k) => k.chave)

export function checkLicenceRecords(usedLicences, doc) {
  const problems = []
  const used = new Set()
  for (const l of usedLicences) {
    const c = classesOf(l)
    if (!c.length) problems.push(`unclassified licence string: ${l.slice(0, 80)}`)
    c.forEach((x) => used.add(x))
  }
  if (!ISO.test(doc?.retrieval?.retrieved_at ?? '')) problems.push('retrieval.retrieved_at must be an ISO UTC timestamp')
  const byClass = new Map((doc?.records ?? []).map((r) => [r.class, r]))
  for (const cls of [...used].sort()) {
    const r = byClass.get(cls)
    if (!r) { problems.push(`no primary-source record for licence class ${cls}`); continue }
    if (!/^https:\/\//.test(r.primary_url ?? '')) problems.push(`${cls}: primary_url must be https`)
    if (r.http_status !== 200) problems.push(`${cls}: primary source was not read (http_status ${r.http_status})`)
    if (!HEX.test(r.content_sha256 ?? '')) problems.push(`${cls}: content_sha256 missing`)
    if (!(typeof r.confirmed_text === 'string' && r.confirmed_text.trim())) problems.push(`${cls}: confirmed_text missing`)
    const icrp = cls.startsWith('ICRP')
    if (icrp && r.kind !== 'owner-statement') problems.push(`${cls}: ICRP basis must be recorded as owner-statement, not a verified licence`)
    if (icrp && !/Not a verified licence/.test(r.basis ?? '')) problems.push(`${cls}: basis must state it is not a verified licence`)
    if (icrp && !r.external_gate) problems.push(`${cls}: owner-statement must point to its external gate`)
    if (!icrp && r.kind !== 'primary-licence-text') problems.push(`${cls}: kind must be primary-licence-text`)
    if (CLAIMS.test(JSON.stringify(r))) problems.push(`${cls}: record claims legal clearance, which no record may do`)
  }
  for (const r of doc?.records ?? []) if (!used.has(r.class)) problems.push(`stale record for unused class ${r.class}`)
  return { used: [...used].sort(), problems }
}
