/** First sentence for the atlas viewport. Empty input stays empty; nothing is invented. */
export function kalimatPertama(teks: string): string {
  const bersih = teks.replace(/\*\*/g, ' ').replace(/\s+/g, ' ').trim()
  if (!bersih) return ''
  const jeda = bersih.search(/\.\s/)
  const kalimat = jeda >= 0 ? bersih.slice(0, jeda + 1) : bersih
  if (kalimat.length <= 220) return kalimat
  return `${kalimat.slice(0, 219)}…`
}
