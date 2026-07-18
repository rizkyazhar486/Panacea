import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Resilience Stories — a curated collection of well-documented people across
// medicine, sport, science, and invention who faced serious adversity
// (illness, injury, failure, loss, rejection) and kept going. Curated for
// factual accuracy rather than padded to an arbitrary count — each entry is a
// widely-documented, verifiable public fact pattern, not an invented bio.
// Pure static content, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Story { name: string; field: string; category: string; hardship: string; lesson: string }

const STORIES: Story[] = [
  // Medicine
  { name: 'Insulin discovery team (Banting, Best, Macleod, Collip)', field: 'Medicine', category: 'Doctors & Scientists', hardship: 'Banting had failed in private practice and had no research reputation; the team raced against time as children were dying of type 1 diabetes with no treatment.', lesson: 'A rejected outsider with a stubborn hypothesis and relentless bench work turned a universally fatal childhood disease into a manageable one within a single year (1921-22).' },
  { name: 'Marie Curie', field: 'Physics & Chemistry', category: 'Doctors & Scientists', hardship: 'Barred from Polish universities for being a woman, worked in a leaking shed, and was later shunned by parts of the French academy over her personal life even as her science was undeniable.', lesson: 'Two Nobel Prizes in two different sciences, achieved through sheer methodological rigor in the face of institutional exclusion.' },
  { name: 'Vivien Thomas', field: 'Cardiac surgery', category: 'Doctors & Scientists', hardship: 'A Black carpenter with no medical degree during Jim Crow-era segregation, denied recognition for decades despite developing the surgical technique behind the first "blue baby" heart operation.', lesson: 'Pioneered lifesaving pediatric cardiac surgery from outside the credentialed system — Johns Hopkins eventually awarded him an honorary doctorate.' },
  { name: 'Paul Farmer', field: 'Global health', category: 'Doctors & Scientists', hardship: 'Built health infrastructure in rural Haiti and other of the world\'s poorest regions against chronic underfunding and skepticism that quality care was "possible" for the poor.', lesson: 'Proved that the standard of care shouldn\'t depend on a patient\'s postal code — a founding principle now central to global health equity work.' },

  // Athletes
  { name: 'Wilma Rudolph', field: 'Track & field', category: 'Athletes', hardship: 'Had polio as a child and wore a leg brace, told she might never walk normally.', lesson: 'Became the first American woman to win three gold medals in a single Olympics (Rome, 1960).' },
  { name: 'Michael Jordan', field: 'Basketball', category: 'Athletes', hardship: 'Cut from his varsity high school team as a sophomore.', lesson: 'Used the rejection as fuel; became widely regarded as one of the greatest basketball players of all time.' },
  { name: 'Bethany Hamilton', field: 'Surfing', category: 'Athletes', hardship: 'Lost her left arm in a shark attack at 13.', lesson: 'Returned to competitive surfing within months and continued a professional career for decades after.' },
  { name: 'Kyle Maynard', field: 'Wrestling & mountaineering', category: 'Athletes', hardship: 'Born with congenital amputation of all four limbs.', lesson: 'Became a championship wrestler and the first quadruple amputee to summit Mount Kilimanjaro unassisted.' },
  { name: 'Eliud Kipchoge', field: 'Marathon running', category: 'Athletes', hardship: 'Grew up in poverty in rural Kenya, ran to school barefoot, finished only fifth in his marathon debut category as a junior.', lesson: 'Became the first person to run a marathon under two hours, crediting relentless, unglamorous daily discipline over talent.' },

  // Innovators & entrepreneurs
  { name: 'Thomas Edison', field: 'Invention', category: 'Innovators', hardship: 'Widely described as failing thousands of times while developing a practical incandescent light bulb; his lab burned down later in life.', lesson: 'Reframed each failure as "a way that won\'t work" — perseverance across thousands of iterations, not one flash of genius.' },
  { name: 'J.K. Rowling', field: 'Writing', category: 'Innovators', hardship: 'A single parent living on welfare, clinically depressed, rejected by roughly a dozen publishers for the first Harry Potter manuscript.', lesson: 'One editor\'s daughter loved the first chapter — the book went on to become one of the best-selling series in history.' },
  { name: 'Stephen King', field: 'Writing', category: 'Innovators', hardship: 'His first novel, Carrie, was rejected around 30 times; he threw the manuscript in the trash before his wife retrieved it.', lesson: 'Became one of the best-selling novelists of all time off a manuscript he had already given up on.' },
  { name: 'Sara Blakely', field: 'Entrepreneurship', category: 'Innovators', hardship: 'Sold fax machines door-to-door and was rejected by every hosiery manufacturer she approached with her idea.', lesson: 'Built Spanx into a billion-dollar company and became one of the youngest self-made female billionaires.' },

  // Scientists & thinkers
  { name: 'Stephen Hawking', field: 'Theoretical physics', category: 'Scientists', hardship: 'Diagnosed with ALS at 21 and given roughly two years to live; progressively lost nearly all motor function and speech.', lesson: 'Continued groundbreaking work on black holes and cosmology for over 50 more years, communicating via a speech-generating device.' },
  { name: 'Charles Darwin', field: 'Natural science', category: 'Scientists', hardship: 'Chronic, poorly understood illness for much of his adult life; anticipated fierce public and religious backlash to his theory for over 20 years before publishing.', lesson: 'On the Origin of Species reshaped biology permanently despite the author\'s own doubt and the certainty of controversy.' },
  { name: 'Katalin Karikó', field: 'Biochemistry', category: 'Scientists', hardship: 'Demoted and nearly pushed out of academia for decades while pursuing mRNA research that mainstream funders considered a dead end.', lesson: 'Her mRNA work became the foundation of COVID-19 vaccines and won the 2023 Nobel Prize in Physiology or Medicine.' },

  // Public figures & leaders
  { name: 'Nelson Mandela', field: 'Leadership', category: 'Leaders', hardship: '27 years in prison, much of it in a small cell on Robben Island, separated from his family.', lesson: 'Emerged advocating reconciliation over revenge, becoming South Africa\'s first democratically elected president.' },
  { name: 'Viktor Frankl', field: 'Psychiatry', category: 'Leaders', hardship: 'Survived multiple Nazi concentration camps, including Auschwitz, and lost his wife and parents in the Holocaust.', lesson: 'Wrote Man\'s Search for Meaning, arguing that finding purpose is what allows people to endure almost any suffering — a founding text of logotherapy.' },
  { name: 'Malala Yousafzai', field: 'Education advocacy', category: 'Leaders', hardship: 'Shot in the head by the Taliban at 15 for advocating girls\' education.', lesson: 'Recovered and became the youngest-ever Nobel Peace Prize laureate, continuing global advocacy for girls\' education.' },
]

