// Simple food database (per 100 g) for the calorie & macro diary.
export interface Food {
  name: string
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export const FOODS: Food[] = [
  { name: 'Nasi putih', kcal: 130, carbs: 28, protein: 2.7, fat: 0.3 },
  { name: 'Nasi merah', kcal: 111, carbs: 23, protein: 2.6, fat: 0.9 },
  { name: 'Salmon', kcal: 208, carbs: 0, protein: 20, fat: 13 },
  { name: 'Dada ayam', kcal: 165, carbs: 0, protein: 31, fat: 3.6 },
  { name: 'Telur', kcal: 155, carbs: 1.1, protein: 13, fat: 11 },
  { name: 'Tempe', kcal: 193, carbs: 9, protein: 19, fat: 11 },
  { name: 'Tahu', kcal: 76, carbs: 1.9, protein: 8, fat: 4.8 },
  { name: 'Brokoli', kcal: 34, carbs: 7, protein: 2.8, fat: 0.4 },
  { name: 'Pisang', kcal: 89, carbs: 23, protein: 1.1, fat: 0.3 },
  { name: 'Alpukat', kcal: 160, carbs: 9, protein: 2, fat: 15 },
  { name: 'Ubi', kcal: 86, carbs: 20, protein: 1.6, fat: 0.1 },
  { name: 'Oat', kcal: 389, carbs: 66, protein: 17, fat: 7 },
  { name: 'Susu', kcal: 61, carbs: 4.8, protein: 3.2, fat: 3.3 },
  { name: 'Daging sapi', kcal: 250, carbs: 0, protein: 26, fat: 15 },
]
