// Latihan mengingat (self-check) atas bahan yang SUDAH bersumber — mis. mekanisme fisiologi di panggung Body Exposure.
//   - jadwal = langkah Leitner yang sama dengan latihan soal (progress.ts), dipisah jadi satu fungsi tanpa ubah perilaku;
//   - setiap penolakan diuji berpasangan (kasus diterima hanya beda di kondisi itu) dan TIDAK mengubah log;
//   - pemulihan dari penyimpanan gagal-tertutup: teks rusak / versi asing → mulai baru, bukan menebak;
//   - adaptor penyimpanan tidak pernah melempar: penyimpanan terblokir dilaporkan sebagai hasil.
import assert from 'node:assert/strict'
import {
  LEITNER_INTERVAL_DAYS,
  browserRecallStore,
  calendarDayOf,
  leitnerNext,
  newProgress,
  newRecallLog,
  planRecallDeck,
  recallEntryOf,
  recordRecall,
  restoreRecallLog,
  serializeRecallLog,
  startLesson,
  submitAnswer,
  CARDIOVASCULAR_CATALOG,
  type RecallLog,
} from '../../src/domains/prometheus-learning/index.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const DEK = ['a', 'b', 'c'] as const
const KENAL = new Set<string>(DEK)
const catat = (log: RecallLog, itemId: string, recalled: boolean, day: number) => {
  const r = recordRecall(log, KENAL, { itemId, recalled, day })
  assert.ok(r.ok, `${itemId}@${day} diterima`)
  return r.log
}
/** Log setelah serangkaian penilaian [item, ingat?, hari]. */
const riwayat = (...langkah: [string, boolean, number][]) => langkah.reduce((log, [i, r, d]) => catat(log, i, r, d), newRecallLog())

// ── langkah Leitner bersama ──
gagal('leitner_naik_satu_kotak_dan_kembali_ke_nol', () => {
  assert.deepEqual(LEITNER_INTERVAL_DAYS, [1, 2, 4, 8, 16])
  assert.deepEqual(leitnerNext(undefined, true, 10), { box: 0, dueDay: 11 })
  assert.deepEqual(leitnerNext(undefined, false, 10), { box: 0, dueDay: 11 })
  assert.deepEqual(leitnerNext({ box: 2, dueDay: 0 }, true, 10), { box: 3, dueDay: 18 })
  assert.deepEqual(leitnerNext({ box: 4, dueDay: 0 }, true, 10), { box: 4, dueDay: 26 }, 'kotak terakhir tidak terlewati')
  assert.deepEqual(leitnerNext({ box: 3, dueDay: 0 }, false, 10), { box: 0, dueDay: 11 })
})
gagal('latihan_soal_tetap_sama_setelah_langkah_dipisah', () => {
  // Nilai acuan yang sama seperti sebelum pemisahan: benar → kotak 0 (h+1), benar lagi → kotak 1 (h+2), salah → 0.
  let p = newProgress('u1')
  const mulai = startLesson(p, CARDIOVASCULAR_CATALOG, 'u1', 'les:cardiac_output'); assert.ok(mulai.ok); p = mulai.progress
  const jawab = (o: string, a: string, d: number) => { const r = submitAnswer(p, CARDIOVASCULAR_CATALOG, { userId: 'u1', questionId: 'q:co_calc', optionId: o, attemptId: a, day: d }); assert.ok(r.ok); p = r.progress }
  jawab('a', 't1', 0); assert.deepEqual(p.review['q:co_calc'], { box: 0, dueDay: 1 })
  jawab('a', 't2', 1); assert.deepEqual(p.review['q:co_calc'], { box: 1, dueDay: 3 })
  jawab('b', 't3', 3); assert.deepEqual(p.review['q:co_calc'], { box: 0, dueDay: 4 })
})

