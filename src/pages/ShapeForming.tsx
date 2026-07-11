import { useRef, useState } from 'react'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconSparkle, IconUpload, IconActivity, IconLeaf, IconHeart } from '../components/icons'
import { compressImage, readAsDataUrl } from '../lib/upload'
import { api } from '../lib/api'

// Level-based workout plans (Beginner → Pro) for shaping the body.
type Level = 'beginner' | 'intermediate' | 'advanced' | 'pro'
const LEVELS: { id: Level; name: string; emoji: string; sub: string; days: number; plan: { day: string; focus: string }[] }[] = [
  {
    id: 'beginner', name: 'Beginner', emoji: '🌱', sub: '3 days/week · movement foundation & habits', days: 3,
    plan: [
      { day: 'Day 1', focus: 'Basic full-body: squat 3×10, knee push-up 3×8, plank 3×20 sec' },
      { day: 'Day 2', focus: 'Light cardio 20–30 min (brisk walk) + mobility' },
      { day: 'Day 3', focus: 'Full-body: glute bridge 3×12, band row 3×12, dead bug 3×8' },
    ],
  },
  {
    id: 'intermediate', name: 'Intermediate', emoji: '💪', sub: '4 days/week · upper/lower split', days: 4,
    plan: [
      { day: 'Day 1', focus: 'Upper: bench/push-up 4×8, row 4×10, shoulder press 3×10' },
      { day: 'Day 2', focus: 'Lower: goblet squat 4×10, RDL 3×10, calf raise 3×15' },
      { day: 'Day 3', focus: 'Interval cardio 25 min + core' },
      { day: 'Day 4', focus: 'Full-body hypertrophy + arms (curl/triceps 3×12)' },
    ],
  },
  {
    id: 'advanced', name: 'Advanced', emoji: '🔥', sub: '5 days/week · push/pull/legs', days: 5,
    plan: [
      { day: 'Day 1', focus: 'Push: bench 5×5, OHP 4×6, dips 3×AMRAP' },
      { day: 'Day 2', focus: 'Pull: pull-up 5×5, barbell row 4×8, face pull 3×15' },
      { day: 'Day 3', focus: 'Legs: squat 5×5, lunge 4×10, leg curl 3×12' },
      { day: 'Day 4', focus: 'Upper hypertrophy + 15-min HIIT' },
      { day: 'Day 5', focus: 'Lower hypertrophy + weighted core' },
    ],
  },
  {
    id: 'pro', name: 'Pro / Athlete', emoji: '🏆', sub: '6 days/week · periodization + performance', days: 6,
    plan: [
      { day: 'Day 1', focus: 'Strength: heavy squat 6×3 @85% + accessory' },
      { day: 'Day 2', focus: 'Power: clean/jump + bench 6×3' },
      { day: 'Day 3', focus: 'Pull hypertrophy + grip' },
      { day: 'Day 4', focus: 'Deadlift 5×3 + posterior chain' },
      { day: 'Day 5', focus: 'Conditioning/Hyrox: sled, erg, wall ball' },
      { day: 'Day 6', focus: 'Hypertrophy/weak-point + deep mobility' },
    ],
  },
]

interface ShapeAnalysis {
  bodyAssessment: string
  bodyType: string
  workoutFocus: string[]
  weeklyPlan: { day: string; focus: string }[]
  nutritionSummary: string
  foodsRecommended: string[]
  foodsAvoid: string[]
  skinAssessment: string
  skinAdvice: string[]
}

function extractJson(raw: string): ShapeAnalysis | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

function demoAnalysis(): ShapeAnalysis {
  return {
    bodyAssessment: '⚠️ Demo Mode. Posture appears proportional with even muscle distribution; there is potential for more definitive shaping in the core and shoulder areas for better visual symmetry.',
    bodyType: 'Mesomorph-Ectomorph (mixed)',
    workoutFocus: ['Core & Posture', 'Shoulders & Upper Back', 'Cardiovascular Conditioning', 'Hip Mobility'],
    weeklyPlan: [
      { day: 'Monday', focus: 'Strength — Push (chest, shoulders, triceps)' },
      { day: 'Tuesday', focus: 'Moderate cardio 30-40 minutes + mobility flow' },
      { day: 'Wednesday', focus: 'Strength — Pull (back, biceps) + core' },
      { day: 'Thursday', focus: 'HIIT/battling ropes 20 minutes (low impact)' },
      { day: 'Friday', focus: 'Strength — Legs & glutes' },
      { day: 'Saturday', focus: 'Light activity — walk/yoga/stretching' },
      { day: 'Sunday', focus: 'Full rest / recovery' },
    ],
    nutritionSummary: 'Focus on a light-to-moderate calorie deficit with high protein for shape forming, plus antioxidants & omega-3s for longevity and skin quality.',
    foodsRecommended: ['Chicken breast/fish', 'Eggs', 'Dark leafy greens', 'Berries (antioxidants)', 'Avocado', 'Almonds/walnuts', 'Greek yogurt', 'Olive oil', 'Water 2.5-3L/day'],
    foodsAvoid: ['Excess added sugar', 'Fried food/trans fats', 'Alcoholic beverages', 'Ultra-processed foods high in sodium'],
    skinAssessment: '⚠️ Demo Mode. Skin texture appears fairly good but needs attention to hydration and UV protection to prevent premature aging (photoaging).',
    skinAdvice: [
      'Use SPF 30+ sunscreen daily, reapply every 2-3 hours during direct sun exposure',
      'Adequate hydration (water + hyaluronic acid moisturizer) for skin elasticity',
      'Vitamin C & E intake from fruits and vegetables supports collagen production & fights free radicals',
      'Sleep 7-8 hours to support skin cell regeneration (repair processes are optimal during deep sleep)',
      'Avoid smoking — it accelerates collagen & elastin degradation',
      'Regular exercise improves blood circulation to the skin, supporting a healthier skin tone',
    ],
  }
}

