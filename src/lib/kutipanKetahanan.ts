// Kutipan ketahanan lintas tradisi — dipakai di ResilienceStories & Dashboard
// (untuk pasien dengan kondisi kronis nyata). Setiap baris adalah kutipan
// nyata dengan sumber yang bisa diperiksa, bukan kalimat yang dikarang untuk
// terdengar bijak. Ayat kitab suci disertakan dalam bahasa aslinya plus
// terjemahan Inggris — bukan diterjemahkan ke Indonesia — sesuai aturan
// naskah suci di CLAUDE.md.
export interface ResilienceQuote {
  quote: string
  source: string
  tradition: 'Roman' | 'Arabic' | 'Samurai' | 'Nordic' | 'Proverb' | 'Reminder'
  original?: string // teks asli, bila bukan bahasa Inggris
}

export const KUTIPAN_KETAHANAN: ResilienceQuote[] = [
  {
    tradition: 'Proverb',
    quote: 'Fall down seven times, stand up eight.',
    source: 'Japanese proverb (Nana korobi ya oki)',
    original: '七転び八起き',
  },
  {
    tradition: 'Roman',
    quote: 'The impediment to action advances action. What stands in the way becomes the way.',
    source: 'Marcus Aurelius, Meditations, Book V',
  },
  {
    tradition: 'Roman',
    quote: 'Difficulties strengthen the mind, as labor does the body.',
    source: 'Seneca, Letters from a Stoic',
  },
  {
    tradition: 'Arabic',
    quote: 'For indeed, with hardship comes ease.',
    source: "Qur'an 94:5-6",
    original: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
  },
  {
    tradition: 'Arabic',
    quote: 'The strong believer is better and more beloved to Allah than the weak believer, though both are good.',
    source: 'Sahih Muslim 2664',
  },
  {
    tradition: 'Samurai',
    quote: 'Today is victory over yourself of yesterday.',
    source: 'Miyamoto Musashi, Dokkodo',
  },
  {
    tradition: 'Nordic',
    quote: "Cattle die, kinsmen die, and so one dies oneself; but the fair fame never dies of him who has earned it.",
    source: 'Hávamál (Poetic Edda), st. 76-77',
  },
  // Bukan naskah kuno — dan diberi label seperti itu apa adanya. Fighting
  // for yourself and being kind to people you don't know are the same
  // instinct pointed in two directions, so it belongs in this rotation.
  {
    tradition: 'Reminder',
    quote: "We don't know others' struggle and pain in life, and everyone is being tested by one thing or another. Where others are harsh — be the light.",
    source: 'A reminder worth keeping',
  },
]