// ── mencatat penilaian sendiri ──
gagal('menerima_penilaian_pertama', () => {
  const r = recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: true, day: 10 })
  assert.ok(r.ok)
  assert.deepEqual(r.entry, { box: 0, dueDay: 11, lastDay: 10, recalled: 1, missed: 0 })
  assert.deepEqual(r.log.entries, { a: r.entry })
  const lupa = recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: false, day: 10 })
  assert.ok(lupa.ok); assert.deepEqual(lupa.entry, { box: 0, dueDay: 11, lastDay: 10, recalled: 0, missed: 1 })
})
gagal('ingat_berturut_naik_kotak_sampai_batas', () => {
  const log = riwayat(['a', true, 0], ['a', true, 1], ['a', true, 3], ['a', true, 7], ['a', true, 15], ['a', true, 31])
  assert.deepEqual(recallEntryOf(log, 'a'), { box: 4, dueDay: 47, lastDay: 31, recalled: 6, missed: 0 })
})
gagal('lupa_mengembalikan_ke_kotak_nol', () => {
  const log = riwayat(['a', true, 0], ['a', true, 1], ['a', true, 3], ['a', false, 7])
  assert.deepEqual(recallEntryOf(log, 'a'), { box: 0, dueDay: 8, lastDay: 7, recalled: 3, missed: 1 })
})
gagal('menolak_item_asing_tanpa_mengubah_log', () => {
  const awal = riwayat(['a', true, 0])
  const salinan = structuredClone(awal)
  for (const itemId of ['z', '', 'toString', '__proto__', 'constructor']) {
    assert.deepEqual(recordRecall(awal, KENAL, { itemId, recalled: true, day: 5 }), { ok: false, reason: 'unknown_item' }, itemId)
  }
  assert.deepEqual(awal, salinan, 'log tidak berubah')
  assert.ok(recordRecall(awal, KENAL, { itemId: 'b', recalled: true, day: 5 }).ok, 'berpasangan: item dek diterima')
})
gagal('menolak_penilaian_yang_bukan_boolean', () => {
  for (const recalled of [1, 'yes', null, undefined]) {
    assert.deepEqual(recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: recalled as never, day: 5 }), { ok: false, reason: 'bad_rating' }, String(recalled))
  }
  assert.ok(recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: false, day: 5 }).ok, 'berpasangan: false diterima')
})
gagal('menolak_hari_tidak_sah', () => {
  for (const day of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '3' as never]) {
    assert.deepEqual(recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: true, day }), { ok: false, reason: 'bad_day' }, String(day))
  }
  assert.ok(recordRecall(newRecallLog(), KENAL, { itemId: 'a', recalled: true, day: 0 }).ok, 'batas: hari 0 diterima')
})
gagal('menolak_jam_mundur_dan_dobel_kirim', () => {
  const awal = riwayat(['a', true, 20])
  const salinan = structuredClone(awal)
  assert.deepEqual(recordRecall(awal, KENAL, { itemId: 'a', recalled: true, day: 19 }), { ok: false, reason: 'bad_day' }, 'hari sebelum penilaian terakhir')
  assert.deepEqual(recordRecall(awal, KENAL, { itemId: 'a', recalled: false, day: 20 }), { ok: false, reason: 'already_rated_today' }, 'penilaian kedua di hari yang sama')
  assert.deepEqual(awal, salinan, 'log tidak berubah')
  assert.ok(recordRecall(awal, KENAL, { itemId: 'a', recalled: true, day: 21 }).ok, 'berpasangan: hari berikutnya diterima')
  assert.ok(recordRecall(awal, KENAL, { itemId: 'b', recalled: true, day: 20 }).ok, 'berpasangan: item lain di hari yang sama diterima')
})

