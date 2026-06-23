import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconPlus, IconSparkle, IconHeart, IconStethoscope, IconHospital, IconActivity, IconFlame, IconDroplet, IconMoon, IconSun, IconShield, IconBrain, IconLungs, IconEye } from '../components/icons'
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
   FOOD DATABASE (Clinical Grade)
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
  { name: 'Telur putih', k: 52, c: 0.7, p: 11, f: 0.2, fb: 0, na: 166, k2: 163, mg: 11, fe: 0.08, zn: 0.03, vitC: 0, vitD: 0, omega3: 0, gi: 0, cat: 'Protein', emoji: '🥚', tags: ['lean-protein', 'low-fat'] },
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
  { name: 'Alpukat', k: 160, c: 9, p: 2, f: 15, fb: 7, na: 7, k2: 485, mg: 29, fe: 0.6, zn: 0.6, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Buah', emoji: '🥑', tags: ['healthy-fat', 'potassium-rich', 'low-gi'] },
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
  { name: 'Jus alpukat', k: 160, c: 3, p: 2, f: 15, fb: 3, na: 10, k2: 300, mg: 20, fe: 0.3, zn: 0.3, vitC: 10, vitD: 0, omega3: 0.1, gi: 15, cat: 'Minuman', emoji: '🥤', tags: ['healthy-fat'] },
  { name: 'Suku coklat', k: 83, c: 10, p: 3.2, f: 3.3, fb: 0, na: 60, k2: 150, mg: 12, fe: 0.1, zn: 0.5, vitC: 2, vitD: 1.5, omega3: 0.05, gi: 35, cat: 'Minuman', emoji: '🥤', tags: ['recovery'] },
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
  { name: 'Tempe bacem', k: 180, c: 12, p: 14, f: 10, fb: 3, na: 400, k2: 200, mg: 50, fe: 2, zn: 1.5, vitC: 0, vitD: 0, omega3: 0.1, gi: 25, cat: 'Lainnya', emoji: '🟫', tags: ['high-sodium', 'fermented'] },
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
   COMPREHENSIVE EXERCISE DATABASE
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
]
const EXCATS = [...new Set(EX.map(e => e.cat))]

/* ═══════════════════════════════════════════════════════
   CHRONIC DISEASE PROTOCOLS (Clinical Grade)
   ═══════════════════════════════════════════════════════ */
