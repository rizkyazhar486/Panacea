import { useEffect, useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconPlus, IconSparkle, IconHeart, IconStethoscope, IconHospital, IconFlame, IconDrop } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { evaluateVitals, overallStatus, STATUS_COLOR, STATUS_LABEL } from '../lib/chronic'
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

const BK = 'pm_body_v2'
const LAB_K = 'pm_lab_weekly'
const defBody: Body = { w: 65, h: 165, age: 30, g: 'M', act: 1, goal: 'maintain' }
const loadBody = (): Body => { try { const d = JSON.parse(localStorage.getItem(BK) || ''); return d.w ? d : defBody } catch { return defBody } }
const saveB = (b: Body) => localStorage.setItem(BK, JSON.stringify(b))
let _br = 0
const emitB = () => { _br++; window.dispatchEvent(new Event('bc')) }
const useBR = () => { const [, s] = useState(0); useEffect(() => { const h = () => s(v => v + 1); window.addEventListener('bc', h); return () => window.removeEventListener('bc', h) }, []); return _br }

/* ═══════════════════════════════════════════════════════
   FOOD DATABASE (150+ items, clinical grade)
   ═══════════════════════════════════════════════════════ */
const FD: Food[] = [
  // KARBOHIDRAT
  { name: 'Nasi putih', k: 130, c: 28, p: 2.7, f: 0.3, fb: 0.4, na: 1, k2: 35, mg: 12, fe: 0.2, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 73, cat: 'Karbo', emoji: '🍚', tags: ['high-gi', 'gluten-free'] },
  { name: 'Nasi merah', k: 111, c: 23, p: 2.6, f: 0.9, fb: 1.8, na: 5, k2: 79, mg: 44, fe: 0.5, zn: 1.2, vitC: 0, vitD: 0, omega3: 0, gi: 68, cat: 'Karbo', emoji: '🍚', tags: ['moderate-gi', 'whole-grain'] },
  { name: 'Nasi hitam', k: 100, c: 21, p: 3, f: 0.5, fb: 2, na: 4, k2: 80, mg: 40, fe: 0.6, zn: 1.1, vitC: 0, vitD: 0, omega3: 0, gi: 55, cat: 'Karbo', emoji: '🍚', tags: ['low-gi', 'antioxidant'] },
  { name: 'Nasi goreng', k: 163, c: 21, p: 4, f: 6, fb: 0.8, na: 400, k2: 50, mg: 18, fe: 1, zn: 0.8, vitC: 2, vitD: 0, omega3: 0, gi: 65, cat: 'Karbo', emoji: '🍛', tags: ['high-sodium'] },
  { name: 'Lontong', k: 122, c: 27, p: 2, f: 0.2, fb: 0.5, na: 2, k2: 30, mg: 10, fe: 0.1, zn: 0.3, vitC: 0, vitD: 0, omega3: 0, gi: 70, cat: 'Karbo', emoji: '🟢', tags: [] },
  { name: 'Roti tawar', k: 265, c: 49, p: 9, f: 3.2, fb: 2.7, na: 491, k2: 115, mg: 25, fe: 2.5, zn: 0.9, vitC: 0, vitD: 0, omega3: 0, gi: 75, cat: 'Karbo', emoji: '🍞', tags: ['high-gi', 'high-sodium'] },
  { name: 'Roti gandum', k: 247, c: 41, p: 13, f: 3.4, fb: 6.8, na: 400, k2: 250, mg: 75, fe: 2.5, zn: 2, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Karbo', emoji: '🍞', tags: ['low-gi', 'whole-grain', 'high-fiber'] },
  { name: 'Oatmeal', k: 389, c: 66, p: 17, f: 7, fb: 11, na: 5, k2: 429, mg: 177, fe: 4.7, zn: 3.9, vitC: 0, vitD: 0, omega3: 0.1, gi: 55, cat: 'Karbo', emoji: '🥣', tags: ['low-gi', 'beta-glucan', 'heart-healthy'] },
  { name: 'Quinoa', k: 368, c: 64, p: 14, f: 6, fb: 7, na: 5, k2: 563, mg: 197, fe: 4.6, zn: 3.1, vitC: 0, vitD: 0, omega3: 0.3, gi: 53, cat: 'Karbo', emoji: '🥣', tags: ['low-gi', 'complete-protein'] },
  { name: 'Kentang rebus', k: 87, c: 20, p: 1.9, f: 0.1, fb: 2.2, na: 6, k2: 421, mg: 23, fe: 0.8, zn: 0.4, vitC: 13, vitD: 0, omega3: 0, gi: 78, cat: 'Karbo', emoji: '🥔', tags: ['potassium-rich'] },
  { name: 'Ubi jalar', k: 86, c: 20, p: 1.6, f: 0.1, fb: 3, na: 55, k2: 337, mg: 25, fe: 0.6, zn: 0.3, vitC: 2.4, vitD: 0, omega3: 0, gi: 44, cat: 'Karbo', emoji: '🍠', tags: ['low-gi', 'beta-carotene'] },
  { name: 'Ubi ungu', k: 82, c: 18, p: 1.5, f: 0.1, fb: 3, na: 40, k2: 350, mg: 25, fe: 0.6, zn: 0.3, vitC: 2.4, vitD: 0, omega3: 0, gi: 42, cat: 'Karbo', emoji: '🍠', tags: ['low-gi', 'anthocyanin'] },
  { name: 'Mie goreng', k: 182, c: 24, p: 5, f: 7, fb: 1.2, na: 600, k2: 80, mg: 25, fe: 1.5, zn: 0.7, vitC: 0, vitD: 0, omega3: 0, gi: 60, cat: 'Karbo', emoji: '🍜', tags: ['high-sodium', 'processed'] },
  { name: 'Mie ayam', k: 85, c: 12, p: 4, f: 2, fb: 0.5, na: 500, k2: 60, mg: 15, fe: 1, zn: 0.5, vitC: 1, vitD: 0, omega3: 0, gi: 55, cat: 'Karbo', emoji: '🍜', tags: ['moderate-sodium'] },
  { name: 'Mie soba', k: 99, c: 21, p: 5.1, f: 0.1, fb: 0.5, na: 300, k2: 100, mg: 40, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Karbo', emoji: '🍜', tags: ['low-gi', 'buckwheat'] },
  { name: 'Bubur ayam', k: 68, c: 10, p: 3, f: 2, fb: 0.3, na: 300, k2: 40, mg: 12, fe: 0.5, zn: 0.4, vitC: 1, vitD: 0, omega3: 0, gi: 70, cat: 'Karbo', emoji: '🥣', tags: ['easy-digest'] },
  { name: 'Jagung rebus', k: 96, c: 21, p: 3.2, f: 1.2, fb: 2.7, na: 3, k2: 270, mg: 37, fe: 0.5, zn: 0.6, vitC: 7, vitD: 0, omega3: 0.2, gi: 52, cat: 'Karbo', emoji: '🌽', tags: ['fiber'] },
  { name: 'Pasta whole wheat', k: 124, c: 25, p: 5, f: 0.5, fb: 3.2, na: 3, k2: 44, mg: 18, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0, gi: 37, cat: 'Karbo', emoji: '🍝', tags: ['low-gi', 'whole-grain'] },
  { name: 'Tortilla', k: 312, c: 52, p: 8, f: 8, fb: 6, na: 450, k2: 180, mg: 60, fe: 2, zn: 1.2, vitC: 0, vitD: 0, omega3: 0, gi: 55, cat: 'Karbo', emoji: '🫓', tags: [] },

  // PROTEIN HEWANI
  { name: 'Ayam goreng', k: 239, c: 8, p: 21, f: 14, fb: 0.3, na: 300, k2: 200, mg: 25, fe: 1, zn: 1.5, vitC: 0, vitD: 0.5, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['high-fat'] },
  { name: 'Ayam bakar', k: 190, c: 1, p: 28, f: 8, fb: 0, na: 100, k2: 250, mg: 30, fe: 1.2, zn: 2, vitC: 0, vitD: 0.3, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['lean'] },
  { name: 'Dada ayam rebus', k: 165, c: 0, p: 31, f: 3.6, fb: 0, na: 74, k2: 256, mg: 29, fe: 1, zn: 1, vitC: 0, vitD: 0.2, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍗', tags: ['lean', 'high-protein'] },
  { name: 'Daging sapi rendah lemak', k: 250, c: 0, p: 26, f: 15, fb: 0, na: 65, k2: 318, mg: 21, fe: 2.6, zn: 5.5, vitC: 0, vitD: 0.2, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['iron-rich', 'zinc-rich'] },
  { name: 'Daging sapi has dalam', k: 271, c: 0, p: 26, f: 18, fb: 0, na: 57, k2: 315, mg: 22, fe: 2.4, zn: 5, vitC: 0, vitD: 0.1, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['high-fat'] },
  { name: 'Ikan salmon', k: 208, c: 0, p: 20, f: 13, fb: 0, na: 59, k2: 363, mg: 27, fe: 0.3, zn: 0.6, vitC: 0, vitD: 12, omega3: 2.3, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['omega3-rich', 'vitamin-d', 'anti-inflammatory'] },
  { name: 'Ikan tuna', k: 132, c: 0, p: 28, f: 1.3, fb: 0, na: 40, k2: 300, mg: 30, fe: 1, zn: 0.6, vitC: 0, vitD: 6, omega3: 0.8, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'omega3-rich'] },
  { name: 'Ikan kembung', k: 205, c: 0, p: 19, f: 13, fb: 0, na: 80, k2: 350, mg: 30, fe: 1.5, zn: 1, vitC: 0, vitD: 5, omega3: 1.5, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['omega3-rich', 'affordable'] },
  { name: 'Ikan kod', k: 82, c: 0, p: 18, f: 0.7, fb: 0, na: 54, k2: 421, mg: 32, fe: 0.4, zn: 0.5, vitC: 0, vitD: 1, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'low-fat'] },
  { name: 'Udang', k: 85, c: 0.2, p: 20, f: 0.5, fb: 0, na: 111, k2: 259, mg: 37, fe: 0.5, zn: 1.1, vitC: 2, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🦐', tags: ['lean', 'high-protein'] },
  { name: 'Telur ayam', k: 155, c: 1.1, p: 13, f: 11, fb: 0, na: 124, k2: 126, mg: 12, fe: 1.8, zn: 1.3, vitC: 0, vitD: 2, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🥚', tags: ['complete-protein', 'choline'] },
  { name: 'Telur bebek', k: 185, c: 1, p: 13, f: 14, fb: 0, na: 140, k2: 140, mg: 15, fe: 2, zn: 1.5, vitC: 0, vitD: 2.5, omega3: 0.4, gi: 0, cat: 'Protein', emoji: '🥚', tags: ['complete-protein'] },
  { name: 'Sate ayam', k: 186, c: 3, p: 22, f: 10, fb: 0.2, na: 400, k2: 180, mg: 25, fe: 1.2, zn: 1.5, vitC: 2, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍢', tags: ['high-sodium'] },
  { name: 'Rendang', k: 193, c: 2, p: 24, f: 10, fb: 0.5, na: 350, k2: 200, mg: 30, fe: 2, zn: 2.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🍛', tags: ['spice-rich', 'anti-inflammatory'] },
  { name: 'Ikan goreng', k: 232, c: 7, p: 19, f: 14, fb: 0.3, na: 250, k2: 200, mg: 20, fe: 0.8, zn: 0.8, vitC: 0, vitD: 3, omega3: 0.5, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['high-fat'] },
  { name: 'Daging kambing', k: 294, c: 0, p: 25, f: 21, fb: 0, na: 72, k2: 355, mg: 23, fe: 2.8, zn: 4.5, vitC: 0, vitD: 0.1, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥩', tags: ['b12-rich', 'iron-rich'] },
  { name: 'Ikan lele', k: 95, c: 0, p: 16, f: 3.5, fb: 0, na: 50, k2: 290, mg: 25, fe: 0.5, zn: 0.8, vitC: 0, vitD: 2, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['affordable'] },
  { name: 'Ikan nila', k: 96, c: 0, p: 18, f: 2.5, fb: 0, na: 40, k2: 300, mg: 27, fe: 0.4, zn: 0.6, vitC: 0, vitD: 1, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🐟', tags: ['lean', 'affordable'] },
  { name: 'Cumi goreng', k: 175, c: 4, p: 18, f: 10, fb: 0, na: 350, k2: 250, mg: 30, fe: 1.5, zn: 2, vitC: 2, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🦑', tags: ['high-sodium'] },
  { name: 'Kepiting', k: 87, c: 0, p: 18, f: 1.1, fb: 0, na: 250, k2: 300, mg: 50, fe: 1.5, zn: 3, vitC: 3, vitD: 0, omega3: 0.4, gi: 0, cat: 'Protein', emoji: '🦀', tags: ['zinc-rich', 'high-sodium'] },

  // PROTEIN NABATI
  { name: 'Tempe goreng', k: 201, c: 8, p: 17, f: 12, fb: 3, na: 200, k2: 250, mg: 80, fe: 2.5, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.2, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented', 'plant-protein'] },
  { name: 'Tempe kukus', k: 160, c: 7, p: 18, f: 8, fb: 4, na: 150, k2: 280, mg: 90, fe: 3, zn: 1.8, vitC: 0, vitD: 0, omega3: 0.3, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented', 'low-fat'] },
  { name: 'Tahu goreng', k: 234, c: 4, p: 15, f: 17, fb: 0.5, na: 150, k2: 130, mg: 40, fe: 1.5, zn: 1, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '⬜', tags: ['plant-protein'] },
  { name: 'Tahu kukus', k: 76, c: 1.9, p: 8, f: 4.8, fb: 0.3, na: 100, k2: 120, mg: 30, fe: 1, zn: 0.8, vitC: 0, vitD: 0, omega3: 0.05, gi: 0, cat: 'Protein', emoji: '⬜', tags: ['plant-protein', 'low-fat'] },
  { name: 'Edamame', k: 121, c: 9, p: 11, f: 5, fb: 5, na: 6, k2: 436, mg: 64, fe: 2.1, zn: 1.6, vitC: 6, vitD: 0, omega3: 0.3, gi: 15, cat: 'Protein', emoji: '🫛', tags: ['complete-protein', 'low-gi'] },
  { name: 'Kacang merah', k: 127, c: 22, p: 8.7, f: 0.5, fb: 6.4, na: 1, k2: 405, mg: 70, fe: 2.9, zn: 1.3, vitC: 1, vitD: 0, omega3: 0.1, gi: 30, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'high-fiber'] },
  { name: 'Kacang kedelai', k: 173, c: 10, p: 16, f: 9, fb: 6, na: 2, k2: 515, mg: 86, fe: 5.1, zn: 2, vitC: 0, vitD: 0, omega3: 0.6, gi: 15, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'isoflavone'] },
  { name: 'Kacang almond', k: 579, c: 22, p: 21, f: 50, fb: 12, na: 1, k2: 733, mg: 270, fe: 3.7, zn: 3.1, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🥜', tags: ['vitamin-e', 'healthy-fat'] },
  { name: 'Kacang tanah', k: 567, c: 16, p: 26, f: 49, fb: 8.5, na: 18, k2: 705, mg: 168, fe: 2, zn: 3.3, vitC: 0, vitD: 0, omega3: 0, gi: 7, cat: 'Protein', emoji: '🥜', tags: ['low-gi'] },
  { name: 'Kacang hijau', k: 105, c: 19, p: 7, f: 0.4, fb: 7.6, na: 1, k2: 460, mg: 48, fe: 2.1, zn: 1.2, vitC: 1, vitD: 0, omega3: 0.1, gi: 31, cat: 'Protein', emoji: '🫘', tags: ['low-gi', 'high-fiber'] },
  { name: 'Oncom', k: 150, c: 10, p: 12, f: 7, fb: 4, na: 120, k2: 200, mg: 60, fe: 2, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Protein', emoji: '🟫', tags: ['fermented'] },

  // SUSU & DERIVAT
  { name: 'Susu full cream', k: 61, c: 4.8, p: 3.2, f: 3.3, fb: 0, na: 43, k2: 132, mg: 10, fe: 0.03, zn: 0.4, vitC: 0, vitD: 1.3, omega3: 0.08, gi: 27, cat: 'Susu', emoji: '🥛', tags: ['calcium'] },
  { name: 'Susu skim', k: 34, c: 5, p: 3.4, f: 0.1, fb: 0, na: 42, k2: 156, mg: 11, fe: 0.03, zn: 0.4, vitC: 0, vitD: 1.3, omega3: 0, gi: 32, cat: 'Susu', emoji: '🥛', tags: ['low-fat', 'calcium'] },
  { name: 'Susu almond', k: 17, c: 0.6, p: 0.4, f: 1.5, fb: 0.2, na: 70, k2: 30, mg: 5, fe: 0.1, zn: 0.1, vitC: 0, vitD: 2.5, omega3: 0, gi: 25, cat: 'Susu', emoji: '🥛', tags: ['plant-based'] },
  { name: 'Yogurt plain', k: 59, c: 3.6, p: 10, f: 0.4, fb: 0, na: 46, k2: 155, mg: 11, fe: 0.05, zn: 0.6, vitC: 0, vitD: 0.1, omega3: 0.02, gi: 25, cat: 'Susu', emoji: '🫙', tags: ['probiotic', 'calcium'] },
  { name: 'Yogurt Greek', k: 97, c: 3.6, p: 9, f: 5, fb: 0, na: 36, k2: 141, mg: 11, fe: 0.1, zn: 0.5, vitC: 0, vitD: 0, omega3: 0.05, gi: 15, cat: 'Susu', emoji: '🫙', tags: ['high-protein', 'probiotic'] },
  { name: 'Keju cheddar', k: 402, c: 1.3, p: 25, f: 33, fb: 0, na: 621, k2: 98, mg: 28, fe: 0.7, zn: 3.1, vitC: 0, vitD: 0.6, omega3: 0.04, gi: 0, cat: 'Susu', emoji: '🧀', tags: ['calcium', 'high-sodium'] },
  { name: 'Keju cottage', k: 98, c: 3.4, p: 11, f: 4.3, fb: 0, na: 364, k2: 104, mg: 8, fe: 0.1, zn: 0.4, vitC: 0, vitD: 0.1, omega3: 0.02, gi: 20, cat: 'Susu', emoji: '🧀', tags: ['high-protein', 'low-fat'] },
  { name: 'Whey protein', k: 400, c: 5, p: 80, f: 3, fb: 0, na: 150, k2: 200, mg: 50, fe: 2, zn: 2, vitC: 0, vitD: 0, omega3: 0, gi: 30, cat: 'Susu', emoji: '🥤', tags: ['high-protein', 'bcaa'] },
  { name: 'Casein protein', k: 380, c: 4, p: 75, f: 4, fb: 0, na: 160, k2: 250, mg: 60, fe: 1.5, zn: 2.5, vitC: 0, vitD: 0, omega3: 0, gi: 25, cat: 'Susu', emoji: '🥤', tags: ['slow-absorbing'] },

  // SAYURAN
  { name: 'Bayam', k: 23, c: 3.6, p: 2.9, f: 0.4, fb: 2.2, na: 79, k2: 558, mg: 79, fe: 2.7, zn: 0.5, vitC: 28, vitD: 0, omega3: 0.1, gi: 15, cat: 'Sayur', emoji: '🥬', tags: ['iron-rich', 'folate'] },
  { name: 'Kangkung', k: 19, c: 3.1, p: 2.6, f: 0.2, fb: 2.5, na: 50, k2: 350, mg: 40, fe: 1.5, zn: 0.3, vitC: 20, vitD: 0, omega3: 0.05, gi: 15, cat: 'Sayur', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Brokoli', k: 34, c: 7, p: 2.8, f: 0.4, fb: 2.6, na: 33, k2: 316, mg: 21, fe: 0.7, zn: 0.6, vitC: 89, vitD: 0, omega3: 0.02, gi: 10, cat: 'Sayur', emoji: '🥦', tags: ['vitamin-c', 'sulforaphane'] },
  { name: 'Wortel', k: 41, c: 10, p: 0.9, f: 0.2, fb: 2.8, na: 69, k2: 320, mg: 12, fe: 0.3, zn: 0.2, vitC: 6, vitD: 0, omega3: 0, gi: 35, cat: 'Sayur', emoji: '🥕', tags: ['beta-carotene'] },
  { name: 'Tomat', k: 18, c: 3.9, p: 0.9, f: 0.2, fb: 1.2, na: 5, k2: 237, mg: 11, fe: 0.3, zn: 0.2, vitC: 14, vitD: 0, omega3: 0, gi: 15, cat: 'Sayur', emoji: '🍅', tags: ['lycopene'] },
  { name: 'Sawi hijau', k: 26, c: 4.5, p: 2.8, f: 0.3, fb: 2.8, na: 20, k2: 250, mg: 20, fe: 1, zn: 0.3, vitC: 30, vitD: 0, omega3: 0.05, gi: 15, cat: 'Sayur', emoji: '🥬', tags: ['calcium', 'vitamin-k'] },
  { name: 'Sawi putih', k: 14, c: 2.5, p: 1.5, f: 0.2, fb: 2, na: 10, k2: 180, mg: 15, fe: 0.5, zn: 0.2, vitC: 15, vitD: 0, omega3: 0, gi: 12, cat: 'Sayur', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Gado-gado', k: 122, c: 10, p: 6, f: 7, fb: 3, na: 300, k2: 200, mg: 40, fe: 1.5, zn: 1, vitC: 10, vitD: 0, omega3: 0.1, gi: 25, cat: 'Sayur', emoji: '🥗', tags: ['balanced'] },
  { name: 'Selada', k: 15, c: 2.9, p: 1.4, f: 0.2, fb: 1.3, na: 28, k2: 194, mg: 13, fe: 1.2, zn: 0.2, vitC: 9, vitD: 0, omega3: 0.05, gi: 10, cat: 'Sayur', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Seledri', k: 16, c: 3, p: 0.7, f: 0.2, fb: 1.6, na: 80, k2: 260, mg: 11, fe: 0.2, zn: 0.1, vitC: 3, vitD: 0, omega3: 0, gi: 15, cat: 'Sayur', emoji: '🥬', tags: ['low-calorie'] },
  { name: 'Paprika merah', k: 31, c: 6, p: 1, f: 0.3, fb: 2.1, na: 4, k2: 318, mg: 12, fe: 0.4, zn: 0.3, vitC: 128, vitD: 0, omega3: 0.05, gi: 15, cat: 'Sayur', emoji: '🫑', tags: ['vitamin-c-rich'] },
  { name: 'Terong', k: 25, c: 6, p: 1, f: 0.2, fb: 3, na: 2, k2: 230, mg: 14, fe: 0.2, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 15, cat: 'Sayur', emoji: '🍆', tags: ['nasunin'] },
  { name: 'Labu siam', k: 16, c: 4, p: 0.8, f: 0.1, fb: 2, na: 3, k2: 150, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0, gi: 15, cat: 'Sayur', emoji: '🥒', tags: ['low-calorie'] },
  { name: 'Buncis', k: 31, c: 7, p: 1.8, f: 0.1, fb: 2.7, na: 6, k2: 210, mg: 25, fe: 1, zn: 0.3, vitC: 12, vitD: 0, omega3: 0.05, gi: 15, cat: 'Sayur', emoji: '🫘', tags: ['fiber'] },
  { name: 'Kecipir', k: 29, c: 5, p: 3, f: 0.1, fb: 2, na: 4, k2: 200, mg: 20, fe: 0.8, zn: 0.3, vitC: 10, vitD: 0, omega3: 0, gi: 15, cat: 'Sayur', emoji: '🫛', tags: [] },
  { name: 'Daun singkong', k: 37, c: 7, p: 3.5, f: 0.5, fb: 3, na: 15, k2: 300, mg: 35, fe: 2, zn: 0.5, vitC: 30, vitD: 0, omega3: 0.05, gi: 15, cat: 'Sayur', emoji: '🥬', tags: ['vitamin-k'] },
  { name: 'Jengkol', k: 140, c: 10, p: 5, f: 0.3, fb: 4, na: 10, k2: 350, mg: 40, fe: 2, zn: 0.8, vitC: 5, vitD: 0, omega3: 0, gi: 20, cat: 'Sayur', emoji: '🟤', tags: [] },
  { name: 'Peté', k: 150, c: 8, p: 8, f: 0.5, fb: 3, na: 5, k2: 280, mg: 30, fe: 1.5, zn: 0.7, vitC: 3, vitD: 0, omega3: 0, gi: 20, cat: 'Sayur', emoji: '🟢', tags: [] },

  // BUAH
  { name: 'Pisang', k: 89, c: 23, p: 1.1, f: 0.3, fb: 2.6, na: 1, k2: 358, mg: 27, fe: 0.3, zn: 0.2, vitC: 9, vitD: 0, omega3: 0.03, gi: 51, cat: 'Buah', emoji: '🍌', tags: ['potassium-rich'] },
  { name: 'Apel', k: 52, c: 14, p: 0.3, f: 0.2, fb: 2.4, na: 1, k2: 107, mg: 5, fe: 0.1, zn: 0.04, vitC: 5, vitD: 0, omega3: 0.01, gi: 36, cat: 'Buah', emoji: '🍎', tags: ['pectin', 'low-gi'] },
  { name: 'Jeruk', k: 47, c: 12, p: 0.9, f: 0.1, fb: 2.4, na: 0, k2: 181, mg: 10, fe: 0.1, zn: 0.07, vitC: 53, vitD: 0, omega3: 0.02, gi: 40, cat: 'Buah', emoji: '🍊', tags: ['vitamin-c'] },
  { name: 'Mangga', k: 60, c: 15, p: 0.8, f: 0.4, fb: 1.6, na: 1, k2: 168, mg: 10, fe: 0.2, zn: 0.1, vitC: 36, vitD: 0, omega3: 0.03, gi: 56, cat: 'Buah', emoji: '🥭', tags: ['vitamin-a'] },
  { name: 'Alpukado', k: 160, c: 9, p: 2, f: 15, fb: 7, na: 7, k2: 485, mg: 29, fe: 0.6, zn: 0.6, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Buah', emoji: '🥑', tags: ['healthy-fat', 'potassium-rich', 'low-gi'] },
  { name: 'Jambu biji', k: 68, c: 14, p: 2.6, f: 1, fb: 5.4, na: 2, k2: 417, mg: 22, fe: 0.3, zn: 0.2, vitC: 228, vitD: 0, omega3: 0.05, gi: 24, cat: 'Buah', emoji: '🍐', tags: ['vitamin-c-super', 'low-gi'] },
  { name: 'Pepaya', k: 43, c: 11, p: 0.5, f: 0.3, fb: 1.7, na: 8, k2: 257, mg: 21, fe: 0.3, zn: 0.1, vitC: 61, vitD: 0, omega3: 0.02, gi: 40, cat: 'Buah', emoji: '🍈', tags: ['papain', 'vitamin-c'] },
  { name: 'Semangka', k: 30, c: 8, p: 0.6, f: 0.2, fb: 0.4, na: 1, k2: 112, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0.01, gi: 76, cat: 'Buah', emoji: '🍉', tags: ['hydrating', 'lycopene'] },
  { name: 'Melon', k: 34, c: 8, p: 0.8, f: 0.2, fb: 0.9, na: 16, k2: 267, mg: 12, fe: 0.2, zn: 0.1, vitC: 18, vitD: 0, omega3: 0.01, gi: 65, cat: 'Buah', emoji: '🍈', tags: ['hydrating'] },
  { name: 'Anggur', k: 69, c: 18, p: 0.7, f: 0.2, fb: 0.9, na: 2, k2: 191, mg: 7, fe: 0.4, zn: 0.07, vitC: 3, vitD: 0, omega3: 0.05, gi: 53, cat: 'Buah', emoji: '🍇', tags: ['resveratrol'] },
  { name: 'Strawberry', k: 32, c: 7.7, p: 0.7, f: 0.3, fb: 2, na: 1, k2: 153, mg: 13, fe: 0.4, zn: 0.1, vitC: 59, vitD: 0, omega3: 0.07, gi: 25, cat: 'Buah', emoji: '🍓', tags: ['low-gi', 'antioxidant'] },
  { name: 'Blueberry', k: 57, c: 14, p: 0.7, f: 0.3, fb: 2.4, na: 1, k2: 77, mg: 6, fe: 0.3, zn: 0.2, vitC: 10, vitD: 0, omega3: 0.06, gi: 34, cat: 'Buah', emoji: '🫐', tags: ['antioxidant', 'brain-health'] },
  { name: 'Duku', k: 70, c: 18, p: 0.9, f: 0.2, fb: 1, na: 3, k2: 150, mg: 10, fe: 0.2, zn: 0.1, vitC: 8, vitD: 0, omega3: 0, gi: 50, cat: 'Buah', emoji: '🟡', tags: [] },
  { name: 'Rambutan', k: 68, c: 16, p: 0.9, f: 0.2, fb: 0.9, na: 11, k2: 140, mg: 8, fe: 0.2, zn: 0.1, vitC: 5, vitD: 0, omega3: 0, gi: 50, cat: 'Buah', emoji: '🔴', tags: [] },
  { name: 'Salak', k: 82, c: 18, p: 0.8, f: 0.4, fb: 2.3, na: 5, k2: 160, mg: 18, fe: 0.3, zn: 0.2, vitC: 2, vitD: 0, omega3: 0, gi: 55, cat: 'Buah', emoji: '🟤', tags: ['tannin'] },
  { name: 'Nanas', k: 50, c: 13, p: 0.5, f: 0.1, fb: 1.4, na: 1, k2: 109, mg: 12, fe: 0.3, zn: 0.1, vitC: 48, vitD: 0, omega3: 0.02, gi: 59, cat: 'Buah', emoji: '🍍', tags: ['bromelain'] },
  { name: 'Kelapa muda', k: 19, c: 4, p: 0.7, f: 0.2, fb: 1.1, na: 105, k2: 250, mg: 25, fe: 0.3, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Buah', emoji: '🥥', tags: ['electrolyte', 'hydrating'] },
  { name: 'Durian', k: 147, c: 27, p: 1.5, f: 5, fb: 3.8, na: 2, k2: 436, mg: 30, fe: 0.4, zn: 0.3, vitC: 20, vitD: 0, omega3: 0, gi: 55, cat: 'Buah', emoji: '🟡', tags: ['high-calorie'] },

  // MINUMAN
  { name: 'Es teh manis', k: 40, c: 10, p: 0, f: 0, fb: 0, na: 10, k2: 10, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 65, cat: 'Minuman', emoji: '🧊', tags: ['high-sugar'] },
  { name: 'Kopi hitam', k: 2, c: 0, p: 0.3, f: 0, fb: 0, na: 2, k2: 49, mg: 3, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Minuman', emoji: '☕', tags: ['caffeine', 'antioxidant'] },
  { name: 'Jus jeruk', k: 45, c: 10, p: 0.7, f: 0.2, fb: 0.2, na: 0, k2: 200, mg: 11, fe: 0.1, zn: 0.05, vitC: 50, vitD: 0, omega3: 0, gi: 50, cat: 'Minuman', emoji: '🧃', tags: ['vitamin-c'] },
  { name: 'Air mineral', k: 0, c: 0, p: 0, f: 0, fb: 0, na: 0, k2: 0, mg: 0, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Minuman', emoji: '💧', tags: ['hydration'] },
  { name: 'Teh hijau', k: 1, c: 0, p: 0.2, f: 0, fb: 0, na: 1, k2: 20, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Minuman', emoji: '🍵', tags: ['egcg', 'antioxidant'] },
  { name: 'Jus alpukado', k: 160, c: 3, p: 2, f: 15, fb: 3, na: 10, k2: 300, mg: 20, fe: 0.3, zn: 0.3, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Minuman', emoji: '🥤', tags: ['healthy-fat'] },
  { name: 'Susu coklat', k: 83, c: 10, p: 3.2, f: 3.3, fb: 0, na: 60, k2: 150, mg: 12, fe: 0.1, zn: 0.5, vitC: 2, vitD: 1.5, omega3: 0.05, gi: 35, cat: 'Minuman', emoji: '🥤', tags: ['recovery'] },
  { name: 'Smoothie hijau', k: 65, c: 12, p: 3, f: 1, fb: 4, na: 30, k2: 200, mg: 30, fe: 1, zn: 0.3, vitC: 40, vitD: 0, omega3: 0.1, gi: 30, cat: 'Minuman', emoji: '🥤', tags: ['fiber', 'vitamin-c'] },
  { name: 'Coconut water', k: 19, c: 4, p: 0.7, f: 0.2, fb: 1.1, na: 105, k2: 250, mg: 25, fe: 0.3, zn: 0.1, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Minuman', emoji: '🥥', tags: ['electrolyte'] },
  { name: 'Minuman energi', k: 45, c: 11, p: 0, f: 0, fb: 0, na: 50, k2: 5, mg: 2, fe: 0, zn: 0, vitC: 0, vitD: 0, omega3: 0, gi: 60, cat: 'Minuman', emoji: '⚡', tags: ['caffeine', 'high-sugar'] },

  // LAINNYA
  { name: 'Bakso', k: 75, c: 10, p: 5, f: 2, fb: 0.3, na: 400, k2: 80, mg: 15, fe: 0.8, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 50, cat: 'Lainnya', emoji: '🟤', tags: ['moderate-sodium'] },
  { name: 'Soto ayam', k: 48, c: 4, p: 4, f: 2, fb: 0.3, na: 500, k2: 120, mg: 12, fe: 0.5, zn: 0.5, vitC: 2, vitD: 0, omega3: 0.05, gi: 30, cat: 'Lainnya', emoji: '🍲', tags: ['high-sodium'] },
  { name: 'Nasi padang', k: 200, c: 25, p: 8, f: 8, fb: 1, na: 600, k2: 200, mg: 30, fe: 1.5, zn: 1.5, vitC: 5, vitD: 0, omega3: 0.1, gi: 55, cat: 'Lainnya', emoji: '🍛', tags: ['high-sodium', 'spicy'] },
  { name: 'Rawon', k: 80, c: 3, p: 8, f: 3, fb: 0.5, na: 450, k2: 150, mg: 15, fe: 2, zn: 1.2, vitC: 0, vitD: 0, omega3: 0.1, gi: 20, cat: 'Lainnya', emoji: '🍲', tags: ['high-sodium', 'iron-rich'] },
  { name: 'Sate kambing', k: 220, c: 2, p: 20, f: 15, fb: 0.5, na: 500, k2: 180, mg: 25, fe: 2.5, zn: 4, vitC: 0, vitD: 0, omega3: 0.1, gi: 0, cat: 'Lainnya', emoji: '🍢', tags: ['high-sodium'] },
  { name: 'Gado-gado dengan bumbu', k: 180, c: 12, p: 8, f: 12, fb: 5, na: 400, k2: 300, mg: 50, fe: 2, zn: 1.2, vitC: 15, vitD: 0, omega3: 0.2, gi: 25, cat: 'Lainnya', emoji: '🥗', tags: ['balanced', 'peanut-sauce'] },
  { name: 'Pecel', k: 140, c: 15, p: 6, f: 7, fb: 5, na: 350, k2: 250, mg: 40, fe: 1.5, zn: 1, vitC: 20, vitD: 0, omega3: 0.1, gi: 25, cat: 'Lainnya', emoji: '🥗', tags: ['fiber', 'peanut-sauce'] },
  { name: 'Nasi uduk', k: 180, c: 25, p: 3, f: 7, fb: 0.5, na: 200, k2: 50, mg: 15, fe: 0.5, zn: 0.5, vitC: 0, vitD: 0, omega3: 0, gi: 70, cat: 'Lainnya', emoji: '🍚', tags: ['coconut-milk'] },
  { name: 'Bubur kacang hijau', k: 110, c: 20, p: 5, f: 0.5, fb: 3, na: 15, k2: 200, mg: 40, fe: 1.5, zn: 0.8, vitC: 0, vitD: 0, omega3: 0.05, gi: 50, cat: 'Lainnya', emoji: '🥣', tags: ['fiber'] },
  { name: 'Kolak', k: 120, c: 22, p: 2, f: 2, fb: 2, na: 20, k2: 150, mg: 15, fe: 0.5, zn: 0.3, vitC: 5, vitD: 0, omega3: 0, gi: 60, cat: 'Lainnya', emoji: '🥣', tags: ['coconut-milk', 'sugar'] },
  { name: 'Es campur', k: 100, c: 22, p: 1, f: 0.5, fb: 1, na: 30, k2: 80, mg: 10, fe: 0.2, zn: 0.1, vitC: 10, vitD: 0, omega3: 0, gi: 65, cat: 'Lainnya', emoji: '🍧', tags: ['high-sugar'] },
  { name: 'Rendang telur', k: 170, c: 2, p: 12, f: 13, fb: 0.5, na: 400, k2: 150, mg: 20, fe: 1.5, zn: 1.2, vitC: 0, vitD: 1, omega3: 0.1, gi: 0, cat: 'Lainnya', emoji: '🥚', tags: ['high-sodium'] },
  { name: 'Perkedel', k: 170, c: 15, p: 4, f: 10, fb: 1.5, na: 300, k2: 400, mg: 25, fe: 0.8, zn: 0.6, vitC: 5, vitD: 0, omega3: 0.05, gi: 55, cat: 'Lainnya', emoji: '🟤', tags: [] },
  { name: 'Tahu bacem', k: 150, c: 8, p: 10, f: 9, fb: 1, na: 350, k2: 150, mg: 30, fe: 1.2, zn: 1, vitC: 0, vitD: 0, omega3: 0.05, gi: 30, cat: 'Lainnya', emoji: '🟫', tags: ['high-sodium'] },
  { name: 'Tempeh bacem', k: 180, c: 12, p: 14, f: 10, fb: 3, na: 400, k2: 200, mg: 50, fe: 2, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 25, cat: 'Lainnya', emoji: '🟫', tags: ['high-sodium', 'fermented'] },
  { name: 'Sayur asem', k: 35, c: 5, p: 2, f: 0.5, fb: 2, na: 300, k2: 200, mg: 15, fe: 1, zn: 0.3, vitC: 15, vitD: 0, omega3: 0, gi: 20, cat: 'Lainnya', emoji: '🍲', tags: ['high-sodium', 'vitamin-c'] },
  { name: 'Sup ayam', k: 40, c: 3, p: 4, f: 1, fb: 0.5, na: 400, k2: 100, mg: 10, fe: 0.5, zn: 0.5, vitC: 2, vitD: 0.5, omega3: 0.05, gi: 15, cat: 'Lainnya', emoji: '🍲', tags: ['high-sodium', 'hydrating'] },
  { name: 'Protein bar', k: 350, c: 40, p: 20, f: 12, fb: 5, na: 200, k2: 200, mg: 50, fe: 3, zn: 2, vitC: 5, vitD: 0, omega3: 0.5, gi: 40, cat: 'Lainnya', emoji: '🍫', tags: ['on-the-go', 'high-protein'] },
  { name: 'Dark chocolate 85%', k: 600, c: 30, p: 8, f: 50, fb: 10, na: 20, k2: 500, mg: 200, fe: 5, zn: 3, vitC: 0, vitD: 0, omega3: 0.2, gi: 20, cat: 'Lainnya', emoji: '🍫', tags: ['flavonoid', 'magnesium-rich'] },
  { name: 'Madu', k: 304, c: 82, p: 0.3, f: 0, fb: 0.2, na: 4, k2: 52, mg: 2, fe: 0.4, zn: 0.2, vitC: 0.5, vitD: 0, omega3: 0, gi: 58, cat: 'Lainnya', emoji: '🍯', tags: ['natural-sweetener', 'antibacterial'] },
  { name: 'Gula merah', k: 380, c: 95, p: 0.5, f: 0, fb: 0, na: 20, k2: 50, mg: 15, fe: 2, zn: 0.3, vitC: 0, vitD: 0, omega3: 0, gi: 65, cat: 'Lainnya', emoji: '🟤', tags: ['high-sugar'] },
  { name: 'Minyak zaitun', k: 884, c: 0, p: 0, f: 100, fb: 0, na: 2, k2: 1, mg: 0, fe: 0.6, zn: 0, vitC: 0, vitD: 0, omega3: 0.8, gi: 0, cat: 'Lainnya', emoji: '🫒', tags: ['mufa', 'mediterranean'] },
  { name: 'Kelapa parut', k: 660, c: 23, p: 7, f: 64, fb: 16, na: 20, k2: 356, mg: 32, fe: 2, zn: 1.5, vitC: 2, vitD: 0, omega3: 0, gi: 40, cat: 'Lainnya', emoji: '🥥', tags: ['mct', 'high-fat'] },
]
const FCATS = [...new Set(FD.map(f => f.cat))]

/* ═══════════════════════════════════════════════════════
   COMPREHENSIVE EXERCISE DATABASE (60+ activities)
   ═══════════════════════════════════════════════════════ */
const EX: Exer[] = [
  // KARDIO - WALKING
  { name: 'Jalan santai', emoji: '🚶', met: 2.5, int: 'Rendah', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Jalan cepat', emoji: '🚶‍♂️', met: 3.5, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Nordic walking', emoji: '🚶‍♀️', met: 4.8, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Power walking', emoji: '⚡', met: 5.5, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  // KARDIO - RUNNING
  { name: 'Jogging', emoji: '🏃', met: 7.0, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Lari santai', emoji: '🏃‍♂️', met: 8.0, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Lari', emoji: '🏃‍♀️', met: 9.8, int: 'Tinggi', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Lari cepat', emoji: '💨', met: 12.5, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Sprint 100m', emoji: '⚡', met: 18.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Sprint 200m', emoji: '⚡', met: 16.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Sprint 400m', emoji: '🔥', met: 14.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Fartlek', emoji: '🌀', met: 11.5, int: 'Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Tempo run', emoji: '🎯', met: 10.8, int: 'Tinggi', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Interval run', emoji: '🔄', met: 13.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Lari uphill', emoji: '⛰️', met: 12.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Trail running', emoji: '🏔️', met: 10.5, int: 'Tinggi', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Treadmill walk', emoji: '🚶', met: 3.0, int: 'Rendah', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Treadmill run', emoji: '🏃', met: 9.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  // KARDIO - CYCLING
  { name: 'Bersepeda santai', emoji: '🚴', met: 6.0, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Bersepeda moderat', emoji: '🚴‍♂️', met: 8.0, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Bersepeda intens', emoji: '🚴‍♀️', met: 12.0, int: 'Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Bersepeda time trial', emoji: '⏱️', met: 16.0, int: 'Sangat Tinggi', gps: true, cat: 'Kardio', hiit: true },
  { name: 'Indoor cycling', emoji: '🚲', met: 8.5, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Spinning HIIT', emoji: '🔥', met: 14.0, int: 'Sangat Tinggi', gps: false, cat: 'Kardio', hiit: true },
  // KARDIO - SWIMMING
  { name: 'Renang santai', emoji: '🏊', met: 5.8, int: 'Sedang', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Renang freestyle', emoji: '🏊‍♂️', met: 8.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Renang butterfly', emoji: '🦋', met: 11.0, int: 'Sangat Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Renang HIIT', emoji: '🔥', met: 12.0, int: 'Sangat Tinggi', gps: false, cat: 'Kardio', hiit: true },
  // KARDIO - OTHER
  { name: 'Trekking/Hiking', emoji: '🥾', met: 6.0, int: 'Sedang', gps: true, cat: 'Kardio', hiit: false },
  { name: 'Aerobik', emoji: '💃', met: 6.5, int: 'Sedang', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Zumba', emoji: '🕺', met: 6.5, int: 'Sedang', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Skip/tali', emoji: '⏭️', met: 12.3, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Boxing', emoji: '🥊', met: 7.8, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Kickboxing', emoji: '🦵', met: 9.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Rowing', emoji: '🚣', met: 7.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Elliptical', emoji: '🔄', met: 5.0, int: 'Sedang', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Stair climbing', emoji: '🏗️', met: 9.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  { name: 'Jump rope HIIT', emoji: '🔥', met: 14.0, int: 'Sangat Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Burpees', emoji: '💪', met: 12.0, int: 'Sangat Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Mountain climbers', emoji: '⛰️', met: 10.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: true },
  { name: 'Jumping jacks', emoji: '⭐', met: 8.0, int: 'Tinggi', gps: false, cat: 'Kardio', hiit: false },
  // FLEKSIBILITAS
  { name: 'Yoga', emoji: '🧘', met: 2.5, int: 'Rendah', gps: false, cat: 'Fleksibilitas', hiit: false },
  { name: 'Yoga power', emoji: '🧘‍♂️', met: 4.0, int: 'Sedang', gps: false, cat: 'Fleksibilitas', hiit: false },
  { name: 'Pilates', emoji: '🤸', met: 3.0, int: 'Rendah', gps: false, cat: 'Fleksibilitas', hiit: false },
  { name: 'Stretching', emoji: '🤸‍♀️', met: 2.3, int: 'Rendah', gps: false, cat: 'Fleksibilitas', hiit: false },
  { name: 'Tai chi', emoji: '☯️', met: 3.0, int: 'Rendah', gps: false, cat: 'Fleksibilitas', hiit: false },
  // KEKUATAN
  { name: 'Angkat beban ringan', emoji: '🏋️', met: 3.5, int: 'Rendah', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Angkat beban', emoji: '🏋️‍♂️', met: 5.0, int: 'Sedang', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Angkat beban berat', emoji: '🏋️‍♀️', met: 6.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Crossfit', emoji: '💪', met: 8.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: true },
  { name: 'Circuit training', emoji: '🔄', met: 8.5, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: true },
  { name: 'Push-ups', emoji: '💪', met: 8.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Pull-ups', emoji: '💪', met: 8.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Plank', emoji: '🧱', met: 3.8, int: 'Rendah', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Deadlift', emoji: '🏋️', met: 6.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Squat', emoji: '🦵', met: 5.0, int: 'Sedang', gps: false, cat: 'Kekuatan', hiit: false },
  { name: 'Kettlebell swing', emoji: '🔔', met: 9.8, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: true },
  { name: 'Battle ropes', emoji: '🪢', met: 10.0, int: 'Tinggi', gps: false, cat: 'Kekuatan', hiit: true },
  // OLAHRAGA
  { name: 'Futsal', emoji: '⚽', met: 10.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Sepak bola', emoji: '🏆', met: 10.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Basket', emoji: '🏀', met: 6.5, int: 'Sedang', gps: true, cat: 'Olahraga', hiit: false },
  { name: 'Badminton', emoji: '🏸', met: 5.5, int: 'Sedang', gps: false, cat: 'Olahraga', hiit: false },
  { name: 'Tenis', emoji: '🎾', met: 7.3, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: false },
  { name: 'Tenis meja', emoji: '🏓', met: 4.0, int: 'Sedang', gps: false, cat: 'Olahraga', hiit: false },
  { name: 'Voli', emoji: '🏐', met: 4.0, int: 'Sedang', gps: false, cat: 'Olahraga', hiit: false },
  { name: 'Rugby', emoji: '🏈', met: 10.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Panahan', emoji: '🏹', met: 3.5, int: 'Rendah', gps: false, cat: 'Olahraga', hiit: false },
  { name: 'Golf', emoji: '⛳', met: 3.5, int: 'Rendah', gps: true, cat: 'Olahraga', hiit: false },
  { name: 'Panjat tebing', emoji: '🧗', met: 8.0, int: 'Tinggi', gps: false, cat: 'Olahraga', hiit: false },
  { name: 'Skateboard', emoji: '🛹', met: 5.0, int: 'Sedang', gps: true, cat: 'Olahraga', hiit: false },
  // AQUATIK
  { name: 'Water polo', emoji: '🤽', met: 10.0, int: 'Tinggi', gps: false, cat: 'Akuatik', hiit: true },
  { name: 'Selancar', emoji: '🏄', met: 3.0, int: 'Sedang', gps: true, cat: 'Akuatik', hiit: false },
  { name: 'Snorkeling', emoji: '🤿', met: 4.0, int: 'Rendah', gps: true, cat: 'Akuatik', hiit: false },
  // RECOVERY
  { name: 'Menyapu', emoji: '🧹', met: 3.3, int: 'Rendah', gps: false, cat: 'Aktivitas', hiit: false },
  { name: 'Mencuci', emoji: '🧼', met: 2.0, int: 'Rendah', gps: false, cat: 'Aktivitas', hiit: false },
  { name: 'Berkebun', emoji: '🌱', met: 3.8, int: 'Rendah', gps: false, cat: 'Aktivitas', hiit: false },
  { name: 'Bersepeda ke kantor', emoji: '🚲', met: 5.0, int: 'Sedang', gps: true, cat: 'Aktivitas', hiit: false },
  // HIGH-INTENSITY / FUNCTIONAL (Hyrox, CrossFit, dll.)
  { name: 'Hyrox (race)', emoji: '🟥', met: 13.0, int: 'Sangat Tinggi', gps: true, cat: 'HIIT', hiit: true },
  { name: 'CrossFit WOD', emoji: '🏋️‍♀️', met: 12.0, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Functional bootcamp', emoji: '🥾', met: 10.0, int: 'Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Sled push/pull', emoji: '🛷', met: 11.0, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Wall balls', emoji: '🧱', met: 9.0, int: 'Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Rowing erg (sprint)', emoji: '🚣', met: 12.0, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'SkiErg', emoji: '⛷️', met: 11.0, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Assault bike', emoji: '🚴‍♂️', met: 12.5, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Farmer carry', emoji: '🧳', met: 8.0, int: 'Tinggi', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Box jumps', emoji: '📦', met: 10.0, int: 'Sangat Tinggi', gps: false, cat: 'HIIT', hiit: true },
  // TEAM SPORTS (moderate–high)
  { name: 'American football', emoji: '🏈', met: 8.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Bola basket (kompetitif)', emoji: '🏀', met: 8.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Sepak bola (kompetitif)', emoji: '⚽', met: 10.3, int: 'Sangat Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Hoki es', emoji: '🏒', met: 8.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
  { name: 'Handball', emoji: '🤾', met: 8.0, int: 'Tinggi', gps: true, cat: 'Olahraga', hiit: true },
]
const EXCATS = [...new Set(EX.map(e => e.cat))]

/* ═══════════════════════════════════════════════════════
   CHRONIC DISEASE PROTOCOLS (Clinical Grade)
   ═══════════════════════════════════════════════════════ */
const CHRONIC_PROTOCOLS: ChronicProtocol[] = [
  {
    id: 'chf', name: 'CHF (Gagal Jantung Kongestif)', emoji: '❤️‍🩹', color: '#ef4444',
    calAdj: -0.1, protAdj: 1.2, naMax: 1500, kMax: 0, fluidMax: 1500, fluidMin: 1200,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Bayam', 'Brokoli', 'Alpukado', 'Jambu biji', 'Yogurt plain'],
    avoidFoods: ['Nasi goreng', 'Bakso', 'Soto ayam', 'Sate ayam', 'Mie goreng', 'Keju cheddar', 'Es teh manis', 'Nasi padang', 'Gula merah', 'Minuman energi'],
    notes: ['Batasi cairan 1.2-1.5 L/hari', 'Monitor berat badan harian', 'Naik >1kg/hari = tanda retensi', 'Hindari makanan tinggi natrium (>600mg/saji)', 'Makan kecil sering 5-6x/hari', 'Konsultasi dokter untuk suplemen CoQ10'],
    labKeys: ['bnp', 'ntprobnp', 'creatinine', 'gfr', 'potassium', 'sodium', 'alt', 'ast', 'albumin', 'hemoglobin'],
    labLabels: { bnp: 'BNP', ntprobnp: 'NT-proBNP', creatinine: 'Kreatinin', gfr: 'eGFR', potassium: 'Kalium', sodium: 'Natrium', alt: 'ALT', ast: 'AST', albumin: 'Albumin', hemoglobin: 'Hemoglobin' },
    labUnits: { bnp: 'pg/mL', ntprobnp: 'pg/mL', creatinine: 'mg/dL', gfr: 'mL/min', potassium: 'mEq/L', sodium: 'mEq/L', alt: 'U/L', ast: 'U/L', albumin: 'g/dL', hemoglobin: 'g/dL' },
    labRanges: { bnp: [0, 100], ntprobnp: [0, 300], creatinine: [0.6, 1.2], gfr: [60, 120], potassium: [3.5, 5.0], sodium: [135, 145], alt: [7, 56], ast: [10, 40], albumin: [3.5, 5.0], hemoglobin: [12, 17] },
    exerRestrictions: ['Hindari latihan intens tinggi tanpa izin kardiolog', 'Maks Z2 (60-70% HR max)', 'Monitor HR selama latihan', 'Hindari latihan isometrik berat', 'Berhenti jika sesak napas atau nyeri dada'],
  },
  {
    id: 'copd', name: 'COPD', emoji: '🫁', color: '#8b5cf6',
    calAdj: 0.15, protAdj: 1.5, naMax: 2000, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Dada ayam rebus', 'Telur ayam', 'Salmon', 'Yogurt Greek', 'Oatmeal', 'Alpukado', 'Bayam', 'Pisang', 'Jambu biji'],
    avoidFoods: ['Makanan gas (kubis, kacang mentah)', 'Makanan tinggi gula', 'Makanan olahan'],
    notes: ['Kebutuhan kalori meningkat 20-30%', 'Protein tinggi 1.5g/kgBB untuk mencegah kakeksia', 'Makan kecil sering 6x/hari', 'Karbohidrat moderat (40-45% total kalori)', 'Lemak tinggi (35-45%) untuk efisiensi respirasi', 'Suplemen Vitamin D jika defisiensi'],
    labKeys: ['spo2', 'hemoglobin', 'wbc', 'crp', 'albumin', 'creatinine', 'gfr'],
    labLabels: { spo2: 'SpO2', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', crp: 'CRP', albumin: 'Albumin', creatinine: 'Kreatinin', gfr: 'eGFR' },
    labUnits: { spo2: '%', hemoglobin: 'g/dL', wbc: '/uL', crp: 'mg/L', albumin: 'g/dL', creatinine: 'mg/dL', gfr: 'mL/min' },
    labRanges: { spo2: [92, 100], hemoglobin: [12, 17], wbc: [4500, 11000], crp: [0, 5], albumin: [3.5, 5.0], creatinine: [0.6, 1.2], gfr: [60, 120] },
    exerRestrictions: ['Latihan pernapasan pursed-lip wajib', 'Aerobik ringan Z1-Z2', 'Hindari latihan di udara dingin/polutan', 'Pemanasan minimal 10 menit', 'Gunakan bronkodilator sebelum latihan jika diresepkan'],
  },
  {
    id: 'diabetes', name: 'Diabetes Melitus', emoji: '🩸', color: '#2563eb',
    calAdj: -0.15, protAdj: 1.2, naMax: 2000, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Oatmeal', 'Quinoa', 'Nasi merah', 'Tempe kukus', 'Tahu kukus', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Kacang almond', 'Ikan salmon', 'Dada ayam rebus', 'Yogurt plain', 'Whey protein'],
    avoidFoods: ['Nasi putih', 'Roti tawar', 'Mie goreng', 'Es teh manis', 'Gula merah', 'Nasi uduk', 'Bubur kacang hijau (manis)', 'Kolak', 'Es campur', 'Minuman energi', 'Pisang matang'],
    notes: ['Pilih makanan GI rendah (<55)', 'Karbo: 40-50% total kalori', 'Serat target 25-35g/hari', 'Protein 1.2-1.5g/kgBB', 'Makan teratur setiap 3-4 jam', 'Monitor gula darah sebelum & sesudah makan', 'HbA1c target <7%'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'creatinine', 'gfr', 'albumin', 'alt'],
    labLabels: { glucose: 'Gula Darah Puasa', hba1c: 'HbA1c', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Trigliserida', creatinine: 'Kreatinin', gfr: 'eGFR', albumin: 'Albumin', alt: 'ALT' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', creatinine: 'mg/dL', gfr: 'mL/min', albumin: 'g/dL', alt: 'U/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], creatinine: [0.6, 1.2], gfr: [60, 120], albumin: [3.5, 5.0], alt: [7, 56] },
    exerRestrictions: ['Latihan resistensi penting untuk sensitivitas insulin', 'Aerobik 150 menit/minggu minimal', 'Hindari latihan jika gula darah >250 mg/dL', 'Bawa karbohidrat cepat selama latihan', 'Monitor gula darah sebelum & sesudah latihan'],
  },
  {
    id: 'ckd', name: 'Gagal Ginjal Kronis', emoji: '🫘', color: '#f97316',
    calAdj: 0, protAdj: 0.6, naMax: 2000, kMax: 2000, fluidMax: 1500, fluidMin: 800,
    specialFoods: ['Nasi putih', 'Telur putih', 'Ikan kod', 'Tahu kukus', 'Wortel', 'Paprika merah', 'Selada', 'Tomat', 'Nanas', 'Semangka'],
    avoidFoods: ['Kacang merah', 'Kacang kedelai', 'Tempe', 'Keju', 'Susu', 'Pisang', 'Jeruk', 'Alpukado', 'Coklat', 'Kacang almond', 'Daging sapi', 'Rendang'],
    notes: ['Protein terbatas 0.6g/kgBB (stadium 3-4)', 'Batasi kalium <2000mg/hari', 'Batasi fosfor', 'Batasi natrium <2000mg/hari', 'Cairan terbatas sesuai urine output + 500mL', 'Gunakan bumbu alami pengganti garam', 'Koordinasi dengan ahli gizi ginjal'],
    labKeys: ['creatinine', 'gfr', 'bun', 'potassium', 'phosphorus', 'calcium', 'sodium', 'hemoglobin', 'albumin', 'alt'],
    labLabels: { creatinine: 'Kreatinin', gfr: 'eGFR', bun: 'BUN', potassium: 'Kalium', phosphorus: 'Fosfor', calcium: 'Kalsium', sodium: 'Natrium', hemoglobin: 'Hemoglobin', albumin: 'Albumin', alt: 'ALT' },
    labUnits: { creatinine: 'mg/dL', gfr: 'mL/min', bun: 'mg/dL', potassium: 'mEq/L', phosphorus: 'mg/dL', calcium: 'mg/dL', sodium: 'mEq/L', hemoglobin: 'g/dL', albumin: 'g/dL', alt: 'U/L' },
    labRanges: { creatinine: [0.6, 1.2], gfr: [60, 120], bun: [7, 20], potassium: [3.5, 5.0], phosphorus: [2.5, 4.5], calcium: [8.5, 10.5], sodium: [135, 145], hemoglobin: [12, 17], albumin: [3.5, 5.0], alt: [7, 56] },
    exerRestrictions: ['Latihan ringan-sedang saja', 'Hindari dehidrasi', 'Monitor tekanan darah', 'Hindari latihan jika edema berat', 'Koordinasi dengan nefrolog'],
  },
  {
    id: 'cancer', name: 'Kanker (Dukungan Nutrisi)', emoji: '🎗️', color: '#ec4899',
    calAdj: 0.2, protAdj: 1.5, naMax: 2500, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Telur ayam', 'Yogurt Greek', 'Oatmeal', 'Quinoa', 'Brokoli', 'Bayam', 'Jambu biji', 'Blueberry', 'Dark chocolate 85%', 'Kacang almond', 'Minyak zaitun', 'Whey protein'],
    avoidFoods: ['Makanan olahan/berpengawet', 'Daging olahan (sosis, nugget)', 'Alkohol', 'Makanan tinggi gula', 'Fast food'],
    notes: ['Kebutuhan kalori meningkat 20-30%', 'Protein tinggi 1.5g/kgBB', 'Omega-3 anti-inflamasi', 'Antioksidan tinggi dari buah & sayur', 'Makan kecil sering jika mual', 'Suplementasi sesuai rekomendasi onkolog', 'Hindari suplemen antioksidan dosis tinggi saat kemoterapi'],
    labKeys: ['hemoglobin', 'wbc', 'platelet', 'albumin', 'crp', 'ldl', 'hdl', 'creatinine', 'gfr', 'alt'],
    labLabels: { hemoglobin: 'Hemoglobin', wbc: 'Leukosit', platelet: 'Trombosit', albumin: 'Albumin', crp: 'CRP', ldl: 'LDL', hdl: 'HDL', creatinine: 'Kreatinin', gfr: 'eGFR', alt: 'ALT' },
    labUnits: { hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', albumin: 'g/dL', crp: 'mg/L', ldl: 'mg/dL', hdl: 'mg/dL', creatinine: 'mg/dL', gfr: 'mL/min', alt: 'U/L' },
    labRanges: { hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], albumin: [3.5, 5.0], crp: [0, 5], ldl: [0, 100], hdl: [40, 100], creatinine: [0.6, 1.2], gfr: [60, 120], alt: [7, 56] },
    exerRestrictions: ['Latihan sesuai kemampuan', 'Hindari jika trombosit <50000', 'Yoga & stretching saat lemah', 'Latihan resistensi ringan saat kuat', 'Koordinasi dengan onkolog'],
  },
  {
    id: 'mental', name: 'Gangguan Mental', emoji: '🧠', color: '#8b5cf6',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Ikan kembung', 'Kacang almond', 'Ubi ungu', 'Bayam', 'Brokoli', 'Dark chocolate 85%', 'Oatmeal', 'Yogurt plain', 'Jambu biji', 'Blueberry', 'Telur ayam', 'Quinoa'],
    avoidFoods: ['Alkohol', 'Kopi berlebihan', 'Gula berlebihan', 'Makanan ultra-olahan', 'Minuman energi'],
    notes: ['Omega-3 (EPA/DHA) 1-2g/hari untuk mood', 'Vitamin D penting untuk depresi', 'Probiotik dari yogurt untuk gut-brain axis', 'Magnesium dari kacang & sayur hijau', 'Zinc penting untuk ansietas', 'Vitamin B-complex dari whole grains', 'Tidur 7-9 jam wajib', 'Latihan aerobik 150 menit/minggu'],
    labKeys: ['vitD', 'vitB12', 'folate', 'tsh', 't4', 'cortisol', 'hemoglobin', 'ferritin', 'alt'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folat', tsh: 'TSH', t4: 'T4 Bebas', cortisol: 'Kortisol', hemoglobin: 'Hemoglobin', ferritin: 'Ferritin', alt: 'ALT' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', tsh: 'mIU/L', t4: 'ng/dL', cortisol: 'ug/dL', hemoglobin: 'g/dL', ferritin: 'ng/mL', alt: 'U/L' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], tsh: [0.4, 4.0], t4: [0.8, 1.8], cortisol: [6, 23], hemoglobin: [12, 17], ferritin: [12, 150], alt: [7, 56] },
    exerRestrictions: ['Yoga & meditasi sangat dianjurkan', 'Aerobik Z1-Z2 untuk mood', 'Latihan di alam terbuka (green exercise)', 'Hindari overtraining', 'Konsistensi lebih penting dari intensitas'],
  },
  {
    id: 'obesity', name: 'Obesitas', emoji: '⚖️', color: '#f59e0b',
    calAdj: -0.25, protAdj: 1.4, naMax: 2000, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Dada ayam rebus', 'Ikan kod', 'Telur putuh', 'Tahu kukus', 'Tempe kukus', 'Oatmeal', 'Quinoa', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Kacang almond', 'Yogurt Greek', 'Whey protein'],
    avoidFoods: ['Nasi goreng', 'Mie goreng', 'Roti tawar', 'Keju cheddar', 'Minuman energi', 'Gula merah', 'Es teh manis', 'Kolak', 'Es campur', 'Fast food', 'Durian'],
    notes: ['Defisit 500-750 kkal/hari untuk penurunan 0.5-1kg/minggu', 'Protein tinggi 1.4g/kgBB untuk mempertahankan otot', 'Serat 30-40g/hari untuk kenyang', 'Makanan GI rendah untuk kontrol nafsu makan', 'Air putih 2.5-3L/hari', 'Hindari minuman berkalori'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'alt', 'ast', 'uricAcid', 'crp'],
    labLabels: { glucose: 'Gula Darah', hba1c: 'HbA1c', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Trigliserida', alt: 'ALT', ast: 'AST', uricAcid: 'Asam Urat', crp: 'CRP' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', alt: 'U/L', ast: 'U/L', uricAcid: 'mg/dL', crp: 'mg/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], alt: [7, 56], ast: [10, 40], uricAcid: [2.5, 7.0], crp: [0, 5] },
    exerRestrictions: ['Mulai dari latihan rendah intensitas', 'Aerobik 200-300 menit/minggu', 'Latihan resistensi 2-3x/minggu', 'HIIT hanya setelah base fitness memadai', 'Hindari aktivitas high-impact pada sendi'],
  },
    {
    id: 'metabolic_x', name: 'Syndrome X / Metabolik', emoji: '⚠️', color: '#ef4444',
    calAdj: -0.2, protAdj: 1.3, naMax: 1500, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Quinoa', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Yogurt Greek', 'Minyak zaitun', 'Dark chocolate 85%'],
    avoidFoods: ['Nasi putih', 'Roti tawar', 'Mie goreng', 'Es teh manis', 'Gula merah', 'Minuman energi', 'Fast food', 'Makanan olahan', 'Nasi uduk'],
    notes: ['Target: turunkan lingkar perut', 'Karbo <45% dari kalori total', 'Lemak sehat 35-40% dari kalori total', 'Hindari fruktosa berlebihan', 'Latihan resistensi untuk sensitivitas insulin', 'Target lingkar perut <90cm (P) / <80cm (W)'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'uricAcid', 'alt', 'ast', 'crp'],
    labLabels: { glucose: 'Gula Darah Puasa', hba1c: 'HbA1c', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Trigliserida', uricAcid: 'Asam Urat', alt: 'ALT', ast: 'AST', crp: 'CRP' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', uricAcid: 'mg/dL', alt: 'U/L', ast: 'U/L', crp: 'mg/L' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], uricAcid: [2.5, 7.0], alt: [7, 56], ast: [10, 40], crp: [0, 5] },
    exerRestrictions: ['Latihan resistensi wajib 2-3x/minggu', 'Aerobik 200-300 menit/minggu', 'HIIT efektif tapi mulai pelan', 'Kombinasi cardio + strength terbaik', 'Target turunkan 5-10% berat badan'],
  },
  {
    id: 'alzheimer', name: 'Alzheimer / Demensia', emoji: '🧠', color: '#818cf8',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Ikan kembung', 'Kacang almond', 'Blueberry', 'Jambu biji', 'Bayam', 'Brokoli', 'Wortel', 'Dark chocolate 85%', 'Minyak zaitun', 'Oatmeal', 'Telur ayam', 'Teh hijau'],
    avoidFoods: ['Makanan ultra-olahan', 'Gula berlebihan', 'Trans fat', 'Alkohol'],
    notes: ['Diet MIND: Mediterranean-DASH Intervention for Neurodegenerative Delay', 'Omega-3 2g+/hari dari ikan berlemak', 'Antioksidan dari berry & sayur berwarna', 'Vitamin E dari kacang almond & minyak zaitun', 'Flavonoid dari dark chocolate & teh hijau', 'Kurangi gula & makanan olahan', 'Aktivitas fisik 150 menit/minggu', 'Stimulasi kognitif & sosial'],
    labKeys: ['vitD', 'vitB12', 'folate', 'tsh', 'homocysteine', 'hemoglobin', 'ferritin'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folat', tsh: 'TSH', homocysteine: 'Homosistein', hemoglobin: 'Hemoglobin', ferritin: 'Ferritin' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', tsh: 'mIU/L', homocysteine: 'umol/L', hemoglobin: 'g/dL', ferritin: 'ng/mL' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], tsh: [0.4, 4.0], homocysteine: [5, 15], hemoglobin: [12, 17], ferritin: [12, 150] },
    exerRestrictions: ['Latihan aerobik ringan-sedang', 'Yoga & tai chi sangat bermanfaat', 'Latihan keseimbangan untuk mencegah jatuh', 'Aktivitas di luar rumah', 'Supervisi selama latihan'],
  },
  {
    id: 'liver', name: 'Gangguan Liver', emoji: '🟤', color: '#f97316',
    calAdj: 0.1, protAdj: 1.2, naMax: 2000, kMax: 0, fluidMax: 2000, fluidMin: 1500,
    specialFoods: ['Oatmeal', 'Kacang almond', 'Dada ayam rebus', 'Ikan kod', 'Tahu kukus', 'Bayam', 'Brokoli', 'Jambu biji', 'Pepaya', 'Whey protein'],
    avoidFoods: ['Alkohol', 'Makanan tinggi gula/fruktosa', 'Makanan goreng', 'Daging berlemak', 'Fast food', 'Makanan olahan'],
    notes: ['Protein 1.2-1.5g/kgBB (kecuali ensefalopati)', 'Kalori cukup untuk mencegah malnutrisi', 'Karbohidrat kompleks', 'Lemak moderat', 'Vitamin B-complex & zinc penting', 'Kopi hitam 2-3 cangkir/hari protektif', 'Hindari suplemen herbal tanpa konsultasi'],
    labKeys: ['alt', 'ast', 'albumin', 'bilirubin', 'platelet', 'gfr', 'creatinine', 'hemoglobin', 'inr'],
    labLabels: { alt: 'ALT', ast: 'AST', albumin: 'Albumin', bilirubin: 'Bilirubin', platelet: 'Trombosit', gfr: 'eGFR', creatinine: 'Kreatinin', hemoglobin: 'Hemoglobin', inr: 'INR' },
    labUnits: { alt: 'U/L', ast: 'U/L', albumin: 'g/dL', bilirubin: 'mg/dL', platelet: '/uL', gfr: 'mL/min', creatinine: 'mg/dL', hemoglobin: 'g/dL', inr: '' },
    labRanges: { alt: [7, 56], ast: [10, 40], albumin: [3.5, 5.0], bilirubin: [0.1, 1.2], platelet: [150000, 400000], gfr: [60, 120], creatinine: [0.6, 1.2], hemoglobin: [12, 17], inr: [0.8, 1.2] },
    exerRestrictions: ['Latihan ringan-sedang', 'Monitor enzim hati', 'Hindari latihan intens jika bilirubin tinggi', 'Koordinasi dengan hepatolog'],
  },
  {
    id: 'hd', name: 'Pasien Indikasi HD', emoji: '💉', color: '#ef4444',
    calAdj: 0.1, protAdj: 1.2, naMax: 2000, kMax: 2500, fluidMax: 1000, fluidMin: 500,
    specialFoods: ['Nasi putih', 'Telur putuh', 'Ikan kod', 'Tahu kukus', 'Wortel', 'Selada', 'Nanas', 'Semangka'],
    avoidFoods: ['Kacang merah', 'Kacang kedelai', 'Tempe', 'Keju', 'Susu', 'Pisang', 'Jeruk', 'Alpukat', 'Daging merah'],
    notes: ['Protein 1.2g/kgBB (kebutuhan meningkat karena kehilangan saat HD)', 'Kalori 30-35 kkal/kgBB', 'Kalium terbatas <2500mg/hari', 'Fosfor terbatas 800-1000mg/hari', 'Cairan sangat terbatas: urine output + 500mL', 'Timbang berat badan sebelum & sesudah HD', 'Makan tinggi protein sesudah HD'],
    labKeys: ['creatinine', 'gfr', 'bun', 'potassium', 'phosphorus', 'calcium', 'hemoglobin', 'albumin', 'ferritin', 'uricAcid'],
    labLabels: { creatinine: 'Kreatinin', gfr: 'eGFR', bun: 'BUN', potassium: 'Kalium', phosphorus: 'Fosfor', calcium: 'Kalsium', hemoglobin: 'Hemoglobin', albumin: 'Albumin', ferritin: 'Ferritin', uricAcid: 'Asam Urat' },
    labUnits: { creatinine: 'mg/dL', gfr: 'mL/min', bun: 'mg/dL', potassium: 'mEq/L', phosphorus: 'mg/dL', calcium: 'mg/dL', hemoglobin: 'g/dL', albumin: 'g/dL', ferritin: 'ng/mL', uricAcid: 'mg/dL' },
    labRanges: { creatinine: [0.6, 1.2], gfr: [60, 120], bun: [7, 20], potassium: [3.5, 5.0], phosphorus: [2.5, 4.5], calcium: [8.5, 10.5], hemoglobin: [10, 17], albumin: [3.5, 5.0], ferritin: [12, 150], uricAcid: [2.5, 7.0] },
    exerRestrictions: ['Latihan sangat ringan hari HD', 'Latihan di hari non-HD bisa sedang', 'Hindari akses HD terkena tekanan', 'Monitor tekanan darah', 'Koordinasi dengan nefrolog'],
  },
  {
    id: 'substance', name: 'Pengguna Alkohol/Rokok/Narkoba', emoji: '🚭', color: '#ef4444',
    calAdj: 0, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3500, fluidMin: 2000,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Telur ayam', 'Oatmeal', 'Bayam', 'Brokoli', 'Jambu biji', 'Blueberry', 'Kacang almond', 'Yogurt Greek', 'Dark chocolate 85%', 'Minyak zaitun'],
    avoidFoods: ['Alkohol', 'Makanan tinggi gula', 'Makanan olahan', 'Fast food', 'Minuman energi'],
    notes: ['Protein tinggi 1.5g/kgBB untuk reparasi jaringan', 'Antioksidan tinggi untuk oxidative stress', 'Vitamin B-complex (terutama B1, B6, B12)', 'Vitamin C 500-1000mg/hari', 'Zinc & magnesium suplementasi', 'Omega-3 2-3g/hari', 'Hidrasi tinggi 2.5-3.5L/hari', 'Makan teratur untuk stabilkan gula darah'],
    labKeys: ['alt', 'ast', 'ggt', 'albumin', 'hemoglobin', 'wbc', 'platelet', 'crp', 'vitB12', 'folate'],
    labLabels: { alt: 'ALT', ast: 'AST', ggt: 'GGT', albumin: 'Albumin', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', platelet: 'Trombosit', crp: 'CRP', vitB12: 'Vitamin B12', folate: 'Folat' },
    labUnits: { alt: 'U/L', ast: 'U/L', ggt: 'U/L', albumin: 'g/dL', hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', crp: 'mg/L', vitB12: 'pg/mL', folate: 'ng/mL' },
    labRanges: { alt: [7, 56], ast: [10, 40], ggt: [5, 40], albumin: [3.5, 5.0], hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], crp: [0, 5], vitB12: [200, 900], folate: [3, 20] },
    exerRestrictions: ['Mulai bertahap dari latihan ringan', 'Aerobik untuk mengurangi craving', 'Latihan resistensi untuk membangun kembali otot', 'Yoga & meditasi untuk recovery mental', 'Koordinasi dengan dokter rehabilitasi'],
  },
  {
    id: 'stroke', name: 'Stroke', emoji: '🧠', color: '#ef4444',
    calAdj: 0, protAdj: 1.2, naMax: 1500, kMax: 0, fluidMax: 2000, fluidMin: 1500,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Quinoa', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Minyak zaitun', 'Yogurt plain'],
    avoidFoods: ['Makanan tinggi natrium', 'Makanan olahan', 'Gula berlebihan', 'Trans fat', 'Alkohol'],
    notes: ['Diet Mediteranean sangat direkomendasikan', 'Natrium <1500mg untuk kontrol tekanan darah', 'Kalium tinggi dari buah & sayur', 'Omega-3 2g+/hari', 'Serat 25-30g/hari', 'Fokus pada rehabilitasi & nutrisi', 'Makanan lunak jika ada dysphagia'],
    labKeys: ['systolic', 'ldl', 'hdl', 'totalCholesterol', 'triglycerides', 'glucose', 'hba1c', 'crp', 'homocysteine'],
    labLabels: { systolic: 'systolic', ldl: 'LDL', hdl: 'HDL', totalCholesterol: 'Kolestrol Total', triglycerides: 'Trigliserida', glucose: 'Gula Darah', hba1c: 'HbA1c', crp: 'CRP', homocysteine: 'Homosistein' },
    labUnits: { systolic: 'mmHg', ldl: 'mg/dL', hdl: 'mg/dL', totalCholesterol: 'mg/dL', triglycerides: 'mg/dL', glucose: 'mg/dL', hba1c: '%', crp: 'mg/L', homocysteine: 'umol/L' },
    labRanges: { systolic: [90, 130], ldl: [0, 100], hdl: [40, 100], totalCholesterol: [0, 200], triglycerides: [0, 150], glucose: [70, 100], hba1c: [0, 6.5], crp: [0, 5], homocysteine: [5, 15] },
    exerRestrictions: ['Fisioterapi terstruktur wajib', 'Latihan sesuai kemampuan', 'Latihan keseimbangan penting', 'Hindari latihan tanpa pengawasan', 'Koordinasi dengan tim rehabilitasi'],
  },
  {
    id: 'epilepsy', name: 'Epilepsi', emoji: '⚡', color: '#f59e0b',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Dada ayam rebus', 'Salmon', 'Telur ayam', 'Bayam', 'Brokoli', 'Alpukado', 'Kacang almond', 'Minyak zaitun', 'Yogurt plain'],
    avoidFoods: ['Alkohol', 'Kafein berlebihan', 'Minuman energi', 'Gula berlebihan'],
    notes: ['Diet Ketogenik bisa dipertimbangkan (dengan pengawasan)', 'Makan teratur untuk stabilkan gula darah', 'Tidur cukup 7-9 jam (kurang tidur trigger)', 'Stress management penting', 'Vitamin D & magnesium suplementasi', 'Koordinasi dengan neurolog untuk diet khusus'],
    labKeys: ['glucose', 'sodium', 'calcium', 'magnesium', 'vitD', 'alt', 'ast'],
    labLabels: { glucose: 'Gula Darah', sodium: 'Natrium', calcium: 'Kalsium', magnesium: 'Magnesium', vitD: 'Vitamin D', alt: 'ALT', ast: 'AST' },
    labUnits: { glucose: 'mg/dL', sodium: 'mEq/L', calcium: 'mg/dL', magnesium: 'mg/dL', vitD: 'ng/mL', alt: 'U/L', ast: 'U/L' },
    labRanges: { glucose: [70, 100], sodium: [135, 145], calcium: [8.5, 10.5], magnesium: [1.7, 2.2], vitD: [30, 100], alt: [7, 56], ast: [10, 40] },
    exerRestrictions: ['Hindari latihan sendirian', 'Hindari olahraga air tanpa pengawasan', 'Yoga & aerobik ringan aman', 'Hindari overtraining & dehidrasi', 'Koordinasi dengan neurolog'],
  },
  {
    id: 'ms', name: 'Multiple Sclerosis', emoji: '🧬', color: '#8b5cf6',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Minyak zaitun', 'Dark chocolate 85%', 'Yogurt plain', 'Teh hijau'],
    avoidFoods: ['Makanan olahan', 'Gula berlebihan', 'Trans fat', 'Susu tinggi lemak (kontroversial)', 'Alkohol'],
    notes: ['Diet anti-inflamasi (mirip Mediteranean)', 'Vitamin D sangat penting (target 50-80 ng/mL)', 'Omega-3 2-3g/hari', 'Probiotik untuk gut-brain axis', 'Hindari panas berlebihan (heat sensitivity)', 'Biotin bisa interaksi dengan beberapa obat MS', 'Hidrasi tinggi 2.5-3L/hari'],
    labKeys: ['vitD', 'vitB12', 'folate', 'crp', 'ldl', 'hdl', 'alt', 'ast'],
    labLabels: { vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folat', crp: 'CRP', ldl: 'LDL', hdl: 'HDL', alt: 'ALT', ast: 'AST' },
    labUnits: { vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', crp: 'mg/L', ldl: 'mg/dL', hdl: 'mg/dL', alt: 'U/L', ast: 'U/L' },
    labRanges: { vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], crp: [0, 5], ldl: [0, 100], hdl: [40, 100], alt: [7, 56], ast: [10, 40] },
    exerRestrictions: ['Latihan sangat bermanfaat untuk MS', 'Yoga & stretching untuk fleksibilitas', 'Aerobik ringan Z1-Z2', 'Hindari panas berlebihan', 'Latihan di air (aquatic therapy) sangat baik', 'Koordinasi dengan neurolog'],
  },
  {
    id: 'ht', name: 'Hipertensi', emoji: '💓', color: '#ef4444',
    calAdj: -0.1, protAdj: 1.0, naMax: 1500, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Bayam', 'Brokoli', 'Pisang', 'Alpukado', 'Kacang almond', 'Salmon', 'Oatmeal', 'Jambu biji', 'Yogurt plain', 'Minyak zaitun', 'Wortel'],
    avoidFoods: ['Nasi goreng', 'Bakso', 'Soto ayam', 'Sate ayam', 'Mie goreng', 'Keju', 'Nasi padang', 'Es teh manis', 'Makanan olahan', 'Fast food'],
    notes: ['Diet DASH sangat direkomendasikan', 'Natrium <1500mg/hari', 'Kalium tinggi 3500-5000mg/hari', 'Kalsium 1000-1300mg/hari', 'Magnesium 300-500mg/hari', 'Serat 25-30g/hari', 'Batasi alkohol', 'Diet Mediteranean juga efektif'],
    labKeys: ['systolic', 'potassium', 'sodium', 'creatinine', 'gfr', 'totalCholesterol', 'ldl', 'hdl', 'glucose', 'uricAcid'],
    labLabels: { systolic: 'systolic', potassium: 'Kalium', sodium: 'Natrium', creatinine: 'Kreatinin', gfr: 'eGFR', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', glucose: 'Gula Darah', uricAcid: 'Asam Urat' },
    labUnits: { systolic: 'mmHg', potassium: 'mEq/L', sodium: 'mEq/L', creatinine: 'mg/dL', gfr: 'mL/min', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', glucose: 'mg/dL', uricAcid: 'mg/dL' },
    labRanges: { systolic: [90, 130], potassium: [3.5, 5.0], sodium: [135, 145], creatinine: [0.6, 1.2], gfr: [60, 120], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], glucose: [70, 100], uricAcid: [2.5, 7.0] },
    exerRestrictions: ['Aerobik 150 menit/minggu minimal', 'Latihan resistensi moderat 2-3x/minggu', 'Hindari latihan isometrik berat', 'Hindari latihan Valsalva', 'Monitor tekanan darah sebelum latihan'],
  },
  {
    id: 'asthma', name: 'Asma', emoji: '🫁', color: '#06b6d4',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Kacang almond', 'Yogurt plain', 'Telur ayam', 'Minyak zaitun'],
    avoidFoods: ['Makanan yang trigger alergi (individual)', 'Makanan tinggi sulfit', 'Makanan olahan dengan pengawet'],
    notes: ['Diet anti-inflamasi', 'Omega-3 2-3g/hari', 'Vitamin D suplementasi jika defisiensi', 'Magnesium 300-500mg/hari (bronkodilator alami)', 'Antioksidan dari buah & sayur berwarna', 'Probiotik dari yogurt', 'Hindari makanan trigger individual'],
    labKeys: ['spo2', 'hemoglobin', 'wbc', 'eosinophils', 'ige', 'crp', 'vitD'],
    labLabels: { spo2: 'SpO2', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', eosinophils: 'Eosinofil', ige: 'IgE Total', crp: 'CRP', vitD: 'Vitamin D' },
    labUnits: { spo2: '%', hemoglobin: 'g/dL', wbc: '/uL', eosinophils: '%', ige: 'IU/mL', crp: 'mg/L', vitD: 'ng/mL' },
    labRanges: { spo2: [95, 100], hemoglobin: [12, 17], wbc: [4500, 11000], eosinophils: [0, 5], ige: [0, 100], crp: [0, 5], vitD: [30, 100] },
    exerRestrictions: ['Pemanasan minimal 10-15 menit', 'Gunakan bronkodilator sebelum latihan', 'Hindari latihan di udara dingin/kering', 'Aerobik Z1-Z2 aman', 'Renang sangat baik (udara lembab)', 'Berhenti jika ada gejala'],
  },
  {
    id: 'ra', name: 'Rheumatoid Arthritis', emoji: '🦴', color: '#f97316',
    calAdj: 0, protAdj: 1.2, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Ikan kembung', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukado', 'Minyak zaitun', 'Dark chocolate 85%', 'Teh hijau', 'Kunyit/turmeric'],
    avoidFoods: ['Gula berlebihan', 'Makanan olahan', 'Trans fat', 'Makanan tinggi omega-6', 'Alkohol', 'Merah (nightshade - kontroversial)'],
    notes: ['Diet anti-inflamasi prioritas utama', 'Omega-3 3-4g/hari (dosis anti-inflamasi)', 'Turmeric/curcumin 500-1000mg/hari', 'Vitamin D target 40-60 ng/mL', 'Hindari omega-6 berlebihan', 'Serat 25-30g/hari', 'Protein 1.2g/kgBB'],
    labKeys: ['crp', 'esr', 'rheumatoid_factor', 'hemoglobin', 'wbc', 'platelet', 'alt', 'ast', 'vitD'],
    labLabels: { crp: 'CRP', esr: 'LED', rheumatoid_factor: 'Faktor Reumatoid', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', platelet: 'Trombosit', alt: 'ALT', ast: 'AST', vitD: 'Vitamin D' },
    labUnits: { crp: 'mg/L', esr: 'mm/jam', rheumatoid_factor: 'IU/mL', hemoglobin: 'g/dL', wbc: '/uL', platelet: '/uL', alt: 'U/L', ast: 'U/L', vitD: 'ng/mL' },
    labRanges: { crp: [0, 5], esr: [0, 20], rheumatoid_factor: [0, 14], hemoglobin: [12, 17], wbc: [4500, 11000], platelet: [150000, 400000], alt: [7, 56], ast: [10, 40], vitD: [30, 100] },
    exerRestrictions: ['Latihan sangat penting untuk RA', 'Latihan rentang gerak harian', 'Aerobik ringan saat flare', 'Latihan resistensi saat remisi', 'Hidroterapi sangat baik', 'Hindari latihan sendi yang inflamasi'],
  },
  {
    id: 'crohn', name: "Crohn's Disease", emoji: '🫄', color: '#f97316',
    calAdj: 0.2, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Telur ayam', 'Oatmeal', 'Nasi putih', 'Alpukado', 'Kacang almond', 'Yogurt plain', 'Whey protein', 'Pisang matang'],
    avoidFoods: ['Makanan tinggi serat saat flare', 'Makanan pedas', 'Susu (jika intoleran)', 'Kacang mentah', 'Buah dengan kulit'],
    notes: ['Kebutuhan kalori meningkat 20-30%', 'Protein 1.5g/kgBB', 'Low-residue diet saat flare', 'Normal diet saat remisi', 'Suplementasi iron, B12, vitamin D, zinc', 'Hindari trigger food individual', 'Makan kecil sering 6x/hari', 'Enteral nutrition jika oral tidak memadai'],
    labKeys: ['crp', 'esr', 'hemoglobin', 'wbc', 'albumin', 'ferritin', 'vitB12', 'folate', 'vitD', 'calcium', 'zinc'],
    labLabels: { crp: 'CRP', esr: 'LED', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', albumin: 'Albumin', ferritin: 'Ferritin', vitB12: 'Vitamin B12', folate: 'Folat', vitD: 'Vitamin D', calcium: 'Kalsium', zinc: 'Zinc' },
    labUnits: { crp: 'mg/L', esr: 'mm/jam', hemoglobin: 'g/dL', wbc: '/uL', albumin: 'g/dL', ferritin: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', vitD: 'ng/mL', calcium: 'mg/dL', zinc: 'ug/dL' },
    labRanges: { crp: [0, 5], esr: [0, 20], hemoglobin: [12, 17], wbc: [4500, 11000], albumin: [3.5, 5.0], ferritin: [12, 150], vitB12: [200, 900], folate: [3, 20], vitD: [30, 100], calcium: [8.5, 10.5], zinc: [66, 110] },
    exerRestrictions: ['Latihan ringan saat flare', 'Latihan normal saat remisi', 'Aerobik ringan Z1-Z2', 'Hindari latihan high-impact saat flare', 'Koordinasi dengan gastroenterolog'],
  },
  {
    id: 'uc', name: 'Ulcerative Colitis', emoji: '🫄', color: '#f97316',
    calAdj: 0.2, protAdj: 1.5, naMax: 2300, kMax: 0, fluidMax: 3000, fluidMin: 2000,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Telur ayam', 'Oatmeal', 'Nasi putih', 'Alpukado', 'Yogurt plain', 'Whey protein', 'Pisang matang', 'Pepaya'],
    avoidFoods: ['Makanan tinggi serat saat flare', 'Makanan pedas', 'Kopi', 'Alkohol', 'Susu (jika intoleran)', 'Makanan tinggi gula'],
    notes: ['Kebutuhan kalori meningkat 20-30%', 'Protein 1.5g/kgBB', 'Low-residue diet saat flare', 'Normal diet saat remisi', 'Suplementasi iron, B12, vitamin D, zinc', 'Hindari trigger food individual', 'Makan kecil sering', 'Hidrasi tinggi terutama saat diare'],
    labKeys: ['crp', 'esr', 'hemoglobin', 'wbc', 'albumin', 'ferritin', 'vitB12', 'folate', 'vitD', 'calcium', 'zinc'],
    labLabels: { crp: 'CRP', esr: 'LED', hemoglobin: 'Hemoglobin', wbc: 'Leukosit', albumin: 'Albumin', ferritin: 'Ferritin', vitB12: 'Vitamin B12', folate: 'Folat', vitD: 'Vitamin D' },
    labUnits: { crp: 'mg/L', esr: 'mm/jam', hemoglobin: 'g/dL', wbc: '/uL', albumin: 'g/dL', ferritin: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', vitD: 'ng/mL' },
    labRanges: { crp: [0, 5], esr: [0, 20], hemoglobin: [12, 17], wbc: [4500, 11000], albumin: [3.5, 5.0], ferritin: [12, 150], vitB12: [200, 900], folate: [3, 20], vitD: [30, 100] },
    exerRestrictions: ['Latihan ringan saat flare', 'Latihan normal saat remisi', 'Hindari dehidrasi', 'Aerobik ringan Z1-Z2', 'Koordinasi dengan gastroenterolog'],
  },
  {
    id: 'presbyacusis', name: 'Presbiakusis', emoji: '👂', color: '#06b6d4',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Salmon', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Dark chocolate 85%', 'Telur ayam', 'Oatmeal', 'Minyak zaitun'],
    avoidFoods: ['Makanan ultra-olahan', 'Gula berlebihan'],
    notes: ['Antioksidan tinggi untuk melindungi sel rambut pendengaran', 'Omega-3 2g/hari', 'Magnesium penting untuk fungsi saraf', 'Zinc untuk indera pendengaran', 'Vitamin B-complex', 'Kurangi paparan kebisingan', 'Kontrol tekanan darah (HT memperburuk presbiakusis)'],
    labKeys: ['systolic', 'vitD', 'vitB12', 'folate', 'magnesium', 'zinc'],
    labLabels: { systolic: 'systolic', vitD: 'Vitamin D', vitB12: 'Vitamin B12', folate: 'Folat', magnesium: 'Magnesium', zinc: 'Zinc' },
    labUnits: { systolic: 'mmHg', vitD: 'ng/mL', vitB12: 'pg/mL', folate: 'ng/mL', magnesium: 'mg/dL', zinc: 'ug/dL' },
    labRanges: { systolic: [90, 130], vitD: [30, 100], vitB12: [200, 900], folate: [3, 20], magnesium: [1.7, 2.2], zinc: [66, 110] },
    exerRestrictions: ['Latihan aerobik untuk sirkulasi', 'Yoga & meditasi untuk stress reduction', 'Hindari latihan dengan kebisingan berlebihan', 'Gunakan ear protection jika perlu'],
  },
]

/* ═══════════════════════════════════════════════════════
   CALCULATIONS
   ═══════════════════════════════════════════════════════ */
const ACT_L = ['Sedentari', 'Ringan', 'Sedang', 'Aktif', 'Sangat aktif']
const ACT_M = [1.2, 1.375, 1.55, 1.725, 1.9]
const getBmi = (w: number, h: number) => w / ((h / 100) ** 2)
const getBmr = (w: number, h: number, a: number, g: string) => g === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
const getTdee = (b: number, l: number) => b * (ACT_M[l] ?? 1.2)
const getMetBurn = (met: number, kg: number, min: number) => Math.round(met * kg * (min / 60))
const bmiInfo = (v: number) => v < 18.5 ? { l: 'Kurus', c: C.blue } : v < 23 ? { l: 'Normal', c: C.ok } : v < 25 ? { l: 'Berlebih', c: C.warn } : v < 30 ? { l: 'Obesitas I', c: C.org } : { l: 'Obesitas II', c: C.bad }
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
function totalDist(pts: GP[]) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng); return d }
function mapSVG(pts: GP[], w: number, h: number, pad: number) {
  if (!pts.length) return [{ x: w / 2, y: h / 2 }]
  const las = pts.map(p => p.lat); const lns = pts.map(p => p.lng)
  const minLa = Math.min(...las); const maxLa = Math.max(...las)
  const minLo = Math.min(...lns); const maxLo = Math.max(...lns)
  const rLa = (maxLa - minLa) || 0.002; const rLo = (maxLo - minLo) || 0.002
  const s = Math.min((w - pad * 2) / rLo, (h - pad * 2) / rLa)
  return pts.map(p => ({
    x: pad + (p.lng - minLo) * s + ((w - pad * 2) - rLo * s) / 2,
    y: pad + (maxLa - p.lat) * s + ((h - pad * 2) - rLa * s) / 2,
  }))
}
function makePath(m: { x: number; y: number }[]) {
  if (m.length < 2) return ''
  return 'M' + m[0].x.toFixed(1) + ',' + m[0].y.toFixed(1) + m.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('')
}

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
    if (na > activeProtocol.naMax) add('\u26A0\uFE0F', 'Natrium melebihi batas', `${Math.round(na)}mg / ${activeProtocol.naMax}mg. Kurangi makanan tinggi garam & olahan.`, 0, C.bad)
    if (activeProtocol.kMax > 0) {
      const potas = FD.reduce((a, f) => a + f.k2, 0) * 0.01
      if (potas > activeProtocol.kMax) add('\u26A0\uFE0F', 'Kalium tinggi', `Perhatikan asupan kalium. Batas: ${activeProtocol.kMax}mg/hari.`, 0, C.warn)
    }
    if (water < activeProtocol.fluidMin) add('\u26A0\uFE0F', 'Cairan kurang', `${water}mL / min ${activeProtocol.fluidMin}mL. Tambah asupan cairan.`, 0, C.bad)
    if (water > activeProtocol.fluidMax) add('\u26A0\uFE0F', 'Cairan berlebih', `${water}mL / max ${activeProtocol.fluidMax}mL. Kurangi cairan.`, 0, C.bad)
    activeProtocol.notes.slice(0, 3).forEach((n, i) => add('\u{1F4CB}', activeProtocol.name + ' #' + (i + 1), n, 1, activeProtocol.color))
  }

  // BMI
  if (bmi < 18.5) add('\u26A0\uFE0F', 'Berat kurang', `BMI ${bmi.toFixed(1)}. Tambah +${Math.round(tdee * 0.15)} kkal/hari.`, 0, C.blue)
  else if (bmi >= 25 && bmi < 30) add('\u26A0\uFE0F', 'Berat berlebih', `BMI ${bmi.toFixed(1)}. Defisit ${Math.round(tdee * 0.2)} kkal/hari.`, 0, C.org)
  else if (bmi >= 30) add('\u{1F6A8}', 'Obesitas', `BMI ${bmi.toFixed(1)}. Konsultasi dokter.`, 0, C.bad)
  else if (!activeProtocol) add('\u2705', 'BMI ideal', `BMI ${bmi.toFixed(1)} - pertahankan.`, 3, C.ok)

  // Calories
  const diff = intake - tdee; const pct = tdee > 0 ? diff / tdee : 0
  if (pct > 0.2) add('\u{1F37D}\uFE0F', 'Surplus tinggi', `+${Math.round(diff)} kkal di atas TDEE.`, 1, C.warn)
  else if (pct < -0.3) add('\u{1F4C9}', 'Defisit ekstrem', `-${Math.round(Math.abs(diff))} kkal. Risiko metabolism melambat.`, 1, C.warn)

  // Protein
  const pk = b.w > 0 ? prot / b.w : 0
  const protTarget = activeProtocol ? activeProtocol.protAdj : (b.goal === 'gain' ? 1.6 : 1.2)
  if (pk < protTarget * 0.8) add('\u{1F969}', 'Protein rendah', `${prot}g (${pk.toFixed(1)}g/kg). Target ${protTarget}g/kg.`, 1, C.pur)
  else if (pk >= protTarget) add('\u2705', 'Protein memadai', `${prot}g (${pk.toFixed(1)}g/kg). Cukup.`, 3, C.ok)

  // Fiber
  if (fiber < 20) add('\u{1F96C}', 'Serat kurang', `${Math.round(fiber)}g - target 25g+.`, 2, C.warn)

  // Sodium
  if (na > 2300 && (!activeProtocol || activeProtocol.naMax >= 2300)) add('\u{1F4A7}', 'Natrium tinggi', `${Math.round(na)}mg - target <2300mg.`, 2, C.warn)

  // Omega-3
  if (omega3 < 1.0) add('\u{1F41F}', 'Omega-3 rendah', `${omega3.toFixed(1)}g - target 1-3g/hari untuk anti-inflamasi.`, 2, C.blue)

  // Exercise
  if (metH < 3.75) add('\u{1F3C3}', 'Olahraga kurang', `${metH.toFixed(1)} MET-jam/minggu. Target 7.5.`, 0, C.org)
  else if (metH >= 7.5) add('\u2705', 'Olahraga memadai', `${metH.toFixed(1)} MET-jam/minggu.`, 3, C.ok)

  // Sleep
  if (sleep < 6) add('\u{1F319}', 'Tidur kurang', `${sleep} jam - target 7-8 jam.`, 0, C.ind)
  else if (sleep >= 7 && sleep <= 9) add('\u2705', 'Tidur optimal', `${sleep} jam.`, 3, C.ok)

  // Water
  if (water < 1500 && (!activeProtocol || activeProtocol.fluidMin < 1500)) add('\u{1F4A7}', 'Hidrasi kurang', `${water}mL - target 2000mL+.`, 2, C.blue)

  // Sun
  if (!sun) add('\u2600\uFE0F', 'Tanpa matahari', '10-20 menit pagi untuk vitamin D.', 3, '#eab308')

  // Vitals
  if (hr != null && hr > 80) add('💓', 'HR istirahat tinggi', `${hr} bpm - optimal <75.`, 1, C.bad)
  if (sys != null && sys > 130) add('\u{1FEA7}', 'Tekanan darah tinggi', `${sys} mmHg.`, 0, C.bad)
  if (spo2 != null && spo2 < 96) add('\u{1F9E1}', 'SpO2 rendah', `${spo2}% - normal >=97%.`, 0, C.bad)

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
        <SectionTitle icon={<span className="text-lg">{'\u2696\uFE0F'}</span>} title="Profil Tubuh" />
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">BMR kkal</div>
          <div className="mt-1 text-[10px] text-neutral-400">{b.g === 'M' ? 'Laki-laki' : 'Perempuan'}, {b.age} th</div>
        </div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-2xl font-extrabold" style={{ color: '#0B7A4B' }}><ANum v={Math.round(td)} /></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">TDEE kkal</div>
          <div className="mt-1 text-[10px] text-neutral-400">{ACT_L[b.act]}</div>
        </div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center">
          <div className="text-lg font-extrabold" style={{ color: intakeKcal > rec * 1.1 ? C.org : intakeKcal < rec * 0.8 ? C.blue : C.ok }}>
            <ANum v={intakeKcal} />/<ANum v={rec} />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Kkal hari ini</div>
          <div className="mt-1 text-[10px]" style={{ color: intakeKcal > rec ? C.org : C.ok }}>
            {intakeKcal > rec ? '+' + (intakeKcal - rec) + ' surplus' : (rec - intakeKcal) + ' tersisa'}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
        {b.w}kg {'\u00B7'} {b.h}cm {'\u00B7'} Target: {b.goal === 'lose' ? 'Turun' : b.goal === 'gain' ? 'Naik' : 'Pertahankan'}
      </div>
    </Card>
  )

  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">{'\u270F\uFE0F'}</span>} title="Edit Profil Tubuh" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Berat (kg)"><input className={inputClass} type="number" value={b.w} onChange={e => setB({ ...b, w: +e.target.value })} /></Field>
        <Field label="Tinggi (cm)"><input className={inputClass} type="number" value={b.h} onChange={e => setB({ ...b, h: +e.target.value })} /></Field>
        <Field label="Usia"><input className={inputClass} type="number" value={b.age} onChange={e => setB({ ...b, age: +e.target.value })} /></Field>
        <Field label="Jenis Kelamin"><select className={inputClass} value={b.g} onChange={e => setB({ ...b, g: e.target.value as 'M' | 'F' })}><option value="M">Laki-laki</option><option value="F">Perempuan</option></select></Field>
        <Field label="Aktivitas Harian"><select className={inputClass} value={b.act} onChange={e => setB({ ...b, act: +e.target.value })}>{ACT_L.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></Field>
        <Field label="Goal"><select className={inputClass} value={b.goal} onChange={e => setB({ ...b, goal: e.target.value as Body['goal'] })}><option value="lose">Turun berat</option><option value="maintain">Pertahankan</option><option value="gain">Naik berat</option></select></Field>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEdit(false)} className="h-9 text-xs rounded-xl">Batal</Button>
        <Button onClick={save} className="h-9 text-xs rounded-xl">Simpan</Button>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   2. FOOD TRACKER
   ═══════════════════════════════════════════════════════ */
function FoodTracker({ body, activeProtocol }: { body: Body; activeProtocol?: ChronicProtocol }) {
  const { state, addFood } = useStore()
  const [q, setQ] = useState(''); const [cat, setCat] = useState('Semua'); const [name, setName] = useState(FD[0].name); const [g, setG] = useState(100)
  const todays = state.foods.filter(f => f.date === today())
  const total = todays.reduce((a, f) => ({ k: a.k + f.kcal, c: a.c + f.carbs, p: a.p + f.protein, f: a.f + f.fat }), { k: 0, c: 0, p: 0, f: 0 })
  const fiber = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const na = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.na * f.grams / 100 : 0) }, 0)
  const omega3 = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.omega3 * f.grams / 100 : 0) }, 0)
  const rec = Math.round(getTdee(getBmr(body.w, body.h, body.age, body.g), body.act) * (1 + goalAdj(body.goal)))
  const filtered = FD.filter(f => (cat === 'Semua' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase())))
  const fd = FD.find(x => x.name === name) ?? FD[0]; const m = g / 100
  const pv = { k: Math.round(fd.k * m), c: Math.round(fd.c * m), p: Math.round(fd.p * m), f: Math.round(fd.f * m), fb: Math.round(fd.fb * m), na: Math.round(fd.na * m), omega3: +(fd.omega3 * m).toFixed(2) }

  // Highlight foods based on active protocol
  const isRecommended = activeProtocol && activeProtocol.specialFoods.some(sf => fd.name.includes(sf))
  const isAvoided = activeProtocol && activeProtocol.avoidFoods.some(af => fd.name.includes(af))

  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">{'\u{1F37D}\uFE0F'}</span>} title="Nutrisi" subtitle={total.k + '/' + rec + ' kkal hari ini'} />
      <div className="mt-3 flex items-center justify-around">
        {([
          ['Karbo', total.c, Math.round(rec * 0.5 / 4), '#f59e0b'],
          ['Protein', total.p, Math.round(body.w * 1.4), C.ok],
          ['Lemak', total.f, Math.round(rec * 0.3 / 9), '#ef4444'],
          ['Serat', Math.round(fiber), 25, C.pur],
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
          <div className="flex justify-between text-[10px] font-semibold"><span className="text-neutral-500">Natrium</span><span style={{ color: na > 2300 ? C.bad : na > 1500 ? C.warn : C.ok }}>{Math.round(na)}mg</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (na / 2300) * 100) + '%', background: na > 2300 ? C.bad : na > 1500 ? C.warn : C.ok }} /></div>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <div className="flex justify-between text-[10px] font-semibold"><span className="text-neutral-500">Omega-3</span><span style={{ color: omega3 >= 2 ? C.ok : omega3 >= 1 ? C.warn : C.blue }}>{omega3.toFixed(1)}g</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (omega3 / 3) * 100) + '%', background: omega3 >= 2 ? C.ok : omega3 >= 1 ? C.warn : C.blue }} /></div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex-1"><input className={inputClass} placeholder="Cari makanan..." value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className={inputClass + ' w-28'} value={cat} onChange={e => setCat(e.target.value)}><option>Semua</option>{FCATS.map(c => <option key={c}>{c}</option>)}</select>
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
          <div className="flex items-baseline gap-2"><span className="text-sm font-bold text-neutral-800">{fd.emoji} {name}</span><Badge tone="neutral">{fd.cat}</Badge>{fd.gi > 0 && <Badge tone={fd.gi > 70 ? 'high' : fd.gi > 55 ? 'neutral' : 'normal'}>GI {fd.gi}</Badge>}{isRecommended && <Badge tone="brand">Rekomendasi</Badge>}{isAvoided && <Badge tone="high">Hindari</Badge>}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs tabular-nums font-semibold">
            <span style={{ color: '#0B7A4B' }}>{pv.k} kkal</span>
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
        {todays.length === 0 && <Empty e={'\u{1F37D}\uFE0F'} t="Belum ada makanan" />}
        {todays.map(f => { const s = FD.find(x => x.name === f.name); return (
          <div key={f.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-neutral-50">
            <div className="min-w-0 flex-1"><span className="text-sm font-medium">{s ? s.emoji : ''} {f.name}</span><span className="ml-2 text-[10px] text-neutral-400">{f.grams}g</span></div>
            <div className="shrink-0 tabular-nums text-xs"><span className="font-bold" style={{ color: '#0B7A4B' }}>{f.kcal}</span><span className="text-neutral-400 ml-1">kkal</span></div>
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
  const [exType, setExType] = useState(EX[0]); const [exCat, setExCat] = useState('Kardio')
  const [pts, setPts] = useState<GP[]>([]); const [plan, setPlan] = useState<{x: number; y: number}[]>([])
  const [dur, setDur] = useState(0); const [hr, setHr] = useState(0)
  const [gpsErr, setGpsErr] = useState('')
  const wRef = useRef<number | null>(null); const tRef = useRef<number | null>(null)
  const sRef = useRef(0); const svgRef = useRef<SVGSVGElement>(null)
  const dist = totalDist(pts); const mapped = mapSVG(pts, 360, 240, 20); const pathD = makePath(mapped)
  const kcal = getMetBurn(exType.met, body.w, dur / 60); const metH = exType.met * (dur / 3600)
  const filtered = EX.filter(e => e.cat === exCat)

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (mode !== 'planning' || !svgRef.current) return
    const r = svgRef.current.getBoundingClientRect()
    setPlan(p => [...p, { x: ((e.clientX - r.left) / r.width) * 360, y: ((e.clientY - r.top) / r.height) * 240 }])
  }
  function startTrack() {
    if (!exType.gps) { setGpsErr('GPS tidak tersedia. Gunakan mode manual.'); return }
    setGpsErr(''); setMode('tracking'); setPts([]); setDur(0); sRef.current = Date.now()
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    if (!navigator.geolocation) { setGpsErr('GPS tidak didukung browser ini.'); return }
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
  function planPathD() { if (plan.length < 2) return ''; return 'M' + plan[0].x.toFixed(1) + ',' + plan[0].y.toFixed(1) + plan.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('') }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <SectionTitle icon={<span className="text-lg">{'\u{1F5FA}\uFE0F'}</span>} title="GPS Tracker" subtitle="Lacak rute, kecepatan, dan kalori" />
      </div>
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{EXCATS.map(c => <button key={c} onClick={() => { setExCat(c); const f = EX.filter(e => e.cat === c); if (f.length) setExType(f[0]) }} className={'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (exCat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}>{c}</button>)}</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{filtered.map(e => <button key={e.name} onClick={() => setExType(e)} disabled={mode === 'tracking' || mode === 'paused'} className={'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 ' + (exType.name === e.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300')}>{e.emoji} {e.name} <span className="text-[9px] text-neutral-400">MET {e.met}</span>{e.hiit && <span className="text-[8px] font-black text-red-500 ml-1">HIIT</span>}</button>)}</div>
      </div>
      <div className="mx-5 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <svg ref={svgRef} viewBox="0 0 360 240" className="w-full cursor-crosshair" onClick={onSvgClick} style={{ minHeight: 200 }}>
          {Array.from({ length: 9 }, (_, i) => <line key={'h' + i} x1="0" x2="360" y1={i * 30} y2={i * 30} stroke="rgba(255,255,255,0.04)" />)}
          {Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={i * 30} x2={i * 30} y1="0" y2="240" stroke="rgba(255,255,255,0.04)" />)}
          {plan.length >= 2 && <><path d={planPathD()} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />{plan.map((p, i) => <circle key={'wp' + i} cx={p.x} cy={p.y} r="5" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" />)}</>}
          {pathD && <><defs><linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00BF63" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs><path d={pathD} fill="none" stroke="url(#rG)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /></>}
          {mapped.length > 0 && <>{mapped.map((p, i) => i === 0 ? <circle key={'s' + i} cx={p.x} cy={p.y} r="6" fill="#00BF63" stroke="white" strokeWidth="2" /> : i === mapped.length - 1 && mode !== 'tracking' ? <circle key={'e' + i} cx={p.x} cy={p.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" /> : null)}{(mode === 'tracking' || mode === 'paused') && mapped.length > 0 && <g><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="8" fill="rgba(0,191,99,0.3)"><animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" /></circle><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="4" fill="#00BF63" stroke="white" strokeWidth="1.5" /></g>}</>}
          {mode === 'idle' && pts.length === 0 && plan.length === 0 && <text x="180" y="115" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.3)" fontWeight="600">Pilih olahraga & tekan Mulai</text>}
          {mode === 'planning' && <text x="180" y="15" textAnchor="middle" fontSize="9" fill="rgba(139,92,246,0.8)" fontWeight="600">Klik untuk menambah waypoint</text>}
        </svg>
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="grid grid-cols-4 gap-px bg-black/30">
            {[[fmtD(dur), 'WAKTU'], [fmtDist(dist), 'JARAK'], [Math.round(dur > 0 ? (dist / dur) * 3.6 : 0) + ' km/h', 'KECEPATAN'], [fmtPace(dur, dist), 'PACE']].map(([v, l]) => (
              <div key={l} className="bg-black/40 px-2 py-2 text-center">
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
              <div><div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ringkasan</div><div className="text-2xl font-extrabold">{exType.emoji} {exType.name}</div></div>
              <div className="text-right"><div className="text-3xl font-extrabold">{kcal}<span className="text-sm font-medium text-white/60"> kkal</span></div><div className="text-xs text-white/70">MET {exType.met} {'\u00B7'} {metH.toFixed(2)} MET-jam</div></div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-3 text-center text-xs">
              <div><div className="font-bold">{fmtDist(dist)}</div><div className="text-white/50">Jarak</div></div>
              <div><div className="font-bold">{fmtD(dur)}</div><div className="text-white/50">Durasi</div></div>
              <div><div className="font-bold">{Math.round(dur > 0 ? (dist / dur) * 3.6 : 0)} km/h</div><div className="text-white/50">Kecepatan</div></div>
              <div><div className="font-bold">{hr || '-'}</div><div className="text-white/50">HR</div></div>
            </div>
          </div>
        )}
        {gpsErr && <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">{gpsErr}</div>}
        <div className="flex gap-2">
          {mode === 'idle' && <><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-11 rounded-xl text-sm font-bold">{'\u25B6'} Mulai GPS{!exType.gps ? ' (N/A)' : ''}</Button><Button onClick={() => { setMode('planning'); setPlan([]) }} className="h-11 rounded-xl text-sm font-bold border-2 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100">{'\u{1F4CD}'} Rencanakan Jalur</Button></>}
          {mode === 'planning' && <><Button onClick={() => setPlan([])} variant="outline" className="h-10 rounded-xl text-xs">Hapus</Button><Button onClick={reset} variant="outline" className="flex-1 h-10 rounded-xl text-xs">Batal</Button><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-10 rounded-xl text-xs font-bold">{'\u25B6'} Mulai</Button></>}
          {mode === 'tracking' && <><Button onClick={pause} className="flex-1 h-11 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600">{'\u23F8'} Jeda</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">{'\u23F9'} Selesai</Button></>}
          {mode === 'paused' && <><Button onClick={resume} className="flex-1 h-11 rounded-xl text-sm font-bold">{'\u25B6'} Lanjut</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">{'\u23F9'} Selesai</Button></>}
          {mode === 'done' && <Button onClick={reset} className="w-full h-10 rounded-xl text-sm">Selesai & Reset</Button>}
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
          <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">{k} kkal</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Stepper value={min} min={5} max={180} step={5} unit="menit" onChange={setMin} />
        <Button onClick={() => onComplete(k, min, mH)} className="h-9 text-xs rounded-xl shrink-0"><IconPlus size={14} /> Catat</Button>
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
      <SectionTitle icon={<span className="text-lg">{'\u{1F4A4}'}</span>} title="Tidur, Air, Sinar Matahari & Mingguan" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u{1F319}'}</span><span className="text-xs font-bold text-neutral-700">Tidur</span><span className="ml-auto text-sm font-extrabold text-indigo-500 tabular-nums"><ANum v={wt.sleepHr} d={1} /> jam</span></div>
          <Stepper value={wt.sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={v => logWellness(today(), { sleepHr: v })} />
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u{1F4A7}'}</span><span className="text-xs font-bold text-neutral-700">Air</span><span className="ml-auto text-sm font-extrabold text-blue-500 tabular-nums"><ANum v={wt.waterMl} /> mL</span></div>
          <Stepper value={wt.waterMl} min={0} max={5000} step={250} unit="mL" onChange={v => logWellness(today(), { waterMl: v })} />
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">{'\u2600\uFE0F'}</span><span className="text-xs font-bold text-neutral-700">Sinar Matahari</span><span className="ml-auto"><button onClick={() => logWellness(today(), { sunDone: !wt.sunDone, sunHr: wt.sunDone ? 0 : 0.25 })} className={'rounded-lg px-3 py-1 text-[11px] font-bold transition active:scale-95 ' + (wt.sunDone ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-500')}>{wt.sunDone ? 'Sudah \u2705' : 'Belum'}</button></span></div>
          {wt.sunDone && <Stepper value={wt.sunHr} min={0.05} max={1} step={0.05} unit="jam" onChange={v => logWellness(today(), { sunHr: v })} />}
        </div>
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="flex items-center gap-2 mb-1"><span className="text-lg">{'\u{1F4CA}'}</span><span className="text-xs font-bold text-neutral-700">MET Mingguan</span><span className="ml-auto text-sm font-extrabold tabular-nums" style={{ color: weekMet >= 7.5 ? C.ok : weekMet >= 3.75 ? C.warn : C.bad }}>{weekMet.toFixed(1)}</span></div>
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
        <SectionTitle icon={<IconHospital size={18} />} title="Protokol Penyakit Kronis" subtitle="Klik untuk pilih kondisi klinik" />
        {active && <button onClick={() => onSelect(undefined)} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-100 active:scale-95">Reset</button>}
      </div>
      {active && (
        <div className="mt-3 rounded-xl p-4" style={{ background: active.color + '10', border: '1px solid ' + active.color + '30' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{active.emoji}</span>
            <div>
              <div className="text-sm font-black" style={{ color: active.color }}>{active.name}</div>
              <div className="text-[10px] text-neutral-500">Kalori: {(active.calAdj * 100).toFixed(0)}% | Protein: {active.protAdj}x | NaMax: {active.naMax}mg | Cairan: {active.fluidMin}-{active.fluidMax}mL</div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Makanan Direkomendasikan</div><div className="mt-1 flex flex-wrap gap-1">{active.specialFoods.slice(0, 6).map(f => <span key={f} className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">{f}</span>)}{active.specialFoods.length > 6 && <span className="text-[9px] text-neutral-400">+{active.specialFoods.length - 6}</span>}</div></div>
            <div><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Makanan Dihindari</div><div className="mt-1 flex flex-wrap gap-1">{active.avoidFoods.slice(0, 6).map(f => <span key={f} className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-600">{f}</span>)}{active.avoidFoods.length > 6 && <span className="text-[9px] text-neutral-400">+{active.avoidFoods.length - 6}</span>}</div></div>
          </div>
          <div className="mt-2"><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Catatan Klinis</div><ul className="mt-1 space-y-0.5">{active.notes.map((n, i) => <li key={i} className="text-[10px] text-neutral-600 flex gap-1"><span style={{ color: active.color }}>{'\u2022'}</span>{n}</li>)}</ul></div>
          <div className="mt-2"><div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Restriksi Olahraga</div><ul className="mt-1 space-y-0.5">{active.exerRestrictions.map((n, i) => <li key={i} className="text-[10px] text-neutral-600 flex gap-1"><span className="text-amber-500">{'\u26A0\uFE0F'}</span>{n}</li>)}</ul></div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="mt-3 w-full rounded-xl border border-dashed border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50 hover:border-neutral-300">
        {open ? 'Tutup Daftar Penyakit' : 'Lihat Semua Protokol (' + CHRONIC_PROTOCOLS.length + ')'}
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
  const labLabels = activeProtocol?.labLabels ?? { glucose: 'Gula Darah', hba1c: 'HbA1c', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Trigliserida', creatinine: 'Kreatinin', gfr: 'eGFR', alt: 'ALT', ast: 'AST', hemoglobin: 'Hemoglobin', crp: 'CRP', potassium: 'Kalium', sodium: 'Natrium', albumin: 'Albumin', vitD: 'Vitamin D' }
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
    if (val < range[0]) return { color: C.blue, label: 'Rendah' }
    return { color: C.bad, label: 'Tinggi' }
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
        <SectionTitle icon={<IconStethoscope size={18} />} title="Lab Penunjang Mingguan" subtitle="Pantau perubahan hasil lab tiap minggu" />
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-95">
            {'\u{1F4C1}'} Import
            <input type="file" accept=".csv,.json" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => { setEditDate(today()); setEditVals({}); setShowForm(true) }} className="rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand-dark transition hover:bg-brand/20 active:scale-95"><IconPlus size={12} /> Tambah</button>
        </div>
      </div>

      {showForm && (
        <div className="mt-3 rounded-xl border border-neutral-200 p-4 space-y-3" style={{ background: '#fafafa' }}>
          <div className="flex items-center gap-3">
            <Field label="Tanggal"><input className={inputClass + ' w-40'} type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></Field>
            <div className="flex-1" />
            <Button onClick={saveLab} className="h-9 text-xs rounded-xl">Simpan</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-xs rounded-xl">Batal</Button>
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
        <Empty e={'\u{1F9EA}'} t="Belum ada data lab. Tambah manual atau import CSV/JSON." />
      ) : (
        <div className="mt-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="py-2 pr-3 text-left font-bold text-neutral-400 sticky left-0 bg-white">Tanggal</th>
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tren Mingguan (terbaru vs sebelumnya)</div>
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
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Rentang Normal Referensi</div>
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
      if (!parsed.length) { setStatus('Gagal parse file. Pastikan format CSV/JSON benar.'); return }
      const avg = avgIV(parsed)
      onImported(avg, parsed)
      setStatus(`Berhasil import ${parsed.length} baris data vital.`)
      setTimeout(() => setStatus(''), 5000)
    }
    reader.readAsText(file)
  }
  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<IconHeart size={18} />} title="Import Data Vital" subtitle="CSV atau JSON (heartRate, steps, spo2, hrv, vo2Max, systolic, dll)" />
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

  const scoreLabel = lng.score >= 80 ? 'Sangat Baik' : lng.score >= 60 ? 'Cukup Baik' : lng.score >= 40 ? 'Perlu Perbaikan' : 'Mulai dari Langkah Kecil'
  const scoreColor = lng.score >= 70 ? C.ok : lng.score >= 45 ? C.warn : C.bad

  const pillars = [
    { label: 'Tubuh', v: lng.body, show: lng.hasB },
    { label: 'Nutrisi', v: lng.nut, show: true },
    { label: 'Olahraga', v: lng.exer, show: true },
    { label: 'Tidur', v: lng.sleep, show: true },
    { label: 'Kalori', v: lng.cal, show: true },
    { label: 'Hidrasi', v: lng.hydr, show: true },
    { label: 'Matahari', v: lng.sun, show: true },
    { label: 'Vital', v: lng.vit, show: lng.hasV },
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
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Skor Longevity</span>
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
                <span className="text-[11px] font-semibold text-white/80">Fokus perbaikan: <b>{topPillar.label} ({topPillar.v})</b></span>
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
      <SectionTitle icon={<IconSparkle size={18} />} title="Rekomendasi Real-time" subtitle={`${recs.length} saran berdasarkan data Anda`} />
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
  const [exCat, setExCat] = useState('Kardio')
  const [exName, setExName] = useState(EX[0].name)
  const [min, setMin] = useState(30)
  const filtered = EX.filter(e => e.cat === exCat)
  const ex = EX.find(e => e.name === exName) ?? EX[0]
  const k = getMetBurn(ex.met, body.w, min)
  const mH = ex.met * (min / 60)

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconFlame size={18} />} title="Log Olahraga Manual" subtitle="Catat olahraga tanpa GPS" />
      <div className="mt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{EXCATS.map(c => <button key={c} onClick={() => { setExCat(c); const f = EX.filter(e => e.cat === c); if (f.length) setExName(f[0].name) }} className={'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (exCat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200')}>{c}</button>)}</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{filtered.map(e => <button key={e.name} onClick={() => setExName(e.name)} className={'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 ' + (ex.name === e.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300')}>{e.emoji} {e.name} <span className="text-[9px] text-neutral-400">MET {e.met}</span>{e.hiit && <span className="text-[8px] font-black text-red-500 ml-1">HIIT</span>}</button>)}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Stepper label="Durasi" value={min} min={5} max={300} step={5} unit="menit" onChange={setMin} />
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold" style={{ color: '#0B7A4B' }}>{k}</div>
          <div className="text-[9px] text-neutral-400">kkal</div>
        </div>
        <Button onClick={() => onLog(k, min, mH)} className="h-10 shrink-0 rounded-xl text-sm font-bold"><IconPlus size={14} /> Catat</Button>
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
      {/* Longevity Score */}
      <LongevityCard body={body} wt={wt} todaysFoods={todaysFoods} vitals={vitals} activeProtocol={activeProtocol} />

      {/* Chronic Protocol Selector */}
      <ChronicProtocolCard onSelect={setActiveProtocol} active={activeProtocol} />

      {/* Body Profile */}
      <BodyCard intakeKcal={totalKcal} />

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
      <LabTracker activeProtocol={activeProtocol} />

      {/* Recommendations */}
      <RecommendationsCard recs={recs} />

      {/* Quick Links — kapabilitas kalkulator longevity */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={18} />} title="Kalkulator Longevity Terbaik" subtitle="Dibangun untuk membantu umat manusia hidup lebih panjang dan lebih sehat" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: '🫀', label: 'VO₂max Est.', desc: 'Kapasitas aerobik' },
            { icon: '⚖️', label: 'BMI & BMR', desc: 'Metabolisme basal & indeks massa' },
            { icon: '🧬', label: 'Lab Tracker', desc: 'Pantau lab penunjang mingguan' },
            { icon: '🏥', label: 'Protokol Kronis', desc: '19 kondisi klinis' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center rounded-2xl border border-brand/15 bg-brand-50/40 p-3 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-sm">{item.icon}</span>
              <div className="mt-2 text-xs font-extrabold text-ink">{item.label}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-neutral-500">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-brand/10 bg-gradient-to-br from-brand-50/70 to-transparent p-5 text-center">
          <p className="text-[13px] leading-relaxed text-neutral-600">
            <b className="text-brand-dark">Panaceamed</b> dirancang dengan standar klinis — dari mendukung atlet elite
            (<i>Ronaldo, Messi, Mbappé, Kipchoge, Phelps</i>) hingga merawat pasien fase kritis
            (<b>CHF, COPD, Diabetes, Gagal Ginjal, Kanker</b>, dan 15+ kondisi kronis). Setiap rekomendasi
            dihitung <b>real-time</b> dari data Anda.
          </p>
          <p className="mt-2 text-xs font-semibold italic text-brand-dark">🌿 Semoga bermanfaat untuk umat manusia.</p>
        </div>
      </Card>
    </div>
  )
}