// ── rencana dek pada satu hari ──
gagal('dek_baru_semuanya_segar_berurutan', () => {
  assert.deepEqual(planRecallDeck(newRecallLog(), DEK, 5), { ok: true, total: 3, studied: 0, due: [], fresh: ['a', 'b', 'c'], queue: ['a', 'b', 'c'], nextDueDay: null })
})
gagal('jatuh_tempo_paling_lama_dulu_lalu_yang_segar', () => {
  // a: jatuh tempo h3 (kotak 0 dari h2); c: jatuh tempo h3 juga; b belum pernah. Pada h6: a dan c terlambat sama → urutan dek.
  const log = riwayat(['c', false, 2], ['a', true, 2])
  assert.deepEqual(planRecallDeck(log, DEK, 6), { ok: true, total: 3, studied: 2, due: ['a', 'c'], fresh: ['b'], queue: ['a', 'c', 'b'], nextDueDay: null })
  // c dinaikkan: jatuh tempo h3+2=5; a tetap h3. Pada h5 keduanya jatuh tempo, a lebih terlambat → a dulu.
  const lanjut = catat(log, 'c', true, 3)
  assert.deepEqual(planRecallDeck(lanjut, ['c', 'a'], 5).ok && planRecallDeck(lanjut, ['c', 'a'], 5), { ok: true, total: 2, studied: 2, due: ['a', 'c'], fresh: [], queue: ['a', 'c'], nextDueDay: null })
})
gagal('seri_jatuh_tempo_mengikuti_urutan_dek_bukan_abjad', () => {
  const log = riwayat(['a', true, 2], ['c', true, 2]) // keduanya jatuh tempo h3
  const plan = planRecallDeck(log, ['c', 'b', 'a'], 4)
  assert.ok(plan.ok); assert.deepEqual(plan.due, ['c', 'a']); assert.deepEqual(plan.queue, ['c', 'a', 'b'])
})
gagal('belum_jatuh_tempo_tidak_masuk_antrean_dan_hari_berikutnya_dilaporkan', () => {
  const log = riwayat(['a', true, 0], ['a', true, 1], ['b', true, 1]) // a: kotak 1 → h3; b: kotak 0 → h2
  const h1 = planRecallDeck(log, DEK, 1)
  assert.deepEqual(h1, { ok: true, total: 3, studied: 2, due: [], fresh: ['c'], queue: ['c'], nextDueDay: 2 })
  const h2 = planRecallDeck(log, DEK, 2)
  assert.ok(h2.ok); assert.deepEqual([h2.due, h2.nextDueDay], [['b'], 3], 'batas: jatuh tempo tepat di harinya')
})
gagal('dek_mengabaikan_entri_di_luar_dek', () => {
  const log = riwayat(['a', true, 0], ['b', true, 0])
  assert.deepEqual(planRecallDeck(log, ['b'], 5), { ok: true, total: 1, studied: 1, due: ['b'], fresh: [], queue: ['b'], nextDueDay: null })
})
gagal('dek_tidak_menganggap_properti_warisan_sebagai_entri', () => {
  const plan = planRecallDeck(newRecallLog(), ['toString', 'constructor'], 5)
  assert.ok(plan.ok); assert.deepEqual(plan.fresh, ['toString', 'constructor'])
  assert.equal(recallEntryOf(newRecallLog(), 'toString'), undefined)
})
gagal('dek_menolak_hari_tidak_sah_dan_item_ganda', () => {
  for (const day of [-1, 2.5, Number.NaN]) assert.deepEqual(planRecallDeck(newRecallLog(), DEK, day), { ok: false, reason: 'bad_day' }, String(day))
  assert.deepEqual(planRecallDeck(newRecallLog(), ['a', 'b', 'a'], 1), { ok: false, reason: 'duplicate_item' })
  assert.ok(planRecallDeck(newRecallLog(), ['a', 'b'], 0).ok, 'berpasangan: dek tanpa ganda pada hari 0 diterima')
})

