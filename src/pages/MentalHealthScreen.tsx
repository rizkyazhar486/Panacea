import { useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart, IconPhone } from '../components/icons'
import {
  simpan, bacaRiwayat, perubahan, riwayatAlat, pita, MAKSIMAL,
  type Alat, type Catatan,
} from '../lib/mentalTrend'

// ─────────────────────────────────────────────────────────────────────────────
// Mental Health Screening — PHQ-9 (depression, Kroenke, Spitzer & Williams,
// 2001, J Gen Intern Med) and GAD-7 (anxiety, Spitzer et al., 2006, Arch
// Intern Med), two of the most widely validated and used brief screening
// instruments in primary care worldwide. Pure arithmetic scoring, no
// external API. PHQ-9 item 9 (self-harm/suicidal ideation) triggers a
// prominent, always-visible crisis-resource callout when endorsed at all —
// this is a screening tool, not a diagnosis, and a positive item 9 always
// warrants direct clinical follow-up regardless of the total score.
// ─────────────────────────────────────────────────────────────────────────────

const SCALE = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']

const PHQ9_ITEMS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure, or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or watching television',
  'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
]

const GAD7_ITEMS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
]

function phqBand(score: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (score <= 4) return { label: 'Minimal depression', tone: 'brand' }
  if (score <= 9) return { label: 'Mild depression', tone: 'low' }
  if (score <= 14) return { label: 'Moderate depression', tone: 'low' }
  if (score <= 19) return { label: 'Moderately severe depression', tone: 'critical' }
  return { label: 'Severe depression', tone: 'critical' }
}
function gadBand(score: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (score <= 4) return { label: 'Minimal anxiety', tone: 'brand' }
  if (score <= 9) return { label: 'Mild anxiety', tone: 'low' }
  if (score <= 14) return { label: 'Moderate anxiety', tone: 'low' }
  return { label: 'Severe anxiety', tone: 'critical' }
}