const CHRONIC_PROTOCOLS: ChronicProtocol[] = [
  {
    id: 'chf', name: 'CHF (Gagal Jantung Kongestif)', emoji: '❤️‍🩹', color: '#ef4444',
    calAdj: -0.1, protAdj: 1.2, naMax: 1500, kMax: 0, fluidMax: 1500, fluidMin: 1200,
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Bayam', 'Brokoli', 'Alpukat', 'Jambu biji', 'Yogurt plain'],
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
    specialFoods: ['Dada ayam rebus', 'Telur ayam', 'Salmon', 'Yogurt Greek', 'Oatmeal', 'Alpukat', 'Bayam', 'Pisang', 'Jambu biji'],
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
    specialFoods: ['Oatmeal', 'Quinoa', 'Nasi merah', 'Tempe kukus', 'Tahu kukus', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukat', 'Kacang almond', 'Ikan salmon', 'Dada ayam rebus', 'Yogurt plain', 'Whey protein'],
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
    avoidFoods: ['Kacang merah', 'Kacang kedelai', 'Tempe', 'Keju', 'Susu', 'Pisang', 'Jeruk', 'Alpukat', 'Coklat', 'Kacang almond', 'Daging sapi', 'Rendang'],
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
    specialFoods: ['Dada ayam rebus', 'Ikan kod', 'Telur putih', 'Tahu kukus', 'Tempe kukus', 'Oatmeal', 'Quinoa', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukat', 'Kacang almond', 'Yogurt Greek', 'Whey protein'],
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
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Quinoa', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukat', 'Yogurt Greek', 'Minyak zaitun', 'Dark chocolate 85%'],
    avoidFoods: ['Nasi putih', 'Roti tawar', 'Mie goreng', 'Es teh manis', 'Gula merah', 'Minuman energi', 'Fast food', 'Makanan olahan', 'Nasi uduk'],
    notes: ['Target: turunkan lingkar perut', 'Karbo <45% dari kalori total', 'Lemak sehat 30-35% (MUFA PUFA)', 'Natrium <1500mg untuk tekanan darah', 'Serat 30g+/hari', 'Omega-3 2-3g/hari', 'Cuka apel sebelum makan bisa bantu sensitivitas insulin'],
    labKeys: ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'uricAcid', 'crp', 'alt', 'systolic'],
    labLabels: { glucose: 'Gula Darah', hba1c: 'HbA1c', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', triglycerides: 'Trigliserida', uricAcid: 'Asam Urat', crp: 'CRP', alt: 'ALT', systolic: 'Sistolik' },
    labUnits: { glucose: 'mg/dL', hba1c: '%', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', triglycerides: 'mg/dL', uricAcid: 'mg/dL', crp: 'mg/L', alt: 'U/L', systolic: 'mmHg' },
    labRanges: { glucose: [70, 100], hba1c: [0, 6.5], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], triglycerides: [0, 150], uricAcid: [2.5, 7.0], crp: [0, 5], alt: [7, 56], systolic: [90, 130] },
    exerRestrictions: ['HIIT sangat efektif untuk syndrome X', 'Latihan resistensi 3-4x/minggu', 'Aerobik minimal 200 menit/minggu', 'Target menurunkan visceral fat', 'Monitor tekanan darah rutin'],
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
    id: 'liver', name: 'Gangguan Liver', emoji: '🫗', color: '#f97316',
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
    specialFoods: ['Nasi putih', 'Telur putih', 'Ikan kod', 'Tahu kukus', 'Wortel', 'Selada', 'Nanas', 'Semangka'],
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
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Quinoa', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukat', 'Minyak zaitun', 'Yogurt plain'],
    avoidFoods: ['Makanan tinggi natrium', 'Makanan olahan', 'Gula berlebihan', 'Trans fat', 'Alkohol'],
    notes: ['Diet Mediterranean sangat direkomendasikan', 'Natrium <1500mg untuk kontrol tekanan darah', 'Kalium tinggi dari buah & sayur', 'Omega-3 2g+/hari', 'Serat 25-30g/hari', 'Fokus pada rehabilitasi & nutrisi', 'Makanan lunak jika ada dysphagia'],
    labKeys: ['systolic', 'ldl', 'hdl', 'totalCholesterol', 'triglycerides', 'glucose', 'hba1c', 'crp', 'homocysteine'],
    labLabels: { systolic: 'Sistolik', ldl: 'LDL', hdl: 'HDL', totalCholesterol: 'Kolestrol Total', triglycerides: 'Trigliserida', glucose: 'Gula Darah', hba1c: 'HbA1c', crp: 'CRP', homocysteine: 'Homosistein' },
    labUnits: { systolic: 'mmHg', ldl: 'mg/dL', hdl: 'mg/dL', totalCholesterol: 'mg/dL', triglycerides: 'mg/dL', glucose: 'mg/dL', hba1c: '%', crp: 'mg/L', homocysteine: 'umol/L' },
    labRanges: { systolic: [90, 130], ldl: [0, 100], hdl: [40, 100], totalCholesterol: [0, 200], triglycerides: [0, 150], glucose: [70, 100], hba1c: [0, 6.5], crp: [0, 5], homocysteine: [5, 15] },
    exerRestrictions: ['Fisioterapi terstruktur wajib', 'Latihan sesuai kemampuan', 'Latihan keseimbangan penting', 'Hindari latihan tanpa pengawasan', 'Koordinasi dengan tim rehabilitasi'],
  },
  {
    id: 'epilepsy', name: 'Epilepsi', emoji: '⚡', color: '#f59e0b',
    calAdj: 0, protAdj: 1.0, naMax: 2300, kMax: 0, fluidMax: 2500, fluidMin: 1500,
    specialFoods: ['Dada ayam rebus', 'Salmon', 'Telur ayam', 'Bayam', 'Brokoli', 'Alpukat', 'Kacang almond', 'Minyak zaitun', 'Yogurt plain'],
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
    specialFoods: ['Salmon', 'Dada ayam rebus', 'Oatmeal', 'Kacang almond', 'Bayam', 'Brokoli', 'Jambu biji', 'Alpukat', 'Minyak zaitun', 'Dark chocolate 85%', 'Yogurt plain', 'Teh hijau'],
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
    specialFoods: ['Bayam', 'Brokoli', 'Pisang', 'Alpukat', 'Kacang almond', 'Salmon', 'Oatmeal', 'Jambu biji', 'Yogurt plain', 'Minyak zaitun', 'Wortel'],
    avoidFoods: ['Nasi goreng', 'Bakso', 'Soto ayam', 'Sate ayam', 'Mie goreng', 'Keju cheddar', 'Nasi padang', 'Es teh manis', 'Makanan olahan', 'Fast food'],
    notes: ['Diet DASH sangat direkomendasikan', 'Natrium <1500mg/hari', 'Kalium tinggi 3500-5000mg/hari', 'Kalsium 1000-1300mg/hari', 'Magnesium 300-500mg/hari', 'Serat 25-30g/hari', 'Batasi alkohol', 'Diet Mediteranean juga efektif'],
    labKeys: ['systolic', 'potassium', 'sodium', 'creatinine', 'gfr', 'totalCholesterol', 'ldl', 'hdl', 'glucose', 'uricAcid'],
    labLabels: { systolic: 'Sistolik', potassium: 'Kalium', sodium: 'Natrium', creatinine: 'Kreatinin', gfr: 'eGFR', totalCholesterol: 'Kolestrol Total', ldl: 'LDL', hdl: 'HDL', glucose: 'Gula Darah', uricAcid: 'Asam Urat' },
    labUnits: { systolic: 'mmHg', potassium: 'mEq/L', sodium: 'mEq/L', creatinine: 'mg/dL', gfr: 'mL/min', totalCholesterol: 'mg/dL', ldl: 'mg/dL', hdl: 'mg/dL', glucose: 'mg/dL', uricAcid: 'mg/dL' },
    labRanges: { systolic: [90, 130], potassium: [3.5, 5.0], sodium: [135, 145], creatinine: [0.6, 1.2], gfr: [60, 120], totalCholesterol: [0, 200], ldl: [0, 100], hdl: [40, 100], glucose: [70, 100], uricAcid: [2.5, 7.0] },
    exerRestrictions: ['Aerobik 150 menit/minggu minimal', 'Latihan resistensi beban moderat (hindari menahan napas berlebih / valsalva)', 'Monitor tekanan darah sebelum dan setelah latihan', 'Hentikan latihan jika tekanan darah >180/110 mmHg atau kepala pusing'],
  }
]

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ChronicDashboard() {
  const [selectedProtocol, setSelectedProtocol] = useState<ChronicProtocol | null>(CHRONIC_PROTOCOLS[0])
  const [body, setBody] = useState<Body>(loadBody)
  const br = useBR()

  useEffect(() => {
    saveB(body)
    emitB()
  }, [body])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Protocol Selection Matrix */}
      <div className="flex flex-col gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <SectionTitle>Clinical Chronic Disease Protocol Dashboard</SectionTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kelola penyesuaian diet, pembatasan fisik, serta target laboratorium klinis secara adaptif.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHRONIC_PROTOCOLS.map((p) => (
            <Button
              key={p.id}
              variant={selectedProtocol?.id === p.id ? 'primary' : 'outline'}
              onClick={() => setSelectedProtocol(p)}
              className="flex items-center gap-2 text-xs py-1.5 px-3"
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Biometrics & Adjusted Nutritional Targets */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <IconActivity size={18} className="text-blue-500" />
              Parameter Biometris Pasien
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Berat (kg)">
                <input
                  type="number"
                  className={inputClass}
                  value={body.w}
                  onChange={(e) => setBody({ ...body, w: Number(e.target.value) })}
                />
              </Field>
              <Field label="Tinggi (cm)">
                <input
                  type="number"
                  className={inputClass}
                  value={body.h}
                  onChange={(e) => setBody({ ...body, h: Number(e.target.value) })}
                />
              </Field>
              <Field label="Umur (Tahun)">
                <input
                  type="number"
                  className={inputClass}
                  value={body.age}
                  onChange={(e) => setBody({ ...body, age: Number(e.target.value) })}
                />
              </Field>
              <Field label="Gender">
                <select
                  className={inputClass}
                  value={body.g}
                  onChange={(e) => setBody({ ...body, g: e.target.value as 'M' | 'F' })}
                >
                  <option value="M">Laki-laki</option>
                  <option value="F">Perempuan</option>
                </select>
              </Field>
            </div>
          </Card>

          {selectedProtocol && (
            <Card className="p-4 space-y-4 border-l-4 shadow-sm" style={{ borderColor: selectedProtocol.color }}>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <IconSparkle size={18} style={{ color: selectedProtocol.color }} />
                Target Nutrisi Klinis ({selectedProtocol.name})
              </h3>
              {(() => {
                // Mifflin-St Jeor Formula for BMR
                const bmr = body.g === 'M'
                  ? 10 * body.w + 6.25 * body.h - 5 * body.age + 5
                  : 10 * body.w + 6.25 * body.h - 5 * body.age - 161
                
                const actMultiplier = [1.2, 1.375, 1.55, 1.725, 1.9][body.act] || 1.2
                const tdee = bmr * actMultiplier
                const targetCal = Math.round(tdee * (1 + selectedProtocol.calAdj))
                const targetProt = Math.round(body.w * selectedProtocol.protAdj)

                return (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-1.5 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Target Energi</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{targetCal} kkal</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Target Protein</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{targetProt} g</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Maks Natrium</span>
                      <span className="font-bold text-rose-500">{selectedProtocol.naMax} mg</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Maks Kalium</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {selectedProtocol.kMax > 0 ? `${selectedProtocol.kMax} mg` : 'Bebas / Pantau Lab'}
                      </span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Batasan Cairan</span>
                      <span className="font-bold text-blue-500">
                        {selectedProtocol.fluidMin} - {selectedProtocol.fluidMax} mL
                      </span>
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}
        </div>

        {/* Right Columns: Guidelines, Dietary Profiling, Lab Ranges */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProtocol && (
            <>
              {/* Guidelines & Structural Limitations */}
              <Card className="p-5 space-y-4 shadow-sm">
                <h3 className="font-semibold text-base flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <IconShield size={20} className="text-blue-500" />
                  Protokol Medis & Catatan Klinis
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedProtocol.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>

                {selectedProtocol.exerRestrictions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                      <IconFlame size={16} />
                      Kontraindikasi & Batasan Olahraga
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {selectedProtocol.exerRestrictions.map((ex, idx) => (
                        <li key={idx}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {/* Dynamic Dietary Profiling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900 shadow-sm">
                  <h3 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                    <IconHeart size={18} />
                    Makanan Sangat Dianjurkan
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProtocol.specialFoods.map((foodName, i) => {
                      const matched = FD.find(f => f.name.toLowerCase() === foodName.toLowerCase() || f.name.includes(foodName))
                      return (
                        <Badge key={i} variant="success" className="text-xs font-normal">
                          {matched?.emoji || '🥗'} {foodName}
                        </Badge>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-4 bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900 shadow-sm">
                  <h3 className="font-semibold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-3">
                    <IconHospital size={18} />
                    Makanan Wajib Dihindari
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProtocol.avoidFoods.map((foodName, i) => {
                      const matched = FD.find(f => f.name.toLowerCase() === foodName.toLowerCase() || f.name.includes(foodName))
                      return (
                        <Badge key={i} variant="danger" className="text-xs font-normal">
                          {matched?.emoji || '⚠️'} {foodName}
                        </Badge>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* Target Laboratory Indicator Table */}
              <Card className="p-4 space-y-3 shadow-sm">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <IconStethoscope size={18} className="text-purple-500" />
                  Rentang Laboratorium Target Terkait
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-medium">
                        <th className="py-2">Parameter</th>
                        <th className="py-2">Rentang Target Klinis</th>
                        <th className="py-2">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                      {selectedProtocol.labKeys.map((key) => {
                        const label = selectedProtocol.labLabels[key] || key
                        const range = selectedProtocol.labRanges[key]
                        const unit = selectedProtocol.labUnits[key] || ''
                        return (
                          <tr key={key} className="text-gray-600 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                            <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200">{label}</td>
                            <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                              {range ? `${range[0]} - ${range[1]}` : 'N/A'}
                            </td>
                            <td className="py-2.5 text-gray-400">{unit}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