// ── simpan & pulihkan ──
gagal('pulih_bolak_balik_identik', () => {
  const log = riwayat(['a', true, 0], ['b', false, 0], ['a', true, 1])
  const teks = serializeRecallLog(log)
  assert.deepEqual(restoreRecallLog(teks, KENAL), { ok: true, log, dropped: 0 })
  assert.equal(serializeRecallLog(restoreRecallLog(teks, KENAL).ok ? (restoreRecallLog(teks, KENAL) as { log: RecallLog }).log : newRecallLog()), teks, 'deterministik')
})
gagal('tanpa_simpanan_berarti_log_baru', () => {
  assert.deepEqual(restoreRecallLog(null, KENAL), { ok: true, log: newRecallLog(), dropped: 0 })
})
gagal('pulih_menolak_teks_rusak', () => {
  const sah = JSON.parse(serializeRecallLog(riwayat(['a', true, 0])))
  const rusak: unknown[] = [
    '{', 'null', '[]', '"x"', '{}',
    { ...sah, entries: [] }, { ...sah, entries: null }, { ...sah, schemaVersion: 1 },
    { ...sah, entries: { a: { ...sah.entries.a, box: 5 } } },
    { ...sah, entries: { a: { ...sah.entries.a, box: -1 } } },
    { ...sah, entries: { a: { ...sah.entries.a, dueDay: 9 } } },
    { ...sah, entries: { a: { ...sah.entries.a, lastDay: 0.5, dueDay: 1.5 } } },
    { ...sah, entries: { a: { ...sah.entries.a, recalled: 0, missed: 0 } } },
    { ...sah, entries: { a: { ...sah.entries.a, missed: -1 } } },
    { ...sah, entries: { a: 'kotak 0' } },
    { ...sah, entries: { z: { ...sah.entries.a, box: 9 } } },
  ]
  for (const r of rusak) {
    const teks = typeof r === 'string' ? r : JSON.stringify(r)
    assert.deepEqual(restoreRecallLog(teks, KENAL), { ok: false, reason: 'corrupt' }, teks)
  }
  assert.ok(restoreRecallLog(JSON.stringify(sah), KENAL).ok, 'berpasangan: log sah diterima')
})
gagal('pulih_menolak_versi_asing', () => {
  const sah = JSON.parse(serializeRecallLog(riwayat(['a', true, 0])))
  assert.deepEqual(restoreRecallLog(JSON.stringify({ ...sah, schemaVersion: '2.0.0' }), KENAL), { ok: false, reason: 'incompatible_version' })
  assert.ok(restoreRecallLog(JSON.stringify({ ...sah, schemaVersion: '1.4.0' }), KENAL).ok, 'berpasangan: versi minor lain diterima')
})
gagal('pulih_membuang_entri_yang_tidak_lagi_di_dek', () => {
  const log = riwayat(['a', true, 0], ['b', true, 0])
  const hasil = restoreRecallLog(serializeRecallLog(log), new Set(['a']))
  assert.deepEqual(hasil, { ok: true, log: riwayat(['a', true, 0]), dropped: 1 })
})
gagal('pulih_aman_dari_kunci_proto', () => {
  const entri = { box: 0, dueDay: 1, lastDay: 0, recalled: 1, missed: 0 }
  const teks = `{"schemaVersion":"1.0.0","entries":{"__proto__":${JSON.stringify(entri)},"a":${JSON.stringify(entri)}}}`
  const hasil = restoreRecallLog(teks, KENAL)
  assert.ok(hasil.ok); assert.equal(hasil.dropped, 1)
  assert.equal(Object.getPrototypeOf(hasil.log.entries), Object.prototype, 'prototipe tidak tercemar')
  assert.deepEqual(Object.keys(hasil.log.entries), ['a'])
  const proto = restoreRecallLog(teks, new Set(['__proto__']))
  assert.ok(proto.ok); assert.deepEqual(Object.keys(proto.log.entries), ['__proto__'], 'id dek bernama __proto__ tetap jadi entri sendiri')
  assert.equal(Object.getPrototypeOf(proto.log.entries), Object.prototype)
})

