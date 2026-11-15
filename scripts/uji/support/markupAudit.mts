// Audit markup aksesibilitas untuk komponen yang dirender ke HTML statis: kontrol tanpa nama, tombol tanpa nama, dan
// grafik SVG tanpa alternatif teks. Murni; diuji berpasangan di atlas-deck-a11y.mts sebelum dipercaya, dan dipakai
// bersama oleh setiap uji UI yang merender markup.
export interface Temuan { aturan: 'kontrol-tanpa-nama' | 'tombol-tanpa-nama' | 'grafik-tanpa-alternatif'; html: string }
export function audit(html: string): Temuan[] {
  const temuan: Temuan[] = []
  const labelUntuk = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]))
  const dibungkus: Array<[number, number]> = []
  for (const m of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) {
    if (m[1].replace(/<[^>]+>/g, '').trim()) dibungkus.push([m.index, m.index + m[0].length])
  }
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const a = m[2]
    if (/\btype="hidden"/.test(a)) continue
    const id = a.match(/\bid="([^"]+)"/)?.[1]
    const bernama = /\baria-label="[^"]*[^"\s][^"]*"/.test(a) || /\baria-labelledby="[^"]+"/.test(a)
      || (id !== undefined && labelUntuk.has(id)) || dibungkus.some(([awal, akhir]) => m.index > awal && m.index < akhir)
    if (!bernama) temuan.push({ aturan: 'kontrol-tanpa-nama', html: m[0].slice(0, 110) })
  }
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const bernama = /\baria-label="[^"]*[^"\s][^"]*"/.test(m[1]) || m[2].replace(/<[^>]+>/g, '').trim().length > 0
    if (!bernama) temuan.push({ aturan: 'tombol-tanpa-nama', html: m[0].slice(0, 110) })
  }
  for (const m of html.matchAll(/<svg\b([^>]*)>/g)) {
    const a = m[1]
    const baik = /\baria-hidden="true"/.test(a) || (/\brole="img"/.test(a) && /\baria-label="[^"]*[^"\s][^"]*"/.test(a))
    if (!baik) temuan.push({ aturan: 'grafik-tanpa-alternatif', html: m[0].slice(0, 110) })
  }
  return temuan
}
