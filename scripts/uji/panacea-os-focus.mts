import {
  PANACEA_OS_CATEGORIES,
  parseClockMinutes,
  readPanaceaOsItems,
  resolvePanaceaOsFocus,
  sortPanaceaOsItems,
  panaceaOsStorageKey,
  type PanaceaOsItem,
} from '../../src/lib/panaceaOsFocus.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama) }
}

const date = '2026-09-09'
const items: PanaceaOsItem[] = [
  { id: 'untimed', date, title: 'Call family', category: 'family', createdAt: '2026-09-09T00:00:00.000Z' },
  { id: 'study', date, title: 'Review OSCE', category: 'study', time: '10:30', createdAt: '2026-09-09T00:01:00.000Z' },
  { id: 'work', date, title: 'Ship Panacea OS batch', category: 'work', time: '09:00', createdAt: '2026-09-09T00:02:00.000Z' },
  { id: 'done', date, title: 'Morning walk', category: 'training', time: '07:00', createdAt: '2026-09-09T00:03:00.000Z', completedAt: '2026-09-09T00:30:00.000Z' },
  { id: 'finance', date, title: 'Review budget', category: 'finance', time: '15:00', createdAt: '2026-09-09T00:04:00.000Z' },
]

const focus = resolvePanaceaOsFocus(items, 9 * 60 + 20)
ok('focus exposes at most three items', focus.length === 3)
ok('completed items are excluded', !focus.some((entry) => entry.item.id === 'done'))
ok('earliest unfinished timed item is Now', focus[0]?.item.id === 'work' && focus[0]?.slot === 'Now')
ok('second timed item is Next', focus[1]?.item.id === 'study' && focus[1]?.slot === 'Next')
ok('third timed item is Later', focus[2]?.item.id === 'finance' && focus[2]?.slot === 'Later')
ok('09:00 at 09:20 is classified overdue', focus[0]?.timing === 'overdue' && focus[0]?.minutesFromNow === -20)
ok('10:30 at 09:20 remains scheduled', focus[1]?.timing === 'scheduled' && focus[1]?.minutesFromNow === 70)
ok('valid clock parses to minutes', parseClockMinutes('23:59') === 1439)
ok('invalid clock is rejected', parseClockMinutes('24:00') === null && parseClockMinutes('9:00') === null)
ok('storage key is date scoped and versioned', panaceaOsStorageKey(date) === `panacea.os.day.v1:${date}`)
ok('life-domain categories are covered', ['work','study','appointment','health','training','nutrition','family','social','finance','spiritual','recovery','leisure','admin'].every((x) => PANACEA_OS_CATEGORIES.includes(x as never)))
const ordered = sortPanaceaOsItems(items)
ok('agenda normalization is chronological with untimed items last', ordered.map((item) => item.id).join(',') === 'done,work,study,finance,untimed')
ok('agenda sorting does not mutate caller array', items[0]?.id === 'untimed')
const parsed = readPanaceaOsItems(JSON.stringify([items[0], { ...items[1], date: '2026-09-08' }, { nope: true }]), date)
ok('storage reader keeps only valid items for the requested date', parsed.length === 1 && parsed[0]?.id === 'untimed')
ok('corrupt storage degrades to empty list', readPanaceaOsItems('{broken', date).length === 0)
console.log(`\nPanacea OS focus: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