// ── hari kalender pelajar ──
gagal('hari_kalender_mengikuti_zona_waktu_pelajar', () => {
  assert.equal(calendarDayOf(0, 0), 0)
  const hari14 = Math.floor(Date.UTC(2026, 10, 14) / 86_400_000)
  // Jakarta (UTC+7, getTimezoneOffset = -420): 16:59:59Z masih 14 Nov pukul 23:59:59; 17:00:00Z sudah 15 Nov.
  assert.equal(calendarDayOf(Date.UTC(2026, 10, 14, 16, 59, 59), -420), hari14)
  assert.equal(calendarDayOf(Date.UTC(2026, 10, 14, 17, 0, 0), -420), hari14 + 1)
  // New York (UTC-5, offset 300): 04:59:59Z masih 13 Nov.
  assert.equal(calendarDayOf(Date.UTC(2026, 10, 14, 4, 59, 59), 300), hari14 - 1)
  assert.equal(calendarDayOf(Date.UTC(2026, 10, 14, 5, 0, 0), 300), hari14)
})
gagal('hari_kalender_menolak_nilai_yang_tidak_diberikan_jam', () => {
  const tahunBaru = Date.UTC(2026, 0, 1)
  for (const [ms, off] of [[Number.NaN, 0], [0, Number.NaN], [Number.POSITIVE_INFINITY, 0], [tahunBaru, 18 * 60 + 1], [tahunBaru, -(18 * 60 + 1)], [-86_400_001, 0]] as const) {
    assert.equal(calendarDayOf(ms, off), null, `${ms}/${off}`)
  }
  assert.equal(calendarDayOf(0, 18 * 60) === null, true, 'UTC-18 pada epoch jatuh sebelum hari 0')
  assert.equal(calendarDayOf(Date.UTC(2026, 0, 1), -18 * 60), Math.floor(Date.UTC(2026, 0, 1, 18) / 86_400_000), 'batas: selisih 18 jam diterima')
})

// ── adaptor penyimpanan peramban ──
const ruang = () => { const m = new Map<string, string>(); return { m, s: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } } } }
gagal('penyimpanan_menyimpan_dan_memuat_di_kuncinya', () => {
  const { m, s } = ruang()
  const toko = browserRecallStore('k1', () => s)
  assert.deepEqual(toko.load(), { ok: true, raw: null })
  assert.deepEqual(toko.save('isi'), { ok: true })
  assert.deepEqual(toko.load(), { ok: true, raw: 'isi' })
  assert.deepEqual([...m.keys()], ['k1'], 'hanya kunci yang dinamai pemanggil')
})
gagal('penyimpanan_terblokir_dilaporkan_bukan_dilempar', () => {
  const lempar = () => { throw new Error('SecurityError') }
  const kasus = [
    browserRecallStore('k', lempar),
    browserRecallStore('k', () => null),
    browserRecallStore('k', () => undefined),
    browserRecallStore('k', () => ({ getItem: lempar, setItem: lempar })),
  ]
  for (const toko of kasus) {
    assert.deepEqual(toko.load(), { ok: false, reason: 'unavailable' })
    assert.deepEqual(toko.save('x'), { ok: false, reason: 'unavailable' })
  }
  const kuota = browserRecallStore('k', () => ({ getItem: () => 'lama', setItem: () => { throw new Error('QuotaExceededError') } }))
  assert.deepEqual(kuota.load(), { ok: true, raw: 'lama' }, 'berpasangan: baca tetap jalan bila hanya tulis yang gagal')
  assert.deepEqual(kuota.save('baru'), { ok: false, reason: 'unavailable' })
})

console.log('recall practice: Leitner step shared with question practice (unchanged), self-ratings refused without side effects on unknown item / bad rating / bad or earlier day / same-day repeat, restore fails closed, storage never throws')
