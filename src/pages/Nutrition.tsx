import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconPlus, IconSparkle, IconHeart, IconStethoscope, IconHospital, IconFlame, IconDrop } from '../components/icons'
import { ShareToFeed } from '../components/ShareToFeed'
import { api, backendEnabled } from '../lib/api'
import { getDemo, setDemo } from '../lib/profile'

// Real map (Leaflet + OpenStreetMap) — same live map as the Beranda tracker.
const RouteMap = lazy(() => import('../components/RouteMap'))
import { evaluateVitals, overallStatus, STATUS_COLOR, STATUS_LABEL } from '../lib/chronic'
// Lazy so recharts is split into its own chunk (keeps the main bundle lean).
const HealthTrends = lazy(() => import('../components/HealthTrends'))
import type { VitalSign } from '../lib/types'

const today = () => new Date().toISOString().slice(0, 10)
const GOAL_SLEEP = 8
const GOAL_WATER = 2000
const C = { ok: '#00BF63', warn: '#f59e0b', bad: '#ef4444', blue: '#2563eb', pur: '#8b5cf6', ind: '#818cf8', org: '#f97316', cyan: '#06b6d4', pink: '#ec4899' }

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Body { w: number; h: number; age: number; g: 'M' | 'F'; act: number; goal: 'lose' | 'maintain' | 'gain' }
interface Food { name: string; k: number; c: number; p: number; f: number; fb: number; na: number; k2: number; mg: number; fe: number; zn: number; vitC: number; vitD: number; omega3: number; gi: number; cat: string; emoji: string; tags: string[] }
interface Exer { name: string; emoji: string; met: number; int: string; gps: boolean; cat: string; hiit: boolean }
interface GP { lat: number; lng: number; t: number; hr?: number }
interface IV { date: string; heartRate?: number; steps?: number; systolic?: number; diastolic?: number; spo2?: number; hrv?: number; vo2Max?: number; glucose?: number; hba1c?: number; creatinine?: number; gfr?: number; bun?: number; potassium?: number; sodium?: number; crp?: number; esr?: number; wbc?: number; hemoglobin?: number; platelet?: number; alt?: number; ast?: number; albumin?: number; bilirubin?: number; tsh?: number; t4?: number; cortisol?: number; uricAcid?: number; ldl?: number; hdl?: number; triglycerides?: number; totalCholesterol?: number; ferritin?: number; vitB12?: number; folate?: number; vitD?: number; calcium?: number; phosphorus?: number }
interface Rec { e: string; t: string; d: string; pr: number; c: string }
interface ChronicProtocol { id: string; name: string; emoji: string; color: string; calAdj: number; protAdj: number; naMax: number; kMax: number; fluidMax: number; fluidMin: number; specialFoods: string[]; avoidFoods: string[]; notes: string[]; labKeys: string[]; labLabels: Record<string, string>; labUnits: Record<string, string>; labRanges: Record<string, [number, number]>; exerRestrictions: string[] }
interface LabEntry { date: string; values: Record<string, number> }

// Weight/height/age/gender come from the shared Demo profile (single source
// of truth, fed by Data Kesehatan) instead of a private local silo — this key
// now only holds Nutrition-specific settings (activity level, diet goal) that
// Data Kesehatan has no concept of.
const BK = 'pm_body_v2'
const LAB_K = 'pm_lab_weekly'
const defBody: Body = { w: 65, h: 165, age: 30, g: 'M', act: 1, goal: 'maintain' }
const loadBody = (): Body => {
  const demo = getDemo()
  let local: { act?: number; goal?: Body['goal'] } = {}
  try { local = JSON.parse(localStorage.getItem(BK) || '{}') } catch { /* ignore */ }
  return { w: demo.weightKg || defBody.w, h: demo.heightCm || defBody.h, age: demo.age || defBody.age, g: demo.sex || defBody.g, act: local.act ?? defBody.act, goal: local.goal ?? defBody.goal }
}
const saveB = (b: Body) => {
  localStorage.setItem(BK, JSON.stringify({ act: b.act, goal: b.goal }))
  setDemo({ weightKg: b.w, heightCm: b.h, age: b.age, sex: b.g })
}
let _br = 0
const emitB = () => { _br++; window.dispatchEvent(new Event('bc')) }
const useBR = () => { const [, s] = useState(0); useEffect(() => { const h = () => s(v => v + 1); window.addEventListener('bc', h); return () => window.removeEventListener('bc', h) }, []); return _br }

/* ═══════════════════════════════════════════════════════
   FOOD DATABASE (150+ items, clinical grade)
   ═══════════════════════════════════════════════════════ */
