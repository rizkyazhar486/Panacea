// Life Story chapters are real age-bracket math from a real date of birth —
// this checks that math, and that grouping/ordering behaves as a reader
// would expect (chronological, empty chapters skipped). Also checks that
// merging real Care Episode timestamps into the same timeline only ever
// surfaces real, dated moments (started/blocked/completed) — never a
// fabricated one.
import { chapterForAge, groupIntoChapters, lifeEventToStoryItem, careEpisodeToStoryItems } from '../../src/lib/lifeStory.ts'
import type { LifeEvent, CareEpisode } from '../../src/lib/types.ts'

const chk = (n: string, c: boolean, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x)

chk('age 5 falls in Origin', chapterForAge(5).name === 'Origin')
chk('age 12 (boundary) still Origin', chapterForAge(12).name === 'Origin')
chk('age 13 (boundary) is Growth', chapterForAge(13).name === 'Growth')
chk('age 30 is Foundation', chapterForAge(30).name === 'Foundation')
chk('age 45 is Family & Career', chapterForAge(45).name === 'Family & Career')
chk('age 60 is Mastery', chapterForAge(60).name === 'Mastery')
chk('age 80 is Legacy', chapterForAge(80).name === 'Legacy')
chk('Legacy age range has an open-ended label', chapterForAge(80).ageRange === '66+')

function ev(id: string, at: string): LifeEvent {
  return { id, at, title: 'x', domains: ['social'], impact: 'positive' }
}

{
  // dob 2000-01-01: event at 2010 -> age 10 (Origin); event at 2025 -> age 25 (Foundation)
  const dob = '2000-01-01'
  const items = [ev('b', '2025-06-01'), ev('a', '2010-06-01')].map(lifeEventToStoryItem) // deliberately out of order
  const chapters = groupIntoChapters(items, dob)
  chk('groups into exactly the two chapters actually used', chapters.length === 2)
  chk('chapters emitted in chronological order (Origin before Foundation)', chapters[0].name === 'Origin' && chapters[1].name === 'Foundation')
  chk('items within a chapter come back oldest first', chapters[0].items[0].id === 'a')
  chk('no empty chapters appear for age ranges with no items', !chapters.some((c) => c.items.length === 0))
}

{
  const chapters = groupIntoChapters([], '2000-01-01')
  chk('no items produces no chapters, not empty placeholders', chapters.length === 0)
}

// --- merging health (Care Episode) moments into the same story ---
function episode(overrides: Partial<CareEpisode>): CareEpisode {
  return {
    id: 'ep1', title: 'Appendectomy', createdAt: '2015-01-01T00:00:00.000Z', updatedAt: '2015-01-01T00:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' }, { stage: 'diagnosis', status: 'done' }, { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' }, { stage: 'cost', status: 'done' }, { stage: 'schedule', status: 'done' },
      { stage: 'treatment', status: 'done' }, { stage: 'recovery', status: 'done' }, { stage: 'followUp', status: 'done' },
      { stage: 'outcome', status: 'done' },
    ],
    ...overrides,
  }
}

{
  const ep = episode({ updatedAt: '2015-01-10T00:00:00.000Z' })
  const items = careEpisodeToStoryItems(ep)
  chk('a fully-done episode produces a started AND a completed moment', items.some((i) => i.healthStatus === 'started') && items.some((i) => i.healthStatus === 'completed'))
  chk('the started moment uses the episode\'s real createdAt', items.find((i) => i.healthStatus === 'started')!.at === '2015-01-01T00:00:00.000Z')
  chk('the completed moment uses the episode\'s real updatedAt', items.find((i) => i.healthStatus === 'completed')!.at === '2015-01-10T00:00:00.000Z')
}

{
  const ep = episode({
    stages: [
      { stage: 'problem', status: 'done' }, { stage: 'diagnosis', status: 'done' }, { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' },
      { stage: 'cost', status: 'blocked', blockedReason: 'Insurance pre-authorization pending', updatedAt: '2015-02-01T00:00:00.000Z' },
      { stage: 'schedule', status: 'pending' }, { stage: 'treatment', status: 'pending' }, { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' }, { stage: 'outcome', status: 'pending' },
    ],
  })
  const items = careEpisodeToStoryItems(ep)
  chk('an incomplete episode does not produce a completed moment', !items.some((i) => i.healthStatus === 'completed'))
  const blocked = items.find((i) => i.healthStatus === 'blocked')
  chk('a blocked stage produces a blocked moment at its own real timestamp', blocked?.at === '2015-02-01T00:00:00.000Z')
  chk('the blocked moment carries the real reason, not a placeholder', blocked?.note === 'Insurance pre-authorization pending')
}

{
  // life + health items merge into one chronological, chaptered timeline
  const dob = '2000-01-01'
  const lifeItem = lifeEventToStoryItem(ev('life1', '2015-06-01'))
  const healthItems = careEpisodeToStoryItems(episode({ createdAt: '2015-01-01T00:00:00.000Z', updatedAt: '2015-01-10T00:00:00.000Z' }))
  const chapters = groupIntoChapters([lifeItem, ...healthItems], dob)
  chk('life and health moments land in the same chapter when they happened around the same age', chapters.length === 1)
  chk('within that chapter, they are ordered by real date regardless of kind', chapters[0].items[0].kind === 'health' && chapters[0].items[0].healthStatus === 'started')
}