export function ShapeForming() {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ShapeAnalysis | null>(null)
  const [level, setLevel] = useState<Level>('beginner')
  const fileRef = useRef<HTMLInputElement>(null)
  const lvl = LEVELS.find((l) => l.id === level)!

  async function onUpload(file?: File) {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setPreview(dataUrl)
      const prompt = `Analyze this body/posture photo for SHAPE FORMING & LONGEVITY purposes (not a formal medical diagnosis, lifestyle education only). Assess body proportions, posture, and visible skin quality (texture, signs of aging, hydration). Provide a weekly (7-day) workout program and nutrition recommendations suited to shape forming & long-term health, plus skin quality education & care advice.\n\nOutput ONLY minified JSON with the structure:\n{"bodyAssessment":string,"bodyType":string,"workoutFocus":string[4],"weeklyPlan":[{"day":string,"focus":string}×7],"nutritionSummary":string,"foodsRecommended":string[],"foodsAvoid":string[],"skinAssessment":string,"skinAdvice":string[]}`
      const r = await api.aiVision(dataUrl, prompt)
      const parsed = extractJson(r.text)
      setResult(parsed ?? demoAnalysis())
    } catch {
      setError('Failed to analyze photo. Showing sample recommendations.')
      setResult(demoAnalysis())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Shape Forming & Longevity from Photo" subtitle="Upload a photo for personalized workout, nutrition & skin quality recommendations" />
        <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-50/30 p-6 text-center">
          {preview ? (
            <img src={preview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover shadow-sm" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl shadow-sm"><IconUpload size={24} /></span>
          )}
          <p className="text-xs text-neutral-500">Body photo (front/side, good lighting) — processed once for analysis, not stored permanently on our servers.</p>
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            <IconUpload size={14} /> {busy ? 'Analyzing…' : preview ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
          {error && <p className="text-xs text-accent">{error}</p>}
        </div>
      </Card>

      {/* Program latihan berdasarkan level */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={18} />} title="Workout Program by Level" subtitle="Choose your level — beginner to pro athlete" />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold transition ${level === l.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              <span className="text-lg">{l.emoji}</span>{l.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-brand-dark">{lvl.emoji} {lvl.name} — {lvl.sub}</p>
        <div className="mt-2 space-y-1.5">
          {lvl.plan.map((d) => (
            <div key={d.day} className="flex gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[11px]">
              <span className="w-12 shrink-0 font-bold text-neutral-500">{d.day}</span>
              <span className="text-neutral-600">{d.focus}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">Gradually increase load/volume (progressive overload). Check movement form in the Physical Test & Form menu.</p>
      </Card>

      {result && (
        <>
          <Card className="!p-5">
            <SectionTitle icon={<IconActivity size={18} />} title="Body Assessment" subtitle={result.bodyType} />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.bodyAssessment}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.workoutFocus.map((f) => <Badge key={f} tone="brand">{f}</Badge>)}
            </div>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconActivity size={18} />} title="Weekly Workout Program" subtitle="Tailored for shape forming & longevity" />
            <div className="mt-2 space-y-1.5">
              {result.weeklyPlan.map((d) => (
                <div key={d.day} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-bold">{d.day}</span>
                  <span className="text-right text-xs text-neutral-500">{d.focus}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">See movement details & how-to instructions on the <b>AI Workout Program</b> page.</p>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconLeaf size={18} />} title="Nutrition Recommendations" subtitle="For body shaping & long-term health" />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.nutritionSummary}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-50/60 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">Recommended</div>
                <ul className="mt-1 space-y-1 text-sm text-neutral-700">{result.foodsRecommended.map((f, i) => <li key={i}>• {f}</li>)}</ul>
              </div>
              <div className="rounded-xl bg-red-50/60 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Avoid</div>
                <ul className="mt-1 space-y-1 text-sm text-neutral-700">{result.foodsAvoid.map((f, i) => <li key={i}>• {f}</li>)}</ul>
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconHeart size={18} />} title="Skin Quality Education" subtitle="Assessment & skin care advice" />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.skinAssessment}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
              {result.skinAdvice.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}

export default ShapeForming