const FD: Food[] = [
  // CARBOHYDRATES
  { name: 'White rice', k: 130, c: 28, p: 2.7, f: 0.3, fb: 0.4, na: 1, k2: 35, mg: 12, fe: 0.2, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 73, cat: 'Carbs', emoji: '🍚', tags: ['high-gi', 'gluten-free'] },
  { name: 'Red rice', k: 111, c: 23, p: 2.6, f: 0.9, fb: 1.8, na: 5, k2: 79, mg: 44, fe: 0.5, zn: 1.2, vitC: 0, vitD: 0, omega3: 0, gi: 68, cat: 'Carbs', emoji: '🍚', tags: ['moderate-gi', 'whole-grain'] },
  { name: 'Black rice', k: 100, c: 21, p: 3, f: 0.5, fb: 2, na: 4, k2: 80, mg: 40, fe: 0.6, zn: 1.1, vitC: 0, vitD: 0, omega3: 0, gi: 55, cat: 'Carbs', emoji: '🍚', tags: ['low-gi', 'antioxidant'] },
  { name: 'Fried rice', k: 163, c: 21, p: 4, f: 6, fb: 0.8, na: 400, k2: 50, mg: 18, fe: 1, zn: 0.8, vitC: 2, vitD: 0, omega3: 0, gi: 65, cat: 'Carbs', emoji: '🍛', tags: ['high-sodium'] },
  { name: 'Lontong (rice cake)', k: 122, c: 27, p: 2, f: 0.2, fb: 0.5, na: 2, k2: 30, mg: 10, fe: 0.1, zn: 0.3, vitC: 0, vitD: 0, omega3: 0, gi: 70, cat: 'Carbs', emoji: '🟢', tags: [] },
  { name: 'White bread', k: 265, c: 49, p: 9, f: 3.2, fb: 2.7, na: 491, k2: 115, mg: 25, fe: 2.5, zn: 0.9, vitC: 0, vitD: 0, omega3: 0, gi: 75, cat: 'Carbs', emoji: '🍞', tags: ['high-gi', 'high-sodium'] },
  { name: 'Whole wheat bread', k: 247, c: 41, p: 13, f: 3.4, fb: 6.8, na: 400, k2: 250, mg: 75, fe: 2.5, zn: 2, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Carbs', emoji: '🍞', tags: ['low-gi', 'whole-grain', 'high-fiber'] },
  { name: 'Oatmeal', k: 389, c: 66, p: 17, f: 7, fb: 11, na: 5, k2: 429, mg: 177, fe: 4.7, zn: 3.9, vitC: 0, vitD: 0, omega3: 0.1, gi: 55, cat: 'Carbs', emoji: '🥣', tags: ['low-gi', 'beta-glucan', 'heart-healthy'] },
  { name: 'Quinoa', k: 368, c: 64, p: 14, f: 6, fb: 7, na: 5, k2: 563, mg: 197, fe: 4.6, zn: 3.1, vitC: 0, vitD: 0, omega3: 0.3, gi: 53, cat: 'Carbs', emoji: '🥣', tags: ['low-gi', 'complete-protein'] },
  { name: 'Boiled potato', k: 87, c: 20, p: 1.9, f: 0.1, fb: 2.2, na: 6, k2: 421, mg: 23, fe: 0.8, zn: 0.4, vitC: 13, vitD: 0, omega3: 0, gi: 78, cat: 'Carbs', emoji: '🥔', tags: ['potassium-rich'] },
  { name: 'Sweet potato', k: 86, c: 20, p: 1.6, f: 0.1, fb: 3, na: 55, k2: 337, mg: 25, fe: 0.6, zn: 0.3, vitC: 2.4, vitD: 0, omega3: 0, gi: 44, cat: 'Carbs', emoji: '🍠', tags: ['low-gi', 'beta-carotene'] },
  { name: 'Purple sweet potato', k: 82, c: 18, p: 1.5, f: 0.1, fb: 3, na: 40, k2: 350, mg: 25, fe: 0.6, zn: 0.3, vitC: 2.4, vitD: 0, omega3: 0, gi: 42, cat: 'Carbs', emoji: '🍠', tags: ['low-gi', 'anthocyanin'] },
  { name: 'Fried noodles', k: 182, c: 24, p: 5, f: 7, fb: 1.2, na: 600, k2: 80, mg: 25, fe: 1.5, zn: 0.7, vitC: 0, vitD: 0, omega3: 0, gi: 60, cat: 'Carbs', emoji: '🍜', tags: ['high-sodium', 'processed'] },
  { name: 'Chicken noodles', k: 85, c: 12, p: 4, f: 2, fb: 0.5, na: 500, k2: 60, mg: 15, fe: 1, zn: 0.5, vitC: 1, vitD: 0, omega3: 0, gi: 55, cat: 'Carbs', emoji: '🍜', tags: ['moderate-sodium'] },
  { name: 'Soba noodles', k: 99, c: 21, p: 5.1, f: 0.1, fb: 0.5, na: 300, k2: 100, mg: 40, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Carbs', emoji: '🍜', tags: ['low-gi', 'buckwheat'] },
  { name: 'Chicken congee', k: 68, c: 10, p: 3, f: 2, fb: 0.3, na: 300, k2: 40, mg: 12, fe: 0.5, zn: 0.4, vitC: 1, vitD: 0, omega3: 0, gi: 70, cat: 'Carbs', emoji: '🥣', tags: ['easy-digest'] },
  { name: 'Boiled corn', k: 96, c: 21, p: 3.2, f: 1.2, fb: 2.7, na: 3, k2: 270, mg: 37, fe: 0.5, zn: 0.6, vitC: 7, vitD: 0, omega3: 0.2, gi: 52, cat: 'Carbs', emoji: '🌽', tags: ['fiber'] },
  { name: 'Whole wheat pasta', k: 124, c: 25, p: 5, f: 0.5, fb: 3.2, na: 3, k2: 44, mg: 18, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0, gi: 37, cat: 'Carbs', emoji: '🍝', tags: ['low-gi', 'whole-grain'] },
  { name: 'Tortilla', k: 312, c: 52, p: 8, f: 8, fb: 6, na: 450, k2: 180, mg: 60, fe: 2, zn: 1.2, vitC: 0, vitD: 0, omega3: 0, gi: 55, cat: 'Carbs', emoji: '🫓', tags: [] },

  // ANIMAL PROTEIN
  { name: 'Fried chicken', k: 239, c: 8, p: 21, f: 14, fb: 0.3, na: 300, k2: 200, mg: 25, fe: 1, zn: 1.5, vitC: 0, vitD: 0.5, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['high-fat'] },
  { name: 'Grilled chicken', k: 190, c: 1, p: 28, f: 8, fb: 0, na: 100, k2: 250, mg: 30, fe: 1.2, zn: 2, vitC: 0, vitD: 0.3, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['lean'] },
  { name: 'Boiled chicken breast', k: 165, c: 0, p: 31, f: 3.6, fb: 0, na: 74, k2: 256, mg: 29, fe: 1, zn: 1, vitC: 0, vitD: 0.2, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['lean', 'high-protein'] },
  { name: 'Lean beef', k: 250, c: 0, p: 26, f: 15, fb: 0, na: 65, k2: 318, mg: 21, fe: 2.6, zn: 5.5, vitC: 0, vitD: 0.2, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['iron-rich', 'zinc-rich'] },
  { name: 'Beef tenderloin', k: 271, c: 0, p: 26, f: 18, fb: 0, na: 57, k2: 315, mg: 22, fe: 2.4, zn: 5, vitC: 0, vitD: 0.1, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['high-fat'] },
  { name: 'Salmon', k: 208, c: 0, p: 20, f: 13, fb: 0, na: 59, k2: 363, mg: 27, fe: 0.3, zn: 0.6, vitC: 0, vitD: 12, omega3: 2.3, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['omega3-rich', 'vitamin-d', 'anti-inflammatory'] },
  { name: 'Tuna', k: 132, c: 0, p: 28, f: 1.3, fb: 0, na: 40, k2: 300, mg: 30, fe: 1, zn: 0.6, vitC: 0, vitD: 6, omega3: 0.8, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'omega3-rich'] },
  { name: 'Mackerel', k: 205, c: 0, p: 19, f: 13, fb: 0, na: 80, k2: 350, mg: 30, fe: 1.5, zn: 1, vitC: 0, vitD: 5, omega3: 1.5, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['omega3-rich', 'affordable'] },
  { name: 'Cod', k: 82, c: 0, p: 18, f: 0.7, fb: 0, na: 54, k2: 421, mg: 32, fe: 0.4, zn: 0.5, vitC: 0, vitD: 1, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'low-fat'] },
  { name: 'Shrimp', k: 85, c: 0.2, p: 20, f: 0.5, fb: 0, na: 111, k2: 259, mg: 37, fe: 0.5, zn: 1.1, vitC: 2, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🦐', tags: ['lean', 'high-protein'] },
  { name: 'Chicken egg', k: 155, c: 1.1, p: 13, f: 11, fb: 0, na: 124, k2: 126, mg: 12, fe: 1.8, zn: 1.3, vitC: 0, vitD: 2, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🥚', tags: ['complete-protein', 'choline'] },
  { name: 'Duck egg', k: 185, c: 1, p: 13, f: 14, fb: 0, na: 140, k2: 140, mg: 15, fe: 2, zn: 1.5, vitC: 0, vitD: 2.5, omega3: 0.4, gi: 0, cat: 'Protein', emoji: '🥚', tags: ['complete-protein'] },
  { name: 'Chicken satay', k: 186, c: 3, p: 22, f: 10, fb: 0.2, na: 400, k2: 180, mg: 25, fe: 1.2, zn: 1.5, vitC: 2, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍢', tags: ['high-sodium'] },
  { name: 'Rendang', k: 193, c: 2, p: 24, f: 10, fb: 0.5, na: 350, k2: 200, mg: 30, fe: 2, zn: 2.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍛', tags: ['spice-rich', 'anti-inflammatory'] },
  { name: 'Fried fish', k: 232, c: 7, p: 19, f: 14, fb: 0.3, na: 250, k2: 200, mg: 20, fe: 0.8, zn: 0.8, vitC: 0, vitD: 3, omega3: 0.5, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['high-fat'] },
  { name: 'Goat meat', k: 294, c: 0, p: 25, f: 21, fb: 0, na: 72, k2: 355, mg: 23, fe: 2.8, zn: 4.5, vitC: 0, vitD: 0.1, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['b12-rich', 'iron-rich'] },
  { name: 'Catfish', k: 95, c: 0, p: 16, f: 3.5, fb: 0, na: 50, k2: 290, mg: 25, fe: 0.5, zn: 0.8, vitC: 0, vitD: 2, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['affordable'] },
  { name: 'Tilapia', k: 96, c: 0, p: 18, f: 2.5, fb: 0, na: 40, k2: 300, mg: 27, fe: 0.4, zn: 0.6, vitC: 0, vitD: 1, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'affordable'] },
  { name: 'Fried squid', k: 175, c: 4, p: 18, f: 10, fb: 0, na: 350, k2: 250, mg: 30, fe: 1.5, zn: 2, vitC: 2, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🦑', tags: ['high-sodium'] },
  { name: 'Crab', k: 87, c: 0, p: 18, f: 1.1, fb: 0, na: 250, k2: 300, mg: 50, fe: 1.5, zn: 3, vitC: 3, vitD: 0, omega3: 0.4, gi: 0, cat: 'Protein', emoji: '🦀', tags: ['zinc-rich', 'high-sodium'] },

  // PLANT PROTEIN
  { name: 'Fried tempeh', k: 201, c: 8, p: 17, f: 12, fb: 3, na: 200, k2: 250, mg: 80, fe: 2.5, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented', 'plant-protein'] },
  { name: 'Steamed tempeh', k: 160, c: 7, p: 18, f: 8, fb: 4, na: 150, k2: 280, mg: 90, fe: 3, zn: 1.8, vitC: 0, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented', 'low-fat'] },
  { name: 'Fried tofu', k: 234, c: 4, p: 15, f: 17, fb: 0.5, na: 150, k2: 130, mg: 40, fe: 1.5, zn: 1, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '⬜', tags: ['plant-protein'] },
  { name: 'Steamed tofu', k: 76, c: 1.9, p: 8, f: 4.8, fb: 0.3, na: 100, k2: 120, mg: 30, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0.05, gi: 0, cat: 'Protein', emoji: '⬜', tags: ['plant-protein', 'low-fat'] },
  { name: 'Edamame', k: 121, c: 9, p: 11, f: 5, fb: 5, na: 6, k2: 436, mg: 64, fe: 2.1, zn: 1.6, vitC: 6, vitD: 0, omega3: 0.3, gi: 15, cat: 'Protein', emoji: '🫛', tags: ['complete-protein', 'low-gi'] },
  { name: 'Kidney beans', k: 127, c: 22, p: 8.7, f: 0.5, fb: 6.4, na: 1, k2: 405, mg: 70, fe: 2.9, zn: 1.3, vitC: 1, vitD: 0, omega3: 0.1, gi: 30, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'high-fiber'] },
  { name: 'Soybeans', k: 173, c: 10, p: 16, f: 9, fb: 6, na: 2, k2: 515, mg: 86, fe: 5.1, zn: 2, vitC: 0, vitD: 0, omega3: 0.6, gi: 15, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'isoflavone'] },
  { name: 'Almonds', k: 579, c: 22, p: 21, f: 50, fb: 12, na: 1, k2: 733, mg: 270, fe: 3.7, zn: 3.1, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥜', tags: ['vitamin-e', 'healthy-fat'] },
  { name: 'Peanuts', k: 567, c: 16, p: 26, f: 49, fb: 8.5, na: 18, k2: 705, mg: 168, fe: 2, zn: 3.3, vitC: 0, vitD: 0, omega3: 0, gi: 7, cat: 'Protein', emoji: '🥜', tags: ['low-gi'] },
  { name: 'Mung beans', k: 105, c: 19, p: 7, f: 0.4, fb: 7.6, na: 1, k2: 460, mg: 48, fe: 2.1, zn: 1.2, vitC: 1, vitD: 0, omega3: 0.1, gi: 31, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'high-fiber'] },
  { name: 'Oncom (fermented soy)', k: 150, c: 10, p: 12, f: 7, fb: 4, na: 120, k2: 200, mg: 60, fe: 2, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented'] },

  // DAIRY & DERIVATIVES
  { name: 'Full cream milk', k: 61, c: 4.8, p: 3.2, f: 3.3, fb: 0, na: 43, k2: 132, mg: 10, fe: 0.03, zn: 0.4, vitC: 0, vitD: 1.3, omega3: 0.08, gi: 27, cat: 'Dairy', emoji: '🥛', tags: ['calcium'] },
  { name: 'Skim milk', k: 34, c: 5, p: 3.4, f: 0.1, fb: 0, na: 42, k2: 156, mg: 11, fe: 0.03, zn: 0.4, vitC: 0, vitD: 1.3, omega3: 0, gi: 32, cat: 'Dairy', emoji: '🥛', tags: ['low-fat', 'calcium'] },
  { name: 'Almond milk', k: 17, c: 0.6, p: 0.4, f: 1.5, fb: 0.2, na: 70, k2: 30, mg: 5, fe: 0.1, zn: 0.1, vitC: 0, vitD: 2.5, omega3: 0, gi: 25, cat: 'Dairy', emoji: '🥛', tags: ['plant-based'] },
  { name: 'Plain yogurt', k: 59, c: 3.6, p: 10, f: 0.4, fb: 0, na: 46, k2: 155, mg: 11, fe: 0.05, zn: 0.6, vitC: 0, vitD: 0.1, omega3: 0.02, gi: 25, cat: 'Dairy', emoji: '🫙', tags: ['probiotic', 'calcium'] },
  { name: 'Greek yogurt', k: 97, c: 3.6, p: 9, f: 5, fb: 0, na: 36, k2: 141, mg: 11, fe: 0.1, zn: 0.5, vitC: 0, vitD: 0, omega3: 0.05, gi: 15, cat: 'Dairy', emoji: '🫙', tags: ['high-protein', 'probiotic'] },
  { name: 'Cheddar cheese', k: 402, c: 1.3, p: 25, f: 33, fb: 0, na: 621, k2: 98, mg: 28, fe: 0.7, zn: 3.1, vitC: 0, vitD: 0.6, omega3: 0.04, gi: 0, cat: 'Dairy', emoji: '🧀', tags: ['calcium', 'high-sodium'] },
  { name: 'Cottage cheese', k: 98, c: 3.4, p: 11, f: 4.3, fb: 0, na: 364, k2: 104, mg: 8, fe: 0.1, zn: 0.4, vitC: 0, vitD: 0.1, omega3: 0.02, gi: 20, cat: 'Dairy', emoji: '🧀', tags: ['high-protein', 'low-fat'] },
  { name: 'Whey protein', k: 400, c: 5, p: 80, f: 3, fb: 0, na: 150, k2: 200, mg: 50, fe: 2, zn: 2, vitC: 0, vitD: 0, omega3: 0, gi: 30, cat: 'Dairy', emoji: '🥤', tags: ['high-protein', 'bcaa'] },
  { name: 'Casein protein', k: 380, c: 4, p: 75, f: 4, fb: 0, na: 160, k2: 250, mg: 60, fe: 1.5, zn: 2.5, vitC: 0, vitD: 0, omega3: 0, gi: 25, cat: 'Dairy', emoji: '🥤', tags: ['slow-absorbing'] },

  // VEGETABLES
  { name: 'Spinach', k: 23, c: 3.6, p: 2.9, f: 0.4, fb: 2.2, na: 79, k2: 558, mg: 79, fe: 2.7, zn: 0.5, vitC: 28, vitD: 0, omega3: 0.1, gi: 15, cat: 'Vegetables', emoji: '🥬', tags: ['iron-rich', 'folate'] },
  { name: 'Water spinach', k: 19, c: 3.1, p: 2.6, f: 0.2, fb: 2.5, na: 50, k2: 350, mg: 40, fe: 1.5, zn: 0.3, vitC: 20, vitD: 0, omega3: 0.05, gi: 15, cat: 'Vegetables', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Broccoli', k: 34, c: 7, p: 2.8, f: 0.4, fb: 2.6, na: 33, k2: 316, mg: 21, fe: 0.7, zn: 0.6, vitC: 89, vitD: 0, omega3: 0.02, gi: 10, cat: 'Vegetables', emoji: '🥦', tags: ['vitamin-c', 'sulforaphane'] },
  { name: 'Carrot', k: 41, c: 10, p: 0.9, f: 0.2, fb: 2.8, na: 69, k2: 320, mg: 12, fe: 0.3, zn: 0.2, vitC: 6, vitD: 0, omega3: 0, gi: 35, cat: 'Vegetables', emoji: '🥕', tags: ['beta-carotene'] },
  { name: 'Tomato', k: 18, c: 3.9, p: 0.9, f: 0.2, fb: 1.2, na: 5, k2: 237, mg: 11, fe: 0.3, zn: 0.2, vitC: 14, vitD: 0, omega3: 0, gi: 15, cat: 'Vegetables', emoji: '🍅', tags: ['lycopene'] },
  { name: 'Green mustard greens', k: 26, c: 4.5, p: 2.8, f: 0.3, fb: 2.8, na: 20, k2: 250, mg: 20, fe: 1, zn: 0.3, vitC: 30, vitD: 0, omega3: 0.05, gi: 15, cat: 'Vegetables', emoji: '🥬', tags: ['calcium', 'vitamin-k'] },
  { name: 'White mustard greens', k: 14, c: 2.5, p: 1.5, f: 0.2, fb: 2, na: 10, k2: 180, mg: 15, fe: 0.5, zn: 0.2, vitC: 15, vitD: 0, omega3: 0, gi: 12, cat: 'Vegetables', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Gado-gado (mixed vegetable salad)', k: 122, c: 10, p: 6, f: 7, fb: 3, na: 300, k2: 200, mg: 40, fe: 1.5, zn: 1, vitC: 10, vitD: 0, omega3: 0.1, gi: 25, cat: 'Vegetables', emoji: '🥗', tags: ['balanced'] },
  { name: 'Lettuce', k: 15, c: 2.9, p: 1.4, f: 0.2, fb: 1.3, na: 28, k2: 194, mg: 13, fe: 1.2, zn: 0.2, vitC: 9, vitD: 0, omega3: 0.05, gi: 10, cat: 'Vegetables', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Celery', k: 16, c: 3, p: 0.7, f: 0.2, fb: 1.6, na: 80, k2: 260, mg: 11, fe: 0.2, zn: 0.1, vitC: 3, vitD: 0, omega3: 0, gi: 15, cat: 'Vegetables', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Red bell pepper', k: 31, c: 6, p: 1, f: 0.3, fb: 2.1, na: 4, k2: 318, mg: 12, fe: 0.4, zn: 0.3, vitC: 128, vitD: 0, omega3: 0.05, gi: 15, cat: 'Vegetables', emoji: '🫑', tags: ['vitamin-c-rich'] },
  { name: 'Eggplant', k: 25, c: 6, p: 1, f: 0.2, fb: 3, na: 2, k2: 230, mg: 14, fe: 0.2, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 15, cat: 'Vegetables', emoji: '🍆', tags: ['nasunin'] },
  { name: 'Chayote', k: 16, c: 4, p: 0.8, f: 0.1, fb: 2, na: 3, k2: 150, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0, gi: 15, cat: 'Vegetables', emoji: '🥒', tags: ['low-calorie'] },
  { name: 'Green beans', k: 31, c: 7, p: 1.8, f: 0.1, fb: 2.7, na: 6, k2: 210, mg: 25, fe: 1, zn: 0.3, vitC: 12, vitD: 0, omega3: 0.05, gi: 15, cat: 'Vegetables', emoji: '🫘', tags: ['fiber'] },
  { name: 'Winged bean', k: 29, c: 5, p: 3, f: 0.1, fb: 2, na: 4, k2: 200, mg: 20, fe: 0.8, zn: 0.3, vitC: 10, vitD: 0, omega3: 0, gi: 15, cat: 'Vegetables', emoji: '🫛', tags: [] },
  { name: 'Cassava leaves', k: 37, c: 7, p: 3.5, f: 0.5, fb: 3, na: 15, k2: 300, mg: 35, fe: 2, zn: 0.5, vitC: 30, vitD: 0, omega3: 0.05, gi: 15, cat: 'Vegetables', emoji: '🥬', tags: ['vitamin-k'] },
  { name: 'Jengkol bean', k: 140, c: 10, p: 5, f: 0.3, fb: 4, na: 10, k2: 350, mg: 40, fe: 2, zn: 0.8, vitC: 5, vitD: 0, omega3: 0, gi: 20, cat: 'Vegetables', emoji: '🟤', tags: [] },
  { name: 'Petai (stink bean)', k: 150, c: 8, p: 8, f: 0.5, fb: 3, na: 5, k2: 280, mg: 30, fe: 1.5, zn: 0.7, vitC: 3, vitD: 0, omega3: 0, gi: 20, cat: 'Vegetables', emoji: '🟢', tags: [] },

  // FRUIT
  { name: 'Banana', k: 89, c: 23, p: 1.1, f: 0.3, fb: 2.6, na: 1, k2: 358, mg: 27, fe: 0.3, zn: 0.2, vitC: 9, vitD: 0, omega3: 0.03, gi: 51, cat: 'Fruit', emoji: '🍌', tags: ['potassium-rich'] },
  { name: 'Apple', k: 52, c: 14, p: 0.3, f: 0.2, fb: 2.4, na: 1, k2: 107, mg: 5, fe: 0.1, zn: 0.04, vitC: 5, vitD: 0, omega3: 0.01, gi: 36, cat: 'Fruit', emoji: '🍎', tags: ['pectin', 'low-gi'] },
  { name: 'Orange', k: 47, c: 12, p: 0.9, f: 0.1, fb: 2.4, na: 0, k2: 181, mg: 10, fe: 0.1, zn: 0.07, vitC: 53, vitD: 0, omega3: 0.02, gi: 40, cat: 'Fruit', emoji: '🍊', tags: ['vitamin-c'] },
  { name: 'Mango', k: 60, c: 15, p: 0.8, f: 0.4, fb: 1.6, na: 1, k2: 168, mg: 10, fe: 0.2, zn: 0.1, vitC: 36, vitD: 0, omega3: 0.03, gi: 56, cat: 'Fruit', emoji: '🥭', tags: ['vitamin-a'] },
  { name: 'Avocado', k: 160, c: 9, p: 2, f: 15, fb: 7, na: 7, k2: 485, mg: 29, fe: 0.6, zn: 0.6, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Fruit', emoji: '🥑', tags: ['healthy-fat', 'potassium-rich', 'low-gi'] },
  { name: 'Guava', k: 68, c: 14, p: 2.6, f: 1, fb: 5.4, na: 2, k2: 417, mg: 22, fe: 0.3, zn: 0.2, vitC: 228, vitD: 0, omega3: 0.05, gi: 24, cat: 'Fruit', emoji: '🍐', tags: ['vitamin-c-super', 'low-gi'] },
  { name: 'Papaya', k: 43, c: 11, p: 0.5, f: 0.3, fb: 1.7, na: 8, k2: 257, mg: 21, fe: 0.3, zn: 0.1, vitC: 61, vitD: 0, omega3: 0.02, gi: 40, cat: 'Fruit', emoji: '🍈', tags: ['papain', 'vitamin-c'] },
  { name: 'Watermelon', k: 30, c: 8, p: 0.6, f: 0.2, fb: 0.4, na: 1, k2: 112, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0.01, gi: 76, cat: 'Fruit', emoji: '🍉', tags: ['hydrating', 'lycopene'] },
  { name: 'Melon', k: 34, c: 8, p: 0.8, f: 0.2, fb: 0.9, na: 16, k2: 267, mg: 12, fe: 0.2, zn: 0.1, vitC: 18, vitD: 0, omega3: 0.01, gi: 65, cat: 'Fruit', emoji: '🍈', tags: ['hydrating'] },
  { name: 'Grapes', k: 69, c: 18, p: 0.7, f: 0.2, fb: 0.9, na: 2, k2: 191, mg: 7, fe: 0.4, zn: 0.07, vitC: 3, vitD: 0, omega3: 0.05, gi: 53, cat: 'Fruit', emoji: '🍇', tags: ['resveratrol'] },
  { name: 'Strawberry', k: 32, c: 7.7, p: 0.7, f: 0.3, fb: 2, na: 1, k2: 153, mg: 13, fe: 0.4, zn: 0.1, vitC: 59, vitD: 0, omega3: 0.07, gi: 25, cat: 'Fruit', emoji: '🍓', tags: ['low-gi', 'antioxidant'] },
  { name: 'Blueberry', k: 57, c: 14, p: 0.7, f: 0.3, fb: 2.4, na: 1, k2: 77, mg: 6, fe: 0.3, zn: 0.2, vitC: 10, vitD: 0, omega3: 0.06, gi: 34, cat: 'Fruit', emoji: '🫐', tags: ['antioxidant', 'brain-health'] },
  { name: 'Duku (langsat)', k: 70, c: 18, p: 0.9, f: 0.2, fb: 1, na: 3, k2: 150, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0, gi: 50, cat: 'Fruit', emoji: '🟡', tags: [] },
  { name: 'Rambutan', k: 68, c: 16, p: 0.9, f: 0.2, fb: 0.9, na: 11, k2: 140, mg: 8, fe: 0.2, zn: 0.1, vitC: 5, vitD: 0, omega3: 0, gi: 50, cat: 'Fruit', emoji: '🔴', tags: [] },
  { name: 'Salak (snake fruit)', k: 82, c: 18, p: 0.8, f: 0.4, fb: 2.3, na: 5, k2: 160, mg: 18, fe: 0.3, zn: 0.2, vitC: 2, vitD: 0, omega3: 0, gi: 55, cat: 'Fruit', emoji: '🟤', tags: ['tannin'] },
  { name: 'Pineapple', k: 50, c: 13, p: 0.5, f: 0.1, fb: 1.4, na: 1, k2: 109, mg: 12, fe: 0.3, zn: 0.1, vitC: 48, vitD: 0, omega3: 0.02, gi: 59, cat: 'Fruit', emoji: '🍍', tags: ['bromelain'] },
  { name: 'Young coconut', k: 19, c: 4, p: 0.7, f: 0.2, fb: 1.1, na: 105, k2: 250, mg: 25, fe: 0.3, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Fruit', emoji: '🥥', tags: ['electrolyte', 'hydrating'] },
  { name: 'Durian', k: 147, c: 27, p: 1.5, f: 5, fb: 3.8, na: 2, k2: 436, mg: 30, fe: 0.4, zn: 0.3, vitC: 20, vitD: 0, omega3: 0, gi: 55, cat: 'Fruit', emoji: '🟡', tags: ['high-calorie'] },

  // BEVERAGES
  { name: 'Sweet iced tea', k: 40, c: 10, p: 0, f: 0, fb: 0, na: 10, k2: 10, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 65, cat: 'Beverages', emoji: '🧊', tags: ['high-sugar'] },
  { name: 'Black coffee', k: 2, c: 0, p: 0.3, f: 0, fb: 0, na: 2, k2: 49, mg: 3, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Beverages', emoji: '☕', tags: ['caffeine', 'antioxidant'] },
  { name: 'Orange juice', k: 45, c: 10, p: 0.7, f: 0.2, fb: 0.2, na: 0, k2: 200, mg: 11, fe: 0.1, zn: 0.05, vitC: 50, vitD: 0, omega3: 0, gi: 50, cat: 'Beverages', emoji: '🧃', tags: ['vitamin-c'] },
  { name: 'Mineral water', k: 0, c: 0, p: 0, f: 0, fb: 0, na: 0, k2: 0, mg: 0, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Beverages', emoji: '💧', tags: ['hydration'] },
  { name: 'Green tea', k: 1, c: 0, p: 0.2, f: 0, fb: 0, na: 1, k2: 20, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Beverages', emoji: '🍵', tags: ['egcg', 'antioxidant'] },
  { name: 'Avocado juice', k: 160, c: 3, p: 2, f: 15, fb: 3, na: 10, k2: 300, mg: 20, fe: 0.3, zn: 0.3, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Beverages', emoji: '🥤', tags: ['healthy-fat'] },
  { name: 'Chocolate milk', k: 83, c: 10, p: 3.2, f: 3.3, fb: 0, na: 60, k2: 150, mg: 12, fe: 0.1, zn: 0.5, vitC: 2, vitD: 1.5, omega3: 0.05, gi: 35, cat: 'Beverages', emoji: '🥤', tags: ['recovery'] },
  { name: 'Green smoothie', k: 65, c: 12, p: 3, f: 1, fb: 4, na: 30, k2: 200, mg: 30, fe: 1, zn: 0.3, vitC: 40, vitD: 0, omega3: 0.1, gi: 30, cat: 'Beverages', emoji: '🥤', tags: ['fiber', 'vitamin-c'] },
  { name: 'Coconut water', k: 19, c: 4, p: 0.7, f: 0.2, fb: 1.1, na: 105, k2: 250, mg: 25, fe: 0.3, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Beverages', emoji: '🥥', tags: ['electrolyte'] },
  { name: 'Energy drink', k: 45, c: 11, p: 0, f: 0, fb: 0, na: 50, k2: 5, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 60, cat: 'Beverages', emoji: '⚡', tags: ['caffeine', 'high-sugar'] },

  // OTHER
  { name: 'Bakso (meatball soup)', k: 75, c: 10, p: 5, f: 2, fb: 0.3, na: 400, k2: 80, mg: 15, fe: 0.8, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Other', emoji: '🟤', tags: ['moderate-sodium'] },
  { name: 'Chicken soto (soup)', k: 48, c: 4, p: 4, f: 2, fb: 0.3, na: 500, k2: 120, mg: 12, fe: 0.5, zn: 0.5, vitC: 2, vitD: 0, omega3: 0.05, gi: 30, cat: 'Other', emoji: '🍲', tags: ['high-sodium'] },
  { name: 'Nasi Padang', k: 200, c: 25, p: 8, f: 8, fb: 1, na: 600, k2: 200, mg: 30, fe: 1.5, zn: 1.5, vitC: 5, vitD: 0, omega3: 0.1, gi: 55, cat: 'Other', emoji: '🍛', tags: ['high-sodium', 'spicy'] },
  { name: 'Rawon (beef soup)', k: 80, c: 3, p: 8, f: 3, fb: 0.5, na: 450, k2: 150, mg: 15, fe: 2, zn: 1.2, vitC: 0, vitD: 0, omega3: 0.1, gi: 20, cat: 'Other', emoji: '🍲', tags: ['high-sodium', 'iron-rich'] },
  { name: 'Goat satay', k: 220, c: 2, p: 20, f: 15, fb: 0.5, na: 500, k2: 180, mg: 25, fe: 2.5, zn: 4, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Other', emoji: '🍢', tags: ['high-sodium'] },
  { name: 'Gado-gado with peanut sauce', k: 180, c: 12, p: 8, f: 12, fb: 5, na: 400, k2: 300, mg: 50, fe: 2, zn: 1.2, vitC: 15, vitD: 0, omega3: 0.2, gi: 25, cat: 'Other', emoji: '🥗', tags: ['balanced', 'peanut-sauce'] },
  { name: 'Pecel (vegetable salad)', k: 140, c: 15, p: 6, f: 7, fb: 5, na: 350, k2: 250, mg: 40, fe: 1.5, zn: 1, vitC: 20, vitD: 0, omega3: 0.1, gi: 25, cat: 'Other', emoji: '🥗', tags: ['fiber', 'peanut-sauce'] },
  { name: 'Nasi uduk (coconut rice)', k: 180, c: 25, p: 3, f: 7, fb: 0.5, na: 200, k2: 50, mg: 15, fe: 0.5, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 70, cat: 'Other', emoji: '🍚', tags: ['coconut-milk'] },
  { name: 'Mung bean porridge', k: 110, c: 20, p: 5, f: 0.5, fb: 3, na: 15, k2: 200, mg: 40, fe: 1.5, zn: 0.8, vitC: 0, vitD: 0, omega3: 0.05, gi: 50, cat: 'Other', emoji: '🥣', tags: ['fiber'] },
  { name: 'Kolak (coconut compote)', k: 120, c: 22, p: 2, f: 2, fb: 2, na: 20, k2: 150, mg: 15, fe: 0.5, zn: 0.3, vitC: 5, vitD: 0, omega3: 0, gi: 60, cat: 'Other', emoji: '🥣', tags: ['coconut-milk', 'sugar'] },
  { name: 'Es campur (mixed ice dessert)', k: 100, c: 22, p: 1, f: 0.5, fb: 1, na: 30, k2: 80, mg: 10, fe: 0.2, zn: 0.1, vitC: 10, vitD: 0, omega3: 0, gi: 65, cat: 'Other', emoji: '🍧', tags: ['high-sugar'] },
  { name: 'Rendang egg', k: 170, c: 2, p: 12, f: 13, fb: 0.5, na: 400, k2: 150, mg: 20, fe: 1.5, zn: 1.2, vitC: 0, vitD: 1, omega3: 0.1, gi: 0, cat: 'Other', emoji: '🥚', tags: ['high-sodium'] },
  { name: 'Perkedel (potato fritter)', k: 170, c: 15, p: 4, f: 10, fb: 1.5, na: 300, k2: 400, mg: 25, fe: 0.8, zn: 0.6, vitC: 5, vitD: 0, omega3: 0.05, gi: 55, cat: 'Other', emoji: '🟤', tags: [] },
  { name: 'Sweet braised tofu', k: 150, c: 8, p: 10, f: 9, fb: 1, na: 350, k2: 150, mg: 30, fe: 1.2, zn: 1, vitC: 0, vitD: 0, omega3: 0.05, gi: 30, cat: 'Other', emoji: '🟫', tags: ['high-sodium'] },
  { name: 'Sweet braised tempeh', k: 180, c: 12, p: 14, f: 10, fb: 3, na: 400, k2: 200, mg: 50, fe: 2, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 25, cat: 'Other', emoji: '🟫', tags: ['high-sodium', 'fermented'] },
  { name: 'Sayur asem (tamarind vegetable soup)', k: 35, c: 5, p: 2, f: 0.5, fb: 2, na: 300, k2: 200, mg: 15, fe: 1, zn: 0.3, vitC: 15, vitD: 0, omega3: 0, gi: 20, cat: 'Other', emoji: '🍲', tags: ['high-sodium', 'vitamin-c'] },
  { name: 'Chicken soup', k: 40, c: 3, p: 4, f: 1, fb: 0.5, na: 400, k2: 100, mg: 10, fe: 0.5, zn: 0.5, vitC: 2, vitD: 0.5, omega3: 0.05, gi: 15, cat: 'Other', emoji: '🍲', tags: ['high-sodium', 'hydrating'] },
  { name: 'Protein bar', k: 350, c: 40, p: 20, f: 12, fb: 5, na: 200, k2: 200, mg: 50, fe: 3, zn: 2, vitC: 5, vitD: 0, omega3: 0.5, gi: 40, cat: 'Other', emoji: '🍫', tags: ['on-the-go', 'high-protein'] },
  { name: 'Dark chocolate 85%', k: 600, c: 30, p: 8, f: 50, fb: 10, na: 20, k2: 500, mg: 200, fe: 5, zn: 3, vitC: 0, vitD: 0, omega3: 0.2, gi: 20, cat: 'Other', emoji: '🍫', tags: ['flavonoid', 'magnesium-rich'] },
  { name: 'Honey', k: 304, c: 82, p: 0.3, f: 0, fb: 0.2, na: 4, k2: 52, mg: 2, fe: 0.4, zn: 0.2, vitC: 0.5, vitD: 0, omega3: 0, gi: 58, cat: 'Other', emoji: '🍯', tags: ['natural-sweetener', 'antibacterial'] },
  { name: 'Palm sugar', k: 380, c: 95, p: 0.5, f: 0, fb: 0, na: 20, k2: 50, mg: 15, fe: 2, zn: 0.3, vitC: 0, vitD: 0, omega3: 0, gi: 65, cat: 'Other', emoji: '🟤', tags: ['high-sugar'] },
  { name: 'Olive oil', k: 884, c: 0, p: 0, f: 100, fb: 0, na: 2, k2: 1, mg: 0, fe: 0.6, zn: 0, vitC: 0, vitD: 0, omega3: 0.8, gi: 0, cat: 'Other', emoji: '🫒', tags: ['mufa', 'mediterranean'] },
  { name: 'Grated coconut', k: 660, c: 23, p: 7, f: 64, fb: 16, na: 20, k2: 356, mg: 32, fe: 2, zn: 1.5, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Other', emoji: '🥥', tags: ['mct', 'high-fat'] },
]
const FCATS = [...new Set(FD.map(f => f.cat))]

/* ═══════════════════════════════════════════════════════
   COMPREHENSIVE EXERCISE DATABASE (60+ activities)
   ═══════════════════════════════════════════════════════ */
const EX: Exer[] = [
  // CARDIO - WALKING
  { name: 'Casual walk', emoji: '🚶', met: 2.5, int: 'Low', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Brisk walk', emoji: '🚶‍♂️', met: 3.5, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Nordic walking', emoji: '🚶‍♀️', met: 4.8, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Power walking', emoji: '⚡', met: 5.5, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  // CARDIO - RUNNING
  { name: 'Jogging', emoji: '🏃', met: 7.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Easy run', emoji: '🏃‍♂️', met: 8.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Running', emoji: '🏃‍♀️', met: 9.8, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Fast run', emoji: '💨', met: 12.5, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '100m sprint', emoji: '⚡', met: 18.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '200m sprint', emoji: '⚡', met: 16.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '400m sprint', emoji: '🔥', met: 14.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Fartlek', emoji: '🌀', met: 11.5, int: 'High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Tempo run', emoji: '🎯', met: 10.8, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Interval run', emoji: '🔄', met: 13.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Uphill run', emoji: '⛰️', met: 12.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Trail running', emoji: '🏔️', met: 10.5, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Treadmill walk', emoji: '🚶', met: 3.0, int: 'Low', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Treadmill run', emoji: '🏃', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  // CARDIO - CYCLING
  { name: 'Casual cycling', emoji: '🚴', met: 6.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Moderate cycling', emoji: '🚴‍♂️', met: 8.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Intense cycling', emoji: '🚴‍♀️', met: 12.0, int: 'High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Cycling time trial', emoji: '⏱️', met: 16.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Indoor cycling', emoji: '🚲', met: 8.5, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Spinning HIIT', emoji: '🔥', met: 14.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  // CARDIO - SWIMMING
  { name: 'Casual swimming', emoji: '🏊', met: 5.8, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Freestyle swimming', emoji: '🏊‍♂️', met: 8.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Butterfly swimming', emoji: '🦋', met: 11.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'HIIT swimming', emoji: '🔥', met: 12.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  // CARDIO - OTHER
  { name: 'Trekking/Hiking', emoji: '🥾', met: 6.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Aerobics', emoji: '💃', met: 6.5, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Zumba', emoji: '🕺', met: 6.5, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Jump rope', emoji: '⏭️', met: 12.3, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Boxing', emoji: '🥊', met: 7.8, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Kickboxing', emoji: '🦵', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Rowing', emoji: '🚣', met: 7.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Elliptical', emoji: '🔄', met: 5.0, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Stair climbing', emoji: '🏗️', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Jump rope HIIT', emoji: '🔥', met: 14.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Burpees', emoji: '💪', met: 12.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Mountain climbers', emoji: '⛰️', met: 10.0, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Jumping jacks', emoji: '⭐', met: 8.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  // FLEXIBILITY
  { name: 'Yoga', emoji: '🧘', met: 2.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Power yoga', emoji: '🧘‍♂️', met: 4.0, int: 'Moderate', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Pilates', emoji: '🤸', met: 3.0, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Stretching', emoji: '🤸‍♀️', met: 2.3, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Tai chi', emoji: '☯️', met: 3.0, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  // STRENGTH
  { name: 'Light weightlifting', emoji: '🏋️', met: 3.5, int: 'Low', gps: false, cat: 'Strength', hiit: false },
  { name: 'Weightlifting', emoji: '🏋️‍♂️', met: 5.0, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Heavy weightlifting', emoji: '🏋️‍♀️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Crossfit', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Circuit training', emoji: '🔄', met: 8.5, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Push-ups', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Pull-ups', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Plank', emoji: '🧱', met: 3.8, int: 'Low', gps: false, cat: 'Strength', hiit: false },
  { name: 'Deadlift', emoji: '🏋️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Squat', emoji: '🦵', met: 5.0, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Kettlebell swing', emoji: '🔔', met: 9.8, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Battle ropes', emoji: '🪢', met: 10.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  // SPORTS
  { name: 'Futsal', emoji: '⚽', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Soccer', emoji: '🏆', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Basketball', emoji: '🏀', met: 6.5, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Badminton', emoji: '🏸', met: 5.5, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Tennis', emoji: '🎾', met: 7.3, int: 'High', gps: true, cat: 'Sports', hiit: false },
  { name: 'Table tennis', emoji: '🏓', met: 4.0, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Volleyball', emoji: '🏐', met: 4.0, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Rugby', emoji: '🏈', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Archery', emoji: '🏹', met: 3.5, int: 'Low', gps: false, cat: 'Sports', hiit: false },
  { name: 'Golf', emoji: '⛳', met: 3.5, int: 'Low', gps: true, cat: 'Sports', hiit: false },
  { name: 'Rock climbing', emoji: '🧗', met: 8.0, int: 'High', gps: false, cat: 'Sports', hiit: false },
  { name: 'Skateboarding', emoji: '🛹', met: 5.0, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  // AQUATIC
  { name: 'Water polo', emoji: '🤽', met: 10.0, int: 'High', gps: false, cat: 'Aquatic', hiit: true },
  { name: 'Surfing', emoji: '🏄', met: 3.0, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Snorkeling', emoji: '🤿', met: 4.0, int: 'Low', gps: true, cat: 'Aquatic', hiit: false },
  // RECOVERY
  { name: 'Sweeping', emoji: '🧹', met: 3.3, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Washing', emoji: '🧼', met: 2.0, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Gardening', emoji: '🌱', met: 3.8, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Cycling to work', emoji: '🚲', met: 5.0, int: 'Moderate', gps: true, cat: 'Activity', hiit: false },
  // HIGH-INTENSITY / FUNCTIONAL (Hyrox, CrossFit, etc.)
  { name: 'Hyrox (race)', emoji: '🟥', met: 13.0, int: 'Very High', gps: true, cat: 'HIIT', hiit: true },
  { name: 'CrossFit WOD', emoji: '🏋️‍♀️', met: 12.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Functional bootcamp', emoji: '🥾', met: 10.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Sled push/pull', emoji: '🛷', met: 11.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Wall balls', emoji: '🧱', met: 9.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Rowing erg (sprint)', emoji: '🚣', met: 12.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'SkiErg', emoji: '⛷️', met: 11.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Assault bike', emoji: '🚴‍♂️', met: 12.5, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Farmer carry', emoji: '🧳', met: 8.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Box jumps', emoji: '📦', met: 10.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  // TEAM SPORTS (moderate-high)
  { name: 'American football', emoji: '🏈', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Basketball (competitive)', emoji: '🏀', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Soccer (competitive)', emoji: '⚽', met: 10.3, int: 'Very High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Ice hockey', emoji: '🏒', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Handball', emoji: '🤾', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
]
const EXCATS = [...new Set(EX.map(e => e.cat))]

/* ═══════════════════════════════════════════════════════
   CHRONIC DISEASE PROTOCOLS (Clinical Grade)
   ═══════════════════════════════════════════════════════ */
const CHRONIC_PROTOCOLS: ChronicProtocol[] = [
  {
    id: 'chf', name: 'CHF (Congestive Heart Failure)', emoji: '❤️‍🩹', color: '#ef4444',
    calAdj: -0.1, protAdj: 1.2, naMax: 1500, kMax: 0, fluidMax: 1500, fluidMin: 1200,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Oatmeal', 'Spinach', 'Broccoli', 'Avocado', 'Guava', 'Plain yogurt'],
    avoidFoods: ['Fried rice', 'Bakso (meatball soup)', 'Chicken soto (soup)', 'Chicken satay', 'Fried noodles', 'Cheddar cheese', 'Sweet iced tea', 'Nasi Padang', 'Palm sugar', 'Energy drink'],
    notes: ['Limit fluids to 1.2-1.5 L/day', 'Monitor daily body weight', 'Gain >1kg/day = sign of fluid retention', 'Avoid high-sodium foods (>600mg/serving)', 'Eat small frequent meals 5-6x/day', 'Consult a doctor about CoQ10 supplements'],
    labKeys: ['bnp', 'ntprobnp', 'creatinine', 'gfr', 'potassium', 'sodium', 'alt', 'ast', 'albumin', 'hemoglobin'],
    labLabels: { bnp: 'BNP', ntprobnp: 'NT-proBNP', creatinine: 'Creatinine', gfr: 'eGFR', potassium: 'Potassium', sodium: 'Sodium', alt: 'ALT', ast: 'AST', albumin: 'Albumin', hemoglobin: 'Hemoglobin' },
    labUnits: { bnp: 'pg/mL', ntprobnp: 'pg/mL', creatinine: 'mg/dL', gfr: 'mL/min', potassium: 'mEq/L', sodium: 'mEq/L', alt: 'U/L', ast: 'U/L', albumin: 'g/dL', hemoglobin: 'g/dL' },
    labRanges: { bnp: [0, 100], ntprobnp: [0, 300], creatinine: [0.6, 1.2], gfr: [60, 120], potassium: [3.5, 5.0], sodium: [135, 145], alt: [7, 56], ast: [10, 40], albumin: [3.5, 5.0], hemoglobin: [12, 17] },
    exerRestrictions: ["Avoid high-intensity exercise without a cardiologist's clearance", 'Max Z2 (60-70% HR max)', 'Monitor HR during exercise', 'Avoid heavy isometric exercise', 'Stop if short of breath or chest pain occurs'],
  },
  {
    id: 'copd', name: 'COPD', emoji: '🫁', color: '#8b5cf6',
    calAdj: 0.15, protAdj: 1.5, naMax: 2000, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Boiled chicken breast', 'Chicken egg', 'Salmon', 'Greek yogurt', 'Oatmeal', 'Avocado', 'Spinach', 'Banana', 'Guava'],
    avoidFoods: ['Gas-forming foods (cabbage, raw nuts)', 'High-sugar foods', 'Processed foods'],
    notes: ['Calorie needs increase 20-30%', 'High protein 1.5g/kg body weight to prevent cachexia', 'Eat small frequent meals 6x/day', 'Moderate carbohydrates (40-45% of total calories)', 'High fat (35-45%) for respiratory efficiency', 'Vitamin D supplement if deficient'],
    labKeys: ['spo2', 'hemoglobin', 'wbc', 'crp', 'albumin', 'creatinine', 'gfr'],
    labLabels: { spo2: 'SpO2', hemoglobin: 'Hemoglobin', wbc: 'WBC', crp: 'CRP', albumin: 'Albumin', creatinine: 'Creatinine', gfr: 'eGFR' },
    labUnits: { spo2: '%', hemoglobin: 'g/dL', wbc: '/uL', crp: 'mg/L', albumin: 'g/dL', creatinine: 'mg/dL', gfr: 'mL/min' },
    labRanges: { spo2: [92, 100], hemoglobin: [12, 17], wbc: [4500, 11000], crp: [0, 5], albumin: [3.5, 5.0], creatinine: [0.6, 1.2], gfr: [60, 120] },
    exerRestrictions: ['Pursed-lip breathing exercises are required', 'Light aerobic exercise Z1-Z2', 'Avoid exercising in cold/polluted air', 'Warm up for at least 10 minutes', 'Use a bronchodilator before exercise if prescribed'],
  },
  {
    id: 'diabetes', name: 'Diabetes Melitus', emoji: '🩸', color: '#2563eb',
    calAdj: -0.15, protAdj: 1.2, naMax: 2000, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Oatmeal', 'Quinoa', 'Red rice', 'Steamed tempeh', 'Steamed tofu', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Almonds', 'Salmon', 'Boiled chicken breast', 'Plain yogurt', 'Whey protein'],
    avoidFoods: ['White rice', 'White bread', 'Fried noodles', 'Sweet iced tea', 'Palm sugar', 'Nasi uduk (coconut rice)', 'Sweet mung bean porridge', 'Kolak (coconut compote)', 'Es campur (mixed ice dessert)', 'Energy drink', 'Ripe banana'],
    notes: ['Choose low-GI foods (<55)', 'Carbs: 40-50% of total calories', 'Fiber target 25-35g/day', 'Protein 1.2-1.5g/kg body weight', 'Eat regularly every 3-4 hours', 'Monitor blood sugar before & after meals', 'HbA1c target <7%'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'creatinine', 'gfr', 'albumin', 'alt'],
    labLabels: { glucose: 'Fasting Blood Glucose', hba1c: 'HbA1c', totalCholesterol: 'Total Cholesterol', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Triglycerides', creatinine: 'Creatinine', gfr: 'eGFR', albumin: 'Albumin', alt: 'ALT' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', creatinine: 'mg/dL', gfr: 'mL/min', albumin: 'g/dL', alt: 'U/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], creatinine: [0.6, 1.2], gfr: [60, 120], albumin: [3.5, 5.0], alt: [7, 56] },
    exerRestrictions: ['Resistance training is important for insulin sensitivity', 'At least 150 minutes/week of aerobic exercise', 'Avoid exercise if blood sugar >250 mg/dL', 'Carry fast-acting carbohydrates during exercise', 'Monitor blood sugar before & after exercise'],
  },
  {
    id: 'ckd', name: 'Chronic Kidney Disease', emoji: '🫘', color: '#f97316',
    calAdj: 0, protAdj: 0.6, naMax: 2000, kMax: 2000, fluidMax: 1500, fluidMin: 800,
    specialFoods: ['White rice', 'Egg white', 'Cod', 'Steamed tofu', 'Carrot', 'Red bell pepper', 'Lettuce', 'Tomato', 'Pineapple', 'Watermelon'],
    avoidFoods: ['Kidney beans', 'Soybeans', 'Tempeh', 'Cheese', 'Milk', 'Banana', 'Orange', 'Avocado', 'Chocolate', 'Almonds', 'Beef', 'Rendang'],
    notes: ['Protein limited to 0.6g/kg body weight (stage 3-4)', 'Limit potassium <2000mg/day', 'Limit phosphorus', 'Limit sodium <2000mg/day', 'Fluid restricted to urine output + 500mL', 'Use natural herbs/spices instead of salt', 'Coordinate with a renal dietitian'],
    labKeys: ['creatinine', 'gfr', 'bun', 'potassium', 'phosphorus', 'calcium', 'sodium', 'hemoglobin', 'albumin', 'alt'],
    labLabels: { creatinine: 'Creatinine', gfr: 'eGFR', bun: 'BUN', potassium: 'Potassium', phosphorus: 'Phosphorus', calcium: 'Calcium', sodium: 'Sodium', hemoglobin: 'Hemoglobin', albumin: 'Albumin', alt: 'ALT' },
    labUnits: { creatinine: 'mg/dL', gfr: 'mL/min', bun: 'mg/dL', potassium: 'mEq/L', phosphorus: 'mg/dL', calcium: 'mg/dL', sodium: 'mEq/L', hemoglobin: 'g/dL', albumin: 'g/dL', alt: 'U/L' },
    labRanges: { creatinine: [0.6, 1.2], gfr: [60, 120], bun: [7, 20], potassium: [3.5, 5.0], phosphorus: [2.5, 4.5], calcium: [8.5, 10.5], sodium: [135, 145], hemoglobin: [12, 17], albumin: [3.5, 5.0], alt: [7, 56] },
    exerRestrictions: ['Light-to-moderate exercise only', 'Avoid dehydration', 'Monitor blood pressure', 'Avoid exercise if edema is severe', 'Coordinate with a nephrologist'],
  },
  {
    id: 'cancer', name: 'Cancer (Nutrition Support)', emoji: '🎗️', color: '#ec4899',
    calAdj: 0.2, protAdj: 1.5, naMax: 2500, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Chicken egg', 'Greek yogurt', 'Oatmeal', 'Quinoa', 'Broccoli', 'Spinach', 'Guava', 'Blueberry', 'Dark chocolate 85%', 'Almonds', 'Olive oil', 'Whey protein'],
    avoidFoods: ['Processed/preserved foods', 'Processed meats (sausage, nuggets)', 'Alcohol', 'High-sugar foods', 'Fast food'],
    notes: ['Calorie needs increase 20-30%', 'High protein 1.5g/kg body weight', 'Anti-inflammatory omega-3', 'High antioxidants from fruit & vegetables', 'Eat small frequent meals if nauseous', 'Supplement per oncologist recommendation', 'Avoid high-dose antioxidant supplements during chemotherapy'],
    labKeys: ['hemoglobin', 'wbc', 'platelet', 'albumin', 'crp', 'ldl', 'hdl', 'creatinine', 'gfr', 'alt'],
    labLabels: { hemoglobin: 'Hemoglobin', wbc: 'WBC', platelet: 'Platelets', albumin: 'Albumin', crp: 'CRP', ldl: 'LDL', hdl: 'HDL', creatinine: 'Creatinine', gfr: 'eGFR', alt: 'ALT' },
    labUnits: { hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', albumin: 'g/dL', crp: 'mg/L', ldl: 'mg/dL', hdl: 'mg/dL', creatinine: 'mg/dL', gfr: 'mL/min', alt: 'U/L' },
    labRanges: { hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], albumin: [3.5, 5.0], crp: [0, 5], ldl: [0, 100], hdl: [40, 100], creatinine: [0.6, 1.2], gfr: [60, 120], alt: [7, 56] },
    exerRestrictions: ['Exercise according to ability', 'Avoid if platelets <50000', 'Yoga & stretching when weak', 'Light resistance training when strong', 'Coordinate with an oncologist'],
  },
  {
    id: 'mental', name: 'Mental Health Disorder', emoji: '🧠', color: '#8b5cf6',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Mackerel', 'Almonds', 'Purple sweet potato', 'Spinach', 'Broccoli', 'Dark chocolate 85%', 'Oatmeal', 'Plain yogurt', 'Guava', 'Blueberry', 'Chicken egg', 'Quinoa'],
    avoidFoods: ['Alcohol', 'Excessive coffee', 'Excess sugar', 'Ultra-processed foods', 'Energy drink'],
    notes: ['Omega-3 (EPA/DHA) 1-2g/day for mood', 'Vitamin D important for depression', 'Probiotics from yogurt for the gut-brain axis', 'Magnesium from nuts & green vegetables', 'Zinc important for anxiety', 'Vitamin B-complex from whole grains', '7-9 hours of sleep required', 'Aerobic exercise 150 minutes/week'],
    labKeys: ['vitD', 'vitB12', 'folate', 'tsh', 't4', 'cortisol', 'hemoglobin', 'ferritin', 'alt'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folate', tsh: 'TSH', t4: 'Free T4', cortisol: 'Cortisol', hemoglobin: 'Hemoglobin', ferritin: 'Ferritin', alt: 'ALT' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', tsh: 'mIU/L', t4: 'ng/dL', cortisol: 'ug/dL', hemoglobin: 'g/dL', ferritin: 'ng/mL', alt: 'U/L' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], tsh: [0.4, 4.0], t4: [0.8, 1.8], cortisol: [6, 23], hemoglobin: [12, 17], ferritin: [12, 150], alt: [7, 56] },
    exerRestrictions: ['Yoga & meditation are highly recommended', 'Aerobic exercise Z1-Z2 for mood', 'Exercise outdoors (green exercise)', 'Avoid overtraining', 'Consistency matters more than intensity'],
  },
  {
    id: 'obesity', name: 'Obesity', emoji: '⚖️', color: '#f59e0b',
    calAdj: -0.25, protAdj: 1.4, naMax: 2000, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Boiled chicken breast', 'Cod', 'Egg white', 'Steamed tofu', 'Steamed tempeh', 'Oatmeal', 'Quinoa', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Almonds', 'Greek yogurt', 'Whey protein'],
    avoidFoods: ['Fried rice', 'Fried noodles', 'White bread', 'Cheddar cheese', 'Energy drink', 'Palm sugar', 'Sweet iced tea', 'Kolak (coconut compote)', 'Es campur (mixed ice dessert)', 'Fast food', 'Durian'],
    notes: ['Deficit of 500-750 kcal/day for a loss of 0.5-1kg/week', 'High protein 1.4g/kg body weight to preserve muscle', 'Fiber 30-40g/day for satiety', 'Low-GI foods to control appetite', 'Plain water 2.5-3L/day', 'Avoid caloric beverages'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'alt', 'ast', 'uricAcid', 'crp'],
    labLabels: { glucose: 'Blood Glucose', hba1c: 'HbA1c', totalCholesterol: 'Total Cholesterol', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Triglycerides', alt: 'ALT', ast: 'AST', uricAcid: 'Uric Acid', crp: 'CRP' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', alt: 'U/L', ast: 'U/L', uricAcid: 'mg/dL', crp: 'mg/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], alt: [7, 56], ast: [10, 40], uricAcid: [2.5, 7.0], crp: [0, 5] },
    exerRestrictions: ['Start with low-intensity exercise', 'Aerobic exercise 200-300 minutes/week', 'Resistance training 2-3x/week', 'HIIT only after adequate base fitness', 'Avoid high-impact activities on joints'],
  },
    {
    id: 'metabolic_x', name: 'Syndrome X / Metabolic Syndrome', emoji: '⚠️', color: '#ef4444',
    calAdj: -0.2, protAdj: 1.3, naMax: 1500, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Oatmeal', 'Quinoa', 'Almonds', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Greek yogurt', 'Olive oil', 'Dark chocolate 85%'],
    avoidFoods: ['White rice', 'White bread', 'Fried noodles', 'Sweet iced tea', 'Palm sugar', 'Energy drink', 'Fast food', 'Processed foods', 'Nasi uduk (coconut rice)'],
    notes: ['Target: reduce waist circumference', 'Carbs <45% of total calories', 'Healthy fats 35-40% of total calories', 'Avoid excess fructose', 'Resistance training for insulin sensitivity', 'Target waist circumference <90cm (men) / <80cm (women)'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'uricAcid', 'alt', 'ast', 'crp'],
    labLabels: { glucose: 'Fasting Blood Glucose', hba1c: 'HbA1c', totalCholesterol: 'Total Cholesterol', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Triglycerides', uricAcid: 'Uric Acid', alt: 'ALT', ast: 'AST', crp: 'CRP' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', uricAcid: 'mg/dL', alt: 'U/L', ast: 'U/L', crp: 'mg/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], uricAcid: [2.5, 7.0], alt: [7, 56], ast: [10, 40], crp: [0, 5] },
    exerRestrictions: ['Resistance training required 2-3x/week', 'Aerobic exercise 200-300 minutes/week', 'HIIT is effective but start slowly', 'A cardio + strength combination is best', 'Target 5-10% body weight reduction'],
  },
  {
    id: 'alzheimer', name: 'Alzheimer / Dementia', emoji: '🧠', color: '#818cf8',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Mackerel', 'Almonds', 'Blueberry', 'Guava', 'Spinach', 'Broccoli', 'Carrot', 'Dark chocolate 85%', 'Olive oil', 'Oatmeal', 'Chicken egg', 'Green tea'],
    avoidFoods: ['Ultra-processed foods', 'Excess sugar', 'Trans fat', 'Alcohol'],
    notes: ['MIND diet: Mediterranean-DASH Intervention for Neurodegenerative Delay', 'Omega-3 2g+/day from fatty fish', 'Antioxidants from berries & colorful vegetables', 'Vitamin E from almonds & olive oil', 'Flavonoids from dark chocolate & green tea', 'Reduce sugar & processed foods', 'Physical activity 150 minutes/week', 'Cognitive & social stimulation'],
    labKeys: ['vitD', 'vitB12', 'folate', 'tsh', 'homocysteine', 'hemoglobin', 'ferritin'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folate', tsh: 'TSH', homocysteine: 'Homocysteine', hemoglobin: 'Hemoglobin', ferritin: 'Ferritin' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', tsh: 'mIU/L', homocysteine: 'umol/L', hemoglobin: 'g/dL', ferritin: 'ng/mL' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], tsh: [0.4, 4.0], homocysteine: [5, 15], hemoglobin: [12, 17], ferritin: [12, 150] },
    exerRestrictions: ['Light-to-moderate aerobic exercise', 'Yoga & tai chi are very beneficial', 'Balance exercises to prevent falls', 'Outdoor activities', 'Supervision during exercise'],
  },
  {
    id: 'liver', name: 'Liver Disorder', emoji: '🟤', color: '#f97316',
    calAdj: 0.1, protAdj: 1.2, naMax: 2000, kMax: 0, fluidMax: 2000, fluidMin: 1500,
    specialFoods: ['Oatmeal', 'Almonds', 'Boiled chicken breast', 'Cod', 'Steamed tofu', 'Spinach', 'Broccoli', 'Guava', 'Papaya', 'Whey protein'],
    avoidFoods: ['Alcohol', 'High sugar/fructose foods', 'Fried foods', 'Fatty meat', 'Fast food', 'Processed foods'],
    notes: ['Protein 1.2-1.5g/kg body weight (except with encephalopathy)', 'Sufficient calories to prevent malnutrition', 'Complex carbohydrates', 'Moderate fat', 'Vitamin B-complex & zinc are important', 'Black coffee 2-3 cups/day is protective', 'Avoid herbal supplements without consultation'],
    labKeys: ['alt', 'ast', 'albumin', 'bilirubin', 'platelet', 'gfr', 'creatinine', 'hemoglobin', 'inr'],
    labLabels: { alt: 'ALT', ast: 'AST', albumin: 'Albumin', bilirubin: 'Bilirubin', platelet: 'Platelets', gfr: 'eGFR', creatinine: 'Creatinine', hemoglobin: 'Hemoglobin', inr: 'INR' },
    labUnits: { alt: 'U/L', ast: 'U/L', albumin: 'g/dL', bilirubin: 'mg/dL', platelet: '/uL', gfr: 'mL/min', creatinine: 'mg/dL', hemoglobin: 'g/dL', inr: '' },
    labRanges: { alt: [7, 56], ast: [10, 40], albumin: [3.5, 5.0], bilirubin: [0.1, 1.2], platelet: [150000, 400000], gfr: [60, 120], creatinine: [0.6, 1.2], hemoglobin: [12, 17], inr: [0.8, 1.2] },
    exerRestrictions: ['Light-to-moderate exercise', 'Monitor liver enzymes', 'Avoid intense exercise if bilirubin is high', 'Coordinate with a hepatologist'],
  },
  {
    id: 'hd', name: 'Hemodialysis Patient', emoji: '💉', color: '#ef4444',
    calAdj: 0.1, protAdj: 1.2, naMax: 2000, kMax: 2500, fluidMax: 1000, fluidMin: 500,
    specialFoods: ['White rice', 'Egg white', 'Cod', 'Steamed tofu', 'Carrot', 'Lettuce', 'Pineapple', 'Watermelon'],
    avoidFoods: ['Kidney beans', 'Soybeans', 'Tempeh', 'Cheese', 'Milk', 'Banana', 'Orange', 'Avocado', 'Red meat'],
    notes: ['Protein 1.2g/kg body weight (needs increase due to losses during HD)', 'Calories 30-35 kcal/kg body weight', 'Potassium limited to <2500mg/day', 'Phosphorus limited to 800-1000mg/day', 'Fluid very restricted: urine output + 500mL', 'Weigh yourself before & after HD', 'Eat high protein after HD'],
    labKeys: ['creatinine', 'gfr', 'bun', 'potassium', 'phosphorus', 'calcium', 'hemoglobin', 'albumin', 'ferritin', 'uricAcid'],
    labLabels: { creatinine: 'Creatinine', gfr: 'eGFR', bun: 'BUN', potassium: 'Potassium', phosphorus: 'Phosphorus', calcium: 'Calcium', hemoglobin: 'Hemoglobin', albumin: 'Albumin', ferritin: 'Ferritin', uricAcid: 'Uric Acid' },
    labUnits: { creatinine: 'mg/dL', gfr: 'mL/min', bun: 'mg/dL', potassium: 'mEq/L', phosphorus: 'mg/dL', calcium: 'mg/dL', hemoglobin: 'g/dL', albumin: 'g/dL', ferritin: 'ng/mL', uricAcid: 'mg/dL' },
    labRanges: { creatinine: [0.6, 1.2], gfr: [60, 120], bun: [7, 20], potassium: [3.5, 5.0], phosphorus: [2.5, 4.5], calcium: [8.5, 10.5], hemoglobin: [10, 17], albumin: [3.5, 5.0], ferritin: [12, 150], uricAcid: [2.5, 7.0] },
    exerRestrictions: ['Very light exercise on HD days', 'Exercise on non-HD days can be moderate', 'Avoid pressure on the HD access site', 'Monitor blood pressure', 'Coordinate with a nephrologist'],
  },
  {
    id: 'substance', name: 'Alcohol/Tobacco/Drug User', emoji: '🚭', color: '#ef4444',
    calAdj: 0, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3500, fluidMin: 2000,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Chicken egg', 'Oatmeal', 'Spinach', 'Broccoli', 'Guava', 'Blueberry', 'Almonds', 'Greek yogurt', 'Dark chocolate 85%', 'Olive oil'],
    avoidFoods: ['Alcohol', 'High-sugar foods', 'Processed foods', 'Fast food', 'Energy drink'],
    notes: ['High protein 1.5g/kg body weight for tissue repair', 'High antioxidants for oxidative stress', 'Vitamin B-complex (especially B1, B6, B12)', 'Vitamin C 500-1000mg/day', 'Zinc & magnesium supplementation', 'Omega-3 2-3g/day', 'High hydration 2.5-3.5L/day', 'Eat regularly to stabilize blood sugar'],
    labKeys: ['alt', 'ast', 'ggt', 'albumin', 'hemoglobin', 'wbc', 'platelet', 'crp', 'vitB12', 'folate'],
    labLabels: { alt: 'ALT', ast: 'AST', ggt: 'GGT', albumin: 'Albumin', hemoglobin: 'Hemoglobin', wbc: 'WBC', platelet: 'Platelets', crp: 'CRP', vitB12: 'Vitamin B12', folate: 'Folate' },
    labUnits: { alt: 'U/L', ast: 'U/L', ggt: 'U/L', albumin: 'g/dL', hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', crp: 'mg/L', vitB12: 'pg/mL', folate: 'ng/mL' },
    labRanges: { alt: [7, 56], ast: [10, 40], ggt: [5, 40], albumin: [3.5, 5.0], hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], crp: [0, 5], vitB12: [200, 900], folate: [3, 20] },
    exerRestrictions: ['Start gradually with light exercise', 'Aerobic exercise to reduce cravings', 'Resistance training to rebuild muscle', 'Yoga & meditation for mental recovery', 'Coordinate with a rehabilitation doctor'],
  },
  {
    id: 'stroke', name: 'Stroke', emoji: '🧠', color: '#ef4444',
    calAdj: 0, protAdj: 1.2, naMax: 1500, kMax: 0, fluidMax: 2000, fluidMin: 1500,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Oatmeal', 'Quinoa', 'Almonds', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Olive oil', 'Plain yogurt'],
    avoidFoods: ['High-sodium foods', 'Processed foods', 'Excess sugar', 'Trans fat', 'Alcohol'],
    notes: ['Mediterranean diet is highly recommended', 'Sodium <1500mg for blood pressure control', 'High potassium from fruit & vegetables', 'Omega-3 2g+/day', 'Fiber 25-30g/day', 'Focus on rehabilitation & nutrition', 'Soft foods if dysphagia is present'],
    labKeys: ['systolic', 'ldl', 'hdl', 'totalCholesterol', 'triglycerides', 'glucose', 'hba1c', 'crp', 'homocysteine'],
    labLabels: { systolic: 'systolic', ldl: 'LDL', hdl: 'HDL', totalCholesterol: 'Total Cholesterol', triglycerides: 'Triglycerides', glucose: 'Blood Glucose', hba1c: 'HbA1c', crp: 'CRP', homocysteine: 'Homocysteine' },
    labUnits: { systolic: 'mmHg', ldl: 'mg/dL', hdl: 'mg/dL', totalCholesterol: 'mg/dL', triglycerides: 'mg/dL', glucose: 'mg/dL', hba1c: '%', crp: 'mg/L', homocysteine: 'umol/L' },
    labRanges: { systolic: [90, 130], ldl: [0, 100], hdl: [40, 100], totalCholesterol: [0, 200], triglycerides: [0, 150], glucose: [70, 100], hba1c: [0, 6.5], crp: [0, 5], homocysteine: [5, 15] },
    exerRestrictions: ['Structured physiotherapy is required', 'Exercise according to ability', 'Balance exercises are important', 'Avoid unsupervised exercise', 'Coordinate with the rehabilitation team'],
  },
  {
    id: 'epilepsy', name: 'Epilepsy', emoji: '⚡', color: '#f59e0b',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Boiled chicken breast', 'Salmon', 'Chicken egg', 'Spinach', 'Broccoli', 'Avocado', 'Almonds', 'Olive oil', 'Plain yogurt'],
    avoidFoods: ['Alcohol', 'Excessive caffeine', 'Energy drink', 'Excess sugar'],
    notes: ['A ketogenic diet may be considered (under supervision)', 'Eat regularly to stabilize blood sugar', 'Get 7-9 hours of sleep (lack of sleep is a trigger)', 'Stress management is important', 'Vitamin D & magnesium supplementation', 'Coordinate with a neurologist for a special diet'],
    labKeys: ['glucose', 'sodium', 'calcium', 'magnesium', 'vitD', 'alt', 'ast'],
    labLabels: { glucose: 'Blood Glucose', sodium: 'Sodium', calcium: 'Calcium', magnesium: 'Magnesium', vitD: 'Vitamin D', alt: 'ALT', ast: 'AST' },
    labUnits: { glucose: 'mg/dL', sodium: 'mEq/L', calcium: 'mg/dL', magnesium: 'mg/dL', vitD: 'ng/mL', alt: 'U/L', ast: 'U/L' },
    labRanges: { glucose: [70, 100], sodium: [135, 145], calcium: [8.5, 10.5], magnesium: [1.7, 2.2], vitD: [30, 100], alt: [7, 56], ast: [10, 40] },
    exerRestrictions: ['Avoid exercising alone', 'Avoid water sports without supervision', 'Yoga & light aerobics are safe', 'Avoid overtraining & dehydration', 'Coordinate with a neurologist'],
  },
  {
    id: 'ms', name: 'Multiple Sclerosis', emoji: '🧬', color: '#8b5cf6',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Oatmeal', 'Almonds', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Olive oil', 'Dark chocolate 85%', 'Plain yogurt', 'Green tea'],
    avoidFoods: ['Processed foods', 'Excess sugar', 'Trans fat', 'High-fat milk (controversial)', 'Alcohol'],
    notes: ['Anti-inflammatory diet (similar to Mediterranean)', 'Vitamin D is very important (target 50-80 ng/mL)', 'Omega-3 2-3g/day', 'Probiotics for the gut-brain axis', 'Avoid excess heat (heat sensitivity)', 'Biotin may interact with some MS medications', 'High hydration 2.5-3L/day'],
    labKeys: ['vitD', 'vitB12', 'folate', 'crp', 'ldl', 'hdl', 'alt', 'ast'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folate', crp: 'CRP', ldl: 'LDL', hdl: 'HDL', alt: 'ALT', ast: 'AST' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', crp: 'mg/L', ldl: 'mg/dL', hdl: 'mg/dL', alt: 'U/L', ast: 'U/L' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], crp: [0, 5], ldl: [0, 100], hdl: [40, 100], alt: [7, 56], ast: [10, 40] },
    exerRestrictions: ['Exercise is very beneficial for MS', 'Yoga & stretching for flexibility', 'Light aerobic exercise Z1-Z2', 'Avoid excess heat', 'Aquatic therapy is very good', 'Coordinate with a neurologist'],
  },
  {
    id: 'ht', name: 'Hypertension', emoji: '💓', color: '#ef4444',
    calAdj: -0.1, protAdj: 1.0, naMax: 1500, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Spinach', 'Broccoli', 'Banana', 'Avocado', 'Almonds', 'Salmon', 'Oatmeal', 'Guava', 'Plain yogurt', 'Olive oil', 'Carrot'],
    avoidFoods: ['Fried rice', 'Bakso (meatball soup)', 'Chicken soto (soup)', 'Chicken satay', 'Fried noodles', 'Cheese', 'Nasi Padang', 'Sweet iced tea', 'Processed foods', 'Fast food'],
    notes: ['DASH diet is highly recommended', 'Sodium <1500mg/day', 'High potassium 3500-5000mg/day', 'Calcium 1000-1300mg/day', 'Magnesium 300-500mg/day', 'Fiber 25-30g/day', 'Limit alcohol', 'Mediterranean diet is also effective'],
    labKeys: ['systolic', 'potassium', 'sodium', 'creatinine', 'gfr', 'totalCholesterol', 'ldl', 'hdl', 'glucose', 'uricAcid'],
    labLabels: { systolic: 'systolic', potassium: 'Potassium', sodium: 'Sodium', creatinine: 'Creatinine', gfr: 'eGFR', totalCholesterol: 'Total Cholesterol', ldl: 'LDL', hdl: 'HDL', glucose: 'Blood Glucose', uricAcid: 'Uric Acid' },
    labUnits: { systolic: 'mmHg', potassium: 'mEq/L', sodium: 'mEq/L', creatinine: 'mg/dL', gfr: 'mL/min', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', glucose: 'mg/dL', uricAcid: 'mg/dL' },
    labRanges: { systolic: [90, 130], potassium: [3.5, 5.0], sodium: [135, 145], creatinine: [0.6, 1.2], gfr: [60, 120], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], glucose: [70, 100], uricAcid: [2.5, 7.0] },
    exerRestrictions: ['At least 150 minutes/week of aerobic exercise', 'Moderate resistance training 2-3x/week', 'Avoid heavy isometric exercise', 'Avoid Valsalva maneuvers during exercise', 'Monitor blood pressure before exercise'],
  },
  {
    id: 'asthma', name: 'Asthma', emoji: '🫁', color: '#06b6d4',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Oatmeal', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Almonds', 'Plain yogurt', 'Chicken egg', 'Olive oil'],
    avoidFoods: ['Individual allergy-trigger foods', 'High-sulfite foods', 'Processed foods with preservatives'],
    notes: ['Anti-inflammatory diet', 'Omega-3 2-3g/day', 'Vitamin D supplementation if deficient', 'Magnesium 300-500mg/day (natural bronchodilator)', 'Antioxidants from colorful fruit & vegetables', 'Probiotics from yogurt', 'Avoid individual trigger foods'],
    labKeys: ['spo2', 'hemoglobin', 'wbc', 'eosinophils', 'ige', 'crp', 'vitD'],
    labLabels: { spo2: 'SpO2', hemoglobin: 'Hemoglobin', wbc: 'WBC', eosinophils: 'Eosinophils', ige: 'IgE Total', crp: 'CRP', vitD: 'Vitamin D' },
    labUnits: { spo2: '%', hemoglobin: 'g/dL', wbc: '/uL', eosinophils: '%', ige: 'IU/mL', crp: 'mg/L', vitD: 'ng/mL' },
    labRanges: { spo2: [95, 100], hemoglobin: [12, 17], wbc: [4500, 11000], eosinophils: [0, 5], ige: [0, 100], crp: [0, 5], vitD: [30, 100] },
    exerRestrictions: ['Warm up for at least 10-15 minutes', 'Use a bronchodilator before exercise', 'Avoid exercising in cold/dry air', 'Aerobic exercise Z1-Z2 is safe', 'Swimming is very good (humid air)', 'Stop if symptoms occur'],
  },
  {
    id: 'ra', name: 'Rheumatoid Arthritis', emoji: '🦴', color: '#f97316',
    calAdj: 0, protAdj: 1.2, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Mackerel', 'Almonds', 'Spinach', 'Broccoli', 'Guava', 'Avocado', 'Olive oil', 'Dark chocolate 85%', 'Green tea', 'Kunyit/turmeric'],
    avoidFoods: ['Excess sugar', 'Processed foods', 'Trans fat', 'High omega-6 foods', 'Alcohol', 'Nightshades (controversial)'],
    notes: ['Anti-inflammatory diet is the top priority', 'Omega-3 3-4g/day (anti-inflammatory dose)', 'Turmeric/curcumin 500-1000mg/day', 'Vitamin D target 40-60 ng/mL', 'Avoid excess omega-6', 'Fiber 25-30g/day', 'Protein 1.2g/kg body weight'],
    labKeys: ['crp', 'esr', 'rheumatoid_factor', 'hemoglobin', 'wbc', 'platelet', 'alt', 'ast', 'vitD'],
    labLabels: { crp: 'CRP', esr: 'ESR', rheumatoid_factor: 'Rheumatoid Factor', hemoglobin: 'Hemoglobin', wbc: 'WBC', platelet: 'Platelets', alt: 'ALT', ast: 'AST', vitD: 'Vitamin D' },
    labUnits: { crp: 'mg/L', esr: 'mm/hr', rheumatoid_factor: 'IU/mL', hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', alt: 'U/L', ast: 'U/L', vitD: 'ng/mL' },
    labRanges: { crp: [0, 5], esr: [0, 20], rheumatoid_factor: [0, 14], hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], alt: [7, 56], ast: [10, 40], vitD: [30, 100] },
    exerRestrictions: ['Exercise is very important for RA', 'Daily range-of-motion exercises', 'Light aerobic exercise during flares', 'Resistance training during remission', 'Hydrotherapy is very good', 'Avoid exercising inflamed joints'],
  },
  {
    id: 'crohn', name: "Crohn's Disease", emoji: '🫄', color: '#f97316',
    calAdj: 0.2, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Chicken egg', 'Oatmeal', 'White rice', 'Avocado', 'Almonds', 'Plain yogurt', 'Whey protein', 'Ripe banana'],
    avoidFoods: ['High-fiber foods during flares', 'Spicy foods', 'Milk (if intolerant)', 'Raw nuts', 'Fruit with skin'],
    notes: ['Calorie needs increase 20-30%', 'Protein 1.5g/kg body weight', 'Low-residue diet during flares', 'Normal diet during remission', 'Supplement iron, B12, vitamin D, zinc', 'Avoid individual trigger foods', 'Eat small frequent meals 6x/day', 'Enteral nutrition if oral intake is inadequate'],
    labKeys: ['crp', 'esr', 'hemoglobin', 'wbc', 'albumin', 'ferritin', 'vitB12', 'folate', 'vitD', 'calcium', 'zinc'],
    labLabels: { crp: 'CRP', esr: 'ESR', hemoglobin: 'Hemoglobin', wbc: 'WBC', albumin: 'Albumin', ferritin: 'Ferritin', vitB12: 'Vitamin B12', folate: 'Folate', vitD: 'Vitamin D', calcium: 'Calcium', zinc: 'Zinc' },
    labUnits: { crp: 'mg/L', esr: 'mm/hr', hemoglobin: 'g/dL', wbc: '/uL', albumin: 'g/dL', ferritin: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', vitD: 'ng/mL', calcium: 'mg/dL', zinc: 'ug/dL' },
    labRanges: { crp: [0, 5], esr: [0, 20], hemoglobin: [12, 17], wbc: [4500, 11000], albumin: [3.5, 5.0], ferritin: [12, 150], vitB12: [200, 900], folate: [3, 20], vitD: [30, 100], calcium: [8.5, 10.5], zinc: [66, 110] },
    exerRestrictions: ['Light exercise during flares', 'Normal exercise during remission', 'Light aerobic exercise Z1-Z2', 'Avoid high-impact exercise during flares', 'Coordinate with a gastroenterologist'],
  },
  {
    id: 'uc', name: 'Ulcerative Colitis', emoji: '🫄', color: '#f97316',
    calAdj: 0.2, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Boiled chicken breast', 'Chicken egg', 'Oatmeal', 'White rice', 'Avocado', 'Plain yogurt', 'Whey protein', 'Ripe banana', 'Papaya'],
    avoidFoods: ['High-fiber foods during flares', 'Spicy foods', 'Coffee', 'Alcohol', 'Milk (if intolerant)', 'High-sugar foods'],
    notes: ['Calorie needs increase 20-30%', 'Protein 1.5g/kg body weight', 'Low-residue diet during flares', 'Normal diet during remission', 'Supplement iron, B12, vitamin D, zinc', 'Avoid individual trigger foods', 'Eat small frequent meals', 'High hydration especially during diarrhea'],
    labKeys: ['crp', 'esr', 'hemoglobin', 'wbc', 'albumin', 'ferritin', 'vitB12', 'folate', 'vitD', 'calcium', 'zinc'],
    labLabels: { crp: 'CRP', esr: 'ESR', hemoglobin: 'Hemoglobin', wbc: 'WBC', albumin: 'Albumin', ferritin: 'Ferritin', vitB12: 'Vitamin B12', folate: 'Folate', vitD: 'Vitamin D' },
    labUnits: { crp: 'mg/L', esr: 'mm/hr', hemoglobin: 'g/dL', wbc: '/uL', albumin: 'g/dL', ferritin: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', vitD: 'ng/mL' },
    labRanges: { crp: [0, 5], esr: [0, 20], hemoglobin: [12, 17], wbc: [4500, 11000], albumin: [3.5, 5.0], ferritin: [12, 150], vitB12: [200, 900], folate: [3, 20], vitD: [30, 100] },
    exerRestrictions: ['Light exercise during flares', 'Normal exercise during remission', 'Avoid dehydration', 'Light aerobic exercise Z1-Z2', 'Coordinate with a gastroenterologist'],
  },
  {
    id: 'presbyacusis', name: 'Presbycusis', emoji: '👂', color: '#06b6d4',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Almonds', 'Spinach', 'Broccoli', 'Guava', 'Dark chocolate 85%', 'Chicken egg', 'Oatmeal', 'Olive oil'],
    avoidFoods: ['Ultra-processed foods', 'Excess sugar'],
    notes: ['High antioxidants to protect hearing hair cells', 'Omega-3 2g/day', 'Magnesium important for nerve function', 'Zinc for hearing function', 'Vitamin B-complex', 'Reduce noise exposure', 'Control blood pressure (hypertension worsens presbycusis)'],
    labKeys: ['systolic', 'vitD', 'vitB12', 'folate', 'magnesium', 'zinc'],
    labLabels: { systolic: 'systolic', vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folate', magnesium: 'Magnesium', zinc: 'Zinc' },
    labUnits: { systolic: 'mmHg', vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', magnesium: 'mg/dL', zinc: 'ug/dL' },
    labRanges: { systolic: [90, 130], vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], magnesium: [1.7, 2.2], zinc: [66, 110] },
    exerRestrictions: ['Aerobic exercise for circulation', 'Yoga & meditation for stress reduction', 'Avoid exercising in excessive noise', 'Use ear protection if needed'],
  },
]

/* ═══════════════════════════════════════════════════════
   CALCULATIONS
   ═══════════════════════════════════════════════════════ */
const ACT_L = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very active']
const ACT_M = [1.2, 1.375, 1.55, 1.725, 1.9]
const getBmi = (w: number, h: number) => w / ((h / 100) ** 2)
const getBmr = (w: number, h: number, a: number, g: string) => g === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
const getTdee = (b: number, l: number) => b * (ACT_M[l] ?? 1.2)
const getMetBurn = (met: number, kg: number, min: number) => Math.round(met * kg * (min / 60))
const bmiInfo = (v: number) => v < 18.5 ? { l: 'Underweight', c: C.blue } : v < 23 ? { l: 'Normal', c: C.ok } : v < 25 ? { l: 'Overweight', c: C.warn } : v < 30 ? { l: 'Obese I', c: C.org } : { l: 'Obese II', c: C.bad }
const goalAdj = (g: string) => g === 'lose' ? -0.2 : g === 'gain' ? 0.15 : 0
const fmtD = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sc = Math.floor(s % 60); return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '0') : m + ':' + String(sc).padStart(2, '0') }
const fmtDist = (m: number) => m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m'
const fmtPace = (s: number, m: number) => { if (m < 10) return '--:--/km'; const pk = s / 60 / (m / 1000); const pm = Math.floor(pk); const ps = Math.round((pk - pm) * 60); return pm + ':' + String(ps).padStart(2, '0') + '/km' }

function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; const dr = Math.PI / 180
  const dLa = (lat2 - lat1) * dr; const dLo = (lon2 - lon1) * dr
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * dr) * Math.cos(lat2 * dr) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function totalDist(pts: { lat: number; lng: number }[]) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng); return d }

/* ═══════════════════════════════════════════════════════
   VITAL IMPORT PARSER
   ═══════════════════════════════════════════════════════ */
const KM: Record<string, string> = {
  date: 'date', tanggal: 'date', heartrate: 'heartRate', hr: 'heartRate', nadi: 'heartRate',
  steps: 'steps', langkah: 'steps', systolic: 'systolic',
  spo2: 'spo2', oxygen: 'spo2', oksigen: 'spo2', hrv: 'hrv', rmssd: 'hrv',
  vo2max: 'vo2Max', vo2: 'vo2Max', glucose: 'glucose', gula: 'glucose',
  hba1c: 'hba1c', creatinine: 'creatinine', kreatinin: 'creatinine', gfr: 'gfr',
  potassium: 'potassium', kalium: 'potassium', sodium: 'sodium', natrium: 'sodium',
  crp: 'crp', wbc: 'wbc', leukosit: 'wbc', hemoglobin: 'hemoglobin', hgb: 'hemoglobin',
  platelet: 'platelet', trombosit: 'platelet', alt: 'alt', ast: 'ast', sgot: 'ast', sgpt: 'alt',
  albumin: 'albumin', bilirubin: 'bilirubin', tsh: 'tsh', t4: 't4', cortisol: 'cortisol',
  uricacid: 'uricAcid', asamurat: 'uricAcid', ldl: 'ldl', hdl: 'hdl', triglycerides: 'triglycerides',
  totalcholesterol: 'totalCholesterol', kolestrol: 'totalCholesterol', ferritin: 'ferritin',
  vitb12: 'vitB12', folate: 'folate', vitd: 'vitD', calcium: 'calcium', kalsium: 'calcium',
  phosphorus: 'phosphorus', fosfor: 'phosphorus', bun: 'bun', esr: 'esr', led: 'esr',
}
const nk = (k: string) => KM[k.toLowerCase().trim().replace(/[\s_-]/g, '')] ?? ''
function parseF(t: string, fn: string): IV[] {
  const isJ = fn.endsWith('.json')
  try {
    const d = isJ ? JSON.parse(t) : null
    const rows = isJ ? (Array.isArray(d) ? d : [d]) : t.trim().split('\n').slice(1).filter(l => l.trim())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => {
      const o: Record<string, unknown> = {}
      if (isJ) {
        Object.entries(r).forEach(([k, v]) => { const m = nk(k); if (m && v != null) o[m] = typeof v === 'number' ? v : parseFloat(v as string) || undefined })
      } else {
        const vs = (r as string).split(',').map((v: string) => v.trim())
        const hs = t.trim().split('\n')[0].split(',').map(nk)
        hs.forEach((h, i) => { if (h && h !== 'date' && vs[i] != null) { const n = parseFloat(vs[i]); if (!isNaN(n)) o[h] = n } })
        if (vs[hs.indexOf('date')]) o.date = vs[hs.indexOf('date')]
      }
      return o as unknown as IV
    }).filter((v: IV) => v.date)
  } catch { return [] }
}
function avgIV(v: IV[]) {
  if (!v.length) return { avgHR: undefined, avgSpo2: undefined, avgSteps: undefined, avgHrv: undefined, vo2Max: undefined, avgSys: undefined, n: 0 }
  const a = (k: keyof IV) => { const x = v.map(i => i[k]).filter((x): x is number => typeof x === 'number'); return x.length ? Math.round(x.reduce((a, b) => a + b, 0) / x.length * 10) / 10 : undefined }
  return { avgHR: a('heartRate'), avgSpo2: a('spo2'), avgSteps: a('steps'), avgHrv: a('hrv'), vo2Max: a('vo2Max'), avgSys: a('systolic'), n: v.length }
}

/* ═══════════════════════════════════════════════════════
   LAB PERSISTENCE
   ═══════════════════════════════════════════════════════ */
function loadLabs(): LabEntry[] {
  try { const d = JSON.parse(localStorage.getItem(LAB_K) || '[]'); return Array.isArray(d) ? d : [] } catch { return [] }
}
function saveLabs(labs: LabEntry[]) { localStorage.setItem(LAB_K, JSON.stringify(labs)) }

/* ═══════════════════════════════════════════════════════
   RECOMMENDATION ENGINE (Clinical Grade)
   ═══════════════════════════════════════════════════════ */
function genRecs(b: Body, intake: number, prot: number, fiber: number, na: number, omega3: number, metH: number, sleep: number, water: number, sun: boolean, hr?: number, sys?: number, spo2?: number, activeProtocol?: ChronicProtocol): Rec[] {
  const r: Rec[] = []
  const bmi = getBmi(b.w, b.h)
  const tdee = getTdee(getBmr(b.w, b.h, b.age, b.g), b.act)
  const add = (e: string, t: string, d: string, pr: number, c: string) => r.push({ e, t, d, pr, c })

  // Protocol-specific recommendations
  if (activeProtocol) {
    if (na > activeProtocol.naMax) add('\u26A0\uFE0F', 'Sodium exceeds limit', `${Math.round(na)}mg / ${activeProtocol.naMax}mg. Reduce salty & processed foods.`, 0, C.bad)
    if (activeProtocol.kMax > 0) {
      const potas = FD.reduce((a, f) => a + f.k2, 0) * 0.01
      if (potas > activeProtocol.kMax) add('\u26A0\uFE0F', 'High potassium', `Watch your potassium intake. Limit: ${activeProtocol.kMax}mg/day.`, 0, C.warn)
    }
    if (water < activeProtocol.fluidMin) add('\u26A0\uFE0F', 'Insufficient fluids', `${water}mL / min ${activeProtocol.fluidMin}mL. Increase fluid intake.`, 0, C.bad)
    if (water > activeProtocol.fluidMax) add('\u26A0\uFE0F', 'Excess fluids', `${water}mL / max ${activeProtocol.fluidMax}mL. Reduce fluid intake.`, 0, C.bad)
    activeProtocol.notes.slice(0, 3).forEach((n, i) => add('\u{1F4CB}', activeProtocol.name + ' #' + (i + 1), n, 1, activeProtocol.color))
  }

  // BMI
  if (bmi < 18.5) add('\u26A0\uFE0F', 'Underweight', `BMI ${bmi.toFixed(1)}. Add +${Math.round(tdee * 0.15)} kcal/day.`, 0, C.blue)
  else if (bmi >= 25 && bmi < 30) add('\u26A0\uFE0F', 'Overweight', `BMI ${bmi.toFixed(1)}. Deficit ${Math.round(tdee * 0.2)} kcal/day.`, 0, C.org)
  else if (bmi >= 30) add('\u{1F6A8}', 'Obesity', `BMI ${bmi.toFixed(1)}. Consult a doctor.`, 0, C.bad)
  else if (!activeProtocol) add('\u2705', 'Ideal BMI', `BMI ${bmi.toFixed(1)} - maintain it.`, 3, C.ok)

  // Calories
  const diff = intake - tdee; const pct = tdee > 0 ? diff / tdee : 0
  if (pct > 0.2) add('\u{1F37D}\uFE0F', 'High surplus', `+${Math.round(diff)} kcal above TDEE.`, 1, C.warn)
  else if (pct < -0.3) add('\u{1F4C9}', 'Extreme deficit', `-${Math.round(Math.abs(diff))} kcal. Risk of slowed metabolism.`, 1, C.warn)

  // Protein
  const pk = b.w > 0 ? prot / b.w : 0
  const protTarget = activeProtocol ? activeProtocol.protAdj : (b.goal === 'gain' ? 1.6 : 1.2)
  if (pk < protTarget * 0.8) add('\u{1F969}', 'Low protein', `${prot}g (${pk.toFixed(1)}g/kg). Target ${protTarget}g/kg.`, 1, C.pur)
  else if (pk >= protTarget) add('\u2705', 'Adequate protein', `${prot}g (${pk.toFixed(1)}g/kg). Sufficient.`, 3, C.ok)

  // Fiber
  if (fiber < 20) add('\u{1F96C}', 'Low fiber', `${Math.round(fiber)}g - target 25g+.`, 2, C.warn)

  // Sodium
  if (na > 2300 && (!activeProtocol || activeProtocol.naMax >= 2300)) add('\u{1F4A7}', 'High sodium', `${Math.round(na)}mg - target <2300mg.`, 2, C.warn)

  // Omega-3
  if (omega3 < 1.0) add('\u{1F41F}', 'Low omega-3', `${omega3.toFixed(1)}g - target 1-3g/day for anti-inflammatory effect.`, 2, C.blue)

  // Exercise
  if (metH < 3.75) add('\u{1F3C3}', 'Insufficient exercise', `${metH.toFixed(1)} MET-hours/week. Target 7.5.`, 0, C.org)
  else if (metH >= 7.5) add('\u2705', 'Adequate exercise', `${metH.toFixed(1)} MET-hours/week.`, 3, C.ok)

  // Sleep
  if (sleep < 6) add('\u{1F319}', 'Insufficient sleep', `${sleep} hours - target 7-8 hours.`, 0, C.ind)
  else if (sleep >= 7 && sleep <= 9) add('\u2705', 'Optimal sleep', `${sleep} hours.`, 3, C.ok)

  // Water
  if (water < 1500 && (!activeProtocol || activeProtocol.fluidMin < 1500)) add('\u{1F4A7}', 'Low hydration', `${water}mL - target 2000mL+.`, 2, C.blue)

  // Sun
  if (!sun) add('\u2600\uFE0F', 'No sun exposure', '10-20 minutes in the morning for vitamin D.', 3, '#eab308')

  // Vitals
  if (hr != null && hr > 80) add('💓', 'High resting HR', `${hr} bpm - optimal <75.`, 1, C.bad)
  if (sys != null && sys > 130) add('\u{1FEA7}', 'High blood pressure', `${sys} mmHg.`, 0, C.bad)
  if (spo2 != null && spo2 < 96) add('\u{1F9E1}', 'Low SpO2', `${spo2}% - normal >=97%.`, 0, C.bad)

  return r.sort((a, b) => a.pr - b.pr)
}

/* ═══════════════════════════════════════════════════════
   LONGEVITY COMPUTATION
   ═══════════════════════════════════════════════════════ */
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }
function calcLong(i: {
  sleepHr: number; hydrationL: number; sunDone: boolean; sunHr: number
  bmiVal?: number; tdeeVal?: number; intakeKcal?: number; proteinG?: number
  weightKg?: number; fiberG?: number; metHoursWeek?: number
  avgHR?: number; avgSpo2?: number; avgSteps?: number
  avgHrv?: number; vo2Max?: number; avgSys?: number
}) {
  const sleep = clamp(i.sleepHr >= 7 && i.sleepHr <= 9 ? 100 : 100 - Math.abs(i.sleepHr - 8) * 16)
  const hydr = clamp(i.hydrationL >= 2 && i.hydrationL <= 3.5 ? 100 : 100 - Math.abs(i.hydrationL - 2.5) * 28)
  const sun = clamp(!i.sunDone ? 40 : i.sunHr >= 0.17 && i.sunHr <= 0.6 ? 100 : 100 - Math.abs(i.sunHr - 0.33) * 80)
  const exer = i.metHoursWeek != null ? clamp((i.metHoursWeek / 7.5) * 100) : 50
  let bodyS = 50
  if (i.bmiVal != null) { const v = i.bmiVal; bodyS = v >= 18.5 && v < 23 ? 100 : v >= 23 && v < 25 ? 80 : v >= 25 && v < 30 ? 55 : v >= 30 ? 30 : clamp(100 - (18.5 - v) * 15) }
  let nutS = 50
  if (i.proteinG != null && i.weightKg != null && i.fiberG != null) {
    const pk = i.proteinG / i.weightKg
    const ps = pk >= 1.2 && pk <= 2 ? 100 : pk >= 0.8 ? 70 : clamp(pk * 80)
    const fs = i.fiberG >= 25 ? 100 : i.fiberG >= 15 ? 70 : clamp(i.fiberG * 3.5)
    nutS = clamp(ps * 0.6 + fs * 0.4)
  }
  let calS = 50
  if (i.tdeeVal != null && i.tdeeVal > 0 && i.intakeKcal != null) {
    const r = i.intakeKcal / i.tdeeVal
    calS = r >= 0.8 && r <= 1.05 ? 100 : r >= 0.7 ? 75 : r > 1.05 && r <= 1.15 ? 80 : clamp(100 - Math.abs(r - 1) * 150)
  }
  let vitS = 50; const vp: number[] = []
  if (i.avgHR != null) vp.push(clamp(i.avgHR >= 55 && i.avgHR <= 75 ? 100 : 100 - Math.abs(i.avgHR - 65) * 2.5))
  if (i.avgSpo2 != null) vp.push(clamp(i.avgSpo2 >= 97 ? 100 : 100 - (97 - i.avgSpo2) * 25))
  if (i.avgSteps != null) vp.push(clamp(i.avgSteps >= 8000 ? 100 : (i.avgSteps / 8000) * 100))
  if (i.avgHrv != null) vp.push(clamp(i.avgHrv >= 40 ? 100 : (i.avgHrv / 40) * 100))
  if (i.vo2Max != null) vp.push(clamp(i.vo2Max >= 40 ? 100 : (i.vo2Max / 40) * 100))
  if (i.avgSys != null) vp.push(clamp(i.avgSys >= 110 && i.avgSys <= 130 ? 100 : 100 - Math.abs(i.avgSys - 120) * 2))
  if (vp.length) vitS = clamp(vp.reduce((a, b) => a + b, 0) / vp.length)
  const hasB = i.bmiVal != null; const hasV = vp.length > 0
  if (hasB) {
    const wv = hasV ? 0.05 : 0; const base = 1 - wv
    return { score: clamp(bodyS * 0.20 * base + nutS * 0.15 * base + exer * 0.20 * base + sleep * 0.15 * base + calS * 0.10 * base + hydr * 0.10 * base + sun * 0.10 * base + vitS * wv), body: bodyS, nut: nutS, exer, sleep, cal: calS, hydr, sun, vit: vitS, hasB, hasV }
  }
  const wv = hasV ? 0.15 : 0; const base = 1 - wv
  return { score: clamp(exer * 0.25 * base + sleep * 0.25 * base + hydr * 0.15 * base + sun * 0.15 * base + nutS * 0.10 * base + calS * 0.10 * base + vitS * wv), body: bodyS, nut: nutS, exer, sleep, cal: calS, hydr, sun, vit: vitS, hasB, hasV }
}

/* ═══════════════════════════════════════════════════════
   WELLNESS HELPER
   ═══════════════════════════════════════════════════════ */
function getW(s: ReturnType<typeof useStore>['state'], d: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = (s.wellness?.[d] ?? {}) as any
  return { sleepHr: (w.sleepHr as number) ?? 0, waterMl: (w.waterMl as number) ?? 0, exerciseKcal: (w.exerciseKcal as number) ?? 0, exerciseMin: (w.exerciseMin as number) ?? 0, metHours: (w.metHours as number) ?? 0, sunDone: (w.sunDone as boolean) ?? false, sunHr: (w.sunHr as number) ?? 0 }
}

/* ═══════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
   ═══════════════════════════════════════════════════════ */
function Empty({ e, t }: { e: string; t: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center">
      <span className="text-3xl">{e}</span>
      <p className="mt-2 text-sm text-neutral-400">{t}</p>
    </div>
  )
}

function Ring({ value, max, color, size = 64, sw = 5, children }: { value: number; max: number; color: string; size?: number; sw?: number; children: React.ReactNode }) {
  const [on, setOn] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  const r = (size - sw) / 2; const c = 2 * Math.PI * r
  const off = c * (1 - (on ? Math.min(1, value / (max || 1)) : 0))
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.12" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }} />
      </svg>
      <div className="absolute flex flex-col items-center">{children}</div>
    </div>
  )
}

function Stepper({ label, value, min, max, step = 1, unit, onChange }: { label?: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-neutral-600 shrink-0">{label}</span>}
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-sm font-bold text-neutral-500 transition hover:bg-neutral-200 active:scale-90">-</button>
      <div className="flex-1 text-center text-sm font-bold tabular-nums">{value}{unit ? ' ' + unit : ''}</div>
      <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand-dark transition hover:bg-brand/20 active:scale-90">+</button>
    </div>
  )
}

function ANum({ v, d = 0 }: { v: number; d?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let cur = Number(el.textContent) || 0
    if (Math.abs(cur - v) < 0.01) return
    const s = cur; const t0 = performance.now(); let raf = 0
    const tick = (now: number) => { const p = Math.min(1, (now - t0) / 500); cur = s + (v - s) * (1 - (1 - p) ** 3); el.textContent = cur.toFixed(d); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [v, d])
  return <span ref={ref}>{v.toFixed(d)}</span>
}

function Pillar({ label, v, hl }: { label: string; v: number; hl?: boolean }) {
  const [on, setOn] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] font-medium">
        <span className={hl ? 'text-white font-bold' : 'text-white/70'}>{label}</span>
        <span className="font-bold">{v}</span>
      </div>
      <div className={'h-1.5 overflow-hidden rounded-full ' + (hl ? 'bg-white/30' : 'bg-white/20')}>
        <div className={'h-full rounded-full transition-all duration-700 ' + (hl ? 'bg-yellow-300' : 'bg-white')} style={{ width: (on ? v : 0) + '%' }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   1. BODY PROFILE CARD
   ═══════════════════════════════════════════════════════ */
function BodyCard({ intakeKcal }: { intakeKcal: number }) {
  const [b, setB] = useState(loadBody); useBR(); const [edit, setEdit] = useState(false)
  const bi = getBmi(b.w, b.h); const bm = getBmr(b.w, b.h, b.age, b.g); const td = getTdee(bm, b.act)
  const rec = Math.round(td * (1 + goalAdj(b.goal))); const info = bmiInfo(bi)
  function save() { saveB(b); emitB(); setEdit(false) }

  if (!edit) return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<span className="text-lg">{'\u2696\uFE0F'}</span>} title="Body Profile" />
        <button onClick={() => setEdit(true)} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-95">{'\u270F\uFE0F'} Edit</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-2xl font-extrabold" style={{ color: info.c }}><ANum v={bi} d={1} /></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">{'BMI \u00B7 ' + info.l}</div>
          <div className="mt-1.5 h-1 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, bi / 40 * 100) + '%', background: info.c }} /></div>
        </div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-2xl font-extrabold text-indigo-500"><ANum v={Math.round(bm)} /></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">BMR kcal</div>
          <div className="mt-1 text-[10px] text-neutral-400">{b.g === 'M' ? 'Male' : 'Female'}, {b.age} yrs</div>
        </div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-2xl font-extrabold" style={{ color: '#0B7A4B' }}><ANum v={Math.round(td)} /></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">TDEE kcal</div>
          <div className="mt-1 text-[10px] text-neutral-400">{ACT_L[b.act]}</div>
        </div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-lg font-extrabold" style={{ color: intakeKcal > rec * 1.1 ? C.org : intakeKcal < rec * 0.8 ? C.blue : C.ok }}>
            <ANum v={intakeKcal} />/<ANum v={rec} />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Kcal today</div>
          <div className="mt-1 text-[10px]" style={{ color: intakeKcal > rec ? C.org : C.ok }}>
            {intakeKcal > rec ? '+' + (intakeKcal - rec) + ' surplus' : (rec - intakeKcal) + ' remaining'}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
        {b.w}kg {'\u00B7'} {b.h}cm {'\u00B7'} Target: {b.goal === 'lose' ? 'Lose' : b.goal === 'gain' ? 'Gain' : 'Maintain'}
      </div>
    </Card>
  )

  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">{'\u270F\uFE0F'}</span>} title="Edit Body Profile" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Weight (kg)"><input className={inputClass} type="number" value={b.w} onChange={e => setB({ ...b, w: +e.target.value })} /></Field>
        <Field label="Height (cm)"><input className={inputClass} type="number" value={b.h} onChange={e => setB({ ...b, h: +e.target.value })} /></Field>
        <Field label="Age"><input className={inputClass} type="number" value={b.age} onChange={e => setB({ ...b, age: +e.target.value })} /></Field>
        <Field label="Sex"><select className={inputClass} value={b.g} onChange={e => setB({ ...b, g: e.target.value as 'M' | 'F' })}><option value="M">Male</option><option value="F">Female</option></select></Field>
        <Field label="Daily Activity"><select className={inputClass} value={b.act} onChange={e => setB({ ...b, act: +e.target.value })}>{ACT_L.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></Field>
        <Field label="Goal"><select className={inputClass} value={b.goal} onChange={e => setB({ ...b, goal: e.target.value as Body['goal'] })}><option value="lose">Lose weight</option><option value="maintain">Maintain</option><option value="gain">Gain weight</option></select></Field>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEdit(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
        <Button onClick={save} className="h-9 text-xs rounded-xl">Save</Button>
      </div>
    </Card>
  )
}

/* ── AI Food Photo Detector ─────────────────────────────
   Food photo → AI vision (server) estimates name, portion &
   macros, then adds it straight into the daily journal.   */
interface DetectedFood { name: string; grams: number; kcal: number; carbs: number; protein: number; fat: number }
function FoodPhotoAI({ onDetect }: { onDetect: (items: DetectedFood[]) => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!backendEnabled) { setMsg('AI photo feature requires an active server (VITE_API_URL).'); return }
    setBusy(true); setMsg('')
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file)
      })
      const prompt = 'Identify the food in this photo. Reply with ONLY a JSON array: [{"name":"...","grams":n,"kcal":n,"carbs":n,"protein":n,"fat":n}] with realistic portion estimates. No other text.'
      const out = (await api.aiVision(dataUrl, prompt)).text
      const jsonStr = out.slice(out.indexOf('['), out.lastIndexOf(']') + 1)
      const items = JSON.parse(jsonStr) as DetectedFood[]
      if (!Array.isArray(items) || items.length === 0) throw new Error('empty')
      onDetect(items.map((i) => ({ name: String(i.name), grams: Math.round(+i.grams || 100), kcal: Math.round(+i.kcal || 0), carbs: Math.round(+i.carbs || 0), protein: Math.round(+i.protein || 0), fat: Math.round(+i.fat || 0) })))
      setMsg(`✓ ${items.length} food item(s) detected & added to journal: ${items.map((i) => i.name).join(', ')}`)
    } catch {
      setMsg('AI is not confident about this photo — try a clearer photo or enter manually.')
    } finally { setBusy(false) }
  }
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-brand/40 bg-brand-50/50 p-3">
      <label className={'flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98] ' + (busy ? 'opacity-60' : '')}
        style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
        {busy ? '⏳ AI analyzing photo…' : '📸 Food Photo → AI auto-fills journal'}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} disabled={busy} />
      </label>
      {msg && <p className="mt-2 text-center text-[11px] text-neutral-500">{msg}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   2. FOOD TRACKER
   ═══════════════════════════════════════════════════════ */
function FoodTracker({ body, activeProtocol }: { body: Body; activeProtocol?: ChronicProtocol }) {
  const { state, addFood } = useStore()
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [name, setName] = useState(FD[0].name); const [g, setG] = useState(100)
  const todays = state.foods.filter(f => f.date === today())
  const total = todays.reduce((a, f) => ({ k: a.k + f.kcal, c: a.c + f.carbs, p: a.p + f.protein, f: a.f + f.fat }), { k: 0, c: 0, p: 0, f: 0 })
  const fiber = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const na = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.na * f.grams / 100 : 0) }, 0)
  const omega3 = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.omega3 * f.grams / 100 : 0) }, 0)
  const rec = Math.round(getTdee(getBmr(body.w, body.h, body.age, body.g), body.act) * (1 + goalAdj(body.goal)))
  const filtered = FD.filter(f => (cat === 'All' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase())))
  const fd = FD.find(x => x.name === name) ?? FD[0]; const m = g / 100
  const pv = { k: Math.round(fd.k * m), c: Math.round(fd.c * m), p: Math.round(fd.p * m), f: Math.round(fd.f * m), fb: Math.round(fd.fb * m), na: Math.round(fd.na * m), omega3: +(fd.omega3 * m).toFixed(2) }

  // Highlight foods based on active protocol
  const isRecommended = activeProtocol && activeProtocol.specialFoods.some(sf => fd.name.includes(sf))
  const isAvoided = activeProtocol && activeProtocol.avoidFoods.some(af => fd.name.includes(af))

  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">{'\u{1F37D}\uFE0F'}</span>} title="Nutrition" subtitle={total.k + '/' + rec + ' kcal today'} />
      <div className="mt-3 flex items-center justify-around">
        {([
          ['Carbs', total.c, Math.round(rec * 0.5 / 4), '#f59e0b'],
          ['Protein', total.p, Math.round(body.w * 1.4), C.ok],
          ['Fat', total.f, Math.round(rec * 0.3 / 9), '#ef4444'],
          ['Fiber', Math.round(fiber), 25, C.pur],
        ] as const).map(([l, v, mx, c]) => (
          <div key={l} className="flex flex-col items-center gap-1">
            <Ring value={v} max={mx} color={c}>
              <span className="text-xs font-extrabold tabular-nums" style={{ color: c }}>{v}</span>
              <span className="text-[8px] text-neutral-400">g</span>
            </Ring>
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{l}</span>
          </div>
        ))}
      </div>

      {/* Sodium & Omega-3 bars */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <div className="flex justify-between text-[10px] font-semibold"><span className="text-neutral-500">Sodium</span><span style={{ color: na > 2300 ? C.bad : na > 1500 ? C.warn : C.ok }}>{Math.round(na)}mg</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (na / 2300) * 100) + '%', background: na > 2300 ? C.bad : na > 1500 ? C.warn : C.ok }} /></div>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <div className="flex justify-between text-[10px] font-semibold"><span className="text-neutral-500">Omega-3</span><span style={{ color: omega3 >= 2 ? C.ok : omega3 >= 1 ? C.warn : C.blue }}>{omega3.toFixed(1)}g</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (omega3 / 3) * 100) + '%', background: omega3 >= 2 ? C.ok : omega3 >= 1 ? C.warn : C.blue }} /></div>
        </div>
      </div>

      <FoodPhotoAI onDetect={(items) => items.forEach((it) => addFood({ id: uid(), date: today(), name: it.name, grams: it.grams, kcal: it.kcal, carbs: it.carbs, protein: it.protein, fat: it.fat }))} />

      <div className="mt-4 flex gap-2">
        <div className="flex-1"><input className={inputClass} placeholder="Search food..." value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className={inputClass + ' w-28'} value={cat} onChange={e => setCat(e.target.value)}><option>All</option>{FCATS.map(c => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/50 p-2" style={{ scrollbarWidth: 'thin' }}>
        {filtered.map(f => {
          const rec = activeProtocol && activeProtocol.specialFoods.some(sf => f.name.includes(sf))
          const avo = activeProtocol && activeProtocol.avoidFoods.some(af => f.name.includes(af))
          return (
            <button key={f.name} onClick={() => setName(f.name)} className={'rounded-lg border px-2 py-1 text-[11px] font-medium transition active:scale-95 ' + (name === f.name ? 'border-brand bg-brand/10 text-brand-dark' : avo ? 'border-red-200 text-red-400 bg-red-50/50' : rec ? 'border-green-200 text-green-600 bg-green-50/50' : 'border-transparent text-neutral-600 hover:bg-white')}>
              {f.emoji} {f.name} <span className="text-neutral-400">{f.k}</span>
              {rec && <span className="ml-0.5 text-green-500">{'\u2705'}</span>}
              {avo && <span className="ml-0.5 text-red-400">{'\u274C'}</span>}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1 rounded-xl bg-neutral-50 px-4 py-3">
          <div className="flex items-baseline gap-2"><span className="text-sm font-bold text-neutral-800">{fd.emoji} {name}</span><Badge tone="neutral">{fd.cat}</Badge>{fd.gi > 0 && <Badge tone={fd.gi > 70 ? 'high' : fd.gi > 55 ? 'neutral' : 'normal'}>GI {fd.gi}</Badge>}{isRecommended && <Badge tone="brand">Recommended</Badge>}{isAvoided && <Badge tone="high">Avoid</Badge>}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs tabular-nums font-semibold">
            <span style={{ color: '#0B7A4B' }}>{pv.k} kcal</span>
            <span className="text-amber-500">K{pv.c}</span>
            <span className="text-green-600">P{pv.p}</span>
            <span className="text-red-400">L{pv.f}</span>
            <span className="text-purple-500">S{pv.fb}</span>
            <span className="text-blue-400">Na{pv.na}</span>
            {pv.omega3 > 0 && <span className="text-cyan-500">{'\u{1F41F}'}{pv.omega3}g</span>}
          </div>
          {fd.tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{fd.tags.slice(0, 4).map(t => <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-500">{t}</span>)}</div>}
        </div>
        <div className="w-20"><Field label="Gram"><input className={inputClass} type="number" value={g} onChange={e => setG(+e.target.value)} /></Field></div>
        <Button onClick={() => addFood({ id: uid(), date: today(), name, grams: g, kcal: pv.k, carbs: pv.c, protein: pv.p, fat: pv.f })} className="h-[42px] shrink-0 rounded-xl"><IconPlus size={15} /></Button>
      </div>
      <div className="mt-3 space-y-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {todays.length === 0 && <Empty e={'\u{1F37D}\uFE0F'} t="No food logged yet" />}
        {todays.map(f => { const s = FD.find(x => x.name === f.name); return (
          <div key={f.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-neutral-50">
            <div className="min-w-0 flex-1"><span className="text-sm font-medium">{s ? s.emoji : ''} {f.name}</span><span className="ml-2 text-[10px] text-neutral-400">{f.grams}g</span></div>
            <div className="shrink-0 tabular-nums text-xs"><span className="font-bold" style={{ color: '#0B7A4B' }}>{f.kcal}</span><span className="text-neutral-400 ml-1">kcal</span></div>
          </div>
        )})}
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   3. EXERCISE TRACKER (GPS + Manual)
   ═══════════════════════════════════════════════════════ */
type GMode = 'idle' | 'planning' | 'tracking' | 'paused' | 'done'

function GPSTracker({ body, onComplete }: { body: Body; onComplete: (kcal: number, min: number, metH: number) => void }) {
  const [mode, setMode] = useState<GMode>('idle')
  const [exType, setExType] = useState(EX[0]); const [exCat, setExCat] = useState('Cardio')
  const [pts, setPts] = useState<GP[]>([]); const [plan, setPlan] = useState<{ lat: number; lng: number }[]>([])
  const [dur, setDur] = useState(0); const [hr, setHr] = useState(0)
  const [gpsErr, setGpsErr] = useState('')
  const wRef = useRef<number | null>(null); const tRef = useRef<number | null>(null)
  const sRef = useRef(0)
  const dist = totalDist(pts)
  const planDist = totalDist(plan)
  const kcal = getMetBurn(exType.met, body.w, dur / 60); const metH = exType.met * (dur / 3600)
  const filtered = EX.filter(e => e.cat === exCat)
  function startTrack() {
    if (!exType.gps) { setGpsErr('GPS not available. Use manual mode.'); return }
    setGpsErr(''); setMode('tracking'); setPts([]); setDur(0); sRef.current = Date.now()
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    if (!navigator.geolocation) { setGpsErr('GPS is not supported by this browser.'); return }
    wRef.current = navigator.geolocation.watchPosition(
      pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined }]),
      err => setGpsErr('GPS error: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }
  function pause() { setMode('paused'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current) }
  function resume() {
    setMode('tracking'); const off = dur * 1000; sRef.current = Date.now() - off
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    wRef.current = navigator.geolocation.watchPosition(
      pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined }]),
      () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }
  function stop() { setMode('done'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current); onComplete(kcal, dur / 60, metH) }
  function reset() { setMode('idle'); setPts([]); setPlan([]); setDur(0); setHr(0); setGpsErr('') }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <SectionTitle icon={<span className="text-lg">{'\u{1F5FA}\uFE0F'}</span>} title="GPS Tracker" subtitle="Track route, speed, and calories" />
      </div>
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{EXCATS.map(c => <button key={c} onClick={() => { setExCat(c); const f = EX.filter(e => e.cat === c); if (f.length) setExType(f[0]) }} className={'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (exCat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}>{c}</button>)}</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{filtered.map(e => <button key={e.name} onClick={() => setExType(e)} disabled={mode === 'tracking' || mode === 'paused'} className={'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 ' + (exType.name === e.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300')}>{e.emoji} {e.name} <span className="text-[9px] text-neutral-400">MET {e.met}</span>{e.hiit && <span className="text-[8px] font-black text-red-500 ml-1">HIIT</span>}</button>)}</div>
      </div>
      {/* Real map (OpenStreetMap) — live position, record routes & plan
          a path by tapping the map. */}
      <div className="relative mx-5 overflow-hidden rounded-2xl border border-neutral-100">
        {mode === 'planning' && (
          <div className="absolute inset-x-0 top-0 z-[500] bg-purple-600/90 px-3 py-1.5 text-center text-[11px] font-bold text-white">
            {'\u{1F4CD}'} Tap the map to add route points {plan.length > 0 && `· ${plan.length} points · ${fmtDist(planDist)}`}
          </div>
        )}
        <Suspense fallback={<div className="grid h-[240px] place-items-center bg-neutral-50 text-xs text-neutral-400">Loading map…</div>}>
          <RouteMap
            points={pts}
            planned={plan}
            height={240}
            onMapClick={mode === 'planning' ? (p) => setPlan((pl) => [...pl, p]) : undefined}
          />
        </Suspense>
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="grid grid-cols-4 gap-px bg-neutral-900">
            {[[fmtD(dur), 'TIME'], [fmtDist(dist), 'DISTANCE'], [Math.round(dur > 0 ? (dist / dur) * 3.6 : 0) + ' km/h', 'SPEED'], [fmtPace(dur, dist), 'PACE']].map(([v, l]) => (
              <div key={l} className="bg-neutral-900 px-2 py-2 text-center">
                <div className="text-sm font-extrabold text-white tabular-nums">{v}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/40">{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-2.5">
            <span className="text-lg">{'\u{1F493}'}</span>
            <div className="flex-1"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Heart Rate</div></div>
            <input className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-sm font-bold tabular-nums" type="number" value={hr} onChange={e => setHr(+e.target.value)} placeholder="bpm" />
            <span className="text-[10px] text-neutral-400">bpm</span>
          </div>
        )}
        {mode === 'done' && (
          <div className="rounded-xl bg-gradient-to-r from-brand to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div><div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Summary</div><div className="text-2xl font-extrabold">{exType.emoji} {exType.name}</div></div>
              <div className="text-right"><div className="text-3xl font-extrabold">{kcal}<span className="text-sm font-medium text-white/60"> kcal</span></div><div className="text-xs text-white/70">MET {exType.met} {'\u00B7'} {metH.toFixed(2)} MET-hours</div></div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-3 text-center text-xs">
              <div><div className="font-bold">{fmtDist(dist)}</div><div className="text-white/50">Distance</div></div>
              <div><div className="font-bold">{fmtD(dur)}</div><div className="text-white/50">Duration</div></div>
              <div><div className="font-bold">{Math.round(dur > 0 ? (dist / dur) * 3.6 : 0)} km/h</div><div className="text-white/50">Speed</div></div>
              <div><div className="font-bold">{hr || '-'}</div><div className="text-white/50">HR</div></div>
            </div>
          </div>
        )}
        {gpsErr && <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">{gpsErr}</div>}
        <div className="flex gap-2">
          {mode === 'idle' && <><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-11 rounded-xl text-sm font-bold">{'\u25B6'} Start GPS{!exType.gps ? ' (N/A)' : ''}</Button><Button onClick={() => { setMode('planning'); setPlan([]) }} className="h-11 rounded-xl text-sm font-bold border-2 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100">{'\u{1F4CD}'} Plan Route</Button></>}
          {mode === 'planning' && <><Button onClick={() => setPlan([])} variant="outline" className="h-10 rounded-xl text-xs">Clear</Button><Button onClick={reset} variant="outline" className="flex-1 h-10 rounded-xl text-xs">Cancel</Button><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-10 rounded-xl text-xs font-bold">{'\u25B6'} Start</Button></>}
          {mode === 'tracking' && <><Button onClick={pause} className="flex-1 h-11 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600">{'\u23F8'} Pause</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">{'\u23F9'} Finish</Button></>}
          {mode === 'paused' && <><Button onClick={resume} className="flex-1 h-11 rounded-xl text-sm font-bold">{'\u25B6'} Resume</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">{'\u23F9'} Finish</Button></>}
          {mode === 'done' && <Button onClick={reset} className="w-full h-10 rounded-xl text-sm">Finish & Reset</Button>}
        </div>
        {!exType.gps && mode === 'idle' && <ManualEx body={body} ex={exType} onComplete={onComplete} />}
      </div>
    </Card>
  )
}

function ManualEx({ body, ex, onComplete }: { body: Body; ex: Exer; onComplete: (kcal: number, min: number, metH: number) => void }) {
  const [min, setMin] = useState(30)
  const k = getMetBurn(ex.met, body.w, min); const mH = ex.met * (min / 60)
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-neutral-700">{ex.emoji} Manual - {ex.name}</span>
        <div className="flex items-center gap-2">
          {ex.hiit && <Badge tone="high">HIIT</Badge>}
          <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">{k} kcal</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Stepper value={min} min={5} max={180} step={5} unit="min" onChange={setMin} />
        <Button onClick={() => onComplete(k, min, mH)} className="h-9 text-xs rounded-xl shrink-0"><IconPlus size={14} /> Log</Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   4. SLEEP, WATER, SUN & WEEKLY MET
   ═══════════════════════════════════════════════════════ */
function SleepWater({ body }: { body: Body }) {
  const { state, logWellness } = useStore()
  const wt = getW(state, today())
  const weekMet = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return getW(state, d.toISOString().slice(0, 10)).metHours }).reduce((a, b) => a + b, 0)
  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">{'\u{1F4A4}'}</span>} title="Sleep, Water, Sunlight & Weekly" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u{1F319}'}</span><span className="text-xs font-bold text-neutral-700">Sleep</span><span className="ml-auto text-sm font-extrabold text-indigo-500 tabular-nums"><ANum v={wt.sleepHr} d={1} /> hrs</span></div>
          <Stepper value={wt.sleepHr} min={0} max={12} step={0.5} unit="hrs" onChange={v => logWellness(today(), { sleepHr: v })} />
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u{1F4A7}'}</span><span className="text-xs font-bold text-neutral-700">Water</span><span className="ml-auto text-sm font-extrabold text-blue-500 tabular-nums"><ANum v={wt.waterMl} /> mL</span></div>
          <Stepper value={wt.waterMl} min={0} max={5000} step={250} unit="mL" onChange={v => logWellness(today(), { waterMl: v })} />
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u2600\uFE0F'}</span><span className="text-xs font-bold text-neutral-700">Sunlight</span><span className="ml-auto"><button onClick={() => logWellness(today(), { sunDone: !wt.sunDone, sunHr: wt.sunDone ? 0 : 0.25 })} className={'rounded-lg px-3 py-1 text-[11px] font-bold transition active:scale-95 ' + (wt.sunDone ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-500')}>{wt.sunDone ? 'Done \u2705' : 'Not yet'}</button></span></div>
          {wt.sunDone && <Stepper value={wt.sunHr} min={0.05} max={1} step={0.05} unit="hrs" onChange={v => logWellness(today(), { sunHr: v })} />}
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-1"><span className="text-lg">{'\u{1F4CA}'}</span><span className="text-xs font-bold text-neutral-700">Weekly MET</span><span className="ml-auto text-sm font-extrabold tabular-nums" style={{ color: weekMet >= 7.5 ? C.ok : weekMet >= 3.75 ? C.warn : C.bad }}>{weekMet.toFixed(1)}</span></div>
          <div className="mt-1 h-2 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (weekMet / 15) * 100) + '%', background: weekMet >= 7.5 ? C.ok : weekMet >= 3.75 ? C.warn : C.bad }} /></div>
          <div className="flex justify-between text-[9px] text-neutral-400 mt-1"><span>0</span><span>7.5 (WHO)</span><span>15</span></div>
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   5. CHRONIC DISEASE PROTOCOL SELECTOR
   ═══════════════════════════════════════════════════════ */
function ChronicProtocolCard({ onSelect, active }: { onSelect: (p: ChronicProtocol | undefined) => void; active?: ChronicProtocol }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<IconHospital size={18} />} title="Chronic Disease Protocol" subtitle="Click to select a clinical condition" />
        {active && <button onClick={() => onSelect(undefined)} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-100 active:scale-95">Reset</button>}
      </div>
      {active && (
        <div className="mt-3 rounded-xl p-4" style={{ background: active.color + '10', border: '1px solid ' + active.color + '30' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{active.emoji}</span>
            <div>
              <div className="text-sm font-black" style={{ color: active.color }}>{active.name}</div>
              <div className="text-[10px] text-neutral-500">Calories: {(active.calAdj * 100).toFixed(0)}% | Protein: {active.protAdj}x | NaMax: {active.naMax}mg | Fluid: {active.fluidMin}-{active.fluidMax}mL</div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Recommended Foods</div><div className="mt-1 flex flex-wrap gap-1">{active.specialFoods.slice(0, 6).map(f => <span key={f} className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">{f}</span>)}{active.specialFoods.length > 6 && <span className="text-[9px] text-neutral-400">+{active.specialFoods.length - 6}</span>}</div></div>
            <div><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Foods to Avoid</div><div className="mt-1 flex flex-wrap gap-1">{active.avoidFoods.slice(0, 6).map(f => <span key={f} className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-600">{f}</span>)}{active.avoidFoods.length > 6 && <span className="text-[9px] text-neutral-400">+{active.avoidFoods.length - 6}</span>}</div></div>
          </div>
          <div className="mt-2"><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Clinical Notes</div><ul className="mt-1 space-y-0.5">{active.notes.map((n, i) => <li key={i} className="text-[10px] text-neutral-600 flex gap-1"><span style={{ color: active.color }}>{'\u2022'}</span>{n}</li>)}</ul></div>
          <div className="mt-2"><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Exercise Restrictions</div><ul className="mt-1 space-y-0.5">{active.exerRestrictions.map((n, i) => <li key={i} className="text-[10px] text-neutral-600 flex gap-1"><span className="text-amber-500">{'\u26A0\uFE0F'}</span>{n}</li>)}</ul></div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="mt-3 w-full rounded-xl border border-dashed border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50 hover:border-neutral-300">
        {open ? 'Close Disease List' : 'View All Protocols (' + CHRONIC_PROTOCOLS.length + ')'}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {CHRONIC_PROTOCOLS.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setOpen(false) }} className={'rounded-xl border p-3 text-left transition active:scale-95 ' + (active?.id === p.id ? 'border-current shadow-sm' : 'border-neutral-100 hover:border-neutral-200')} style={active?.id === p.id ? { borderColor: p.color, background: p.color + '08' } : {}}>
              <span className="text-lg">{p.emoji}</span>
              <div className="mt-1 text-[11px] font-bold" style={{ color: active?.id === p.id ? p.color : '#404040' }}>{p.name}</div>
              <div className="text-[9px] text-neutral-400">NaMax {p.naMax}mg | Prot {p.protAdj}x</div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   6. LAB TRACKER (Weekly Comparison)
   ═══════════════════════════════════════════════════════ */
function LabTracker({ activeProtocol }: { activeProtocol?: ChronicProtocol }) {
  const [labs, setLabs] = useState<LabEntry[]>(loadLabs)
  const [editVals, setEditVals] = useState<Record<string, string>>({})
  const [editDate, setEditDate] = useState<string>(today())
  const [showForm, setShowForm] = useState(false)

  const labKeys = activeProtocol?.labKeys ?? ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'creatinine', 'gfr', 'alt', 'ast', 'hemoglobin', 'crp', 'potassium', 'sodium', 'albumin', 'vitD']
  const labLabels = activeProtocol?.labLabels ?? { glucose: 'Blood Glucose', hba1c: 'HbA1c', totalCholesterol: 'Total Cholesterol', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Triglycerides', creatinine: 'Creatinine', gfr: 'eGFR', alt: 'ALT', ast: 'AST', hemoglobin: 'Hemoglobin', crp: 'CRP', potassium: 'Potassium', sodium: 'Sodium', albumin: 'Albumin', vitD: 'Vitamin D' }
  const labUnits = activeProtocol?.labUnits ?? { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', creatinine: 'mg/dL', gfr: 'mL/min', alt: 'U/L', ast: 'U/L', hemoglobin: 'g/dL', crp: 'mg/L', potassium: 'mEq/L', sodium: 'mEq/L', albumin: 'g/dL', vitD: 'ng/mL' }
  const labRanges = activeProtocol?.labRanges ?? { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], creatinine: [0.6, 1.2], gfr: [60, 120], alt: [7, 56], ast: [10, 40], hemoglobin: [12, 17], crp: [0, 5], potassium: [3.5, 5.0], sodium: [135, 145], albumin: [3.5, 5.0], vitD: [30, 100] }

  function saveLab() {
    const vals: Record<string, number> = {}
    Object.entries(editVals).forEach(([k, v]) => { const n = parseFloat(v); if (!isNaN(n)) vals[k] = n })
    if (Object.keys(vals).length === 0) return
    const updated = [...labs.filter(l => l.date !== editDate), { date: editDate, values: vals }]
    setLabs(updated); saveLabs(updated); setShowForm(false); setEditVals({})
  }

  function labStatus(key: string, val: number) {
    const range = labRanges[key]
    if (!range) return { color: '#a3a3a3', label: '-' }
    if (val >= range[0] && val <= range[1]) return { color: C.ok, label: 'Normal' }
    if (val < range[0]) return { color: C.blue, label: 'Low' }
    return { color: C.bad, label: 'High' }
  }

  function labTrend(key: string) {
    if (labs.length < 2) return null
    const sorted = [...labs].sort((a, b) => b.date.localeCompare(a.date))
    const latest = sorted[0].values[key]
    const prev = sorted[1].values[key]
    if (latest == null || prev == null) return null
    const diff = latest - prev
    if (Math.abs(diff) < 0.01) return { dir: 'flat', color: '#a3a3a3' }
    const range = labRanges[key]
    let improving = diff < 0
    if (range && latest < range[0]) improving = diff > 0
    if (range && latest > range[1]) improving = diff < 0
    return { dir: improving ? 'up' : 'down', color: improving ? C.ok : C.bad, diff }
  }

  // CSV import
  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string; if (!text) return
      const parsed = parseF(text, file.name)
      if (!parsed.length) return
      const newLabs: LabEntry[] = parsed.map(p => ({ date: p.date, values: Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'date').map(([k, v]) => [k, v as number])) as Record<string, number> }))
      const merged = [...labs]
      newLabs.forEach(nl => {
        const idx = merged.findIndex(l => l.date === nl.date)
        if (idx >= 0) merged[idx] = { ...merged[idx], values: { ...merged[idx].values, ...nl.values } }
        else merged.push(nl)
      })
      setLabs(merged); saveLabs(merged)
    }
    reader.readAsText(file)
  }

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<IconStethoscope size={18} />} title="Weekly Lab Tracker" subtitle="Monitor lab result changes each week" />
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-95">
            {'\u{1F4C1}'} Import
            <input type="file" accept=".csv,.json" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => { setEditDate(today()); setEditVals({}); setShowForm(true) }} className="rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand-dark transition hover:bg-brand/20 active:scale-95"><IconPlus size={12} /> Add</button>
        </div>
      </div>

      {showForm && (
        <div className="mt-3 rounded-xl border border-neutral-200 p-4 space-y-3" style={{ background: '#fafafa' }}>
          <div className="flex items-center gap-3">
            <Field label="Date"><input className={inputClass + ' w-40'} type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></Field>
            <div className="flex-1" />
            <Button onClick={saveLab} className="h-9 text-xs rounded-xl">Save</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
  {labKeys.map(k => (
    <div key={k}>
      <label className="text-[10px] font-bold text-neutral-500">
        {labLabels[k] || k} ({labUnits[k] || ''})
      </label>
      <input
        className={inputClass + ' mt-0.5'}
        placeholder="-"
        value={editVals[k] ?? ''}
        onChange={e => setEditVals({ ...editVals, [k]: e.target.value })}
        type="number"
        step="any"
      />
    </div>
 ))}
</div>
</div>
)}
      {/* Lab Results Table with Weekly Comparison */}
      {labs.length === 0 ? (
        <Empty e={'\u{1F9EA}'} t="No lab data yet. Add manually or import CSV/JSON." />
      ) : (
        <div className="mt-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="py-2 pr-3 text-left font-bold text-neutral-400 sticky left-0 bg-white">Date</th>
                {labKeys.map(k => (
                  <th key={k} className="py-2 px-2 text-center font-bold text-neutral-400 whitespace-nowrap" title={labLabels[k]}>{labLabels[k]}</th>
                ))}
                <th className="py-2 pl-2 text-center font-bold text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...labs].sort((a, b) => b.date.localeCompare(a.date)).map((lab, li) => {
                const abnormalCount = labKeys.filter(k => {
                  const v = lab.values[k]; if (v == null) return false
                  const r = labRanges[k]; return r && (v < r[0] || v > r[1])
                }).length
                return (
                  <tr key={lab.date + li} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition">
                    <td className="py-2 pr-3 font-bold text-neutral-700 whitespace-nowrap sticky left-0 bg-white">{new Date(lab.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    {labKeys.map(k => {
                      const v = lab.values[k]; const st = v != null ? labStatus(k, v) : null
                      return (
                        <td key={k} className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
                          {v != null ? <span style={{ color: st?.color ?? '#404040', fontWeight: st?.label !== 'Normal' ? 700 : 400 }}>{v}</span> : <span className="text-neutral-300">-</span>}
                        </td>
                      )
                    })}
                    <td className="py-2 pl-2 text-center">
                      {abnormalCount === 0 ? <span className="text-[10px] font-bold" style={{ color: C.ok }}>{'\u2705'}</span> : <span className="text-[10px] font-bold" style={{ color: C.bad }}>{abnormalCount} {'\u26A0\uFE0F'}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Trend Summary */}
      {labs.length >= 2 && (
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Weekly Trend (latest vs previous)</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {labKeys.map(k => {
              const trend = labTrend(k)
              if (!trend) return null
              const sorted = [...labs].sort((a, b) => b.date.localeCompare(a.date))
              const latest = sorted[0].values[k]
              if (latest == null) return null
              const st = labStatus(k, latest)
              return (
                <div key={k} className="rounded-lg border border-neutral-100 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-neutral-500">{labLabels[k]}</span>
                    <span className="text-[10px]" style={{ color: trend.color }}>{trend.dir === 'up' ? '\u2191' : trend.dir === 'down' ? '\u2193' : '\u2192'} {trend.diff != null ? (trend.diff > 0 ? '+' : '') + trend.diff.toFixed(1) : ''}</span>
                  </div>
                  <div className="text-sm font-extrabold tabular-nums" style={{ color: st.color }}>{latest} <span className="text-[9px] font-normal text-neutral-400">{labUnits[k]}</span></div>
                  <div className="text-[9px] font-semibold" style={{ color: st.color }}>{st.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lab Range Reference */}
      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Normal Reference Range</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {labKeys.map(k => {
            const range = labRanges[k]
            if (!range) return null
            return (
              <div key={k} className="flex items-center justify-between rounded-lg bg-neutral-50 px-2.5 py-1.5">
                <span className="text-[10px] text-neutral-600">{labLabels[k]}</span>
                <span className="text-[10px] font-bold tabular-nums text-neutral-400">{range[0]}-{range[1]} {labUnits[k]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   7. VITAL SIGNS IMPORTER
   ═══════════════════════════════════════════════════════ */
function VitalImporter({ onImported }: { onImported: (avg: ReturnType<typeof avgIV>, raw: IV[]) => void }) {
  const [status, setStatus] = useState('')
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string; if (!text) return
      const parsed = parseF(text, file.name)
      if (!parsed.length) { setStatus('Failed to parse file. Make sure the CSV/JSON format is correct.'); return }
      const avg = avgIV(parsed)
      onImported(avg, parsed)
      setStatus(`Successfully imported ${parsed.length} row(s) of vital data.`)
      setTimeout(() => setStatus(''), 5000)
    }
    reader.readAsText(file)
  }
  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<IconHeart size={18} />} title="Import Vital Data" subtitle="CSV or JSON (heartRate, steps, spo2, hrv, vo2Max, systolic, etc.)" />
        <label className="cursor-pointer rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand-dark transition hover:bg-brand/20 active:scale-95">
          {'\u{1F4C1}'} Import File
          <input type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {status && <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-[11px] font-medium text-green-700">{status}</div>}
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   8. LONGEVITY SCORE CARD
   ═══════════════════════════════════════════════════════ */
function LongevityCard({ body, wt, todaysFoods, vitals, activeProtocol }: {
  body: Body; wt: { sleepHr: number; waterMl: number; metHours: number; sunDone: boolean; sunHr: number }
  todaysFoods: { kcal: number; protein: number; carbs: number; fat: number; grams: number; name: string }[]
  vitals: ReturnType<typeof avgIV>; activeProtocol?: ChronicProtocol
}) {
  const total = todaysFoods.reduce((a, f) => ({ k: a.k + f.kcal, p: a.p + f.protein }), { k: 0, p: 0 })
  const fiber = todaysFoods.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const bmi = getBmi(body.w, body.h)
  const bmr = getBmr(body.w, body.h, body.age, body.g)
  const tdee = getTdee(bmr, body.act)
  const vo2Est = vitals.avgHR ? (body.g === 'M' ? 15.3 * (220 - body.age) / vitals.avgHR : 15.3 * (226 - body.age) / vitals.avgHR) : undefined

  const lng = calcLong({
    sleepHr: wt.sleepHr,
    hydrationL: wt.waterMl / 1000,
    sunDone: wt.sunDone,
    sunHr: wt.sunHr,
    bmiVal: bmi,
    tdeeVal: tdee,
    intakeKcal: total.k,
    proteinG: total.p,
    weightKg: body.w,
    fiberG: fiber,
    metHoursWeek: wt.metHours,
    avgHR: vitals.avgHR,
    avgSpo2: vitals.avgSpo2,
    avgSteps: vitals.avgSteps,
    avgHrv: vitals.avgHrv,
    vo2Max: vitals.vo2Max || vo2Est,
    avgSys: vitals.avgSys,
  })

  const scoreLabel = lng.score >= 80 ? 'Excellent' : lng.score >= 60 ? 'Good' : lng.score >= 40 ? 'Needs Improvement' : 'Start Small'
  const scoreColor = lng.score >= 70 ? C.ok : lng.score >= 45 ? C.warn : C.bad

  const pillars = [
    { label: 'Body', v: lng.body, show: lng.hasB },
    { label: 'Nutrition', v: lng.nut, show: true },
    { label: 'Exercise', v: lng.exer, show: true },
    { label: 'Sleep', v: lng.sleep, show: true },
    { label: 'Calories', v: lng.cal, show: true },
    { label: 'Hydration', v: lng.hydr, show: true },
    { label: 'Sunlight', v: lng.sun, show: true },
    { label: 'Vitals', v: lng.vit, show: lng.hasV },
  ].filter(p => p.show)

  const topPillar = pillars.reduce((a, b) => a.v < b.v ? a : b, pillars[0])

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="relative p-6 text-white" style={{ background: 'linear-gradient(135deg, #0B7A4B 0%, #064e36 40%, #0a2f1f 100%)' }}>
        <div className="absolute right-4 top-4 opacity-[0.04]">
          <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="2" /><circle cx="40" cy="40" r="28" fill="none" stroke="white" strokeWidth="1.5" /><circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="1" /></svg>
        </div>
        <div className="absolute -left-4 -bottom-4 opacity-[0.03]">
          <svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" /></svg>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Longevity Score</span>
            <span className="text-[9px] text-white/20">{'\u00B7'}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {activeProtocol && <span className="ml-2"><Badge tone="high">{activeProtocol.emoji} {activeProtocol.name}</Badge></span>}
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="relative shrink-0">
              <svg width="96" height="96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                <circle cx="48" cy="48" r="40" fill="none" stroke={scoreColor} strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - lng.score / 100)} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)', filter: 'drop-shadow(0 0 8px ' + scoreColor + '66)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tabular-nums">{lng.score}</span>
                <span className="text-[10px] text-white/30">/100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-black leading-tight">{scoreLabel}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: scoreColor, boxShadow: '0 0 6px ' + scoreColor }} />
                <span className="text-[11px] font-semibold text-white/80">Focus on improving: <b>{topPillar.label} ({topPillar.v})</b></span>
              </div>
            </div>
          </div>

          {/* Pillar Bars */}
          <div className="mt-5 space-y-2">
            {pillars.map(p => (
              <Pillar key={p.label} label={p.label} v={p.v} hl={p.label === topPillar.label} />
            ))}
          </div>

          {/* Quick Vitals */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {vitals.avgHR != null && <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center"><div className="text-[8px] text-white/40 uppercase">HR</div><div className="text-sm font-extrabold tabular-nums">{vitals.avgHR}</div></div>}
            {vitals.avgSpo2 != null && <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center"><div className="text-[8px] text-white/40 uppercase">SpO2</div><div className="text-sm font-extrabold tabular-nums">{vitals.avgSpo2}%</div></div>}
            {(vitals.vo2Max || vo2Est) != null && <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center"><div className="text-[8px] text-white/40 uppercase">VO2Max</div><div className="text-sm font-extrabold tabular-nums">{(vitals.vo2Max || vo2Est || 0).toFixed(1)}</div></div>}
            {bmi > 0 && <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center"><div className="text-[8px] text-white/40 uppercase">BMI</div><div className="text-sm font-extrabold tabular-nums">{bmi.toFixed(1)}</div></div>}
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black tracking-wider text-white/25">PANACEA</span>
            <span className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(0,191,99,0.5)' }}>MED</span>
          </div>
          <span className="text-[10px] font-mono text-white/20">.id</span>
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   9. RECOMMENDATIONS CARD
   ═══════════════════════════════════════════════════════ */
function RecommendationsCard({ recs }: { recs: Rec[] }) {
  if (!recs.length) return null
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconSparkle size={18} />} title="Real-time Recommendations" subtitle={`${recs.length} suggestion(s) based on your data`} />
      <div className="mt-3 space-y-2 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {recs.map((r, i) => (
          <div key={i} className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-neutral-50" style={{ borderLeft: '3px solid ' + r.c }}>
            <span className="text-lg shrink-0 mt-0.5">{r.e}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold" style={{ color: r.c }}>{r.t}</div>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">{r.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   10. MANUAL EXERCISE LOG (Non-GPS)
   ═══════════════════════════════════════════════════════ */
function ExerciseLog({ body, onLog }: { body: Body; onLog: (kcal: number, min: number, metH: number) => void }) {
  const [exCat, setExCat] = useState('Cardio')
  const [exName, setExName] = useState(EX[0].name)
  const [min, setMin] = useState(30)
  const filtered = EX.filter(e => e.cat === exCat)
  const ex = EX.find(e => e.name === exName) ?? EX[0]
  const k = getMetBurn(ex.met, body.w, min)
  const mH = ex.met * (min / 60)

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconFlame size={18} />} title="Manual Exercise Log" subtitle="Log exercise without GPS" />
      <div className="mt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{EXCATS.map(c => <button key={c} onClick={() => { setExCat(c); const f = EX.filter(e => e.cat === c); if (f.length) setExName(f[0].name) }} className={'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (exCat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}>{c}</button>)}</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{filtered.map(e => <button key={e.name} onClick={() => setExName(e.name)} className={'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 ' + (ex.name === e.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300')}>{e.emoji} {e.name} <span className="text-[9px] text-neutral-400">MET {e.met}</span>{e.hiit && <span className="text-[8px] font-black text-red-500 ml-1">HIIT</span>}</button>)}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Stepper label="Duration" value={min} min={5} max={300} step={5} unit="min" onChange={setMin} />
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold" style={{ color: '#0B7A4B' }}>{k}</div>
          <div className="text-[9px] text-neutral-400">kcal</div>
        </div>
        <Button onClick={() => onLog(k, min, mH)} className="h-10 shrink-0 rounded-xl text-sm font-bold"><IconPlus size={14} /> Log</Button>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   OBESITY — WEEKLY NUTRITION + EXERCISE SCHEDULER
   ═══════════════════════════════════════════════════════ */
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ObesityWeeklyPlan({ protocol }: { protocol: ChronicProtocol }) {
  const meals = protocol.specialFoods
  const restrictions = protocol.exerRestrictions
  // Deterministic rotation so each day gets a distinct meal trio + exercise focus.
  const plan = WEEK_DAYS.map((day, i) => {
    const breakfast = meals[i % meals.length]
    const lunch = meals[(i + 3) % meals.length]
    const dinner = meals[(i + 6) % meals.length]
    const isRestDay = i === 6
    const exerciseFocus = isRestDay
      ? 'Active recovery / casual walk 15-20 minutes'
      : i % 3 === 2
        ? 'Resistance training (full body, 30-40 minutes)'
        : 'Moderate-intensity aerobic exercise (brisk walk/cycling, 40-60 minutes)'
    return { day, breakfast, lunch, dinner, exerciseFocus, isRestDay }
  })

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconFlame size={18} />} title="Weekly Schedule — Obesity" subtitle="7-day meal & exercise schedule based on the obesity protocol" />
      <div className="mt-3 space-y-2">
        {plan.map((d) => (
          <div key={d.day} className="rounded-2xl border border-neutral-100 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-ink">{d.day}</div>
              {d.isRestDay && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Recovery</span>}
            </div>
            <div className="mt-1.5 grid grid-cols-1 gap-1 text-xs text-neutral-600 sm:grid-cols-3">
              <div><b className="text-neutral-400">Breakfast:</b> {d.breakfast}</div>
              <div><b className="text-neutral-400">Lunch:</b> {d.lunch}</div>
              <div><b className="text-neutral-400">Dinner:</b> {d.dinner}</div>
            </div>
            <div className="mt-1.5 text-xs font-semibold text-brand-dark">🏃 {d.exerciseFocus}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-amber-50/60 p-3">
        <div className="mb-1 text-xs font-bold text-amber-800">Exercise Restriction Notes</div>
        <ul className="space-y-1 text-xs text-amber-800">
          {restrictions.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN NUTRITION EXPORT
   ═══════════════════════════════════════════════════════ */
export function Nutrition() {
  const { state, addFood, logWellness } = useStore()
  const body = loadBody(); useBR()
  const [activeProtocol, setActiveProtocol] = useState<ChronicProtocol | undefined>()
  const [vitals, setVitals] = useState<ReturnType<typeof avgIV>>({ avgHR: undefined, avgSpo2: undefined, avgSteps: undefined, avgHrv: undefined, vo2Max: undefined, avgSys: undefined, n: 0 })

  const todayStr = today()
  const wt = getW(state, todayStr)
  const todaysFoods = state.foods.filter(f => f.date === todayStr)
  const totalKcal = todaysFoods.reduce((a, f) => a + f.kcal, 0)
  const totalProt = todaysFoods.reduce((a, f) => a + f.protein, 0)
  const totalFiber = todaysFoods.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const totalNa = todaysFoods.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.na * f.grams / 100 : 0) }, 0)
  const totalOmega3 = todaysFoods.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.omega3 * f.grams / 100 : 0) }, 0)

  function onExComplete(kcal: number, min: number, metH: number) {
    logWellness(todayStr, { exerciseKcal: (wt.exerciseKcal || 0) + kcal, exerciseMin: (wt.exerciseMin || 0) + min, metHours: (wt.metHours || 0) + metH })
  }

  const recs = useMemo(() => genRecs(body, totalKcal, totalProt, totalFiber, totalNa, totalOmega3, wt.metHours || 0, wt.sleepHr, wt.waterMl, wt.sunDone, vitals.avgHR, vitals.avgSys, vitals.avgSpo2, activeProtocol), [body, totalKcal, totalProt, totalFiber, totalNa, totalOmega3, wt.metHours, wt.sleepHr, wt.waterMl, wt.sunDone, vitals, activeProtocol])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex justify-end">
        <ShareToFeed activity="🥗 Nutrition & Calories" defaultCaption="My nutrition & healthy lifestyle progress today 🥗" />
      </div>
      {/* Longevity Score */}
      <LongevityCard body={body} wt={wt} todaysFoods={todaysFoods} vitals={vitals} activeProtocol={activeProtocol} />

      {/* Chronic Protocol Selector */}
      <div id="calc-protokol"><ChronicProtocolCard onSelect={setActiveProtocol} active={activeProtocol} /></div>

      {/* Body Profile */}
      <div id="calc-bmi"><BodyCard intakeKcal={totalKcal} /></div>

      {/* 7-day BMI / BMR / VO₂Max trends (recharts) */}
      <div id="calc-vo2max">
        <Suspense fallback={<div className="rounded-2xl border border-black/5 bg-white p-5 text-center text-xs text-neutral-400 shadow-sm">Loading health trends…</div>}>
          <HealthTrends weight={body.w} height={body.h} age={body.age} gender={body.g as 'M' | 'F'} hrRest={vitals.avgHR} />
        </Suspense>
      </div>

      {/* Food Tracker */}
      <FoodTracker body={body} activeProtocol={activeProtocol} />

      {/* GPS Tracker */}
      <GPSTracker body={body} onComplete={onExComplete} />

      {/* Exercise Log */}
      <ExerciseLog body={body} onLog={onExComplete} />

      {/* Sleep, Water, Sun */}
      <SleepWater body={body} />

      {/* Vital Importer */}
      <VitalImporter onImported={avg => setVitals(avg)} />

      {/* Lab Tracker */}
      <div id="calc-lab"><LabTracker activeProtocol={activeProtocol} /></div>

      {/* Obesity weekly nutrition + exercise scheduler */}
      {activeProtocol?.id === 'obesity' && <ObesityWeeklyPlan protocol={activeProtocol} />}

      {/* Recommendations */}
      <RecommendationsCard recs={recs} />

      {/* Quick Links — longevity calculator capabilities */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={18} />} title="The Best Longevity Calculator" subtitle="Built to help humanity live longer and healthier" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: '🫀', label: 'VO₂max Est.', desc: 'Aerobic capacity', anchor: 'calc-vo2max' },
            { icon: '⚖️', label: 'BMI & BMR', desc: 'Basal metabolism & body mass index', anchor: 'calc-bmi' },
            { icon: '🧬', label: 'Lab Tracker', desc: 'Track weekly lab results', anchor: 'calc-lab' },
            { icon: '🏥', label: 'Chronic Protocols', desc: '19 clinical conditions', anchor: 'calc-protokol' },
          ].map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex flex-col items-center rounded-2xl border border-brand/15 bg-brand-50/40 p-3 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-sm active:scale-95"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-sm">{item.icon}</span>
              <div className="mt-2 text-xs font-extrabold text-ink">{item.label}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-neutral-500">{item.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-brand/10 bg-gradient-to-br from-brand-50/70 to-transparent p-5 text-center">
          <p className="text-[13px] leading-relaxed text-neutral-600">
            <b className="text-brand-dark">Panaceamed</b> is designed to clinical standards — from supporting elite athletes
            (<i>Ronaldo, Messi, Mbappé, Kipchoge, Phelps</i>) to caring for critically ill patients
            (<b>CHF, COPD, Diabetes, Kidney Failure, Cancer</b>, and 15+ chronic conditions). Every recommendation
            is calculated <b>in real-time</b> from your data.
          </p>
          <p className="mt-2 text-xs font-semibold italic text-brand-dark">🌿 May this benefit humanity.</p>
        </div>
      </Card>

      {/* Nutrition Data Sources */}
      <Card className="!p-5">
        <SectionTitle icon={<span className="text-lg">📚</span>} title="Nutrition Data Sources" subtitle="Food composition references underlying the Panaceamed nutrition database" />
        <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-neutral-600">
          <li>• <b>TKPI</b> (Indonesian Food Composition Table), Ministry of Health of the Republic of Indonesia — the primary reference for the nutritional content of traditional/local Indonesian foods.</li>
          <li>• <b>USDA FoodData Central</b> (U.S. Department of Agriculture) — a supplementary reference for international items or more detailed micronutrient data.</li>
          <li>• <b>AKG 2019</b> (Indonesian Recommended Dietary Allowance, Ministry of Health Regulation) — the baseline reference for daily needs (protein, fiber, micronutrients) used for the targets/scores on this page.</li>
        </ul>
        <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">The nutritional values per 100g in this database are representative estimates per food category (e.g. "Grilled chicken" represents common recipe variations), not laboratory test results for a specific item — recipe variation, portion size, and product brand affect the actual values. For high-precision medical needs (e.g. chronic kidney disease, severe allergies), verify product labels & consult a clinical dietitian.</p>
      </Card>
    </div>
  )
}
