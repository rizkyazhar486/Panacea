// Layar Sederhana: SEMUA tindakan di sini memakai rute yang sudah ada. Tidak ada
// kemampuan baru, tidak ada angka klinis, tidak ada status buatan.
// Aturan keras (diuji): ≤ 4 tombol utama, label ≤ 3 kata, petunjuk ≤ 8 kata.
export interface SimpleAction {
  id: 'help' | 'medicine' | 'ask' | 'body'
  to: string
  icon: string
  /** Kalimat Inggris sumber; diterjemahkan lewat tr() saat dirender. */
  label: string
  hint: string
  /** Latar solid; putih di atasnya ≥ 4,5:1 (diuji). */
  background: string
}

export const SIMPLE_ACTIONS: readonly SimpleAction[] = [
  { id: 'help', to: '/emergency', icon: '🆘', label: 'I need help', hint: 'Open my emergency card', background: '#b91c1c' },
  { id: 'medicine', to: '/med-reminders', icon: '💊', label: 'My medicines', hint: 'See what to take and when', background: '#15803d' },
  { id: 'ask', to: '/chatbot', icon: '💬', label: 'Ask a question', hint: 'Type your question and read the answer', background: '#1d4ed8' },
  { id: 'body', to: '/tubuh', icon: '❤️', label: 'My body', hint: 'See my health numbers', background: '#7e22ce' },
]

/** Jalan keluar ke aplikasi penuh; tetap bisa dicapai dari layar ini. */
export const SEE_EVERYTHING_ROUTE = '/cari'
export const SIMPLE_ROUTE = '/simple'
