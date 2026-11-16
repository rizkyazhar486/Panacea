import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SystemBoardView } from '../../src/domains/body-exposure/ui/SystemBoardView.tsx'
import { buildSystemBoard } from '../../src/domains/body-exposure/engine/systemBoard.ts'
import type { SinyalSistem } from '../../src/lib/sinyalPribadiSistem.ts'

const NOW = new Date('2026-11-16T00:00:00.000Z')
const sig = (metric: string, recordedAt: string, value: number, unit = ''): SinyalSistem => ({ metric, value, unit, recordedAt, count: 1, delta: null })
const render = (rows: ReturnType<typeof buildSystemBoard>, selected: never = null as never) =>
  renderToStaticMarkup(createElement(SystemBoardView, { rows, metricLabel: (m: string) => `L:${m}`, selected, onSelect: () => {} }))

// kosong: satu catatan jujur, tanpa daftar 11 baris, tanpa nilai karangan
const kosong = render(buildSystemBoard(new Map(), NOW))
assert.match(kosong, /0 of 11 have data/); assert.match(kosong, /Nothing you recorded is linked to a body system yet/)
assert.doesNotMatch(kosong, /data-system=/); assert.doesNotMatch(kosong, /<details/)

// data: baris ber-data tampil dengan nilai, satuan, umur; sistem tanpa data dilipat
const peta = new Map([['respiratory', [sig('spo2', '2026-11-14T00:00:00.000Z', 97, '%')]], ['cardiovascular', [sig('lab.ldl', '2026-08-01T00:00:00.000Z', 110, 'mg/dL')]]])
const ada = render(buildSystemBoard(peta as never, NOW), 'respiratory' as never)
assert.match(ada, /2 of 11 have data/)
assert.match(ada, /data-system="respiratory" data-recency="recent"/); assert.match(ada, /data-system="cardiovascular" data-recency="older"/)
assert.match(ada, /2 days ago/); assert.match(ada, /L:spo2/); assert.match(ada, /97/)
assert.match(ada, /Nothing recorded yet \(9\)/)
// terpilih: hanya baris yang dipilih aria-pressed=true (berpasangan)
assert.equal((ada.match(/aria-pressed="true"/g) ?? []).length, 1)
assert.match(ada, /aria-pressed="true"[^>]*data-system="respiratory"/)
// tanggal rusak: baris tetap ada tetapi jujur, tidak 'recent'
const rusak = render(buildSystemBoard(new Map([['digestive', [sig('lab.sgot', 'rusak', 20)]]]) as never, NOW))
assert.match(rusak, /data-system="digestive" data-recency="unknown"/); assert.match(rusak, /date unreadable/)
// tanpa kata penilaian
assert.doesNotMatch(ada, /\b(normal|abnormal|good|bad|healthy|danger)\b/i)
console.log('your-systems-board-view: OK')
