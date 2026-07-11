// Minimal client-side PDF generator that stamps a per-buyer watermark on every
// page, so purchased materials are traceable to the buyer's ID.

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '')
}

function wrap(text: string, width = 88): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > width) {
        out.push(line.trim())
        line = word
      } else line = (line + ' ' + word).trim()
    }
    out.push(line)
  }
  return out
}

function pageContent(title: string, meta: string, body: string[], watermark: string, page: number): string {
  const wm = esc(watermark)
  const L: string[] = []
  // Two faint diagonal watermarks per page
  L.push('q 0.86 0.86 0.86 rg 0.7071 0.7071 -0.7071 0.7071 70 250 cm BT /F2 30 Tf 0 0 Td (' + wm + ') Tj ET Q')
  L.push('q 0.92 0.92 0.92 rg 0.7071 0.7071 -0.7071 0.7071 70 520 cm BT /F2 26 Tf 0 0 Td (' + wm + ') Tj ET Q')
  L.push('0 0 0 rg')
  let y = 800
  if (page === 0) {
    L.push(`BT /F2 18 Tf 50 ${y} Td (${esc(title)}) Tj ET`); y -= 26
    L.push(`BT /F1 10 Tf 50 ${y} Td (${esc(meta)}) Tj ET`); y -= 24
  } else {
    L.push(`BT /F1 9 Tf 50 ${y} Td (${esc(title)} - hal ${page + 1}) Tj ET`); y -= 24
  }
  L.push(`BT /F1 11 Tf 50 ${y} Td 15 TL`)
  for (const line of body) L.push(`(${esc(line)}) Tj T*`)
  L.push('ET')
  L.push(`BT /F1 8 Tf 50 28 Td (${esc('Lisensi untuk: ' + watermark + ' - Dilarang menyebarluaskan. (c) Panaceamed.id')}) Tj ET`)
  return L.join('\n')
}

export function makeWatermarkedPdf(title: string, meta: string, bodyText: string, watermark: string): Blob {
  const allLines = wrap(bodyText)
  const perPage = 42
  const pageCount = Math.max(1, Math.ceil(allLines.length / perPage))
  const objects: string[] = []
  const add = (s: string) => objects.push(s)

  const kids: number[] = []
  for (let i = 0; i < pageCount; i++) kids.push(6 + i * 2)
  add('<</Type /Catalog /Pages 2 0 R>>')
  add(`<</Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${pageCount}>>`)
  add('<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>')
  add('<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>')
  for (let i = 0; i < pageCount; i++) {
    const content = pageContent(title, meta, allLines.slice(i * perPage, (i + 1) * perPage), watermark, i)
    add(`<</Length ${content.length}>>\nstream\n${content}\nendstream`)
    add(`<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>> /Contents ${5 + i * 2} 0 R>>`)
  }

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((bodyObj, idx) => {
    offsets.push(pdf.length)
    pdf += `${idx + 1} 0 obj\n${bodyObj}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((off) => { pdf += String(off).padStart(10, '0') + ' 00000 n \n' })
  pdf += `trailer\n<</Size ${objects.length + 1} /Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function downloadWatermarkedPdf(opts: { title: string; meta: string; body: string; buyerId: string }) {
  const blob = makeWatermarkedPdf(opts.title, opts.meta, opts.body, `Panaceamed.id - ${opts.buyerId}`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40) + '.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking right after click() can abort the download mid-flight on some
  // browsers (notably Safari/iOS) since the actual file write is async —
  // give it headroom before freeing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
