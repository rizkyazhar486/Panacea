// Validator untuk governance/ACCEPTANCE_V2.json. Murni: pengecekan keberadaan berkas diinjeksikan
// (`ada`) supaya negatif-kontrol dapat diuji tanpa menyentuh disk.
// BATAS: memastikan kriteria v2 terstruktur, dapat dieksekusi (skrip/bukti ada) dan tidak memakai
// status yang tidak boleh; TIDAK menjalankan perintahnya dan TIDAK membuktikan kriteria lulus.
export const LEGACY_WAJIB = ['D7', 'D8', 'E4', 'E7', 'F1', 'F2', 'C6']
const FIELD_KRITERIA = ['id', 'legacy', 'capability', 'risk', 'definitionOfDone', 'command', 'negativeControl', 'evidence', 'owner', 'priority', 'horizon', 'allowedStatus', 'status', 'revalidation']
const FIELD_GATE = ['id', 'legacy', 'decisionOwner', 'question', 'whyAiCannot', 'interimBehaviour', 'status', 'activatesWhen']
const STATUS_ENG = ['PASS', 'FAIL', 'NOT_RUN']
const STATUS_GATE = ['DEFERRED_FINAL_STAGE', 'DECIDED']

/** Token jalur skrip di dalam string perintah; `uji/...` relatif ke server/ bila perintah memakai `cd server`. */
export function jalurDariPerintah(cmd) {
  const dariServer = /\bcd server\b/.test(cmd)
  return [...cmd.matchAll(/(?:^|[\s(])((?:scripts|uji)\/[\w./-]+\.(?:mjs|mts|ts))/g)]
    .map((m) => (dariServer && m[1].startsWith('uji/') ? `server/${m[1]}` : m[1]))
}

export function validasi(doc, ada) {
  const e = []
  const ids = new Set()
  const kr = doc.engineeringCriteria ?? []
  const gt = doc.externalGates ?? []
  if (doc.version !== 2) e.push('version harus 2')
  for (const k of kr) {
    const w = `kriteria ${k.id ?? '(tanpa id)'}`
    for (const f of FIELD_KRITERIA) if (k[f] === undefined || k[f] === '' || (Array.isArray(k[f]) && !k[f].length)) e.push(`${w}: field ${f} kosong`)
    if (ids.has(k.id)) e.push(`${w}: id ganda`)
    ids.add(k.id)
    if (k.owner !== 'AI') e.push(`${w}: owner harus AI (bergantung manusia -> gerbang eksternal)`)
    if (!STATUS_ENG.includes(k.status)) e.push(`${w}: status ${k.status} tidak diizinkan`)
    if (JSON.stringify(k.allowedStatus) !== JSON.stringify(STATUS_ENG)) e.push(`${w}: allowedStatus menyimpang`)
    for (const p of k.evidence ?? []) if (!ada(p)) e.push(`${w}: bukti tidak ada: ${p}`)
    const skrip = jalurDariPerintah(k.command ?? '')
    if (!skrip.length) e.push(`${w}: perintah tidak menunjuk skrip`)
    for (const p of skrip) if (!ada(p)) e.push(`${w}: skrip perintah tidak ada: ${p}`)
  }
  for (const g of gt) {
    const w = `gerbang ${g.id ?? '(tanpa id)'}`
    for (const f of FIELD_GATE) if (!g[f]) e.push(`${w}: field ${f} kosong`)
    if (ids.has(g.id)) e.push(`${w}: id ganda`)
    ids.add(g.id)
    if (!STATUS_GATE.includes(g.status)) e.push(`${w}: status ${g.status} tidak diizinkan`)
    if (g.blocksEngineeringWork !== false) e.push(`${w}: tidak boleh menahan pekerjaan engineering`)
  }
  const tercakup = new Set([...kr, ...gt].map((x) => x.legacy))
  for (const l of LEGACY_WAJIB) if (!tercakup.has(l)) e.push(`legacy ${l} tidak terpetakan`)
  return e
}
