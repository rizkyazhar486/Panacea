// Simple food database (per 100 g) for the calorie & macro diary.
export interface Food {
  name: string
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export const FOODS: Food[] = [
  // Karbohidrat & pokok
  { name: 'Nasi putih', kcal: 130, carbs: 28, protein: 2.7, fat: 0.3 },
  { name: 'Nasi merah', kcal: 111, carbs: 23, protein: 2.6, fat: 0.9 },
  { name: 'Ubi', kcal: 86, carbs: 20, protein: 1.6, fat: 0.1 },
  { name: 'Kentang', kcal: 77, carbs: 17, protein: 2, fat: 0.1 },
  { name: 'Singkong', kcal: 160, carbs: 38, protein: 1.4, fat: 0.3 },
  { name: 'Jagung', kcal: 96, carbs: 21, protein: 3.4, fat: 1.5 },
  { name: 'Oat', kcal: 389, carbs: 66, protein: 17, fat: 7 },
  { name: 'Roti gandum', kcal: 247, carbs: 41, protein: 13, fat: 4.2 },
  { name: 'Mie instan', kcal: 436, carbs: 60, protein: 9, fat: 18 },
  { name: 'Quinoa', kcal: 120, carbs: 21, protein: 4.4, fat: 1.9 },
  // Protein hewani
  { name: 'Salmon', kcal: 208, carbs: 0, protein: 20, fat: 13 },
  { name: 'Dada ayam', kcal: 165, carbs: 0, protein: 31, fat: 3.6 },
  { name: 'Telur', kcal: 155, carbs: 1.1, protein: 13, fat: 11 },
  { name: 'Daging sapi', kcal: 250, carbs: 0, protein: 26, fat: 15 },
  { name: 'Ikan kembung', kcal: 105, carbs: 0, protein: 22, fat: 1.5 },
  { name: 'Udang', kcal: 99, carbs: 0.2, protein: 24, fat: 0.3 },
  { name: 'Ikan tuna', kcal: 132, carbs: 0, protein: 28, fat: 1.3 },
  // Protein nabati
  { name: 'Tempe', kcal: 193, carbs: 9, protein: 19, fat: 11 },
  { name: 'Tahu', kcal: 76, carbs: 1.9, protein: 8, fat: 4.8 },
  { name: 'Kacang almond', kcal: 579, carbs: 22, protein: 21, fat: 50 },
  { name: 'Kacang merah', kcal: 127, carbs: 23, protein: 9, fat: 0.5 },
  { name: 'Edamame', kcal: 121, carbs: 9, protein: 12, fat: 5 },
  // Sayur
  { name: 'Brokoli', kcal: 34, carbs: 7, protein: 2.8, fat: 0.4 },
  { name: 'Bayam', kcal: 23, carbs: 3.6, protein: 2.9, fat: 0.4 },
  { name: 'Wortel', kcal: 41, carbs: 10, protein: 0.9, fat: 0.2 },
  { name: 'Kangkung', kcal: 19, carbs: 3.1, protein: 2.6, fat: 0.2 },
  { name: 'Tomat', kcal: 18, carbs: 3.9, protein: 0.9, fat: 0.2 },
  // Buah
  { name: 'Pisang', kcal: 89, carbs: 23, protein: 1.1, fat: 0.3 },
  { name: 'Alpukat', kcal: 160, carbs: 9, protein: 2, fat: 15 },
  { name: 'Apel', kcal: 52, carbs: 14, protein: 0.3, fat: 0.2 },
  { name: 'Jeruk', kcal: 47, carbs: 12, protein: 0.9, fat: 0.1 },
  { name: 'Pepaya', kcal: 43, carbs: 11, protein: 0.5, fat: 0.3 },
  { name: 'Mangga', kcal: 60, carbs: 15, protein: 0.8, fat: 0.4 },
  // Susu & lainnya
  { name: 'Susu', kcal: 61, carbs: 4.8, protein: 3.2, fat: 3.3 },
  { name: 'Yogurt plain', kcal: 59, carbs: 3.6, protein: 10, fat: 0.4 },
  { name: 'Keju', kcal: 402, carbs: 1.3, protein: 25, fat: 33 },
  { name: 'Madu', kcal: 304, carbs: 82, protein: 0.3, fat: 0 },
]

// -- Exercise / activity database (kcal burned per minute, ~70 kg adult) -----
export interface Exercise {
  name: string
  emoji: string
  kcalPerMin: number // approximate calories burned per minute
  intensity: 'Ringan' | 'Sedang' | 'Berat'
}

export const EXERCISES: Exercise[] = [
  { name: 'Jalan kaki', emoji: '🚶', kcalPerMin: 4, intensity: 'Ringan' },
  { name: 'Jalan cepat', emoji: '🚶‍♂️', kcalPerMin: 6, intensity: 'Sedang' },
  { name: 'Lari santai', emoji: '🏃', kcalPerMin: 10, intensity: 'Sedang' },
  { name: 'Lari cepat', emoji: '🏃‍♂️', kcalPerMin: 14, intensity: 'Berat' },
  { name: 'Bersepeda', emoji: '🚴', kcalPerMin: 8, intensity: 'Sedang' },
  { name: 'Berenang', emoji: '🏊', kcalPerMin: 11, intensity: 'Berat' },
  { name: 'Padel / Tenis', emoji: '🎾', kcalPerMin: 9, intensity: 'Sedang' },
  { name: 'Badminton', emoji: '🏸', kcalPerMin: 7, intensity: 'Sedang' },
  { name: 'Sepak bola', emoji: '⚽', kcalPerMin: 9, intensity: 'Berat' },
  { name: 'Basket', emoji: '🏀', kcalPerMin: 8, intensity: 'Berat' },
  { name: 'Latihan beban', emoji: '🏋️', kcalPerMin: 6, intensity: 'Sedang' },
  { name: 'Yoga', emoji: '🧘', kcalPerMin: 3, intensity: 'Ringan' },
  { name: 'Pilates', emoji: '🤸', kcalPerMin: 4, intensity: 'Sedang' },
  { name: 'HIIT', emoji: '🔥', kcalPerMin: 12, intensity: 'Berat' },
  { name: 'Senam aerobik', emoji: '💃', kcalPerMin: 7, intensity: 'Sedang' },
  { name: 'Mendaki', emoji: '🥾', kcalPerMin: 9, intensity: 'Berat' },
  { name: 'Lompat tali', emoji: '🤾', kcalPerMin: 12, intensity: 'Berat' },
  { name: 'Tai chi', emoji: '☯️', kcalPerMin: 3, intensity: 'Ringan' },
]