function QuestionSet({ items, answers, setAnswers }: { items: string[]; answers: (number | null)[]; setAnswers: (a: (number | null)[]) => void }) {
  return (
    <div className="space-y-3">
      {items.map((text, qi) => (
        <Card key={qi} className="!p-4">
          <div className="text-sm font-semibold text-ink dark:text-ink">{qi + 1}. {text}</div>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {SCALE.map((label, pts) => (
              <button
                key={label}
                onClick={() => setAnswers(answers.map((v, i) => (i === qi ? pts : v)))}
                className={`rounded-lg border px-2 py-2 text-[11px] font-semibold leading-tight transition ${
                  answers[qi] === pts
                    ? 'border-brand bg-brand-50 text-brand-dark'
                    : 'border-neutral-200 text-neutral-500 hover:border-brand/30 dark:border-white/10 dark:text-neutral-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

export function MentalHealthScreen() {
  const [tab, setTab] = useState<'phq9' | 'gad7'>('phq9')
  const [riwayat, setRiwayat] = useState<Catatan[]>(() => bacaRiwayat())
  const [baruSimpan, setBaruSimpan] = useState<Alat | null>(null)
  const [phq, setPhq] = useState<(number | null)[]>(Array(PHQ9_ITEMS.length).fill(null))
  const [gad, setGad] = useState<(number | null)[]>(Array(GAD7_ITEMS.length).fill(null))

  const phqAnswered = phq.every((a) => a !== null)
  const gadAnswered = gad.every((a) => a !== null)
  const phqScore = phqAnswered ? (phq as number[]).reduce((s, a) => s + a, 0) : null
  const gadScore = gadAnswered ? (gad as number[]).reduce((s, a) => s + a, 0) : null
  const item9Positive = (phq[8] ?? 0) > 0

  // Menyimpan hasil, bukan menampilkannya lalu membuangnya. Skor tunggal
  // hampir tidak berarti; yang bermakna secara klinis adalah perubahannya.
  function simpanHasil(alat: Alat, skor: number) {
    setRiwayat(simpan({
      alat, skor, waktu: new Date().toISOString(),
      butir9: alat === 'phq9' ? (phq[8] ?? 0) : undefined,
    }))
    setBaruSimpan(alat)
  }

  const ubah = perubahan(riwayat, tab)
  const lalu = riwayatAlat(riwayat, tab)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Mental Health Screening" subtitle="PHQ-9 (depression) and GAD-7 (anxiety) — short validated screeners" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Over the last 2 weeks, how often have you been bothered by each of these? These are the most widely used screening instruments in primary care worldwide — not a diagnosis, but a validated way to gauge severity and, more importantly, to follow how it changes over time.</Prosa>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setTab('phq9')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'phq9' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>PHQ-9 (Depression)</button>
          <button onClick={() => setTab('gad7')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'gad7' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>GAD-7 (Anxiety)</button>
        </div>
      </Card>

      {item9Positive && (
        <Card className="!p-5 border-2 border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500 text-white"><IconPhone size={18} /></span>
            <div>
              <div className="text-sm font-black text-rose-700 dark:text-rose-300">You don't have to go through this alone</div>
              <Prosa kelas="mt-1 text-[13px] leading-relaxed text-rose-700/90 dark:text-rose-200/90">You reported thoughts of harming yourself, or that you would be better off gone. Please reach someone now — a person you trust, a mental health professional, or one of these lines:</Prosa>
              <ul className="mt-2 space-y-1 text-[13px] font-semibold text-rose-800 dark:text-rose-200">
                <li>🇮🇩 Indonesia — Kemenkes SEJIWA: <b>119 ext. 8</b></li>
                <li>🌍 International — <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline">findahelpline.com</a> (crisis lines by country)</li>
                <li>Or go to your nearest emergency department.</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {tab === 'phq9' ? (
        <QuestionSet items={PHQ9_ITEMS} answers={phq} setAnswers={setPhq} />
      ) : (
        <QuestionSet items={GAD7_ITEMS} answers={gad} setAnswers={setGad} />
      )}

      {tab === 'phq9' && phqScore != null && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">PHQ-9 Result</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-brand-dark">{phqScore}/27</span>
            <Badge tone={phqBand(phqScore).tone}>{phqBand(phqScore).label}</Badge>
          </div>
        </Card>
      )}
      {tab === 'gad7' && gadScore != null && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">GAD-7 Result</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-brand-dark">{gadScore}/21</span>
            <Badge tone={gadBand(gadScore).tone}>{gadBand(gadScore).label}</Badge>
          </div>
        </Card>
      )}

      {((tab === 'phq9' && phqScore != null) || (tab === 'gad7' && gadScore != null)) && (
        <button
          onClick={() => simpanHasil(tab, (tab === 'phq9' ? phqScore : gadScore) as number)}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-black text-white active:scale-[0.99]"
        >
          {baruSimpan === tab ? 'Saved — take it again in 2–4 weeks' : 'Save this result'}
        </button>
      )}

      {lalu.length > 0 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
            {tab === 'phq9' ? 'PHQ-9' : 'GAD-7'} over time
          </div>

          {/* Batang, bukan satu angka: dua belas catatan memperlihatkan pola
              yang tidak bisa dilihat pada satu skor mana pun. */}
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {lalu.slice(-12).map((c) => {
              const tinggi = Math.max(4, (c.skor / MAKSIMAL[c.alat]) * 100)
              const p = pita(c.alat, c.skor)
              return (
                <div key={c.waktu} className="flex h-full flex-1 flex-col items-center gap-1">
                  {/* Tinggi dalam persen hanya berarti bila induknya punya
                      tinggi yang pasti; karena itu batangnya diletakkan di
                      dalam kotak flex-1 yang relatif, bukan langsung di kolom. */}
                  <div className="relative w-full flex-1">
                    <div
                      className={`absolute inset-x-0 bottom-0 rounded-t ${p.tingkat >= 3 ? 'bg-rose-400' : p.tingkat === 2 ? 'bg-amber-400' : 'bg-brand'}`}
                      style={{ height: `${tinggi}%` }}
                      title={`${c.skor} — ${new Date(c.waktu).toLocaleDateString()}`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-neutral-500">{c.skor}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
            <span>{new Date(lalu[Math.max(0, lalu.length - 12)].waktu).toLocaleDateString()}</span>
            <span>{new Date(lalu[lalu.length - 1].waktu).toLocaleDateString()}</span>
          </div>

          {ubah && (
            <p className="mt-3 rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
              {ubah.kalimat}
            </p>
          )}
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Kroenke, K., Spitzer, R.L., &amp; Williams, J.B. (2001). The PHQ-9. <i>J Gen Intern Med</i>, 16(9),
        606-613. Spitzer, R.L., et al. (2006). GAD-7. <i>Arch Intern Med</i>, 166(10), 1092-1097.
        Screening tools only — a score of any level, and especially any endorsement of item 9 above,
        warrants discussion with a mental health professional or your doctor.
      </div>
    </div>
  )
}

export default MentalHealthScreen
