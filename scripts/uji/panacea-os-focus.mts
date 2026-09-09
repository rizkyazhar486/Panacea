import { PANACEA_OS_CATEGORIES, parseClockMinutes, readPanaceaOsItems, resolvePanaceaOsFocus, sortPanaceaOsItems, panaceaOsStorageKey, type PanaceaOsItem } from '../../src/lib/panaceaOsFocus.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) { if (syarat) { lulus++; console.log('ok    ', nama) } else { gagal++; console.log('GAGAL ', nama) } }
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
ok('focus order is chronological', focus.map((x) => x.item.id).join(',') === 'work,study,finance')
ok('valid clock parses', parseClockMinutes('23:59') === 1439)
ok('invalid clock rejected', parseClockMinutes('24:00') === null && parseClockMinutes('9:00') === null)
ok('date-scoped storage key', panaceaOsStorageKey(date) === `panacea.os.day.v1:${date}`)
ok('required life domains exist', ['work','study','appointment','health','training','nutrition','family','social','finance','spiritual','recovery','leisure','admin'].every((x) => PANACEA_OS_CATEGORIES.includes(x as never)))
ok('sorting is deterministic', sortPanaceaOsItems(items).map((x) => x.id).join(',') === 'done,work,study,finance,untimed')
ok('storage reader filters wrong dates and corrupt values', readPanaceaOsItems(JSON.stringify([items[0], { ...items[1], date: '2026-09-08' }, { nope: true }]), date).length === 1 && readPanaceaOsItems('{broken', date).length === 0)
console.log(`\nPanacea OS focus: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
