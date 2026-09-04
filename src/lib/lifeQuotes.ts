// Kutipan motivasi lintas dunia — dipakai HANYA untuk sambutan singkat saat
// masuk aplikasi (lihat DailyQuoteBanner), berbeda dari KUTIPAN_KETAHANAN di
// kutipanKetahanan.ts yang khusus area Fitness/Resilience untuk pasien
// kondisi kronis. Sumbernya sengaja beragam — film, buku, tokoh sejarah,
// atlet, pemimpin — bukan hanya satu tradisi, dan setiap baris adalah
// kutipan nyata dengan atribusi yang bisa diperiksa, bukan karangan.
export interface LifeQuote {
  quote: string
  source: string
}

export const KUTIPAN_HIDUP: LifeQuote[] = [
  { quote: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.", source: 'Rocky Balboa, Rocky Balboa (2006)' },
  { quote: 'Get busy living, or get busy dying.', source: 'The Shawshank Redemption (1994)' },
  { quote: 'Whoever saves one life, saves the world entire.', source: "Schindler's List (1993), quoting the Talmud (Sanhedrin 37a)" },
  { quote: "Do. Or do not. There is no try.", source: 'Yoda, The Empire Strikes Back (1980)' },
  { quote: 'Some people never go crazy. What truly horrible lives they must lead.', source: 'Charles Bukowski' },
  { quote: 'It does not matter how slowly you go as long as you do not stop.', source: 'attributed to Confucius' },
  { quote: 'When you have exhausted all possibilities, remember this: you haven’t.', source: 'Thomas Edison (attributed)' },
  { quote: 'The wound is the place where the Light enters you.', source: 'Rumi' },
  { quote: "In the middle of difficulty lies opportunity.", source: 'Albert Einstein' },
  { quote: "Man's search for meaning is the primary motivation in his life.", source: "Viktor Frankl, Man's Search for Meaning (1946)" },
  { quote: "It is not the mountain we conquer, but ourselves.", source: 'Sir Edmund Hillary' },
  { quote: "The struggle itself toward the heights is enough to fill a man's heart. One must imagine Sisyphus happy.", source: 'Albert Camus, The Myth of Sisyphus (1942)' },
  { quote: "I've missed more than 9,000 shots in my career... I've failed over and over and over again in my life. And that is why I succeed.", source: 'Michael Jordan' },
  { quote: 'It always seems impossible until it’s done.', source: 'Nelson Mandela' },
  { quote: "Champions keep playing until they get it right.", source: 'Billie Jean King' },
  { quote: "Float like a butterfly, sting like a bee.", source: 'Muhammad Ali' },
  { quote: 'The only way to do great work is to love what you do.', source: 'Steve Jobs, Stanford commencement address (2005)' },
  { quote: 'Life is 10% what happens to us and 90% how we react to it.', source: 'Charles R. Swindoll' },
  { quote: 'Far away there in the sunshine are my highest aspirations. I may not reach them, but I can look up and see their beauty, believe in them, and try to follow where they lead.', source: 'Louisa May Alcott' },
  { quote: 'It is our choices that show what we truly are, far more than our abilities.', source: 'Albus Dumbledore, Harry Potter and the Chamber of Secrets (J.K. Rowling)' },
  { quote: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.', source: 'The Shawshank Redemption (1994)' },
  { quote: 'You have power over your mind, not outside events. Realize this, and you will find strength.', source: 'Marcus Aurelius, Meditations' },
  { quote: 'The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.', source: 'Winston Churchill (attributed)' },
  { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", source: 'Ralph Waldo Emerson' },
  { quote: 'The world breaks everyone, and afterward, some are strong at the broken places.', source: 'Ernest Hemingway, A Farewell to Arms' },
  { quote: "Turn your wounds into wisdom.", source: 'Oprah Winfrey' },
  { quote: "I am not afraid of storms, for I am learning how to sail my ship.", source: 'Louisa May Alcott, Little Women' },
  { quote: "The comeback is always stronger than the setback.", source: 'unknown (widely circulated athletic maxim)' },
]

// Deterministik per hari — bukan acak — supaya seluruh sesi pada hari yang
// sama melihat kutipan yang sama, dan supaya rotasinya bisa diuji.
export function kutipanHariIni(tanggal: Date = new Date()): LifeQuote {
  const mulaiTahun = Date.UTC(tanggal.getUTCFullYear(), 0, 1)
  const hariKe = Math.floor((Date.UTC(tanggal.getUTCFullYear(), tanggal.getUTCMonth(), tanggal.getUTCDate()) - mulaiTahun) / 86_400_000)
  return KUTIPAN_HIDUP[hariKe % KUTIPAN_HIDUP.length]
}
