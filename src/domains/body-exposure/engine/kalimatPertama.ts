/** First sentence for the atlas viewport. A heading such as "What it is." is skipped. Empty input stays empty. */
export function kalimatPertama(teks: string): string {
  const bersih = teks.replace(/\*\*/g, ' ').replace(/\s+/g, ' ').trim()
  if (!bersih) return ''
  const potongan = bersih.split(/(?<=\.)\s+/).filter(Boolean)
  let kalimat = potongan[0] ?? ''
  for (const bagian of potongan) {
    kalimat = bagian
    if (!/^(what|how|which|under|worth|congenital)\b/i.test(bagian)) break
  }
  if (kalimat.length <= 220) return kalimat
  return `${kalimat.slice(0, 219)}…`
}