const CATEGORIES = ['All', ...Array.from(new Set(STORIES.map((s) => s.category)))]

export function ResilienceStories() {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return STORIES.filter((s) => (cat === 'All' || s.category === cat) && (!q || (s.name + s.field + s.hardship + s.lesson).toLowerCase().includes(q)))
  }, [cat, q])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Resilience Stories" subtitle="Real people, real hardship, real comebacks" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A curated collection of well-documented doctors, scientists, athletes, innovators, and
          leaders who faced serious adversity — illness, injury, poverty, rejection, loss — and kept
          going. Curated for accuracy over quantity: each story here is a verifiable public fact
          pattern, not padding.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
        <input className={`${inputClass} mt-3`} placeholder="Search a name, field, or struggle…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-400">No stories match "{query}".</Card>}

      {filtered.map((s) => (
        <Card key={s.name} className="!p-5">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-ink dark:text-white">{s.name}</span>
            <Badge tone="brand">{s.field}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500"><span className="font-bold text-neutral-600 dark:text-neutral-300">The struggle: </span>{s.hardship}</p>
          <p className="mt-2 rounded-xl bg-brand/10 px-3 py-2 text-[13px] leading-relaxed text-brand-dark">{s.lesson}</p>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Facts summarized from widely available public biographical record. This collection will grow
        over time — always with verifiable stories, never invented ones.
      </div>
    </div>
  )
}

export default ResilienceStories
