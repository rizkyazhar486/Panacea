import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Longevity Game Center — the "fun, shareable, viral-loop" cluster: a 5x5
// habit bingo board, a downloadable canvas-rendered "Longevity Report Card"
// (real data — it renders whatever the user actually checked off, not a
// fabricated score), and a daily rotating longevity quote. Pure client-side
// state + HTML5 canvas, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'bingo' | 'report-card' | 'quote'

const BINGO_HABITS = [
  'Drank enough water', '7+ hours sleep', 'Walked 20+ min', 'Ate vegetables', 'No added sugar',
  'Strength trained', 'Meditated/breathed', 'Got morning sunlight', '30 min no-phone time', 'Ate protein at every meal',
  'Stood/moved hourly', 'Read something', 'Stretched', 'Gratitude noted', 'Cold or hot exposure',
  'Ate a plant variety', 'Connected with someone', 'No late caffeine', 'Journaled', 'Deep breathing break',
  'Balanced a meal', 'Took stairs', 'Limited screens before bed', 'Did something creative', 'Rested when tired',
]
const BINGO_KEY = 'pmd_habit_bingo_v1'

function BingoBoard() {
  const today = new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState<boolean[]>(() => {
    try { const s = JSON.parse(localStorage.getItem(BINGO_KEY) || '{}'); return s.day === today ? s.cells : Array(25).fill(false) } catch { return Array(25).fill(false) }
  })
  const [celebrated, setCelebrated] = useState(false)
  useEffect(() => { try { localStorage.setItem(BINGO_KEY, JSON.stringify({ day: today, cells: done })) } catch { /* ignore */ } }, [done, today])

  const bingoLines = useMemo(() => {
    const lines: number[][] = []
    for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c))
    for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c))
    lines.push([0, 6, 12, 18, 24])
    lines.push([4, 8, 12, 16, 20])
    return lines
  }, [])
  const hasBingo = bingoLines.some((line) => line.every((i) => done[i]))
  useEffect(() => { if (hasBingo) setCelebrated(true) }, [hasBingo])

  const toggle = (i: number) => setDone((d) => { const n = [...d]; n[i] = !n[i]; return n })

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-neutral-500">Check off habits as you do them today — complete a row, column, or diagonal for bingo.</p>
        {hasBingo && <Badge tone="brand">🎉 BINGO!</Badge>}
      </div>
      {celebrated && hasBingo && (
        <div className="mt-2 rounded-xl bg-gradient-to-r from-brand to-emerald-600 p-3 text-center text-sm font-black text-white">
          🎉 Bingo! Great day for your longevity habits.
        </div>
      )}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {BINGO_HABITS.map((h, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex h-16 items-center justify-center rounded-lg p-1 text-center text-[9px] font-bold leading-tight transition ${done[i] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
          >
            {h}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-neutral-400">{done.filter(Boolean).length}/25 checked today</p>
    </Card>
  )
}

function ReportCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState<boolean[]>(Array(25).fill(false))
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(BINGO_KEY) || '{}'); if (s.day === today) setDone(s.cells) } catch { /* ignore */ }
  }, [today])

  const count = done.filter(Boolean).length

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 800; canvas.height = 1000
    const grad = ctx.createLinearGradient(0, 0, 0, 1000)
    grad.addColorStop(0, '#00BF63'); grad.addColorStop(1, '#0B7A4B')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 800, 1000)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText('MY LONGEVITY REPORT CARD', 400, 100)
    ctx.font = '20px sans-serif'
    ctx.globalAlpha = 0.85
    ctx.fillText(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), 400, 140)
    ctx.globalAlpha = 1
    ctx.font = 'bold 180px sans-serif'
    ctx.fillText(String(count), 400, 400)
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText('/ 25 HABITS TODAY', 400, 450)
    ctx.font = '22px sans-serif'
    ctx.globalAlpha = 0.9
    const doneHabits = BINGO_HABITS.filter((_, i) => done[i]).slice(0, 8)
    doneHabits.forEach((h, i) => ctx.fillText('✓ ' + h, 400, 540 + i * 40))
    if (BINGO_HABITS.filter((_, i) => done[i]).length > 8) ctx.fillText(`+ ${BINGO_HABITS.filter((_, i) => done[i]).length - 8} more`, 400, 540 + 8 * 40)
    ctx.globalAlpha = 1
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText('panaceamed.id', 400, 950)
  }

  useEffect(() => { draw() }, [done])

  const download = () => {
    draw()
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `longevity-report-${today}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Renders from what you've actually checked off in Habit Bingo today — go log a few habits first if this looks empty.</p>
      <div className="mt-3 overflow-hidden rounded-2xl">
        <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: '4/5' }} />
      </div>
      <button onClick={download} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Download to share</button>
    </Card>
  )
}

const QUOTES = [
  'The compound interest of small daily habits is the entire game.',
  "You don't have to be extreme, just consistent.",
  'Your body keeps the score of every choice you make, quietly, for years.',
  'Longevity is built in the boring repetitions, not the dramatic overhauls.',
  'The best supplement is still sleep, movement, and real food.',
  'Every walk you take is a vote for the person you want to be at 80.',
  "Stress you can't avoid; recovery you can always choose.",
  'Muscle is the organ of longevity — use it or lose it, literally.',
  'The habit you skip "just today" is the one that quietly becomes never.',
  'Small, boring, repeatable — that\'s what actually compounds.',
]
function DailyQuote() {
  const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length
  return (
    <Card className="!p-8 text-center">
      <div className="text-4xl">💬</div>
      <p className="mt-4 text-lg font-black leading-snug text-ink dark:text-white">"{QUOTES[dayIndex]}"</p>
      <p className="mt-3 text-[12px] text-neutral-400">panaceamed.id · daily longevity quote</p>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'bingo', label: 'Habit Bingo' },
  { id: 'report-card', label: 'Report Card' },
  { id: 'quote', label: 'Daily Quote' },
]

export function LongevityGameCenter() {
  const [tab, setTab] = useState<Tab>('bingo')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Longevity Game Center" subtitle="Habit bingo, a shareable report card, and a daily quote" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'bingo' && <BingoBoard />}
      {tab === 'report-card' && <ReportCard />}
      {tab === 'quote' && <DailyQuote />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Playful habit-tracking for motivation, not a clinical scoring system. The report card reflects
        exactly what you checked off — nothing is generated or exaggerated.
      </div>
    </div>
  )
}

export default LongevityGameCenter
