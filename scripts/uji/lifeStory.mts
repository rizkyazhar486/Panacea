// Life Story chapters are real age-bracket math from a real date of birth —
// this checks that math, and that grouping/ordering behaves as a reader
// would expect (chronological, empty chapters skipped).
import { chapterForAge, groupIntoChapters } from '../../src/lib/lifeStory.ts'
import type { LifeEvent } from '../../src/lib/types.ts'

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
  const events = [ev('b', '2025-06-01'), ev('a', '2010-06-01')] // deliberately out of order
  const chapters = groupIntoChapters(events, dob)
  chk('groups into exactly the two chapters actually used', chapters.length === 2)
  chk('chapters emitted in chronological order (Origin before Foundation)', chapters[0].name === 'Origin' && chapters[1].name === 'Foundation')
  chk('events within a chapter come back oldest first', chapters[0].events[0].id === 'a')
  chk('no empty chapters appear for age ranges with no events', !chapters.some((c) => c.events.length === 0))
}

{
  const chapters = groupIntoChapters([], '2000-01-01')
  chk('no events produces no chapters, not empty placeholders', chapters.length === 0)
}
